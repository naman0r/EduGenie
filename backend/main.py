from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging
from uuid import UUID # Import UUID
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleAuthRequest # Alias to avoid name clash
from fastapi import Request as FastAPIRequest # Alias FastAPI's Request
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json # Import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Check if Supabase credentials are set
if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY in .env file")
    # Continue execution but log the error

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    raise

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  #  Next.js frontend URL; add deployment url when deployed. 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for Google Auth request (make fields optional)
class UserAuth(BaseModel):
    google_id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

# Pydantic model for profile update
class UserProfileUpdate(BaseModel): # abstractions because avi told me to learn 
    academic_year: Optional[int] = None
    academic_level: Optional[str] = None
    institution: Optional[str] = None
    full_name: Optional[str] = None # Allow updating name too

# --- Pydantic Models for Classes ---
class ClassInfo(BaseModel):
    id: UUID
    user_id: str
    name: str
    code: Optional[str] = None
    instructor: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True # Allows mapping from ORM objects

class ClassCreate(BaseModel):
    name: str
    code: Optional[str] = None
    instructor: Optional[str] = None

# --- Google Calendar Config ---
# IMPORTANT: Ensure this file is in .gitignore and the backend directory!
CLIENT_SECRETS_FILE = os.path.join(os.path.dirname(__file__), 'client_secret_377799709353-3e316d1al2o05ju3k84ip6ud0hfu3p7l.apps.googleusercontent.com.json')

# Define the scopes your app needs
SCOPES = ['https://www.googleapis.com/auth/calendar.events']
# The Redirect URI for the backend callback handler
REDIRECT_URI = 'http://localhost:8000/oauth2callback'

# --- Load Google Client Config ONCE at startup ---
GOOGLE_CLIENT_ID = None
GOOGLE_CLIENT_SECRET = None
GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token' # Default, but can be loaded from file

try:
    if not os.path.exists(CLIENT_SECRETS_FILE):
        logger.error(f"FATAL: Client secrets file not found at startup: {CLIENT_SECRETS_FILE}")
        # Exit or raise critical error? For now, log and variables will be None.
    else:
        with open(CLIENT_SECRETS_FILE, 'r') as f:
            secrets_data = json.load(f)
            # Structure is usually {"web": {...}} or {"installed": {...}}
            if 'web' in secrets_data:
                config = secrets_data['web']
            elif 'installed' in secrets_data:
                config = secrets_data['installed']
            else:
                raise ValueError("Invalid client secrets file format: missing 'web' or 'installed' key.")
                
            GOOGLE_CLIENT_ID = config.get('client_id')
            GOOGLE_CLIENT_SECRET = config.get('client_secret')
            GOOGLE_TOKEN_URI = config.get('token_uri', GOOGLE_TOKEN_URI) # Use file value if present
            
            if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
                 raise ValueError("Client ID or Client Secret missing in secrets file.")
            logger.info("Successfully loaded Google Client ID and Token URI from secrets file.")
            # Avoid logging secret itself

except Exception as e:
    logger.error(f"FATAL: Failed to load Google client secrets at startup: {e}")
    # Application might not function correctly for Google Calendar

@app.get("/")
async def root():
    return {"message": "Hello World", "hello" : "your mom"}

@app.post("/auth/google")
async def google_auth(user: UserAuth):
    try:
        logger.info(f"Received authentication request for user: {user.email}")
        
        # Log the request data
        logger.info(f"User data: google_id={user.google_id}, email={user.email}, name={user.full_name}")
        
        existing_user = supabase.table("users").select("*").eq("google_id", user.google_id).execute()
        logger.info(f"Supabase query response: {existing_user}")
        
        if existing_user.data:
            logger.info(f"Updating existing user: {user.email}")
            # updates last login 
            updated_user = supabase.table("users").update(
                {"last_logged_in": datetime.utcnow().isoformat()}
            ).eq("google_id", user.google_id).execute()
            
            logger.info(f"User updated: {updated_user}")
            return {"message": "User login updated", "user": updated_user.data[0] if updated_user.data else None}
        
        else: # user signing into EduGenie for the first time
            logger.info(f"Creating new user: {user.email}")
            # Create new user
            user_data_to_insert = {
                "google_id": user.google_id,
                "email": user.email,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url,
                "created_at": datetime.utcnow().isoformat(),
                "last_logged_in": datetime.utcnow().isoformat(),
                "plan_type": "basic"  
            }
            new_user = supabase.table("users").insert(user_data_to_insert).execute()
            
            logger.info(f"New user created: {new_user}")
            return {"message": "User created", "user": new_user.data[0] if new_user.data else None}
    except Exception as e:
        logger.error(f"Error in google_auth: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process user: {str(e)}")

@app.get("/users/{google_id}")
async def get_user_profile(google_id: str):
    try:
        logger.info(f"Fetching profile for user_id: {google_id}")
        user_profile = supabase.table("users").select("*").eq("google_id", google_id).maybe_single().execute()
        
        if not user_profile.data:
            logger.warning(f"User profile not found for ID: {google_id}")
            raise HTTPException(status_code=404, detail="User profile not found")
        
        logger.info(f"Profile found for user_id: {google_id}")
        return {"user": user_profile.data}
    except HTTPException as http_exc: # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching profile for user_id {google_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {str(e)}")

@app.put("/users/{google_id}")
async def update_user_profile(google_id: str, profile_update: UserProfileUpdate):
    try:
        # Create update dict removing None values
        update_data = profile_update.dict(exclude_unset=True)
        
        if not update_data:
             raise HTTPException(status_code=400, detail="No update data provided")

        logger.info(f"Updating profile for user_id: {google_id} with data: {update_data}")
        
        updated_user = supabase.table("users").update(update_data).eq("google_id", google_id).execute()

        if not updated_user.data:
             logger.warning(f"User profile not found for update for ID: {google_id}")
             raise HTTPException(status_code=404, detail="User profile not found for update")

        logger.info(f"Profile updated successfully for user_id: {google_id}")
        # Fetch the updated profile to return it
        profile_response = await get_user_profile(google_id)
        return profile_response
        
    except HTTPException as http_exc: # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        logger.error(f"Error updating profile for user_id {google_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update user profile: {str(e)}")

# --- Class Endpoints ---

@app.get("/users/{google_id}/classes", response_model=list[ClassInfo])
async def get_user_classes(google_id: str):
    try:
        logger.info(f"Fetching classes for user_id: {google_id}")
        response = supabase.table("classes").select("*").eq("user_id", google_id).order("created_at", desc=True).execute()
        
        # response.data will be a list of dictionaries
        logger.info(f"Found {len(response.data)} classes for user_id: {google_id}")
        return response.data
    except Exception as e:
        logger.error(f"Error fetching classes for user_id {google_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch classes: {str(e)}")

@app.post("/users/{google_id}/classes", response_model=ClassInfo, status_code=201)
async def create_user_class(google_id: str, class_data: ClassCreate):
    try:
        logger.info(f"Creating class for user_id: {google_id} with data: {class_data.dict()}")
        
        # Prepare data for insertion
        insert_dict = class_data.dict()
        insert_dict['user_id'] = google_id
        
        response = supabase.table("classes").insert(insert_dict).execute()
        
        if not response.data:
             logger.error(f"Failed to insert class for user {google_id}. Response: {response}")
             raise HTTPException(status_code=500, detail="Failed to create class entry in database.")

        created_class = response.data[0]
        logger.info(f"Class created successfully with id: {created_class.get('id')} for user: {google_id}")
        return created_class

    except Exception as e:
        logger.error(f"Error creating class for user_id {google_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create class: {str(e)}")

@app.get("/classes/{class_id}", response_model=ClassInfo)
async def get_single_class(class_id: UUID):
    # Note: No user check here for simplicity, assumes any valid class ID can be fetched.
    # Add user authorization check if needed based on session/token.
    try:
        logger.info(f"Fetching details for class_id: {class_id}")
        response = supabase.table("classes").select("*").eq("id", str(class_id)).maybe_single().execute() # Query by primary key 'id'
        
        if not response.data:
            logger.warning(f"Class not found for ID: {class_id}")
            raise HTTPException(status_code=404, detail="Class not found")
        
        logger.info(f"Class details found for ID: {class_id}")
        return response.data
        
    except HTTPException as http_exc: # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching details for class_id {class_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch class details: {str(e)}")

# --- Google Calendar Auth Endpoints ---

@app.get("/auth/google/calendar/initiate")
async def initiate_google_calendar_auth(google_id: str):
    try:
        # Use loaded config instead of reading file here
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
             logger.error("Google client config not loaded during initiation.")
             raise HTTPException(status_code=500, detail="Server configuration error: Google client secrets not loaded.")
             
        # Create flow instance using config variables
        flow = Flow.from_client_config(
            client_config={
                ("web" if 'web' in json.load(open(CLIENT_SECRETS_FILE)) else "installed"): {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth", # Standard URIs
                    "token_uri": GOOGLE_TOKEN_URI,
                    "redirect_uris": [REDIRECT_URI] # Needs redirect URIs too
                 }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        # Generate the authorization URL users will visit
        authorization_url, state = flow.authorization_url(access_type='offline', prompt='consent', state=google_id)
        
        logger.info(f"Redirecting user {google_id} to Google for Calendar auth.")
        # Redirect the user to Google's authorization page
        return RedirectResponse(authorization_url)
        
    except Exception as e:
        logger.error(f"Error initiating Google Calendar auth for user {google_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to initiate Google Calendar authentication.")

@app.get("/oauth2callback")
async def oauth2callback(request: FastAPIRequest, code: str, state: str):
    google_id = state
    try:
        logger.info(f"Received OAuth callback for user {google_id}...")
        # Use loaded config instead of reading file here
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
             logger.error("Google client config not loaded during callback.")
             return RedirectResponse("http://localhost:3000/profile?google_auth_status=server_error")
             
        flow = Flow.from_client_config(
             client_config={
                ("web" if 'web' in json.load(open(CLIENT_SECRETS_FILE)) else "installed"): {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": GOOGLE_TOKEN_URI,
                    "redirect_uris": [REDIRECT_URI]
                 }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        # Exchange the authorization code for credentials
        flow.fetch_token(code=code)
        credentials = flow.credentials
        logger.info(f"Exchanged code for tokens for user {google_id}. Refresh token received: {bool(credentials.refresh_token)}")
        update_data = { 'google_refresh_token': credentials.refresh_token, 'google_access_token': credentials.token, 'google_token_expiry': credentials.expiry.isoformat() if credentials.expiry else None }
        response = supabase.table("users").update(update_data).eq("google_id", google_id).execute()
        if not response.data:
             logger.error(f"Failed to store Google tokens for user {google_id}.")
             return RedirectResponse("http://localhost:3000/profile?google_auth_status=error_saving")
        logger.info(f"Google Calendar tokens stored successfully for user {google_id}")
        return RedirectResponse("http://localhost:3000/profile?google_auth_status=success")

    except Exception as e:
        logger.error(f"Error during Google OAuth callback for user {google_id}: {str(e)}", exc_info=True)
        return RedirectResponse("http://localhost:3000/profile?google_auth_status=callback_failed")

# --- Google Calendar API Utility (Modified) ---
async def get_google_calendar_client(google_id: str):
    logger.info(f"Attempting to get Google Calendar client for user: {google_id}")
    
    # Check if client config loaded correctly at startup
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        logger.error("Google client config (ID/Secret) not loaded. Cannot proceed.")
        raise HTTPException(status_code=500, detail="Server configuration error: Google client secrets not loaded.")

    # 1. Fetch stored tokens
    user_response = supabase.table("users").select("google_refresh_token, google_access_token, google_token_expiry").eq("google_id", google_id).maybe_single().execute()
    if not user_response.data:
        raise HTTPException(status_code=404, detail="User not found.")
    user_data = user_response.data
    refresh_token = user_data.get('google_refresh_token')
    access_token = user_data.get('google_access_token')
    token_expiry_str = user_data.get('google_token_expiry')

    if not refresh_token:
        raise HTTPException(status_code=400, detail="Google Calendar not connected for this user.")

    # 2. Create Credentials object using loaded config
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri=GOOGLE_TOKEN_URI, # Use loaded value
        client_id=GOOGLE_CLIENT_ID, # Use loaded value
        client_secret=GOOGLE_CLIENT_SECRET, # Use loaded value
        scopes=SCOPES
    )

    # 3. Check validity and refresh if needed
    try:
        # Rely on creds.valid, which implicitly checks expiry
        logger.info(f"Checking token validity for user {google_id}. creds.valid = {creds.valid}. Has refresh token: {bool(creds.refresh_token)}")
        
        if not creds.valid:
            if creds.refresh_token:
                logger.info(f"Token invalid/expired. Attempting token refresh for user: {google_id}")
                logger.debug(f"Refresh details - RefreshToken (exists): {bool(creds.refresh_token)}, ClientID: {GOOGLE_CLIENT_ID}, TokenURI: {GOOGLE_TOKEN_URI}")
                creds.refresh(GoogleAuthRequest())
                logger.info(f"Token refreshed successfully for user: {google_id}. New expiry: {creds.expiry}")
                update_data = { 'google_access_token': creds.token, 'google_token_expiry': creds.expiry.isoformat() if creds.expiry else None }
                update_response = supabase.table("users").update(update_data).eq("google_id", google_id).execute()
                if not update_response.data:
                     logger.warning(f"Failed to update refreshed Google tokens in DB for user {google_id}")
            else:
                logger.error(f"Cannot refresh token for user {google_id}: No refresh token and token invalid.")
                raise HTTPException(status_code=401, detail="Google Calendar re-authentication required.")
        else:
             logger.info(f"Token for user {google_id} is still valid.")
                
    except Exception as e:
        logger.error(f"Exception during Google token refresh for user {google_id}: {type(e).__name__} - {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to refresh Google Calendar session.")

    # 5. Build and return the API service client
    try:
        service = build('calendar', 'v3', credentials=creds, static_discovery=False)
        logger.info(f"Successfully built Google Calendar client for user: {google_id}")
        return service
    except Exception as e:
        logger.error(f"Error building Google Calendar service for user {google_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to build Google Calendar service client.")


# --- Pydantic Model for Calendar Event Creation ---
class CalendarEventCreate(BaseModel):
    summary: str # Title of the event
    description: Optional[str] = None
    start_datetime: str # ISO 8601 format string, e.g., "2024-08-15T09:00:00-07:00"
    end_datetime: str   # ISO 8601 format string, e.g., "2024-08-15T10:00:00-07:00"
    # Add timeZone if needed, otherwise uses user's default calendar timezone


# --- New Calendar Event Endpoint ---

@app.post("/users/{google_id}/calendar/events", status_code=201)
async def add_calendar_event(google_id: str, event_data: CalendarEventCreate):
    try:
        logger.info(f"Received request to add calendar event for user {google_id}: {event_data.summary}")
        # 1. Get authenticated calendar service client for the user
        calendar_service = await get_google_calendar_client(google_id)
        
        # 2. Construct the event body for Google API
        event_body = {
            'summary': event_data.summary,
            'description': event_data.description,
            'start': {
                'dateTime': event_data.start_datetime,
                # 'timeZone': 'America/Los_Angeles', # Optional: Specify timezone if needed
            },
            'end': {
                'dateTime': event_data.end_datetime,
                # 'timeZone': 'America/Los_Angeles', # Optional: Specify timezone if needed
            },
            # Add other fields like reminders, attendees if necessary
            # 'reminders': {
            #     'useDefault': False,
            #     'overrides': [
            #         {'method': 'popup', 'minutes': 10},
            #     ],
            # },
        }

        # 3. Insert the event into the user's primary calendar
        logger.info(f"Inserting event into primary calendar for user {google_id}")
        created_event = calendar_service.events().insert(
            calendarId='primary', 
            body=event_body
        ).execute()
        
        event_link = created_event.get('htmlLink')
        event_summary = created_event.get('summary')
        logger.info(f"Successfully created event '{event_summary}' for user {google_id}. Link: {event_link}")
        
        return {"message": "Event created successfully", "event_details": created_event}

    except HttpError as error:
        logger.error(f"Google API error creating event for user {google_id}: {error.resp.status} - {error._get_reason()}")
        detail = f"Google API error: {error._get_reason()}"
        # Provide more specific feedback if possible (e.g., permission denied, invalid date format)
        if error.resp.status == 403:
             detail = "Permission denied by Google Calendar API. Check scopes or user access."
        elif error.resp.status == 400:
             detail = "Invalid request to Google Calendar API. Check event data format."
        raise HTTPException(status_code=error.resp.status, detail=detail)
        
    except HTTPException as http_exc:
        # Re-raise exceptions from get_google_calendar_client
        raise http_exc
        
    except Exception as e:
        logger.error(f"Unexpected error creating calendar event for user {google_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create calendar event due to an internal server error.")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
        
    

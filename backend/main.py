from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging
from uuid import UUID # Import UUID
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleAuthRequest # Alias to avoid name clash
from fastapi import Request as FastAPIRequest # Alias FastAPI's Request
from fastapi.responses import RedirectResponse

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
CLIENT_SECRETS_FILE = os.path.join(os.path.dirname(__file__), 'client_secret_377799709353-3e316d1al2o05ju3k84ip6ud0hfu3p7l.apps.googleusercontent.com.json') # USE YOUR ACTUAL FILENAME

# Define the scopes your app needs
SCOPES = ['https://www.googleapis.com/auth/calendar.events']
# The Redirect URI for the backend callback handler
REDIRECT_URI = 'http://localhost:8000/oauth2callback'

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
                "plan_type": "basic" # <<< Add default plan type here
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
async def initiate_google_calendar_auth(google_id: str): # Get user ID to store in state
    try:
        if not os.path.exists(CLIENT_SECRETS_FILE):
             logger.error(f"Client secrets file not found at: {CLIENT_SECRETS_FILE}")
             raise HTTPException(status_code=500, detail="Server configuration error: Client secrets file missing.")
             
        # Create flow instance using client secrets file
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        # Generate the authorization URL users will visit
        authorization_url, state = flow.authorization_url(
            access_type='offline',  # Essential for getting a refresh token
            prompt='consent',      # Force consent screen for refresh token
            # Include user identifier in state to link tokens later safely
            state=google_id # Pass the user's google_id in the state
        )
        
        logger.info(f"Redirecting user {google_id} to Google for Calendar auth.")
        # Redirect the user to Google's authorization page
        return RedirectResponse(authorization_url)
        
    except Exception as e:
        logger.error(f"Error initiating Google Calendar auth for user {google_id}: {str(e)}")
        # Optionally redirect to a frontend error page
        raise HTTPException(status_code=500, detail="Failed to initiate Google Calendar authentication.")

@app.get("/oauth2callback") # Path must match REDIRECT_URI and Google Console config
async def oauth2callback(request: FastAPIRequest, code: str, state: str): # Google adds 'code' and 'state'
    # The 'state' should contain the user's google_id we passed
    google_id = state
    try:
        logger.info(f"Received OAuth callback for user {google_id}...")
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )

        # Exchange the authorization code for credentials
        flow.fetch_token(code=code)
        credentials = flow.credentials

        logger.info(f"Successfully exchanged code for tokens for user {google_id}. Refresh token received: {bool(credentials.refresh_token)}")

        # Store the credentials securely associated with the user
        # IMPORTANT: Encrypt refresh_token before saving in production!
        update_data = {
            'google_refresh_token': credentials.refresh_token, # Store this long-term
            'google_access_token': credentials.token,
            'google_token_expiry': credentials.expiry.isoformat() if credentials.expiry else None
        }

        # Update the user's record in Supabase
        response = supabase.table("users").update(update_data).eq("google_id", google_id).execute()

        if not response.data:
             logger.error(f"Failed to store Google tokens for user {google_id}. User not found or update failed.")
             # Redirect user back to frontend with an error indicator
             return RedirectResponse("http://localhost:3000/profile?google_auth_status=error_saving")

        logger.info(f"Google Calendar tokens stored successfully for user {google_id}")
        # Redirect user back to a relevant frontend page (e.g., profile or dashboard)
        return RedirectResponse("http://localhost:3000/profile?google_auth_status=success")

    except Exception as e:
        logger.error(f"Error during Google OAuth callback for user {google_id}: {str(e)}")
        # Redirect user back to frontend with an error indicator
        return RedirectResponse("http://localhost:3000/profile?google_auth_status=callback_failed")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
        
    

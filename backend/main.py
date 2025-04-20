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
    allow_origins=["http://localhost:3000"],  # Your Next.js frontend URL
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
class UserProfileUpdate(BaseModel):
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

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
        
    

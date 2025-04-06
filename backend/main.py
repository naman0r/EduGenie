from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

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

# Pydantic model for request validation
class UserAuth(BaseModel):
    google_id: str
    email: str
    full_name: str
    avatar_url: str | None = None

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
        
        else: # user signing into hackverseai for the first time
            logger.info(f"Creating new user: {user.email}")
            # Create new user
            new_user = supabase.table("users").insert(
                {
                    "google_id": user.google_id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "avatar_url": user.avatar_url,
                    "created_at": datetime.utcnow().isoformat(),
                    "last_logged_in": datetime.utcnow().isoformat()
                }
            ).execute()
            
            logger.info(f"New user created: {new_user}")
            return {"message": "User created", "user": new_user.data[0] if new_user.data else None}
    except Exception as e:
        logger.error(f"Error in google_auth: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process user: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
        
    

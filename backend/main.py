from fastapi import FastAPI
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) # type casting for debugging


app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World", "hello" : "your mom"}


@app.post("/auth/google")
async def google_auth(user):
    existing_user = supabase.table("users").select("*").eq("google_id", user.google_id).execute()
    
    if existing_user.data:
        # updates last login 
        supabase.table("users").update(
            {"last_logged_in": datetime.utcnow().isoformat()}
        ).eq("google_id", user.google_id).execute()
        
        return {"message" : "User login updated", "user": existing_user.data[0]}
    
    else: # user signing into hackverseai for the first time
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

        return {"message": "User created", "user": new_user.data[0]}
        
    

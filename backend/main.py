from flask import Flask, request, jsonify, abort, redirect
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime
import logging
from uuid import UUID
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
import jwt
from pydantic import BaseModel, Field
from typing import Optional
from routes.auth import bp as auth_bp
from routes.users import bp as users_bp
from routes.classes import bp as classes_bp
from routes.resources import bp as resources_bp
from routes.calendar import bp as calendar_bp
from routes.notes import bp as notes_bp
from routes.video import bp as video_bp



# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY in .env file")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    raise

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True, allow_headers=["Content-Type"])

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(classes_bp)
app.register_blueprint(resources_bp)
app.register_blueprint(calendar_bp)
app.register_blueprint(notes_bp)
app.register_blueprint(video_bp)


# --- Pydantic Models ---
class UserAuth(BaseModel):
    google_id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserProfileUpdate(BaseModel):
    academic_year: Optional[int] = None
    academic_level: Optional[str] = None
    institution: Optional[str] = None
    full_name: Optional[str] = None

class ClassCreate(BaseModel):
    name: str
    code: Optional[str] = None
    instructor: Optional[str] = None

class ResourceCreate(BaseModel):
    class_id: UUID
    user_id: str
    type: str
    name: str
    content: dict

class CalendarEventCreate(BaseModel):
    summary: str
    description: Optional[str] = None
    start_datetime: str
    end_datetime: str

# --- Google Calendar Config ---
CLIENT_SECRETS_FILE = os.path.join(os.path.dirname(__file__),
    'client_secret_377799709353-3e316d1al2o05ju3k84ip6ud0hfu3p7l.apps.googleusercontent.com.json')
SCOPES = ['https://www.googleapis.com/auth/calendar.events']
REDIRECT_URI = 'http://localhost:8000/oauth2callback'
GOOGLE_CLIENT_ID = None
GOOGLE_CLIENT_SECRET = None
GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token'

# Load Google client config
try:
    if os.path.exists(CLIENT_SECRETS_FILE):
        with open(CLIENT_SECRETS_FILE) as f:
            data = json.load(f)
            cfg = data.get('web') or data.get('installed')
            GOOGLE_CLIENT_ID = cfg.get('client_id')
            GOOGLE_CLIENT_SECRET = cfg.get('client_secret')
            GOOGLE_TOKEN_URI = cfg.get('token_uri', GOOGLE_TOKEN_URI)
            logger.info("Loaded Google Client config.")
    else:
        logger.error(f"Google client secrets not found: {CLIENT_SECRETS_FILE}")
except Exception as e:
    logger.error(f"Failed to load Google client config: {e}")

# --- Helper: Google Calendar Client ---
def get_google_calendar_client(google_id: str):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        abort(500, description="Server config error: Google client secrets not loaded.")
    # fetch tokens
    user_resp = supabase.table("users").select(
        "google_refresh_token,google_access_token,google_token_expiry"
    ).eq("google_id", google_id).maybe_single().execute()
    if not user_resp.data:
        abort(404, description="User not found.")
    token_info = user_resp.data
    refresh_token = token_info.get('google_refresh_token')
    access_token = token_info.get('google_access_token')
    if not refresh_token:
        abort(400, description="Google Calendar not connected for this user.")

    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri=GOOGLE_TOKEN_URI,
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=SCOPES
    )
    try:
        if not creds.valid:
            if creds.refresh_token:
                creds.refresh(GoogleAuthRequest())
                supabase.table("users").update({
                    'google_access_token': creds.token,
                    'google_token_expiry': creds.expiry.isoformat() if creds.expiry else None
                }).eq("google_id", google_id).execute()
            else:
                abort(401, description="Google Calendar re-authentication required.")
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        abort(500, description="Failed to refresh Google token.")
    try:
        service = build('calendar', 'v3', credentials=creds, static_discovery=False)
        return service
    except Exception as e:
        logger.error(f"Error building calendar service: {e}")
        abort(500, description="Failed to build Google Calendar client.")

# Remove existing routes since they are now handled by blueprints

@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "Hello World", "hello": "your mom"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
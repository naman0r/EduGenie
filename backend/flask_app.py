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
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

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

# --- Routes ---
@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "Hello World", "hello": "your mom"})

@app.route('/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    try:
        user = UserAuth(**data)
        # check existing
        existing = supabase.table("users").select("*").eq("google_id", user.google_id).execute()
        if existing.data:
            updated = supabase.table("users").update({
                'last_logged_in': datetime.utcnow().isoformat()
            }).eq("google_id", user.google_id).execute()
            return jsonify({"message": "User login updated", "user": updated.data[0] if updated.data else None})
        else:
            new_user = {
                'google_id': user.google_id,
                'email': user.email,
                'full_name': user.full_name,
                'avatar_url': user.avatar_url,
                'created_at': datetime.utcnow().isoformat(),
                'last_logged_in': datetime.utcnow().isoformat(),
                'plan_type': 'basic'
            }
            inserted = supabase.table("users").insert(new_user).execute()
            return jsonify({"message": "User created", "user": inserted.data[0] if inserted.data else None}), 201
    except Exception as e:
        logger.error(f"Error in google_auth: {e}")
        abort(500, description=str(e))

@app.route('/users/<string:google_id>', methods=['GET'])
def get_user_profile(google_id):
    try:
        resp = supabase.table("users").select("*").eq("google_id", google_id).maybe_single().execute()
        if not resp.data:
            abort(404, description="User profile not found")
        return jsonify({"user": resp.data})
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        abort(500, description=str(e))

@app.route('/users/<string:google_id>', methods=['PUT'])
def update_user_profile_route(google_id):
    data = request.get_json()
    try:
        update = UserProfileUpdate(**data).dict(exclude_none=True)
        if not update:
            abort(400, description="No update data provided")
        updated = supabase.table("users").update(update).eq("google_id", google_id).execute()
        if not updated.data:
            abort(404, description="User profile not found for update")
        return get_user_profile(google_id)
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        abort(500, description=str(e))

@app.route('/users/<string:google_id>/classes', methods=['GET'])
def get_user_classes(google_id):
    try:
        resp = supabase.table("classes").select("*").eq("user_id", google_id).order("created_at", desc=True).execute()
        return jsonify(resp.data)
    except Exception as e:
        logger.error(f"Error fetching classes: {e}")
        abort(500, description=str(e))

@app.route('/users/<string:google_id>/classes', methods=['POST'])
def create_user_class_route(google_id):
    data = request.get_json()
    try:
        cls = ClassCreate(**data).dict()
        cls['user_id'] = google_id
        resp = supabase.table("classes").insert(cls).execute()
        if not resp.data:
            abort(500, description="Failed to create class")
        return jsonify(resp.data[0]), 201
    except Exception as e:
        logger.error(f"Error creating class: {e}")
        abort(500, description=str(e))

@app.route('/classes/<string:class_id>', methods=['GET'])
def get_single_class(class_id):
    try:
        resp = supabase.table("classes").select("*").eq("id", class_id).maybe_single().execute()
        if not resp.data:
            abort(404, description="Class not found")
        return jsonify(resp.data)
    except Exception as e:
        logger.error(f"Error fetching class: {e}")
        abort(500, description=str(e))

@app.route('/auth/google/calendar/initiate', methods=['GET'])
def initiate_google_calendar_auth():
    google_id = request.args.get('google_id')
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        abort(500, description="Google client config not loaded.")
    try:
        flow = Flow.from_client_config(
            client_config={
                ('web' if 'web' in json.load(open(CLIENT_SECRETS_FILE)) else 'installed'):
                {
                    'client_id': GOOGLE_CLIENT_ID,
                    'client_secret': GOOGLE_CLIENT_SECRET,
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': GOOGLE_TOKEN_URI,
                    'redirect_uris': [REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        auth_url, state = flow.authorization_url(access_type='offline', prompt='consent', state=google_id)
        return redirect(auth_url)
    except Exception as e:
        logger.error(f"Error initiating calendar auth: {e}")
        abort(500, description="Failed to initiate Google Calendar auth")

@app.route('/oauth2callback', methods=['GET'])
def oauth2callback():
    code = request.args.get('code')
    state = request.args.get('state')
    google_id = state
    try:
        flow = Flow.from_client_config(
            client_config={('web' if 'web' in json.load(open(CLIENT_SECRETS_FILE)) else 'installed'):
                {
                    'client_id': GOOGLE_CLIENT_ID,
                    'client_secret': GOOGLE_CLIENT_SECRET,
                    'auth_uri':'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': GOOGLE_TOKEN_URI,
                    'redirect_uris': [REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        flow.fetch_token(code=code)
        creds = flow.credentials
        update = {
            'google_refresh_token': creds.refresh_token,
            'google_access_token': creds.token,
            'google_token_expiry': creds.expiry.isoformat() if creds.expiry else None
        }
        resp = supabase.table("users").update(update).eq("google_id", google_id).execute()
        return redirect("http://localhost:3000/profile?google_auth_status=" +
                        ("success" if resp.data else "error_saving"))
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return redirect("http://localhost:3000/profile?google_auth_status=callback_failed")

@app.route('/users/<string:google_id>/calendar/events', methods=['POST'])
def add_calendar_event(google_id):
    data = request.get_json()
    try:
        ev = CalendarEventCreate(**data)
        service = get_google_calendar_client(google_id)
        body = {
            'summary': ev.summary,
            'description': ev.description,
            'start': {'dateTime': ev.start_datetime},
            'end': {'dateTime': ev.end_datetime}
        }
        created = service.events().insert(calendarId='primary', body=body).execute()
        return jsonify({"message":"Event created successfully", "event_details": created}), 201
    except HttpError as err:
        code = err.resp.status
        msg = err._get_reason()
        logger.error(f"Google API error {code}: {msg}")
        abort(code, description=msg)
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        abort(500, description=str(e))

@app.route('/users/<string:google_id>/resources', methods=['GET'])
def get_user_resources(google_id):
    class_id = request.args.get('class_id')
    try:
        q = supabase.table("resources").select("*").eq("user_id", google_id)
        if class_id:
            q = q.eq("class_id", class_id)
        resp = q.order("created_at", desc=True).execute()
        return jsonify(resp.data)
    except Exception as e:
        logger.error(f"Error fetching resources: {e}")
        abort(500, description=str(e))

@app.route('/users/<string:google_id>/resources', methods=['POST'])
def create_resource_route(google_id):
    data = request.get_json()
    try:
        rc = ResourceCreate(**data)
        if rc.user_id != google_id:
            abort(400, description="Path user ID does not match user ID in body")
        d = rc.dict()
        d['class_id'] = str(d['class_id'])
        resp = supabase.table("resources").insert(d).execute()
        return jsonify(resp.data[0]), 201
    except Exception as e:
        logger.error(f"Error creating resource: {e}")
        abort(500, description=str(e))

@app.route('/users/<string:google_id>/resources/all', methods=['GET'])
def get_all_resources(google_id):
    try:
        resp = supabase.table("resources").select("*").eq("user_id", google_id).order("created_at", desc=True).execute()
        return jsonify(resp.data)
    except Exception as e:
        logger.error(f"Error fetching resources: {e}")
        abort(500, description=str(e))

@app.route('/users/<string:google_id>/resources/<string:resource_id>', methods=['GET'])
def get_resource_route(google_id, resource_id):
    try:
        resp = supabase.table("resources").select("*,classes(name)").eq("id", resource_id).eq("user_id", google_id).maybe_single().execute()
        if not resp.data:
            abort(404, description="Resource not found")
        data = resp.data
        cls = data.pop('classes', None)
        data['class_name'] = cls.get('name') if cls else None
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error fetching resource: {e}")
        abort(500, description=str(e))

@app.route('/users/<string:google_id>/resources/<string:resource_id>/ai/generate-mindmaps', methods=['POST'])
def generate_mindmaps_route(google_id, resource_id):
    # stub route
    return ('', 204)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000) 
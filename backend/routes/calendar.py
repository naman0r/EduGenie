from flask import Blueprint, request, jsonify, abort, redirect
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
from initdb import supabase
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('calendar', __name__)

CLIENT_SECRETS_FILE = 'client_secret_377799709353-3e316d1al2o05ju3k84ip6ud0hfu3p7l.apps.googleusercontent.com.json'
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

class CalendarEventCreate(BaseModel):
    summary: str
    description: Optional[str] = None
    start_datetime: str
    end_datetime: str

@bp.route('/auth/google/calendar/initiate', methods=['GET'])
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

@bp.route('/oauth2callback', methods=['GET'])
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

@bp.route('/users/<string:google_id>/calendar/events', methods=['POST'])
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

# Helper function to get Google Calendar client
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
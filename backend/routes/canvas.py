from flask import Blueprint, request, jsonify, abort
# from pydantic import BaseModel
# from typing import Optional
# from datetime import datetime
import logging
from initdb import supabase
import requests
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('canvas_infra', __name__)

@bp.route('/canvas/connect', methods=['POST'])
def connect_canvas(): 
    data = request.json
    domain = data.get('domain')
    access_token = data.get('access_token')
    google_id = data.get('google_id') 

    normalized_domain = None
    # Check if it's a disconnection request (both domain and token are None)
    is_disconnect_request = domain is None and access_token is None

    # Validate and normalize the domain ONLY IF NOT disconnecting
    if not is_disconnect_request:
        if not domain or not access_token:
            return jsonify({"error": "Domain and access token are required for connection"}), 400
        
        # Normalize the domain
        if isinstance(domain, str): 
            normalized_domain = domain.strip()
            if normalized_domain.startswith('http://'):
                normalized_domain = normalized_domain[7:]
            elif normalized_domain.startswith('https://'):
                normalized_domain = normalized_domain[8:]
            normalized_domain = normalized_domain.rstrip('/')
            normalized_domain = f"https://{normalized_domain}/"
        else:
            # Handle case where domain is present but not a string (shouldn't happen with JSON but good practice)
            return jsonify({"error": "Invalid domain format"}), 400

    # Google ID is always required
    if not google_id:
        return jsonify({"error": "User identifier (google_id) is required"}), 400

    # Store or clear the credentials in the database
    try:
        # Use normalized_domain if connecting, otherwise domain (which will be None if disconnecting)
        domain_to_store = normalized_domain if not is_disconnect_request else domain
        
        supabase.table('users').update({
            'canvas_domain': domain_to_store, 
            'canvas_access_token': access_token # Will be None if disconnecting
        }).eq('google_id', google_id).execute()
        
        message = "Canvas credentials stored successfully" if not is_disconnect_request else "Canvas connection removed successfully"
        return jsonify({"message": message}), 200
    except Exception as e:
        logger.error(f"Error updating Canvas credentials for {google_id}: {e}") # Added logging
        return jsonify({"error": "Database operation failed"}), 500  

    
    
    
@bp.route('/canvas/courses', methods =["GET"])
def get_current_courses(): 
    # lets see if I cooked or not
    data = request.json
    google_id = data.get('google_id')
    if not google_id: 
        return jsonify({"error": "User identifier (google_id) is required"}), 400
    
    # step 1 is getting canvas domain and token from supabase
    res = (supabase.table('users')
                     .select('canvas_domain, canvas_access_token')
                     .eq('google_id', google_id)
                     .single()
                     .execute())
    
    if res.data is None: 
        logger.error(f"Error fetching Canvas credentials for {google_id}: {res.error}")
        return jsonify({"error": "user not found or not connected to canvas"}), 500
    
    row = res.data # this is a row in the users table, supabase python is so cool
    token  = row.get('canvas_access_token')
    domain = row.get('canvas_domain')
    
    if not token or not domain: 
        return jsonify({"error": "canvas credentials not found"}), 400
    
    headers = {"Authorization": f"Bearer {token}"}
    params  = {"enrollment_state": "active"}   # only current courses
    url     = f"{domain}/api/v1/courses"
    
    try:
        courses = []
        while url:
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            if resp.status_code != 200:
                logger.warning(f"Canvas API error {resp.status_code}: {resp.text[:200]}")
                return jsonify({"error": "Canvas API error",
                                "details": resp.text}), resp.status_code

            courses.extend(resp.json())
            # Canvas paginates with RFC‑5988 Link headers
            url = resp.links.get('next', {}).get('url')
            params = None        # only on first iteration

    except requests.exceptions.RequestException as e:
        logger.exception("Network error reaching Canvas")
        return jsonify({"error": "Could not reach Canvas"}), 502

    return jsonify(courses), 200
        
        
   
    
    
    



# this is just to check if the blueprint connected properly. 
@bp.route('/testcanvas', methods=['GET'])
def test_canvas(): 
    return jsonify({"message": "you are not dumb"}), 200
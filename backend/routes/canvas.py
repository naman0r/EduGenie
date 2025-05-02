from flask import Blueprint, request, jsonify, abort
# from pydantic import BaseModel
# from typing import Optional
# from datetime import datetime
# import logging
from initdb import supabase

# Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

bp = Blueprint('canvas_infra', __name__)

@bp.route('/canvas/connect', methods=['POST'])
def connect_canvas(): 
    data = request.json
    domain = data.get('domain')
    access_token = data.get('access_token')
    google_id = data.get('google_id') 

    # Validate the domain and access token
    if not domain or not access_token:
        return jsonify({"error": "Domain and access token are required"}), 400

    # Store the credentials in the database
    try:
        supabase.table('users').update({
            'canvas_domain': domain,
            'canvas_access_token': access_token
        }).eq('google_id', google_id).execute()
        return jsonify({"message": "Canvas credentials stored successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500  

    


# this is just to check if the blueprint connected properly. 
@bp.route('/testcanvas', methods=['GET'])
def test_canvas(): 
    return jsonify({"message": "you are not dumb"}), 200
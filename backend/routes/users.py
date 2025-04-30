from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from initdb import supabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('users', __name__)

class UserProfileUpdate(BaseModel):
    academic_year: Optional[int] = None
    academic_level: Optional[str] = None
    institution: Optional[str] = None
    full_name: Optional[str] = None

@bp.route('/users/<string:google_id>', methods=['GET'])
def get_user_profile(google_id):
    try:
        resp = supabase.table("users").select("*").eq("google_id", google_id).maybe_single().execute()
        if not resp.data:
            abort(404, description="User profile not found")
        return jsonify({"user": resp.data})
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        abort(500, description=str(e))

@bp.route('/users/<string:google_id>', methods=['PUT'])
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
from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from initdb import supabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('auth', __name__)

class UserAuth(BaseModel):
    google_id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

@bp.route('/auth/google', methods=['POST'])
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
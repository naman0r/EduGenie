from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from initdb import supabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('classes', __name__)

class ClassCreate(BaseModel):
    name: str
    code: Optional[str] = None
    instructor: Optional[str] = None

@bp.route('/users/<string:google_id>/classes', methods=['GET'])
def get_user_classes(google_id):
    try:
        resp = supabase.table("classes").select("*").eq("user_id", google_id).order("created_at", desc=True).execute()
        return jsonify(resp.data)
    except Exception as e:
        logger.error(f"Error fetching classes: {e}")
        abort(500, description=str(e))

@bp.route('/users/<string:google_id>/classes', methods=['POST'])
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

@bp.route('/classes/<string:class_id>', methods=['GET'])
def get_single_class(class_id):
    try:
        resp = supabase.table("classes").select("*").eq("id", class_id).maybe_single().execute()
        if not resp.data:
            abort(404, description="Class not found")
        return jsonify(resp.data)
    except Exception as e:
        logger.error(f"Error fetching class: {e}")
        abort(500, description=str(e)) 
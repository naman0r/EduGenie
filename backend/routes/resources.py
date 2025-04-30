from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from uuid import UUID
from initdb import supabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('resources', __name__)

class ResourceCreate(BaseModel):
    class_id: UUID
    user_id: str
    type: str
    name: str
    content: dict

@bp.route('/users/<string:google_id>/resources', methods=['GET'])
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

@bp.route('/users/<string:google_id>/resources', methods=['POST'])
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

@bp.route('/users/<string:google_id>/resources/all', methods=['GET'])
def get_all_resources(google_id):
    try:
        resp = supabase.table("resources").select("*").eq("user_id", google_id).order("created_at", desc=True).execute()
        return jsonify(resp.data)
    except Exception as e:
        logger.error(f"Error fetching resources: {e}")
        abort(500, description=str(e))

@bp.route('/users/<string:google_id>/resources/<string:resource_id>', methods=['GET'])
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

@bp.route('/users/<string:google_id>/resources/<string:resource_id>/ai/generate-mindmaps', methods=['POST'])
def generate_mindmaps_route(google_id, resource_id):
    # stub route
    return ('', 204) 
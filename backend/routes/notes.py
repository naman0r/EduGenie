from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from initdb import supabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('notes', __name__)

class NoteCreate(BaseModel):
    user_id: str
    content: str

@bp.route('/users/<string:google_id>/notes', methods=['GET'])
def get_user_notes(google_id):
    try:
        resp = supabase.table("notes").select("*").eq("user_id", google_id).order("created_at", desc=True).execute()
        return jsonify(resp.data)
    except Exception as e:
        logger.error(f"Error fetching notes: {e}")
        abort(500, description=str(e))

@bp.route('/users/<string:google_id>/notes', methods=['POST'])
def create_user_note_route(google_id):
    data = request.get_json()
    try:
        note = NoteCreate(**data).dict()
        note['user_id'] = google_id
        note['created_at'] = datetime.utcnow().isoformat()
        note['updated_at'] = datetime.utcnow().isoformat()
        resp = supabase.table("notes").insert(note).execute()
        if not resp.data:
            abort(500, description="Failed to create note")
        return jsonify(resp.data[0]), 201
    except Exception as e:
        logger.error(f"Error creating note: {e}")
        abort(500, description=str(e))

@bp.route('/users/<string:google_id>/notes/<string:note_id>', methods=['PUT'])
def update_user_note_route(google_id, note_id):
    data = request.get_json()
    try:
        update_data = {"content": data.get("content"), "updated_at": datetime.utcnow().isoformat()}
        updated = supabase.table("notes").update(update_data).eq("id", note_id).eq("user_id", google_id).execute()
        if not updated.data:
            abort(404, description="Note not found for update")
        return jsonify(updated.data[0])
    except Exception as e:
        logger.error(f"Error updating note: {e}")
        abort(500, description=str(e))

@bp.route('/users/<string:google_id>/notes/<string:note_id>', methods=['DELETE'])
def delete_user_note_route(google_id, note_id):
    try:
        deleted = supabase.table("notes").delete().eq("id", note_id).eq("user_id", google_id).execute()
        if not deleted.data:
            abort(404, description="Note not found for deletion")
        return jsonify({"message": "Note deleted"})
    except Exception as e:
        logger.error(f"Error deleting note: {e}")
        abort(500, description=str(e))


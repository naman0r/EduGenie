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

@bp.route('/classes/batch', methods=['POST'])
def add_classes_batch():
    data = request.get_json()
    google_id = data.get('google_id')
    courses_data = data.get('courses')

    if not google_id or not courses_data:
        return jsonify({"error": "Missing google_id or courses data"}), 400
    
    if not isinstance(courses_data, list):
         return jsonify({"error": "courses data must be a list"}), 400

    # Validate if the google_id actually exists in users table (optional but good practice)
    # Note: If inserts fail due to foreign key constraint, this check isn't strictly necessary
    #       but can provide a clearer error message upfront.
    try:
        user_check = supabase.table("users").select("google_id").eq("google_id", google_id).limit(1).execute()
        if not user_check.data:
             logger.warning(f"Attempt to add classes for non-existent google_id: {google_id}")
             return jsonify({"error": "User not found for the provided google_id"}), 404
    except Exception as e:
        logger.exception(f"Error checking user existence for {google_id}: {e}")
        return jsonify({"error": "Database error verifying user"}), 500

    try:
        # Use the provided google_id directly as the foreign key value
        user_id_for_fk = google_id 

        # 2. Prepare course records for insertion
        classes_to_insert = []
        for course in courses_data:
            if not isinstance(course, dict) or 'name' not in course:
                 logger.warning(f"Skipping invalid course data item: {course}")
                 continue # Skip invalid course entries
            
            classes_to_insert.append({
                'user_id': user_id_for_fk, # Use google_id directly for the FK
                'name': course.get('name'),
                'code': course.get('code'), # Optional field
                'canvas_course_id': course.get('canvas_course_id'), # Store the canvas ID
            })
        
        if not classes_to_insert:
            return jsonify({"error": "No valid course data provided to insert"}), 400

        # 3. Insert the batch into the classes table
        insert_resp = supabase.table("classes").insert(classes_to_insert).execute()

        # Check if insertion failed (PostgREST might return data even on some errors, but check error status)
        if hasattr(insert_resp, 'error') and insert_resp.error:
             logger.error(f"Supabase insert error for batch classes: {insert_resp.error}")
             details = str(insert_resp.error)
             if 'duplicate key value violates unique constraint' in details:
                 return jsonify({"error": "One or more classes might already exist for this user."}), 409 # Conflict
             # Check for foreign key violation explicitly
             if 'violates foreign key constraint \"classes_user_id_fkey\"' in details:
                  logger.error(f"FK violation inserting classes for google_id: {google_id}")
                  return jsonify({"error": "User ID mismatch or user does not exist", "details": "Foreign key constraint violation"}), 400
             return jsonify({"error": "Failed to insert classes into database", "details": details}), 500

        if not insert_resp.data:
             logger.warning(f"Supabase insert for batch classes returned no data. Request: {classes_to_insert}")
             return jsonify({"error": "Failed to insert classes, database returned no confirmation."}), 500

        return jsonify({"message": f"{len(insert_resp.data)} classes added successfully"}), 201

    except Exception as e:
        logger.exception(f"Error processing batch class add for google_id {google_id}: {e}")
        return jsonify({"error": "An unexpected server error occurred"}), 500 

@bp.route('/classes/<string:class_id>/check-access/<string:google_id>', methods=['GET'])
def check_class_access(class_id, google_id):
    try:
        # Check if the class exists and belongs to the user
        resp = supabase.table("classes").select("id").eq("id", class_id).eq("user_id", google_id).maybe_single().execute()
        
        if not resp.data:
            return jsonify({"has_access": False}), 403
        
        return jsonify({"has_access": True}), 200
    except Exception as e:
        logger.error(f"Error checking class access: {e}")
        abort(500, description=str(e)) 
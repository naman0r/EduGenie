from flask import Blueprint, request, jsonify, abort
# from pydantic import BaseModel
# from typing import Optional
# from datetime import datetime
import logging
from initdb import supabase
import requests
import json
import time

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
    # Read google_id from query parameters instead of body for GET request
    google_id = request.args.get('google_id')
    # data = request.json # No longer reading from body
    # google_id = data.get('google_id')
    if not google_id: 
        return jsonify({"error": "User identifier (google_id) is required as query parameter"}), 400
    
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

@bp.route('/canvas/assignments/<string:course_id>', methods=['GET'])
def get_canvas_assignments(course_id):
    """Fetch assignments from Canvas for a specific course."""
    google_id = request.args.get('google_id')
    
    if not google_id:
        return jsonify({"error": "User identifier (google_id) is required as query parameter"}), 400
    
    if not course_id:
        return jsonify({"error": "Course ID is required"}), 400
    
    # Get Canvas credentials
    try:
        res = (supabase.table('users')
                        .select('canvas_domain, canvas_access_token')
                        .eq('google_id', google_id)
                        .single()
                        .execute())
        
        if res.data is None:
            logger.error(f"Error fetching Canvas credentials for {google_id}")
            return jsonify({"error": "User not found or not connected to Canvas"}), 404
        
        row = res.data
        token = row.get('canvas_access_token')
        domain = row.get('canvas_domain')
        
        if not token or not domain:
            return jsonify({"error": "Canvas credentials not found"}), 400
        
    except Exception as e:
        logger.error(f"Database error fetching Canvas credentials: {e}")
        return jsonify({"error": "Database error"}), 500
    
    # Fetch assignments from Canvas
    headers = {"Authorization": f"Bearer {token}"}
    params = {"bucket": "upcoming", "order_by": "due_at"}
    url = f"{domain}/api/v1/courses/{course_id}/assignments"
    
    try:
        assignments = []
        retry_count = 0
        max_retries = 2
        
        while url and retry_count <= max_retries:
            try:
                resp = requests.get(url, headers=headers, params=params, timeout=10)
                
                if resp.status_code == 200:
                    # Success - process the data and continue
                    assignments.extend(resp.json())
                    # Handle pagination
                    url = resp.links.get('next', {}).get('url')
                    params = None  # Only on first iteration
                    retry_count = 0  # Reset retry count on success
                else:
                    logger.warning(f"Canvas API error {resp.status_code}: {resp.text[:200]}")
                    if retry_count < max_retries:
                        retry_count += 1
                        logger.info(f"Retrying Canvas API request (attempt {retry_count}/{max_retries})")
                        time.sleep(1)  # Add a small delay before retry
                    else:
                        # Return error if max retries reached
                        return jsonify({
                            "error": "Canvas API error", 
                            "details": resp.text,
                            "status_code": resp.status_code
                        }), resp.status_code
            
            except requests.exceptions.Timeout:
                # Handle timeout specifically
                if retry_count < max_retries:
                    retry_count += 1
                    logger.info(f"Canvas API request timed out, retrying (attempt {retry_count}/{max_retries})")
                    time.sleep(1)
                else:
                    raise
        
    except requests.exceptions.RequestException as e:
        logger.exception("Network error reaching Canvas")
        return jsonify({"error": "Could not reach Canvas", "details": str(e)}), 502
    
    # Process assignments to match our format
    processed_assignments = []
    for assignment in assignments:
        processed_assignments.append({
            "id": assignment.get("id"),
            "title": assignment.get("name"),
            "description": assignment.get("description"),
            "due_date": assignment.get("due_at"),
            "html_url": assignment.get("html_url"),
            "submission_types": assignment.get("submission_types"),
            "points_possible": assignment.get("points_possible")
        })
    
    return jsonify(processed_assignments), 200

@bp.route('/classes/<string:class_id>/canvas/import-assignments', methods=['POST'])
def import_canvas_assignments(class_id):
    """Import assignments from Canvas into the tasks table."""
    data = request.json
    google_id = data.get('google_id')
    assignment_ids = data.get('assignment_ids', [])  # List of Canvas assignment IDs to import
    
    if not google_id:
        return jsonify({"error": "User identifier (google_id) is required"}), 400
    
    if not assignment_ids:
        return jsonify({"error": "No assignments selected for import"}), 400
    
    # Verify the class exists and belongs to the user
    try:
        class_check = (supabase.table('classes')
                              .select('id, canvas_course_id')
                              .eq('id', class_id)
                              .eq('user_id', google_id)
                              .single()
                              .execute())
        
        if not class_check.data:
            return jsonify({"error": "Class not found or not owned by user"}), 404
        
        canvas_course_id = class_check.data.get('canvas_course_id')
        if not canvas_course_id:
            return jsonify({"error": "This class is not linked to a Canvas course"}), 400
        
    except Exception as e:
        logger.error(f"Database error checking class: {e}")
        return jsonify({"error": "Database error"}), 500
    
    # Get Canvas credentials
    try:
        user_resp = (supabase.table('users')
                            .select('canvas_domain, canvas_access_token')
                            .eq('google_id', google_id)
                            .single()
                            .execute())
        
        if not user_resp.data:
            return jsonify({"error": "User not found or not connected to Canvas"}), 404
        
        token = user_resp.data.get('canvas_access_token')
        domain = user_resp.data.get('canvas_domain')
        
        if not token or not domain:
            return jsonify({"error": "Canvas credentials not found"}), 400
        
    except Exception as e:
        logger.error(f"Database error fetching user Canvas credentials: {e}")
        return jsonify({"error": "Database error"}), 500
    
    # Fetch assignments from Canvas to get details
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{domain}/api/v1/courses/{canvas_course_id}/assignments"
    params = {"assignment_ids[]": assignment_ids}
    
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        if resp.status_code != 200:
            logger.warning(f"Canvas API error {resp.status_code}: {resp.text[:200]}")
            return jsonify({"error": "Canvas API error", "details": resp.text}), resp.status_code
        
        canvas_assignments = resp.json()
        
    except requests.exceptions.RequestException as e:
        logger.exception("Network error reaching Canvas")
        return jsonify({"error": "Could not reach Canvas"}), 502
    
    # Insert assignments into tasks table
    imported_tasks = []
    for assignment in canvas_assignments:
        if assignment.get('id') not in assignment_ids:
            continue
            
        # Check if this assignment is already imported - use more careful error handling
        try:
            # Convert Canvas assignment ID to string for safety
            canvas_assignment_id_str = str(assignment.get('id'))
            
            # First check if assignment already exists
            existing_query = (supabase.table('tasks')
                             .select('id')
                             .eq('class_id', class_id)
                             .eq('user_id', google_id)
                             .eq('canvas_assignment_id', assignment.get('id')))
            
            existing_check = existing_query.execute()
            
            # Skip if assignment already exists
            if existing_check and existing_check.data and len(existing_check.data) > 0:
                logger.info(f"Skipping already imported assignment: {assignment.get('id')}")
                continue
                
        except Exception as e:
            logger.error(f"Error checking for existing task: {e}")
            # Don't abort, just log and continue to next assignment
            continue
        
        # Prepare the task data
        task_data = {
            'class_id': class_id,
            'user_id': google_id,
            'title': assignment.get('name'),
            'description': assignment.get('description'),
            'type': 'assignment',
            'due_date': assignment.get('due_at'),
            'status': 'pending',
            'from_canvas': True,
            'canvas_assignment_id': assignment.get('id'),
            'canvas_html_url': assignment.get('html_url'),
            'submission_types': json.dumps(assignment.get('submission_types', [])),
        }
        
        # Insert the task
        try:
            task_insert = supabase.table('tasks').insert(task_data).execute()
            if task_insert and task_insert.data:
                imported_tasks.append(task_insert.data[0])
            else:
                logger.warning(f"Task insert returned no data for assignment {assignment.get('id')}")
        except Exception as e:
            logger.error(f"Error inserting task from Canvas: {e}")
            # Continue to next assignment instead of aborting
    
    return jsonify({
        "message": f"Successfully imported {len(imported_tasks)} assignments",
        "imported_tasks": imported_tasks
    }), 201

@bp.route('/classes/<string:class_id>/tasks', methods=['GET'])
def get_class_tasks(class_id):
    """Get all tasks for a specific class."""
    google_id = request.args.get('google_id')
    
    if not google_id:
        return jsonify({"error": "User identifier (google_id) is required as query parameter"}), 400
    
    if not class_id:
        return jsonify({"error": "Class ID is required"}), 400
    
    # Verify the class exists and belongs to the user
    try:
        class_check = (supabase.table('classes')
                              .select('id')
                              .eq('id', class_id)
                              .eq('user_id', google_id)
                              .single()
                              .execute())
        
        if not class_check.data:
            return jsonify({"error": "Class not found or not owned by user"}), 404
        
    except Exception as e:
        logger.error(f"Database error checking class: {e}")
        return jsonify({"error": "Database error"}), 500
    
    # Get all tasks for the class
    try:
        tasks_resp = (supabase.table('tasks')
                             .select('*')
                             .eq('class_id', class_id)
                             .eq('user_id', google_id)
                             .order('due_date', desc=False)
                             .execute())
        
        return jsonify(tasks_resp.data), 200
        
    except Exception as e:
        logger.error(f"Database error fetching tasks: {e}")
        return jsonify({"error": "Database error"}), 500

@bp.route('/canvas/tasks/<string:task_id>/status', methods=['PUT'])
def update_task_status(task_id):
    """Update the status of a specific task."""
    data = request.json
    google_id = data.get('google_id')
    new_status = data.get('status')

    logger.info(f"Attempting to update task {task_id} to status: '{new_status}' for user {google_id}")

    if not google_id:
        return jsonify({"error": "User identifier (google_id) is required"}), 400
    
    if not new_status:
        return jsonify({"error": "New status is required"}), 400
    
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400

    try:
        # First, verify the task exists and belongs to the user
        task_check_res = (supabase.table('tasks')
                                .select('id, user_id')
                                .eq('id', task_id)
                                .eq('user_id', google_id)
                                .single()
                                .execute())

        if not task_check_res.data:
            return jsonify({"error": "Task not found or user not authorized"}), 404

        # Update the task status
        update_res = (supabase.table('tasks')
                            .update({'status': new_status})
                            .eq('id', task_id)
                            .eq('user_id', google_id) # Ensure only the owner can update
                            .execute())

        if update_res.data:
            # Optionally, return the updated task or just a success message
            # For simplicity, returning the first updated record
            # Ensure your frontend can handle if this returns a list or a single object
            # based on your Supabase client version and usage.
            # Assuming .execute() on update returns a list of updated records.
            return jsonify(update_res.data[0]), 200
        else:
            # This case might indicate the record wasn't updated,
            # potentially due to postgrest returning no content on successful update with certain settings
            # or if the conditions weren't met (though 'task_check_res' should catch user mismatch).
            # If Supabase returns an empty list on successful update with `returning='minimal'`,
            # this might be misinterpreted as an error.
            # Consider checking update_res.error or status codes from Supabase if applicable.
            # For now, we assume if task_check_res passed, the update should succeed.
            # A more robust check might involve re-fetching the task or ensuring `returning='representation'`.
            # Let's assume data will be present on successful update for now.
            logger.warning(f"Task status update for task {task_id} by user {google_id} returned no data.")
            # If your Supabase setup returns data upon successful update:
            # return jsonify({"error": "Failed to update task status, no data returned"}), 500
            # If it might return empty data on success (e.g. with `Prefer: return=minimal`):
            return jsonify({"message": "Task status updated successfully (no data returned)"}), 200


    except Exception as e:
        logger.error(f"Database error updating task {task_id} status: {e}")
        # Check for specific Supabase errors if possible, e.g., PgrstError
        # from supabase.lib.client_options import PgrstError
        # if isinstance(e, PgrstError):
        #     return jsonify({"error": f"Supabase error: {e.message}"}), 500
        return jsonify({"error": "Database operation failed"}), 500
from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from uuid import UUID
from initdb import supabase
import openai
import os
import json
from openai import OpenAI, APIError

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

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Instantiate the client (ensure API key is set)
client = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)
    logger.info("OpenAI client initialized.")
else:
    logger.warning("OPENAI_API_KEY not found. OpenAI client not initialized.")

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
        abort(500, description=str(e)) # learned abort instead of return for error handling

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

@bp.route('/users/<string:google_id>/resources/<string:resource_id>', methods=['PUT'])
def update_resource_content(google_id, resource_id):
    data = request.get_json()
    if 'content' not in data:
        abort(400, description="'content' field is required for update.")

    try:
        # Fetch the resource to ensure it exists and belongs to the user
        resource_resp = supabase.table("resources").select("id, user_id").eq("id", resource_id).eq("user_id", google_id).maybe_single().execute()
        if not resource_resp.data:
            abort(404, description="Resource not found or access denied.")

        update_payload = {"content": data['content']}
        # Optionally add updated_at if you have it in your schema
        # update_payload["updated_at"] = datetime.utcnow().isoformat()

        updated = supabase.table("resources").update(update_payload).eq("id", resource_id).execute()
        
        # Supabase update doesn't return the full updated object by default in Python client v1 unless specified
        # Fetch the updated resource again to return it
        if updated.data: # Check if update was likely successful (affected rows > 0)
            fetch_updated = supabase.table("resources").select("*, classes(name)").eq("id", resource_id).maybe_single().execute()
            if fetch_updated.data:
                 data = fetch_updated.data
                 cls = data.pop('classes', None)
                 data['class_name'] = cls.get('name') if cls else None
                 return jsonify(data)
            else:
                 # Should not happen if update was successful, but handle defensively
                 abort(500, description="Failed to retrieve updated resource.")
        else:
            # This condition might indicate the resource wasn't found or wasn't updated
            abort(404, description="Resource not found or failed to update.")

    except Exception as e:
        logger.error(f"Error updating resource content: {e}")
        abort(500, description=str(e))

@bp.route('/users/<string:google_id>/resources/<string:resource_id>/generate-mindmap', methods=['POST'])
def generate_mindmap_route(google_id, resource_id):
    if not client:
        abort(500, description="OpenAI client not initialized due to missing API key.")

    data = request.get_json()
    prompt = data.get('prompt')
    existing_nodes = data.get('existing_nodes') # Get existing data
    existing_edges = data.get('existing_edges') # Get existing data

    if not prompt:
        abort(400, description="'prompt' field is required.")

    try:
        # 1. Verify resource exists and belongs to user
        resource_resp = supabase.table("resources")\
            .select("id, user_id, type")\
            .eq("id", resource_id)\
            .eq("user_id", google_id)\
            .maybe_single()\
            .execute()

        if not resource_resp.data:
            abort(404, description="Resource not found or access denied.")
        if resource_resp.data.get('type') != 'Mindmap':
             abort(400, description="Resource is not of type Mindmap.")

        # 2. Construct OpenAI Prompt based on whether enhancing or generating new
        if existing_nodes and existing_edges:
            # --- Enhance Existing Mind Map --- 
            logger.info(f"Enhancing mind map for resource {resource_id}...")
            system_prompt = (
                "You are an expert mind map editor. You will be given an existing mind map structure (nodes and edges in JSON format) and a prompt. "
                "Your task is to enhance or add to the existing mind map based on the user's prompt. "
                "You can add new nodes, connect them to existing nodes, add connections between existing nodes, or potentially modify existing node labels if it makes sense based on the prompt. "
                "Output ONLY the *complete, updated* mind map structure as a JSON object containing two keys: 'nodes' and 'edges'. "
                "Follow the exact same JSON format requirements as the generation prompt (unique string IDs for nodes/edges, position object, data.label, edge format 'e[source]-[target]'). "
                "Ensure all original nodes and edges that should remain are included in your output, along with any additions or modifications. Keep existing node IDs where possible. Generate new unique IDs for new nodes/edges. "
                "Example node: { id: 'existing_id_1', position: { x: 0, y: 0 }, data: { label: 'Modified Label' } }"
                "Example new node: { id: 'new_node_abc', position: { x: 0, y: 0 }, data: { label: 'New Concept' } }"
                "Example edge: { id: 'eexisting_id_1-new_node_abc', source: 'existing_id_1', target: 'new_node_abc' }"
                "Do not include any explanations or introductory text outside the final JSON object."
            )
            
            existing_structure = json.dumps({"nodes": existing_nodes, "edges": existing_edges}, indent=2)
            user_content = f"Enhance the following mind map based on this prompt: '{prompt}'\n\nExisting Mind Map Structure:\n```json\n{existing_structure}\n```"

        else:
            # --- Generate New Mind Map --- 
            logger.info(f"Generating new mind map for resource {resource_id} with prompt: {prompt[:50]}...")
            system_prompt = (
                "You are an expert mind map generator. Given a topic or text, create a hierarchical mind map structure. "
                "Output ONLY a JSON object containing two keys: 'nodes' and 'edges'. "
                "'nodes' should be an array of objects, each with 'id' (string), 'position' (object with 'x' and 'y', initially 0), and 'data' (object with 'label'). "
                "'edges' should be an array of objects, each with 'id' (string, e.g., 'e1-2'), 'source' (source node id), and 'target' (target node id). "
                "Ensure node IDs are unique strings. Start node IDs from '1'. Edge IDs should follow the format 'e[source]-[target]'."
                "Example node: { id: '1', position: { x: 0, y: 0 }, data: { label: 'Central Topic' } }"
                "Example edge: { id: 'e1-2', source: '1', target: '2' }"
                "Do not include any explanations or introductory text outside the JSON object."
            )
            user_content = prompt

        # 3. Call OpenAI API
        completion = client.chat.completions.create(
            model="gpt-4o", # Using a potentially stronger model for editing tasks
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.6, # Slightly higher temp might be good for creative enhancement
            max_tokens=3072 # Allow more tokens for potentially larger combined structures
        )

        mindmap_json_string = completion.choices[0].message.content
        logger.info("OpenAI response received.")

        # 4. Parse and Validate OpenAI response
        try:
            mindmap_data = json.loads(mindmap_json_string)
            if not isinstance(mindmap_data, dict) or 'nodes' not in mindmap_data or 'edges' not in mindmap_data:
                raise ValueError("Invalid JSON structure from OpenAI.")
            # Add more validation if needed
        except (json.JSONDecodeError, ValueError) as json_error:
            logger.error(f"Failed to parse OpenAI response as valid JSON: {json_error}")
            logger.error(f"Raw OpenAI response: {mindmap_json_string}")
            abort(500, description="Failed to process the generated mind map structure.")

        # 5. Update the resource content in Supabase
        update_payload = {"content": mindmap_data}
        updated = supabase.table("resources")\
            .update(update_payload)\
            .eq("id", resource_id)\
            .execute()

        if not updated.data:
             abort(500, description="Failed to update resource content after generation.")

        # 6. Return the new content (important for frontend update)
        return jsonify(mindmap_data), 200 # Return the newly generated/updated content

    except APIError as api_error:
        logger.error(f"OpenAI API error: {api_error}")
        abort(502, description=f"Failed to communicate with AI service: {api_error.code}")
    except Exception as e:
        logger.error(f"Error generating/enhancing mind map: {e}")
        # Avoid exposing raw internal errors unless necessary
        abort(500, description="An unexpected error occurred during mind map generation.")

# Keep the generate-mindmaps stub or remove if replaced by the one above
# @bp.route('/users/<string:google_id>/resources/<string:resource_id>/ai/generate-mindmaps', methods=['POST'])
# def generate_mindmaps_route(google_id, resource_id):
#     # stub route
#     return ('', 204) 
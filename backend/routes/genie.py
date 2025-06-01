from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import logging
from initdb import supabase
import os
from openai import OpenAI, APIError
from uuid import UUID, uuid4
import json
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- OpenAI Client Initialization ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)
    logger.info("OpenAI client initialized for Genie.")
else:
    logger.warning("OPENAI_API_KEY not found. OpenAI client for Genie not initialized.")


bp = Blueprint('genie', __name__, url_prefix='/genie')

# --- Pydantic Models ---
class ChatMessageBase(BaseModel):
    id: UUID
    chat_id: UUID
    sender: str # Should match chat_sender_type enum ('user', 'ai')
    message_text: Optional[str] = None
    resource_type: Optional[str] = None # Should match chat_resource_type enum
    content: Optional[dict] = None
    created_at: datetime

    class Config:
        orm_mode = True # Allows creating model from ORM objects

class ChatCreate(BaseModel):
    name: Optional[str] = "New Genie" # Default name

class MessageCreate(BaseModel):
    message_text: str

class ChatUpdate(BaseModel):
    name: str

# --- Helper Function: Check Chat Ownership ---
def check_chat_ownership(chat_id: str, google_id: str):
    """Verifies if the user owns the chat."""
    try:
        resp = supabase.table("chats").select("id").eq("id", chat_id).eq("user_id", google_id).maybe_single().execute()
        if not resp.data:
            abort(403, description="Access denied: You do not own this chat.")
        return True
    except Exception as e:
        logger.error(f"Error checking chat ownership for chat {chat_id} and user {google_id}: {e}")
        abort(500, description="Failed to verify chat ownership.")


@bp.route('/test')
def test():
    return jsonify({"message": "Genie API is working!"})

# --- Chat Session (Genie) Routes ---
@bp.route('/users/<string:google_id>', methods=['POST'])
def create_chat_session(google_id):
    """Creates a new chat session (Genie) for a user."""
    data = request.get_json()
    chat_input = ChatCreate(**data if data else {})
    
    try:
        new_chat = {
            "user_id": google_id,
            "name": chat_input.name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        response = supabase.table("chats").insert(new_chat).execute()
        if not response.data:
            logger.error(f"Failed to create chat for user {google_id}: {response.error}")
            abort(500, description="Could not create chat session.")
        return jsonify(response.data[0]), 201
    except Exception as e:
        logger.error(f"Error creating chat for user {google_id}: {e}")
        abort(500, description=str(e))

@bp.route('/users/<string:google_id>', methods=['GET'])
def list_chat_sessions(google_id):
    """Lists all chat sessions (Genies) for a user, ordered by last updated."""
    try:
        response = supabase.table("chats")\
            .select("id, name, created_at, updated_at")\
            .eq("user_id", google_id)\
            .order("updated_at", desc=True)\
            .execute()
        return jsonify(response.data)
    except Exception as e:
        logger.error(f"Error listing chats for user {google_id}: {e}")
        abort(500, description=str(e))

# --- New routes for Edit and Delete ---
@bp.route('/<string:chat_id>', methods=['PUT'])
def update_chat_session_name(chat_id):
    """Updates the name of a specific chat session (Genie)."""
    # This is a placeholder for where you'd get the current user's google_id
    # In a real app, this needs robust auth from a token.
    # For now, we'll assume it's passed in the request for testing or handled by a decorator.
    google_id_current_user = request.headers.get("X-Google-ID")
    if not google_id_current_user:
        abort(401, description="User authentication required (X-Google-ID header missing).")

    check_chat_ownership(chat_id, google_id_current_user) # Verify ownership

    data = request.get_json()
    if not data or "name" not in data or not data["name"].strip():
        abort(400, description="'name' is required and cannot be empty.")
    
    try:
        chat_update_data = ChatUpdate(name=data["name"].strip())
        update_payload = {
            "name": chat_update_data.name,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        response = supabase.table("chats")\
            .update(update_payload)\
            .eq("id", chat_id)\
            .eq("user_id", google_id_current_user)\
            .execute()

        if not response.data:
            # This could happen if the chat_id didn't match or was already deleted
            logger.warning(f"Failed to update chat name for chat {chat_id}. No data returned or match failed.")
            abort(404, description="Chat session not found or update failed.")
        
        return jsonify(response.data[0]), 200
    except Exception as e:
        logger.error(f"Error updating chat name for chat {chat_id}: {e}")
        abort(500, description=str(e))

@bp.route('/<string:chat_id>', methods=['DELETE'])
def delete_chat_session(chat_id):
    """Deletes a specific chat session (Genie) and its messages."""
    # Placeholder for robust auth
    google_id_current_user = request.headers.get("X-Google-ID")
    if not google_id_current_user:
        abort(401, description="User authentication required (X-Google-ID header missing).")

    check_chat_ownership(chat_id, google_id_current_user) # Verify ownership

    try:
        # Foreign key constraint `chat_messages.chat_id` should have `ON DELETE CASCADE`
        # So, deleting the chat from `chats` table will also delete its messages.
        response = supabase.table("chats")\
            .delete()\
            .eq("id", chat_id)\
            .eq("user_id", google_id_current_user)\
            .execute()

        if not response.data:
            # This implies the chat didn't exist or didn't belong to the user.
            # The check_chat_ownership should ideally catch ownership issues first.
            logger.warning(f"Failed to delete chat {chat_id}. No data returned (already deleted or no access).")
            abort(404, description="Chat session not found or you do not have permission to delete it.")

        return jsonify({"message": "Chat session deleted successfully"}), 200 # Or 204 No Content
    except Exception as e:
        logger.error(f"Error deleting chat session {chat_id}: {e}")
        abort(500, description=str(e))

# --- Chat Message Routes ---
@bp.route('/<string:chat_id>/messages', methods=['GET'])
def get_chat_messages(chat_id):
    """Gets all messages for a specific chat session, ordered by creation time."""
    # Note: google_id for ownership check should ideally come from an auth token
    # For now, we might need to pass it or fetch it if available in session/request context
    # This is a placeholder for where you'd get the current user's google_id
    # google_id_current_user = request.headers.get("X-Google-ID") # Example: Get from header
    # if not google_id_current_user:
    #     abort(401, description="User authentication required.")
    # check_chat_ownership(chat_id, google_id_current_user)
    # For now, assuming ownership is handled by frontend or a previous step

    try:
        messages_resp = supabase.table("chat_messages")\
            .select("id, chat_id, sender, message_text, resource_type, content, created_at")\
            .eq("chat_id", chat_id)\
            .order("created_at", desc=False)\
            .execute()
        
        # Validate with Pydantic
        validated_messages = [ChatMessageBase(**msg) for msg in messages_resp.data]
        return jsonify([msg.dict() for msg in validated_messages])
    except Exception as e:
        logger.error(f"Error fetching messages for chat {chat_id}: {e}")
        abort(500, description=str(e))

@bp.route('/<string:chat_id>/messages', methods=['POST'])
def post_chat_message(chat_id):
    """Posts a message to a chat, gets an AI response, and saves both."""
    if not client:
        abort(503, description="OpenAI client not initialized. Cannot process message.")

    data = request.get_json()
    if not data or "message_text" not in data or not data["message_text"].strip():
        abort(400, description="'message_text' is required and cannot be empty.")
    
    user_message_text = data["message_text"].strip()
    resource_type = data.get("resource_type", None)
    content = None

    try:
        # 1. Save User's Message
        user_message_db = {
            "chat_id": chat_id,
            "sender": "user", # From chat_sender_type ENUM
            "message_text": user_message_text,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        user_msg_resp = supabase.table("chat_messages").insert(user_message_db).execute()
        if not user_msg_resp.data:
            logger.error(f"Failed to save user message for chat {chat_id}: {user_msg_resp.error}")
            abort(500, description="Could not save user message.")

        # 2. Update chat's updated_at timestamp
        supabase.table("chats").update({"updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", chat_id).execute()

        # 3. Get AI Response (simple, no history for now)
        logger.info(f"Sending to OpenAI for chat {chat_id}: '{user_message_text[:50]}...'")
        ai_response = client.chat.completions.create(
            model="gpt-3.5-turbo", # Or your preferred model
            messages=[
                {"role": "system", "content": "You are a helpful assistant which helps students learn about some topic."},
                {"role": "user", "content": user_message_text}
            ]
        )
        ai_message_text = ai_response.choices[0].message.content
        logger.info(f"Received from OpenAI for chat {chat_id}: '{ai_message_text[:50]}...'")

        # Only generate mindmap if resource_type is 'mindmap'
        if resource_type and resource_type.lower() == 'mindmap':
            content = json.loads(generate_mindmap_for_genie(user_message_text))
            resource_type_val = 'mindmap'
        elif resource_type and resource_type.lower() == 'video':
            # Generate video content
            content = generate_video_for_genie(user_message_text)
            resource_type_val = 'video'
        else:
            content = None
            resource_type_val = None

        # 4. Save AI's Message
        ai_message_db = {
            "chat_id": chat_id,
            "sender": "ai", # From chat_sender_type ENUM
            "message_text": ai_message_text,
            "content": content,
            "resource_type": resource_type_val,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        ai_msg_resp = supabase.table("chat_messages").insert(ai_message_db).execute()
        if not ai_msg_resp.data:
            logger.error(f"Failed to save AI message for chat {chat_id}: {ai_msg_resp.error}")
            return jsonify(ChatMessageBase(**ai_message_db, id=None, chat_id=UUID(chat_id)).dict()), 200

        validated_ai_message = ChatMessageBase(**ai_msg_resp.data[0])
        return jsonify(validated_ai_message.dict()), 201

    except APIError as e:
        logger.error(f"OpenAI API error for chat {chat_id}: {e}")
        abort(502, description=f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"Error posting message to chat {chat_id}: {e}")
        abort(500, description=str(e))




def generate_mindmap_for_genie(user_prompt):
    ''' just returns JSONB format for mindmap creation with openai client. '''
    
    if not client: 
        abort(500, description="OpenAI client not initialized due to missing API key.")
        
        
        
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
    
    completion = client.chat.completions.create(
            model="gpt-4o", # Using a potentially stronger model for editing tasks
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.6, # Slightly higher temp might be good for creative enhancement
            max_tokens=3072 # Allow more tokens for potentially larger combined structures
        )

    mindmap_json_string = completion.choices[0].message.content
    logger.info("OpenAI response received.")
    
    return mindmap_json_string
        
    

# Video generation function (moved from video.py for integration)
def generate_video_for_genie(user_prompt):
    """Generate actual video content with slides and synchronized audio"""
    if not client:
        abort(500, description="OpenAI client not initialized due to missing API key.")
    
    try:
        logger.info(f"Starting video generation for prompt: {user_prompt[:100]}...")
        
        # Step 1: Generate structured script for slides
        logger.info("Generating video script with slide breakdown...")
        script_response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system", 
                    "content": """You are an educational video script writer. Create a structured script for a simple slide-based video.

Output a JSON object with:
{
  "title": "Video title",
  "slides": [
    {
      "text": "Text to display on this slide (keep it concise, max 2-3 lines)",
      "narration": "What to say while this slide is shown",
      "duration": 4.0
    }
  ]
}

Guidelines:
- Create 3-6 slides maximum
- Each slide text should be concise and readable
- Narration should match the slide content
- Duration in seconds (3-6 seconds per slide)
- Focus on key concepts, not lengthy explanations
- Use simple, clear language"""
                },
                {"role": "user", "content": f"Create an educational video script about: {user_prompt}"}
            ]
        )
        
        script_data = json.loads(script_response.choices[0].message.content)
        logger.info(f"Generated script with {len(script_data['slides'])} slides")
        
        # Step 2: Generate TTS audio for the complete narration
        logger.info("Generating TTS audio...")
        full_narration = " ".join([slide['narration'] for slide in script_data['slides']])
        
        audio_response = client.audio.speech.create(
            model="tts-1-hd",
            voice="nova",
            input=full_narration,
            speed=0.95
        )
        
        # Step 3: Upload audio to Supabase
        job_id = str(uuid4())
        ensure_video_bucket_exists()
        
        audio_filename = f"video_{job_id}_audio.mp3"
        logger.info(f"Uploading audio: {audio_filename}")
        
        upload_response = supabase.storage.from_("generated-videos").upload(
            audio_filename,
            audio_response.content,
            {"contentType": "audio/mpeg"}
        )
        
        if hasattr(upload_response, 'error') and upload_response.error:
            raise Exception(f"Failed to upload audio: {upload_response.error}")
        
        # Get audio URL
        audio_url = supabase.storage.from_("generated-videos").get_public_url(audio_filename)
        if isinstance(audio_url, str):
            audio_public_url = audio_url
        else:
            audio_public_url = getattr(audio_url, 'publicUrl', str(audio_url))
        
        # Step 4: Return video generation data for frontend processing
        # The frontend will handle Canvas rendering and ffmpeg.wasm compilation
        video_content = {
            "video_id": job_id,
            "title": script_data.get("title", "Generated Educational Video"),
            "type": "slide_video",
            "status": "ready_for_compilation",
            "audio_url": audio_public_url,
            "slides": script_data['slides'],
            "total_duration": sum(slide.get('duration', 4.0) for slide in script_data['slides']),
            "format": "slide_compilation",
            "video_settings": {
                "width": 1280,
                "height": 720,
                "fps": 30,
                "background_color": "#000000",
                "text_color": "#FFFFFF",
                "font_family": "Arial, sans-serif",
                "font_size": 48,
                "text_align": "center"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"Video generation data prepared for job {job_id}")
        return video_content
        
    except Exception as e:
        logger.error(f"Error generating video for genie: {e}")
        raise


def ensure_video_bucket_exists():
    """Helper function to ensure the video bucket exists and is public"""
    try:
        logger.info("Checking if generated-videos bucket exists...")
        bucket_response = supabase.storage.get_bucket("generated-videos")
        
        # Check if bucket is public, if not make it public
        if hasattr(bucket_response, 'public') and not bucket_response.public:
            logger.info("Bucket exists but is private, updating to public...")
            try:
                supabase.storage.update_bucket("generated-videos", {"public": True})
                logger.info("Bucket updated to public")
            except Exception as update_error:
                logger.warning(f"Could not update bucket to public: {update_error}")
                
    except Exception as e:
        logger.info(f"Bucket doesn't exist, creating it as public. Error: {e}")
        try:
            supabase.storage.create_bucket("generated-videos", {"public": True})
            logger.info("Public bucket created successfully")
        except Exception as create_error:
            logger.error(f"Failed to create public bucket: {create_error}")
            # Continue anyway - maybe it exists but get_bucket failed
        
    


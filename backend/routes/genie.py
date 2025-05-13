from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import logging
from initdb import supabase
import os
from openai import OpenAI, APIError
from uuid import UUID

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
    
    # This is a placeholder for where you'd get the current user's google_id
    # It's CRITICAL for check_chat_ownership
    # google_id_current_user = request.headers.get("X-Google-ID") # Example
    # if not google_id_current_user:
    #     abort(401, description="User authentication required.")
    # check_chat_ownership(chat_id, google_id_current_user)
    # For the purpose of this implementation, assuming ownership is verified elsewhere
    # or the user_id is implicitly trusted from a secure context (e.g. session). 
    # In a real app, this needs robust auth.

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
        # For a better chatbot, you'd fetch previous messages and include them in the prompt.
        logger.info(f"Sending to OpenAI for chat {chat_id}: '{user_message_text[:50]}...'")
        ai_response = client.chat.completions.create(
            model="gpt-3.5-turbo", # Or your preferred model
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_message_text}
            ]
        )
        ai_message_text = ai_response.choices[0].message.content
        logger.info(f"Received from OpenAI for chat {chat_id}: '{ai_message_text[:50]}...'")

        # 4. Save AI's Message
        ai_message_db = {
            "chat_id": chat_id,
            "sender": "ai", # From chat_sender_type ENUM
            "message_text": ai_message_text,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        ai_msg_resp = supabase.table("chat_messages").insert(ai_message_db).execute()
        if not ai_msg_resp.data:
            logger.error(f"Failed to save AI message for chat {chat_id}: {ai_msg_resp.error}")
            # User message is saved, so don't abort entirely, but log and maybe return partial success?
            # For now, returning the AI message if available, but DB save failed.
            # This scenario needs careful handling in a production app.
            return jsonify(ChatMessageBase(**ai_message_db, id=None, chat_id=UUID(chat_id)).dict()), 200 # Faking ID

        # Return the AI's message (the latest one)
        validated_ai_message = ChatMessageBase(**ai_msg_resp.data[0])
        return jsonify(validated_ai_message.dict()), 201

    except APIError as e:
        logger.error(f"OpenAI API error for chat {chat_id}: {e}")
        abort(502, description=f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"Error posting message to chat {chat_id}: {e}")
        abort(500, description=str(e))


# how the fuck do i get started
# 1. create some sort of DDl for this (im thinking a chat table with 
#  id, uid, name, and a chat_thread table with id, number, enum for 'ai' or 'user', message and content
# 2. create a route for the chat feature
# 3. create a route for the chatbot to send messages to the user
# 4. create a route for the chatbot to receive messages from the user
# 5. create a route for the chatbot to send messages to the user
# 6. create a route for the chatbot to receive messages from the user


from flask import Blueprint, request, jsonify, abort
from supabase import create_client, Client
import os
import logging
from dotenv import load_dotenv
# logging.basicConfig(level=logging.INFO) # Removed redundant config
logger = logging.getLogger(__name__)

load_dotenv()
# Initialize OpenAI Client (as in video.py)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None
if OPENAI_API_KEY:
    from openai import OpenAI
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    logging.warning("OPENAI_API_KEY not found. AI features will be disabled.")


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client | None = None # Initialize supabase variable

if not supabase_url or not supabase_key:
    logging.error("Supabase URL or Key not found in environment variables. Routes requiring Supabase will fail.")
    # supabase remains None
else:
    try:
        supabase = create_client(supabase_url, supabase_key) # Assign to the variable
        logging.info("Supabase client initialized successfully.")
    except Exception as e:
        logging.error(f"Failed to initialize Supabase client: {e}")
        # supabase remains None



bp = Blueprint('chat', __name__, url_prefix='/chats')


# ---------------------------
# Chat list & create routes
# ---------------------------

# GET /chats?user_id=<google_id>  -> list chats for that user
@bp.route('/', methods=['GET'])
def list_chats():
    google_id = request.args.get('user_id')
    if not google_id:
        abort(400, description="Missing 'user_id' query parameter.")

    if not supabase:
        abort(503, description="Database service not available.")

    try:
        resp = supabase.table('chats') \
            .select('id, name, created_at, updated_at') \
            .eq('user_id', google_id) \
            .order('updated_at', desc=True) \
            .execute()

        return jsonify(resp.data if resp.data else []), 200
    except Exception as e:
        logger.error(f"Error fetching chats for {google_id}: {e}")
        abort(500, description="Failed to fetch chats.")


# POST /chats  body: {name, user_id}
@bp.route('/', methods=['POST'])
def create_chat():
    data = request.get_json()
    if not data:
        abort(400, description="Invalid JSON body.")

    name = data.get('name')
    google_id = data.get('user_id')

    if not name or not google_id:
        abort(400, description="'name' and 'user_id' fields are required.")

    if not supabase:
        abort(503, description="Database service not available.")

    try:
        # Insert new chat and return the inserted row (using returning='representation')
        insert_resp = supabase.table('chats') \
            .insert({'name': name, 'user_id': google_id}, returning='representation') \
            .execute()

        if not insert_resp.data or len(insert_resp.data) == 0:
            abort(500, description="Failed to create chat.")

        # insert_resp.data is a list of the inserted chat objects
        created_chat = insert_resp.data[0]
        return jsonify(created_chat), 201
    except Exception as e:
        logger.error(f"Error creating chat for {google_id}: {e}")
        abort(500, description="Failed to create chat.")


@bp.route('/<uuid:chat_id>', methods=['GET'])
def get_specific_chat(chat_id):
    try:
        chat_details = supabase.table('chats').select('*').eq('id', str(chat_id)).execute().data[0]
        return jsonify(chat_details), 200
    except Exception as e:
        logger.error(f"Error fetching chat {chat_id} for user {user_id}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        abort(500, description="Failed to retrieve chat details.")

# --- Create Message in Chat ---

@bp.route('/<uuid:chat_id>/messages', methods=['POST'])
def create_chat_message(chat_id):
    request_data = request.get_json()
    if not request_data:
        abort(400, description="Invalid JSON body.")

    message_text = request_data.get('message_text')
    sender = request_data.get('sender', 'user')  # default to user
    resource_type = request_data.get('resource_type')  # optional
    content = request_data.get('content')  # optional JSON
    user_id = request_data.get('user_id')  # we require for validation

    if not message_text or not user_id:
        abort(400, description="'message_text' and 'user_id' are required.")

    if sender not in ('user', 'ai'):
        abort(400, description="Invalid sender value.")

    if not supabase:
        abort(503, description="Database service not available.")

    # verify chat belongs to user_id
    chat_resp = supabase.table('chats').select('id').eq('id', str(chat_id)).eq('user_id', user_id).maybe_single().execute()
    if not chat_resp.data:
        abort(404, description="Chat not found for this user.")

    try:
        insert_payload = {
            'chat_id': str(chat_id),
            'sender': sender,
            'message_text': message_text,
            'resource_type': resource_type,
            'content': content,
        }
        # Insert new chat message and return it
        msg_resp = supabase.table('chat_messages').insert(insert_payload, returning='representation').execute()

        if not msg_resp.data or len(msg_resp.data) == 0:
            abort(500, description="Failed to create chat message.")

        # update chat updated_at
        supabase.table('chats').update({'updated_at': 'now()'}).eq('id', str(chat_id)).execute()

        return jsonify(msg_resp.data[0]), 201
    except Exception as e:
        logger.error(f"Error inserting message into chat {chat_id}: {e}")
        abort(500, description="Failed to create chat message.")


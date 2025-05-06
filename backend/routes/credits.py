from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from initdb import supabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('credits', __name__, url_prefix='/credits')

class Credit(BaseModel):
    user_id: str
    amount: int
    description: Optional[str] = None
    
@bp.route('/<string:google_id>/get_credits', methods=['GET'])
def create_credit(google_id):
    response = supabase.table("users").select("credits").eq("google_id", google_id).execute()
    return jsonify({"message": "Credit created", "credits": response.data[0]["credits"]})



# expects a json body with an amount int field. will use this to subtract credits from user too, 
# if the amount is negative. 
@bp.route('/<string:google_id>/add_credits', methods=['POST'])
def add_credits(google_id):
    data = request.get_json()
    amount = data.get("amount")

    if amount is None:
        return jsonify({"error": "Missing 'amount' in request body"}), 400

    if not isinstance(amount, int):
        return jsonify({"error": "'amount' must be an integer"}), 400
        
    try:
        # Fetch current credits
        user_response = supabase.table("users").select("credits").eq("google_id", google_id).single().execute()
        
        if not user_response.data:
            return jsonify({"error": "User not found"}), 404

        current_credits = user_response.data.get("credits", 0) # Default to 0 if credits column is null

        if amount == 0:
            return jsonify({"message": "Amount is 0, credits unchanged", "credits": current_credits})

        new_credits = current_credits + amount
        
        # Update credits
        update_response = supabase.table("users").update({"credits": new_credits}).eq("google_id", google_id).execute()

        if not update_response.data: # Check if update was successful and returned data
             logger.error(f"Failed to update credits for user {google_id}: {update_response.error.message if update_response.error else 'No data returned'}")
             return jsonify({"error": "Failed to update credits"}), 500

        return jsonify({"message": "Credits updated successfully", "credits": update_response.data[0]["credits"]})

    except Exception as e:
        logger.error(f"Error processing add_credits for user {google_id}: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500
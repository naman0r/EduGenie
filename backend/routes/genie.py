from flask import Blueprint, request, jsonify, abort
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from initdb import supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('genie', __name__, url_prefix='/genie')

@bp.route('/test')
def test():
    return jsonify({"message": "Genie API is working!"})


from flask import Flask, Blueprint

notes_bp = Blueprint("notes", __name__, url_prefix="/notes")

@notes_bp.route("/")
def home():
    return "Hello from the notes blueprint!"


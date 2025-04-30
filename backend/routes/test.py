from flask import Flask, Blueprint


bp = Blueprint("demo", __name__, url_prefix="/demo")

@bp.route("/hi")
def home():
    return "Hello from a blueprint!"
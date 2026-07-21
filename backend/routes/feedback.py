from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Feedback

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api/feedback")


@feedback_bp.route("", methods=["POST"])
@jwt_required()
def submit_feedback():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    if "is_correct" not in data:
        return jsonify({"error": "is_correct is required (true/false)"}), 400

    fb = Feedback(
        user_id=user_id,
        plant_id=data.get("plant_id"),
        identification_id=data.get("identification_id"),
        is_correct=bool(data["is_correct"]),
        comment=(data.get("comment") or "").strip() or None,
    )
    db.session.add(fb)
    db.session.commit()
    return jsonify(fb.to_dict()), 201

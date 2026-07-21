from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, SavedPlant, Plant
from achievements import check_achievements_after_save, log_activity

saved_bp = Blueprint("saved_plants", __name__, url_prefix="/api/saved-plants")


@saved_bp.route("", methods=["GET"])
@jwt_required()
def list_saved():
    user_id = int(get_jwt_identity())
    saved = SavedPlant.query.filter_by(user_id=user_id).order_by(SavedPlant.saved_at.desc()).all()
    return jsonify([s.to_dict() for s in saved]), 200


@saved_bp.route("", methods=["POST"])
@jwt_required()
def save_plant():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    plant_id = data.get("plant_id")

    plant = Plant.query.get(plant_id) if plant_id else None
    if not plant:
        return jsonify({"error": "plant not found"}), 404

    existing = SavedPlant.query.filter_by(user_id=user_id, plant_id=plant_id).first()
    if existing:
        return jsonify({"error": "already saved"}), 409

    saved = SavedPlant(user_id=user_id, plant_id=plant_id)
    db.session.add(saved)
    log_activity(user_id, f"Saved {plant.common_name}")
    db.session.commit()

    newly_unlocked = check_achievements_after_save(user_id)
    db.session.commit()

    return jsonify({"saved": saved.to_dict(), "newly_unlocked_badges": newly_unlocked}), 201


@saved_bp.route("/<int:plant_id>", methods=["DELETE"])
@jwt_required()
def unsave_plant(plant_id):
    user_id = int(get_jwt_identity())
    existing = SavedPlant.query.filter_by(user_id=user_id, plant_id=plant_id).first()
    if not existing:
        return jsonify({"error": "not found"}), 404
    db.session.delete(existing)
    db.session.commit()
    return jsonify({"message": "removed"}), 200

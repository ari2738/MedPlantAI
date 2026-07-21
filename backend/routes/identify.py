"""
MedPlant AI - Identify route
Accepts an uploaded image, sends it to Plant.id API, matches the result
against our Plant table, and logs an Identification record.
"""
import os
import base64
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Plant, Identification
from achievements import check_achievements_after_identification, log_activity
from app import limiter

identify_bp = Blueprint("identify", __name__, url_prefix="/api/identify")

PLANTID_API_KEY = os.environ.get("PLANTID_API_KEY")
PLANTID_URL = "https://plant.id/api/v3/identification?details=common_names,description,taxonomy,edible_parts,watering,propagation_methods"


def call_plantid(image_bytes, mime_type):
    if not PLANTID_API_KEY:
        raise RuntimeError("PLANTID_API_KEY is not set on the server")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "images": [f"data:{mime_type};base64,{image_b64}"],
    }

    headers = {
        "Api-Key": PLANTID_API_KEY,
        "Content-Type": "application/json",
    }

    resp = requests.post(PLANTID_URL, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    # Plant.id v3 response structure
    suggestions = data.get("result", {}).get("classification", {}).get("suggestions", [])

    if not suggestions:
        return {"common_name": "", "botanical_name": "", "confidence": 0, "external_info": None}

    top = suggestions[0]
    botanical_name = top.get("name", "")
    confidence = round(float(top.get("probability", 0)) * 100)

    details = top.get("details", {}) or {}
    common_names = details.get("common_names") or []
    common_name = common_names[0] if common_names else botanical_name

    description = None
    desc_obj = details.get("description")
    if isinstance(desc_obj, dict):
        description = desc_obj.get("value")
    elif isinstance(desc_obj, str):
        description = desc_obj

    taxonomy = details.get("taxonomy") or {}
    edible_parts = details.get("edible_parts") or []
    watering = details.get("watering") or {}
    wiki_url = details.get("url") or ""

    external_info = {
        "common_names": common_names,
        "description": description,
        "taxonomy": taxonomy,
        "edible_parts": edible_parts,
        "watering": watering.get("min") if isinstance(watering, dict) else None,
        "wiki_url": wiki_url,
    }

    return {
        "common_name": common_name,
        "botanical_name": botanical_name,
        "confidence": confidence,
        "external_info": external_info,
    }


@identify_bp.route("", methods=["POST"])
@limiter.limit("20 per hour")  # image identification is resource-intensive
@jwt_required()
def identify_plant():
    user_id = int(get_jwt_identity())

    if "image" not in request.files:
        return jsonify({"error": "no image file provided (expected form field 'image')"}), 400

    file = request.files["image"]
    image_bytes = file.read()
    mime_type = file.mimetype or "image/jpeg"

    try:
        result = call_plantid(image_bytes, mime_type)
    except requests.exceptions.HTTPError as e:
        try:
            detail = e.response.json()
        except Exception:
            detail = e.response.text
        return jsonify({"error": f"Plant.id API error: {str(e)}", "detail": detail}), 502
    except Exception as e:
        return jsonify({"error": f"identification failed: {str(e)}"}), 502

    confidence = float(result.get("confidence", 0) or 0)
    botanical_name = (result.get("botanical_name") or "").strip()
    common_name_guess = (result.get("common_name") or "").strip()

    matched_plant = None
    if botanical_name:
        matched_plant = Plant.query.filter(Plant.botanical_name.ilike(f"%{botanical_name}%")).first()
    if not matched_plant and common_name_guess:
        matched_plant = Plant.query.filter(Plant.common_name.ilike(f"%{common_name_guess}%")).first()

    record = Identification(
        user_id=user_id,
        plant_id=matched_plant.id if matched_plant else None,
        confidence=confidence,
        raw_label=common_name_guess or botanical_name or "Unknown",
    )
    db.session.add(record)

    label = matched_plant.common_name if matched_plant else (common_name_guess or "an unrecognized plant")
    log_activity(user_id, f"Identified {label}")
    db.session.commit()

    newly_unlocked = check_achievements_after_identification(user_id)
    db.session.commit()

    return jsonify({
        "identification": record.to_dict(),
        "matched_in_database": matched_plant is not None,
        "newly_unlocked_badges": newly_unlocked,
        "external_info": result.get("external_info"),
    }), 201


@identify_bp.route("/history", methods=["GET"])
@jwt_required()
def identification_history():
    user_id = int(get_jwt_identity())
    records = Identification.query.filter_by(user_id=user_id).order_by(Identification.created_at.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200

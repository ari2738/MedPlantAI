from flask import Blueprint, request, jsonify
from models import Plant, Remedy

plants_bp = Blueprint("plants", __name__, url_prefix="/api/plants")


@plants_bp.route("", methods=["GET"])
def list_plants():
    query = request.args.get("q", "").strip().lower()
    region = request.args.get("region", "").strip().lower()

    q = Plant.query
    if query:
        like = f"%{query}%"
        q = q.filter(
            (Plant.common_name.ilike(like))
            | (Plant.botanical_name.ilike(like))
            | (Plant.hindi_name.ilike(like))
            | (Plant.tamil_name.ilike(like))
        )
    if region:
        q = q.filter(Plant.region.ilike(f"%{region}%"))

    plants = q.order_by(Plant.common_name).all()
    return jsonify([p.to_dict(include_remedies=False) for p in plants]), 200


@plants_bp.route("/remedies/search", methods=["GET"])
def search_by_ailment():
    """Search remedies by ailment keyword, returns matching plants + their remedies."""
    ailment = request.args.get("q", "").strip()
    if not ailment:
        return jsonify([]), 200

    like = f"%{ailment}%"
    matching_remedies = Remedy.query.filter(Remedy.ailment.ilike(like)).all()

    # Group by plant, deduplicate
    seen = set()
    results = []
    for remedy in matching_remedies:
        plant = remedy.plant
        if plant.id not in seen:
            seen.add(plant.id)
            plant_data = plant.to_dict(include_remedies=False)
            # Only include remedies that match the ailment query
            plant_data["matched_remedies"] = [
                r.to_dict() for r in plant.remedies if ailment.lower() in r.ailment.lower()
            ]
            results.append(plant_data)

    results.sort(key=lambda x: x["common_name"])
    return jsonify(results), 200


@plants_bp.route("/<string:slug>", methods=["GET"])
def get_plant(slug):
    plant = Plant.query.filter_by(slug=slug).first()
    if not plant:
        return jsonify({"error": "plant not found"}), 404
    return jsonify(plant.to_dict(include_remedies=True)), 200


@plants_bp.route("/regions", methods=["GET"])
def list_regions():
    regions = [r[0] for r in Plant.query.with_entities(Plant.region).distinct() if r[0]]
    return jsonify(sorted(regions)), 200

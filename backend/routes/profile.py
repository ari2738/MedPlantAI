from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import (
    db, User, SavedPlant, Identification, QuizAttempt, Achievement, ActivityLog
)

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

POINTS_PER_IDENTIFICATION = 5
POINTS_PER_SAVE = 2
POINTS_PER_CORRECT_QUIZ = 3
POINTS_PER_BADGE = 20


@profile_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    plants_identified = Identification.query.filter_by(user_id=user_id).count()
    plants_saved = SavedPlant.query.filter_by(user_id=user_id).count()

    total_quiz = QuizAttempt.query.filter_by(user_id=user_id).count()
    correct_quiz = QuizAttempt.query.filter_by(user_id=user_id, is_correct=True).count()
    quiz_accuracy = round((correct_quiz / total_quiz) * 100, 1) if total_quiz else 0.0

    badges = Achievement.query.filter_by(user_id=user_id).order_by(Achievement.earned_at.desc()).all()

    total_points = (
        plants_identified * POINTS_PER_IDENTIFICATION
        + plants_saved * POINTS_PER_SAVE
        + correct_quiz * POINTS_PER_CORRECT_QUIZ
        + len(badges) * POINTS_PER_BADGE
    )

    recent_activity = (
        ActivityLog.query.filter_by(user_id=user_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
        .all()
    )

    recent_identifications = (
        Identification.query.filter_by(user_id=user_id)
        .order_by(Identification.created_at.desc())
        .limit(10)
        .all()
    )

    return jsonify({
        "profile": user.to_dict(),
        "stats": {
            "plants_identified": plants_identified,
            "plants_saved": plants_saved,
            "quiz_accuracy": quiz_accuracy,
            "total_quiz_attempts": total_quiz,
            "total_points": total_points,
        },
        "badges": [b.to_dict() for b in badges],
        "recent_activity": [a.to_dict() for a in recent_activity],
        "identification_history": [i.to_dict() for i in recent_identifications],
    }), 200

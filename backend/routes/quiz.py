from datetime import datetime, timezone, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import db, QuizQuestion, QuizAttempt
from achievements import check_achievements_after_quiz, log_activity

quiz_bp = Blueprint("quiz", __name__, url_prefix="/api/quiz")

DAILY_LIMIT = 5


def get_today_attempts(user_id):
    """Return number of quiz attempts the user has made today (UTC)."""
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    return QuizAttempt.query.filter(
        QuizAttempt.user_id == user_id,
        QuizAttempt.attempted_at >= today_start,
    ).count()


@quiz_bp.route("/random", methods=["GET"])
def random_question():
    import random
    count = QuizQuestion.query.count()
    if count == 0:
        return jsonify({"error": "no quiz questions available"}), 404
    q = QuizQuestion.query.offset(random.randint(0, count - 1)).first()
    return jsonify(q.to_dict(reveal_answer=False)), 200


@quiz_bp.route("/status", methods=["GET"])
@jwt_required()
def daily_status():
    """Return how many questions the user has answered today vs the daily limit."""
    user_id = int(get_jwt_identity())
    used = get_today_attempts(user_id)
    return jsonify({
        "used": used,
        "limit": DAILY_LIMIT,
        "remaining": max(0, DAILY_LIMIT - used),
        "completed": used >= DAILY_LIMIT,
    }), 200


@quiz_bp.route("/<int:question_id>/submit", methods=["POST"])
@jwt_required()
def submit_answer(question_id):
    user_id = int(get_jwt_identity())

    # Enforce daily limit
    used = get_today_attempts(user_id)
    if used >= DAILY_LIMIT:
        return jsonify({
            "error": "daily_limit_reached",
            "message": f"You've completed your {DAILY_LIMIT} questions for today. Come back tomorrow!",
            "used": used,
            "limit": DAILY_LIMIT,
        }), 429

    data = request.get_json(silent=True) or {}
    selected = (data.get("selected_answer") or "").strip()

    question = QuizQuestion.query.get(question_id)
    if not question:
        return jsonify({"error": "question not found"}), 404

    is_correct = selected.lower() == question.correct_answer.strip().lower()

    attempt = QuizAttempt(
        user_id=user_id,
        quiz_question_id=question_id,
        selected_answer=selected,
        is_correct=is_correct,
    )
    db.session.add(attempt)
    log_activity(user_id, "Completed Quiz" + (" (correct)" if is_correct else " (incorrect)"))
    db.session.commit()

    newly_unlocked = check_achievements_after_quiz(user_id)
    db.session.commit()

    used_after = used + 1
    return jsonify({
        "is_correct": is_correct,
        "correct_answer": question.correct_answer,
        "newly_unlocked_badges": newly_unlocked,
        "daily_progress": {
            "used": used_after,
            "limit": DAILY_LIMIT,
            "remaining": max(0, DAILY_LIMIT - used_after),
            "completed": used_after >= DAILY_LIMIT,
        },
    }), 200


@quiz_bp.route("/history", methods=["GET"])
@jwt_required()
def quiz_history():
    user_id = int(get_jwt_identity())
    attempts = QuizAttempt.query.filter_by(user_id=user_id).order_by(QuizAttempt.attempted_at.desc()).all()
    return jsonify([a.to_dict() for a in attempts]), 200

"""
MedPlant AI - Achievement engine
Called after relevant user actions (identify, save plant, quiz submit).
Checks milestone conditions and unlocks new badges if earned.
"""
from models import db, Achievement, SavedPlant, Identification, QuizAttempt, ActivityLog, Plant, now


def log_activity(user_id, action):
    db.session.add(ActivityLog(user_id=user_id, action=action))


def _unlock(user_id, badge_type):
    """Insert an Achievement row if not already earned. Returns True if newly unlocked."""
    exists = Achievement.query.filter_by(user_id=user_id, badge_type=badge_type).first()
    if exists:
        return False
    db.session.add(Achievement(user_id=user_id, badge_type=badge_type))
    log_activity(user_id, f"Earned badge: {badge_type.replace('_', ' ').title()}")
    return True


def check_achievements_after_identification(user_id):
    newly_unlocked = []
    total_ids = Identification.query.filter_by(user_id=user_id).count()

    if total_ids >= 1 and _unlock(user_id, "first_identification"):
        newly_unlocked.append("first_identification")

    if total_ids >= 25 and _unlock(user_id, "herbal_expert"):
        newly_unlocked.append("herbal_expert")

    # Regional Expert: identified plants spanning 3+ distinct regions
    distinct_regions = (
        db.session.query(Plant.region)
        .join(Identification, Identification.plant_id == Plant.id)
        .filter(Identification.user_id == user_id, Plant.region.isnot(None))
        .distinct()
        .count()
    )
    if distinct_regions >= 3 and _unlock(user_id, "regional_expert"):
        newly_unlocked.append("regional_expert")

    _maybe_champion(user_id, newly_unlocked)
    return newly_unlocked


def check_achievements_after_save(user_id):
    newly_unlocked = []
    total_saved = SavedPlant.query.filter_by(user_id=user_id).count()

    if total_saved >= 10 and _unlock(user_id, "plant_explorer"):
        newly_unlocked.append("plant_explorer")

    _maybe_champion(user_id, newly_unlocked)
    return newly_unlocked


def check_achievements_after_quiz(user_id):
    newly_unlocked = []
    total_correct = QuizAttempt.query.filter_by(user_id=user_id, is_correct=True).count()

    if total_correct >= 10 and _unlock(user_id, "quiz_master"):
        newly_unlocked.append("quiz_master")

    _maybe_champion(user_id, newly_unlocked)
    return newly_unlocked


def _maybe_champion(user_id, newly_unlocked):
    """MedPlant Champion: earned all other 5 badges."""
    other_badges = {"first_identification", "plant_explorer", "quiz_master", "regional_expert", "herbal_expert"}
    earned = {a.badge_type for a in Achievement.query.filter_by(user_id=user_id).all()}
    if other_badges.issubset(earned) and _unlock(user_id, "medplant_champion"):
        newly_unlocked.append("medplant_champion")

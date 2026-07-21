"""
MedPlant AI - Database Models
Flask + SQLAlchemy + PostgreSQL
"""
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


def now():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# USER
# ---------------------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=now)

    saved_plants = db.relationship("SavedPlant", backref="user", lazy=True, cascade="all, delete-orphan")
    identifications = db.relationship("Identification", backref="user", lazy=True, cascade="all, delete-orphan")
    quiz_attempts = db.relationship("QuizAttempt", backref="user", lazy=True, cascade="all, delete-orphan")
    achievements = db.relationship("Achievement", backref="user", lazy=True, cascade="all, delete-orphan")
    feedback_entries = db.relationship("Feedback", backref="user", lazy=True, cascade="all, delete-orphan")
    activity_logs = db.relationship("ActivityLog", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, raw_password):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# PLANT / REMEDY / QUIZ (already built - kept as-is, extended slightly)
# ---------------------------------------------------------------------------
class Plant(db.Model):
    __tablename__ = "plants"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(120), unique=True, nullable=False)
    common_name = db.Column(db.String(150), nullable=False)
    botanical_name = db.Column(db.String(150), nullable=False)
    family = db.Column(db.String(100))
    hindi_name = db.Column(db.String(150))
    tamil_name = db.Column(db.String(150))
    part_used = db.Column(db.String(200))
    region = db.Column(db.String(200))
    uses = db.Column(db.JSON)
    image_url = db.Column(db.String(500))

    remedies = db.relationship("Remedy", backref="plant", lazy=True, cascade="all, delete-orphan")
    quiz_questions = db.relationship("QuizQuestion", backref="plant", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_remedies=True):
        data = {
            "id": self.id,
            "slug": self.slug,
            "common_name": self.common_name,
            "botanical_name": self.botanical_name,
            "family": self.family,
            "hindi_name": self.hindi_name,
            "tamil_name": self.tamil_name,
            "part_used": self.part_used,
            "region": self.region,
            "uses": self.uses,
            "image_url": self.image_url,
        }
        if include_remedies:
            data["remedies"] = [r.to_dict() for r in self.remedies]
        return data


class Remedy(db.Model):
    __tablename__ = "remedies"

    id = db.Column(db.Integer, primary_key=True)
    plant_id = db.Column(db.Integer, db.ForeignKey("plants.id"), nullable=False)
    ailment = db.Column(db.String(200), nullable=False)
    preparation = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {"ailment": self.ailment, "preparation": self.preparation}


class QuizQuestion(db.Model):
    __tablename__ = "quiz_questions"

    id = db.Column(db.Integer, primary_key=True)
    plant_id = db.Column(db.Integer, db.ForeignKey("plants.id"), nullable=False)
    question = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.String(200), nullable=False)
    wrong_answers = db.Column(db.JSON)

    attempts = db.relationship("QuizAttempt", backref="question", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, reveal_answer=False):
        data = {
            "id": self.id,
            "plant_id": self.plant_id,
            "question": self.question,
            "options": self._shuffled_options(),
        }
        if reveal_answer:
            data["correct_answer"] = self.correct_answer
        return data

    def _shuffled_options(self):
        import random
        opts = list(self.wrong_answers or []) + [self.correct_answer]
        random.shuffle(opts)
        return opts


# ---------------------------------------------------------------------------
# USER-SCOPED TABLES
# ---------------------------------------------------------------------------
class SavedPlant(db.Model):
    __tablename__ = "saved_plants"
    __table_args__ = (db.UniqueConstraint("user_id", "plant_id", name="uq_user_plant_saved"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    plant_id = db.Column(db.Integer, db.ForeignKey("plants.id"), nullable=False)
    saved_at = db.Column(db.DateTime, default=now)

    plant = db.relationship("Plant")

    def to_dict(self):
        return {
            "id": self.id,
            "plant": self.plant.to_dict(include_remedies=False),
            "saved_at": self.saved_at.isoformat(),
        }


class Identification(db.Model):
    __tablename__ = "identifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    plant_id = db.Column(db.Integer, db.ForeignKey("plants.id"), nullable=True)  # null if unrecognized
    image_url = db.Column(db.String(500))
    confidence = db.Column(db.Float)  # 0-100
    raw_label = db.Column(db.String(200))  # what Gemini returned, even if no plant match
    created_at = db.Column(db.DateTime, default=now)

    plant = db.relationship("Plant")

    def to_dict(self):
        return {
            "id": self.id,
            "plant": self.plant.to_dict(include_remedies=False) if self.plant else None,
            "raw_label": self.raw_label,
            "image_url": self.image_url,
            "confidence": self.confidence,
            "created_at": self.created_at.isoformat(),
        }


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    quiz_question_id = db.Column(db.Integer, db.ForeignKey("quiz_questions.id"), nullable=False)
    selected_answer = db.Column(db.String(200), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    attempted_at = db.Column(db.DateTime, default=now)

    def to_dict(self):
        return {
            "id": self.id,
            "quiz_question_id": self.quiz_question_id,
            "selected_answer": self.selected_answer,
            "is_correct": self.is_correct,
            "attempted_at": self.attempted_at.isoformat(),
        }


BADGE_TYPES = {
    "first_identification": ("🌱", "First Identification"),
    "plant_explorer": ("🌿", "Plant Explorer"),
    "quiz_master": ("🧠", "Quiz Master"),
    "regional_expert": ("🌍", "Regional Expert"),
    "herbal_expert": ("⭐", "Herbal Expert"),
    "medplant_champion": ("🏆", "MedPlant Champion"),
}


class Achievement(db.Model):
    __tablename__ = "achievements"
    __table_args__ = (db.UniqueConstraint("user_id", "badge_type", name="uq_user_badge"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    badge_type = db.Column(db.String(50), nullable=False)
    earned_at = db.Column(db.DateTime, default=now)

    def to_dict(self):
        icon, label = BADGE_TYPES.get(self.badge_type, ("🏅", self.badge_type))
        return {
            "badge_type": self.badge_type,
            "icon": icon,
            "label": label,
            "earned_at": self.earned_at.isoformat(),
        }


class Feedback(db.Model):
    """Lets users report if an identification result was right or wrong."""
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    plant_id = db.Column(db.Integer, db.ForeignKey("plants.id"), nullable=True)
    identification_id = db.Column(db.Integer, db.ForeignKey("identifications.id"), nullable=True)
    is_correct = db.Column(db.Boolean, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=now)

    def to_dict(self):
        return {
            "id": self.id,
            "plant_id": self.plant_id,
            "identification_id": self.identification_id,
            "is_correct": self.is_correct,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }


class ActivityLog(db.Model):
    """Powers the 'Recent Activity' feed on the profile page."""
    __tablename__ = "activity_log"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    action = db.Column(db.String(255), nullable=False)  # e.g. "Identified Neem"
    created_at = db.Column(db.DateTime, default=now)

    def to_dict(self):
        return {"id": self.id, "action": self.action, "created_at": self.created_at.isoformat()}

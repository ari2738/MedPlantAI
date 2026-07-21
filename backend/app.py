"""
MedPlant AI - Flask app entry point
"""
import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from models import db
from routes.auth import auth_bp
from routes.plants import plants_bp
from routes.saved_plants import saved_bp
from routes.identify import identify_bp
from routes.quiz import quiz_bp
from routes.feedback import feedback_bp
from routes.profile import profile_bp

# Global limiter instance — blueprints import this to add per-route limits
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",  # use Redis URI in production for multi-worker setups
)


def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/medplant_db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")

    db.init_app(app)
    JWTManager(app)
    limiter.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://medplantai.netlify.app",
    ]}})

    # Create tables if they don't exist (safe to run on every startup)
    with app.app_context():
        db.create_all()

    app.register_blueprint(auth_bp)
    app.register_blueprint(plants_bp)
    app.register_blueprint(saved_bp)
    app.register_blueprint(identify_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(profile_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    # Return JSON for rate limit errors instead of plain text
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "rate_limit_exceeded", "message": str(e.description)}), 429

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)

"""
MedPlant AI - Seed script (plants, remedies, quiz questions only)
User-related tables start empty and populate as people use the app.

Usage:
    export DATABASE_URL="postgresql://user:pass@host:5432/medplant_db"
    pip install -r requirements.txt
    python seed_database.py
"""
import json
import os
import random
from app import create_app
from models import db, Plant, Remedy, QuizQuestion

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "plants_seed_data.json")

app = create_app()


def make_quiz_questions(all_plants, plant):
    others = [p for p in all_plants if p["slug"] != plant["slug"]]
    distractor_names = random.sample([p["common"] for p in others], 3)

    q1 = QuizQuestion(
        question=f"What is the botanical name of {plant['common']}?",
        correct_answer=plant["botanical"],
        wrong_answers=random.sample([p["botanical"] for p in others], 3),
    )
    q2 = QuizQuestion(
        question=f"Which plant is traditionally associated with: \"{plant['uses'][0]}\"?",
        correct_answer=plant["common"],
        wrong_answers=distractor_names,
    )
    return [q1, q2]


def seed():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    with app.app_context():
        db.create_all()

        if Plant.query.first():
            print("Plants already seeded - skipping. Delete rows or drop tables to reseed.")
            return

        for entry in data:
            plant = Plant(
                slug=entry["slug"],
                common_name=entry["common"],
                botanical_name=entry["botanical"],
                family=entry.get("family"),
                hindi_name=entry.get("hindi"),
                tamil_name=entry.get("tamil"),
                part_used=entry.get("part"),
                region=entry.get("region"),
                uses=entry.get("uses", []),
            )
            db.session.add(plant)
            db.session.flush()

            for r in entry.get("remedies", []):
                db.session.add(Remedy(plant_id=plant.id, ailment=r["ailment"], preparation=r["prep"]))

            for q in make_quiz_questions(data, entry):
                q.plant_id = plant.id
                db.session.add(q)

        db.session.commit()
        print(f"Seeded {len(data)} plants, remedies, and quiz questions.")


if __name__ == "__main__":
    seed()

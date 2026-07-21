# MedPlant AI

An interactive Indian medicinal plant identifier — upload a leaf photo, get an
AI identification, browse traditional remedies, take quizzes, and track your
progress with badges.


**Website live url**

https://medplantai.netlify.app/

## Stack
- **Frontend:** React (Vite), Tailwind CSS v4, Framer Motion, React Router
- **Backend:** Flask, Flask-JWT-Extended, SQLAlchemy
- **Database:** PostgreSQL (Neon recommended)
- **AI:** Google Gemini Vision API (plant identification)
- **Auth:** JWT + bcrypt (via werkzeug password hashing)

## Backend setup

```bash
cd backend
pip install -r requirements.txt

export DATABASE_URL="postgresql://user:pass@host:5432/medplant_db"
export JWT_SECRET_KEY="something-long-and-random"
export GEMINI_API_KEY="your-gemini-api-key"

python seed_database.py   # one-time: loads 45 plants, remedies, quiz questions
python app.py             # runs on http://localhost:5000
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev                # runs on http://localhost:5173, proxies /api to :5000
```

To point the frontend at a deployed backend (e.g. Render), set the proxy target
in `vite.config.js`, or add a `.env` with `VITE_API_URL` and update `src/lib/api.js`
accordingly before deploying to Netlify.

## Deployment
- **Frontend:** Netlify (`npm run build`, publish `dist/`)
- **Backend:** Render (Flask app, add the same env vars as above)
- **Database:** Neon PostgreSQL — copy its connection string into `DATABASE_URL`

## What's included
- Full JWT auth (register/login, bcrypt password hashing, protected routes)
- 45 real medicinal plants seeded with Hindi/Tamil names, traditional uses, and remedies
- Gemini Vision-powered plant identification with confidence scores
- Saved plants, identification history, quiz with auto-generated questions
- Achievement system (6 badges, backend-triggered, stored with earned dates)
- Feedback system (report incorrect identifications)
- Activity log powering the "Recent Activity" profile feed
- Full profile dashboard: stats, badges, activity, identification history



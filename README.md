# 🏥 Medico AI - AI-Powered Medical Image Analysis

Medico AI is a **demo / learning project** that combines YOLO-based detection on medical images, AI-written explanatory notes (Google Gemini), and a chatbot.

> ⚠️ **Not a medical device.** Output is AI-generated, can be wrong, and must never replace a doctor's diagnosis. See [Model notes](#-model-notes-read-this-before-trusting-results).

## ✨ Features

- **🔍 Detection**: Upload an image and run one of three YOLO models (Tuberculosis, Eye Disease, Bone Fracture)
- **📋 AI notes**: Gemini writes plain-language notes about the detected finding (patient name/ID are **not** sent to Gemini)
- **💬 Chatbot**: Ask questions and get answers from Gemini
- **⚡ Three entry points**: Streamlit app, Django REST API, and a React frontend

## 📁 Project Structure

```
medico-2.0/
├── main.py                  # Streamlit web app
├── backend/                 # Django REST API
│   ├── manage.py
│   ├── medicoai/            # Settings, URLs, .env loader
│   └── core/                # API views, Gemini + YOLO helpers, tests
├── frontend/                # React + Vite
├── requirements.txt         # Backend dependencies
├── requirements-streamlit.txt  # Backend + Streamlit
├── Procfile                 # Process definition for Heroku-style hosts
├── vercel.json              # Frontend deployment config
└── .env.example             # Environment template
```

## 🚀 Quick Start

Prerequisites: Python 3.11+, Node.js 18+, Git.

```bash
git clone https://github.com/UjjwalShreyas/medico-2.0.git
cd medico-2.0

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements-streamlit.txt   # or requirements.txt for the API only

cp .env.example .env             # Windows: copy .env.example .env
# then open .env and paste your GEMINI_API_KEY
```

> The first install downloads PyTorch (large). That is normal.

## 🎯 Run Locally

### Option 1: Streamlit app

```bash
streamlit run main.py
```
Open http://localhost:8501

### Option 2: Django API + React frontend

Terminal 1 - backend:
```bash
python backend/manage.py runserver
```

Terminal 2 - frontend:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000. In development the frontend calls `/api/...` and Vite forwards it to Django on port 8000, so leave `VITE_BACKEND_URL` empty.

API endpoints:
- `POST /api/analyze/` - upload an image and detect
- `POST /api/chatbot/` - chat with the assistant

## ✅ Run the tests

```bash
python backend/manage.py test
```
Gemini is mocked, so no API key or internet is needed. The three YOLO models are real, so this also checks that the `.pt` files load and run.

## 📦 Model notes (read this before trusting results)

| Menu name | Classes the model outputs | Validation mAP50* |
|---|---|---|
| Tuberculosis (Lung Cancer) | `mtb` | 0.90 |
| Eye Disease | Bulging_Eyes, Cataracts, Crossed_Eyes, Glaucoma, Uveitis | 0.65 |
| Bone Fracture | angle, fracture, line, messed_up_angle | 0.36 |

\*Read from the training metadata stored inside each `.pt` file.

- The TB model has a single class, `mtb` (the usual abbreviation for *M. tuberculosis*). That points to a bacteria detector, not a chest X-ray lung-cancer detector, so the menu label "Tuberculosis (Lung Cancer)" is misleading. Confirm what data it was trained on before relying on it.
- In the bone model only `fracture` is treated as a finding. `angle`, `line` and `messed_up_angle` look like annotation labels and are ignored (`NON_DIAGNOSTIC_LABELS` in `backend/core/yolo_utils.py`).
- The bone model's accuracy is low. Treat its output as a demo.

## 🌐 Deployment

- **Frontend** → Vercel (static React build)
- **Backend** → any Python host (Railway, Render, Heroku, a VPS). Uses `Procfile` + `gunicorn`.

### Frontend on Vercel
1. Push to GitHub, then import the repo in Vercel (the build settings come from `vercel.json`).
2. In the Vercel dashboard add the environment variable `VITE_BACKEND_URL=https://your-backend-url`.
3. Deploy.

### Backend
Set these environment variables on the host (never commit them):
```
GEMINI_API_KEY=...
DJANGO_SECRET_KEY=<long random string>
DJANGO_ALLOWED_HOSTS=your-backend-host.example.com
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```
Leave `DJANGO_DEBUG` unset in production.

Heads-up: the default `torch` wheel from PyPI is very large (it bundles CUDA). Many hosts have size limits, so use a CPU-only PyTorch build there. The `.pt` model files (~65 MB) must be present on the server.

## ⚙️ Environment Variables

See `.env.example` for the full list with comments. The important ones: `GEMINI_API_KEY` (required for reports and chat) and `GEMINI_MODEL` (change it when Google retires a model; see the [deprecations page](https://ai.google.dev/gemini-api/docs/deprecations)).

## 📝 API

### `POST /api/analyze/` (multipart form)

Fields: `image` (PNG/JPG, max 10 MB), `model` (one of the menu names above), `patient_name`, `patient_id`.

```json
{
  "detected_disease": "fracture (87.31%)",
  "medical_report": "Patient: ... \n\n...notes...\n\n⚠️ disclaimer",
  "report_error": "only present if the AI report failed; detection is still returned"
}
```

### `POST /api/chatbot/` (JSON)

```json
{ "query": "What are symptoms of tuberculosis?" }
```
Returns `{ "response": "..." }`.

Errors are always JSON: `{ "error": "message" }` with status 400 (bad input), 413 (too large), 429 (rate limited), 503 (AI/model unavailable).

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| "The AI service is not configured" | Add `GEMINI_API_KEY` to `.env` and restart |
| AI answers fail / "could not answer right now" | The model may be retired; update `GEMINI_MODEL` in `.env` |
| Frontend: "Can't reach the server" | Make sure `python backend/manage.py runserver` is running |
| Browser CORS error on a deployed site | Add the frontend's URL to `CORS_ALLOWED_ORIGINS` |
| "Model file is missing" | The `.pt` files must be in the repository root |
| HTTP 429 | Rate limit hit; wait a minute or raise `API_THROTTLE_RATE` |

## 📄 License

MIT License.

# Medico AI

Medico AI is a medical imaging assistant that combines image detection, AI-generated reports, and a chatbot experience.

## Project layout

- `main.py` is the Streamlit demo entry point.
- `backend/` contains the Django REST API used by the React frontend.
- `frontend/` contains the React/Tailwind UI components.
- The YOLO model files live at the repository root.

## Features

- Upload a medical image and detect likely conditions with YOLO.
- Generate a medical report with Gemini when a disease is detected.
- Ask questions in a Gemini-backed chatbot.
- Pass patient name and ID through the workflow.

## Requirements

Install the Python dependencies listed in `requirements.txt`.

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Run the Streamlit app

The quickest working entry point is the Streamlit app:

```bash
streamlit run main.py
```

The app loads the local image `temp.jpg` and the local YOLO model files:

- `bone_fracture.pt`
- `eye_disease.pt`
- `tuberculosis(lung_cancer).pt`

## Run the backend API

The Django backend lives under `backend/`.

```bash
python backend/manage.py migrate
python backend/manage.py runserver
```

API routes:

- `POST /api/analyze/`
- `POST /api/chatbot/`

## Environment variables

Create a `.env` file at the repository root if you want Gemini output to work:

```env
GEMINI_API_KEY=your_api_key_here
```

## Frontend status

The React components in `frontend/src/` show the intended UI flow, but the frontend package is still incomplete because `frontend/package.json` does not yet include a React scaffold or run scripts. That means the current working entry points are the Streamlit app and the Django backend.

## Notes

- Model paths and image paths were changed to be repository-relative instead of machine-specific download folders.
- The backend now has a real `manage.py`, settings, WSGI, and ASGI module so Django can start from `backend/`.
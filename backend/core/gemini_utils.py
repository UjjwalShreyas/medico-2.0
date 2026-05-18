import google.generativeai as genai
import os
from pathlib import Path

def load_env_file():
    env_candidates = [
        Path(__file__).resolve().parents[2] / ".env",
        Path(__file__).resolve().parents[3] / ".env",
    ]

    for env_path in env_candidates:
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
        break


load_env_file()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def generate_medical_report(disease_name, patient_name, patient_id):
    if not GEMINI_API_KEY:
        return "Gemini API key is missing. Add GEMINI_API_KEY to .env"

    query = f"""
    Provide a detailed medical report for {disease_name} for patient {patient_name} (ID: {patient_id}).
    Include: Diagnosis, Treatment, Precautions, Advice.
    """
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(query)
    return response.text if response and hasattr(response, "text") else "No report available."

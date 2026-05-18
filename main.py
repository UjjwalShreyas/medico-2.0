import streamlit as st
import base64
import numpy as np
import cv2
import os
from PIL import Image
from ultralytics import YOLO
import time
from pathlib import Path
import google.generativeai as genai
from PIL import Image
import torch




# --- STREAMLIT PAGE CONFIG ---
st.set_page_config(page_title="MEDICO AI", layout="wide", page_icon="🩺")

ROOT_DIR = Path(__file__).resolve().parent

# Convert image to Base64
def image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

# Replace with a workspace-relative image path
base64_image = image_to_base64(ROOT_DIR / "temp.jpg")

# Custom CSS for background & styling
st.markdown(
    f"""
    <style>
    [data-testid="stAppViewContainer"] {{
        background-image: url("data:image/jpg;base64,{base64_image}");
        background-size: cover;
        background-position: center;
    }}
    [data-testid="stAppViewContainer"]::before {{
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 0;
    }}
    [data-testid="stAppViewContainer"] > * {{
        position: relative;
        z-index: 1;
        color: white;
    }}
    [data-testid="stSidebar"] {{
        background-color: #ADD8E6;
    }}
    [data-testid="stSidebar"] * {{
        color: #00008B;
    }}
    </style>
    """,
    unsafe_allow_html=True
)

# --- DEFAULT SESSION STATES (No login) ---
if "current_user" not in st.session_state:
    st.session_state["current_user"] = {"name": "Guest User"}
if "page" not in st.session_state:
    st.session_state["page"] = "Welcome Page"
if "analyzed_image" not in st.session_state:
    st.session_state["analyzed_image"] = None
if "patient_name" not in st.session_state:
    st.session_state["patient_name"] = ""
if "patient_id" not in st.session_state:
    st.session_state["patient_id"] = ""
if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []
if "uploaded_image" not in st.session_state:
    st.session_state["uploaded_image"] = None
if "detected_disease" not in st.session_state:
    st.session_state["detected_disease"] = "No Disease Detected"

# --- GEMINI API SETUP ---
def load_env_file():
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# --- YOLO MODEL PATHS ---
MODEL_PATHS = {
    "Tuberculosis (Lung Cancer)": str(ROOT_DIR / "tuberculosis(lung_cancer).pt"),
    "Eye Disease": str(ROOT_DIR / "eye_disease.pt"),
    "Bone Fracture": str(ROOT_DIR / "bone_fracture.pt"),
}

# Load YOLO Model
def load_detection_model(model_name):
    model_path = MODEL_PATHS.get(model_name)
    if model_path and Path(model_path).exists():
        return YOLO(model_path)
    else:
        st.error(f"Model file not found: {model_path}")
        return None

# Detect disease
def detect_disease(image, model):
    results = model(image)
    detections = results[0]
    image_np = np.array(image)
    detected_labels = []

    for r in detections.boxes:
        x1, y1, x2, y2 = map(int, r.xyxy[0])
        label = detections.names[int(r.cls[0])]
        conf = float(r.conf[0]) * 100
        detected_labels.append(f"{label} ({conf:.2f}%)")
        cv2.rectangle(image_np, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(image_np, f"{label} ({conf:.2f}%)", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    result_text = ", ".join(detected_labels) if detected_labels else "No Disease Detected"
    return image_np, result_text

# Medical report generation
def generate_medical_report(disease_name, patient_name, patient_id):
    if not GEMINI_API_KEY:
        return "Gemini API key is missing. Add GEMINI_API_KEY to .env"

    query = f"""
    Provide a detailed medical report for {disease_name} for patient {patient_name} (ID: {patient_id}).
    Include the following:
    - Diagnosis
    - Treatment options
    - Precautions
    - Medical advice
    """
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(query)
    return response.text if response and hasattr(response, "text") else "No report available."

# Chatbot response
def chatbot_response(query):
    if not GEMINI_API_KEY:
        return "Gemini API key is missing. Add GEMINI_API_KEY to .env"

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(query)
    return response.text if response and hasattr(response, "text") else "Sorry, I couldn't process that."

# --- SIDEBAR NAVIGATION ---
st.sidebar.title("Navigation📍")
st.sidebar.write(f"Logged in as: {st.session_state['current_user']['name']}")
page = st.sidebar.radio("Select a Page", ["Welcome Page", "Analysis and Report", "Medico AI"],
                        index=0 if st.session_state["page"] == "Welcome Page" else (
                            1 if st.session_state["page"] == "Analysis and Report" else 2))
if page != st.session_state["page"]:
    st.session_state["page"] = page
    st.rerun()

# --- PAGE 1: WELCOME ---
if st.session_state["page"] == "Welcome Page":
    st.markdown('<h1 style="text-align:center; color:white;">🩺 Welcome to MEDICO AI</h1>', unsafe_allow_html=True)
    st.write("""
    *MEDICO AI* uses AI to detect diseases from medical images.

    **Features:**
    - AI-powered disease detection using YOLO.
    - Medical report generation with Gemini AI.
    - Interactive chatbot for medical queries.
    """)
    st.session_state["patient_name"] = st.text_input("Enter Patient Name", value=st.session_state["patient_name"])
    st.session_state["patient_id"] = st.text_input("Enter Patient ID", value=st.session_state["patient_id"])

    if st.button("Proceed to Analysis and Report"):
        st.session_state["page"] = "Analysis and Report"
        st.rerun()

# --- PAGE 2: ANALYSIS ---
elif st.session_state["page"] == "Analysis and Report":
    st.markdown('<h1 style="text-align:center; color:#0ff;">🩺 Analysis and Report</h1>', unsafe_allow_html=True)
    st.write(f"*Patient Name:* {st.session_state['patient_name']}")
    st.write(f"*Patient ID:* {st.session_state['patient_id']}")

    uploaded_file = st.file_uploader("Upload Image", type=["jpg", "png", "jpeg"])
    model_selection = st.selectbox("Select Disease Model", list(MODEL_PATHS.keys()))
    submit_button = st.button("Submit Image")

    if uploaded_file and uploaded_file != st.session_state.get("uploaded_file"):
        st.session_state["uploaded_image"] = Image.open(uploaded_file)
        st.session_state["analyzed_image"] = None
        st.session_state["detected_disease"] = "No Disease Detected"
        st.session_state["uploaded_file"] = uploaded_file

    if uploaded_file and submit_button:
        if st.session_state["uploaded_image"]:
            detection_model = load_detection_model(model_selection)
            if detection_model:
                with st.spinner("Analyzing Image..."):
                    time.sleep(2)
                    analyzed_image, detected_disease = detect_disease(st.session_state["uploaded_image"], detection_model)
                    st.session_state["analyzed_image"] = analyzed_image
                    st.session_state["detected_disease"] = detected_disease

    if st.session_state["uploaded_image"]:
        st.subheader("📊 Diagnosis Result")
        col1, col2 = st.columns(2)
        with col1:
            st.image(st.session_state["uploaded_image"], caption="Uploaded Image", use_container_width=True)
        with col2:
            if st.session_state["analyzed_image"] is not None:
                st.image(st.session_state["analyzed_image"], caption=f"Detection: {st.session_state['detected_disease']}",
                         use_container_width=True)
            else:
                st.write("No analysis results yet.")

        st.success(f"Detection: {st.session_state['detected_disease']}")

        if st.session_state["detected_disease"] != "No Disease Detected":
            st.subheader("💬 Medical Report")
            medical_report = generate_medical_report(st.session_state["detected_disease"],
                                                     st.session_state["patient_name"],
                                                     st.session_state["patient_id"])
            st.write(medical_report)

    if st.button("Clear Analysis and Start Over"):
        st.session_state["uploaded_image"] = None
        st.session_state["analyzed_image"] = None
        st.session_state["detected_disease"] = "No Disease Detected"
        st.session_state["uploaded_file"] = None
        st.rerun()

    if st.button("Any Queries?"):
        st.session_state["page"] = "Medico AI"
        st.rerun()

# --- PAGE 3: CHATBOT ---
elif st.session_state["page"] == "Medico AI":
    st.markdown('<h1 style="text-align:center; color:#0ff;">💬 Medico AI Chatbot</h1>', unsafe_allow_html=True)
    st.write("Ask any question, whether medical or general:")

    def handle_input():
        if st.session_state["user_input"].strip():
            user_query = st.session_state["user_input"]
            response = chatbot_response(user_query)
            st.session_state["chat_history"].append((user_query, response))
            st.session_state["user_input"] = ""

    st.text_input("", key="user_input", on_change=handle_input)

    for user_msg, bot_msg in st.session_state["chat_history"]:
        st.markdown(f'<p style="text-align:right; font-size:18px;"><strong>{user_msg} 😎</strong></p>', unsafe_allow_html=True)
        st.markdown(f'<p style="text-align:left; font-size:18px;">🤖 {bot_msg}</p>', unsafe_allow_html=True)

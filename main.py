import base64
import sys
import textwrap
from pathlib import Path

import cv2
import numpy as np
import streamlit as st
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent

# Reuse backend helpers
sys.path.insert(0, str(ROOT_DIR / "backend"))
from core.gemini_utils import (  # noqa: E402
    GeminiError,
    chat,
    generate_medical_report,
    validate_medical_scan,
)
from core.yolo_utils import (  # noqa: E402
    MODEL_PATHS,
    NO_DETECTION,
    NON_DIAGNOSTIC_LABELS,
    UnknownModelError,
    load_detection_model,
)

# --- STREAMLIT PAGE CONFIG ---
st.set_page_config(page_title="Medico - Medical Scan Assistant", layout="wide")

SAMPLES_DIR = ROOT_DIR / "frontend" / "public" / "samples"

# Cream Vanilla (#EEDCC8) and Dark Ruby (#570300) Design System
st.markdown(
    textwrap.dedent("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    html, body, [class*="css"], .stApp {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    }

    /* Primary Cream Vanilla Background */
    [data-testid="stAppViewContainer"] {
        background-color: #EEDCC8 !important;
        color: #570300 !important;
    }

    [data-testid="stHeader"] {
        background-color: #EEDCC8 !important;
        border-bottom: 1px solid rgba(87, 3, 0, 0.15) !important;
    }

    /* Sidebar in slightly deeper warm tone */
    [data-testid="stSidebar"] {
        background: #E2CCB5 !important;
        border-right: 1px solid rgba(87, 3, 0, 0.15) !important;
    }
    [data-testid="stSidebar"] * {
        color: #570300 !important;
        font-weight: 500 !important;
    }
    [data-testid="stSidebar"] .stRadio label {
        font-size: 0.9rem !important;
        font-weight: 600 !important;
        padding: 6px 10px !important;
        border-radius: 6px !important;
    }
    [data-testid="stSidebar"] .stRadio label:hover {
        background: rgba(87, 3, 0, 0.08) !important;
    }

    /* Container Border Card in soft warm cream */
    [data-testid="stVerticalBlockBorderWrapper"] > div {
        background: #FAF3EC !important;
        border: 1px solid rgba(87, 3, 0, 0.2) !important;
        border-radius: 14px !important;
        padding: 24px !important;
        color: #570300 !important;
        box-shadow: 0 2px 4px rgba(87, 3, 0, 0.04) !important;
    }

    /* Input Styling */
    div[data-baseweb="input"] {
        background-color: #ffffff !important;
        border: 1px solid rgba(87, 3, 0, 0.3) !important;
        border-radius: 8px !important;
    }
    div[data-baseweb="input"]:focus-within {
        border-color: #570300 !important;
        box-shadow: 0 0 0 1px #570300 !important;
    }
    div[data-baseweb="input"] input {
        color: #570300 !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
    }

    /* Dark Ruby Primary Buttons with Cream Vanilla text */
    div.stButton > button {
        background-color: #570300 !important;
        color: #EEDCC8 !important;
        font-weight: 700 !important;
        font-size: 0.9rem !important;
        border-radius: 8px !important;
        border: none !important;
        padding: 8px 18px !important;
        width: 100% !important;
        transition: background-color 0.15s ease !important;
    }
    div.stButton > button:hover {
        background-color: #6B0502 !important;
        color: #EEDCC8 !important;
    }

    /* File Uploader Box */
    [data-testid="stFileUploader"] section {
        background: #ffffff !important;
        border: 1px dashed rgba(87, 3, 0, 0.35) !important;
        border-radius: 10px !important;
        padding: 16px !important;
    }
    [data-testid="stFileUploader"] button {
        background-color: #570300 !important;
        color: #EEDCC8 !important;
        border: none !important;
        border-radius: 6px !important;
        font-weight: 600 !important;
    }
    [data-testid="stFileUploader"] div, [data-testid="stFileUploader"] span, [data-testid="stFileUploader"] small {
        color: #570300 !important;
        font-weight: 500 !important;
    }

    .stSuccess {
        background-color: #FAF3EC !important;
        border: 2px solid #570300 !important;
        color: #570300 !important;
        border-radius: 10px !important;
        font-weight: 700 !important;
    }
    </style>
    """),
    unsafe_allow_html=True,
)

# --- SESSION STATE DEFAULTS ---
DEFAULTS = {
    "page": "Home & Overview",
    "patient_name": "Sarah Jenkins",
    "patient_id": "PT-1049",
    "doctor_notes": "",
    "chat_history": [],
    "uploaded_image": None,
    "uploaded_file": None,
    "detected_disease": NO_DETECTION,
    "report_key": None,
    "report_text": "",
    "report_error": "",
}
for key, value in DEFAULTS.items():
    if key not in st.session_state:
        st.session_state[key] = value


def detect_disease(image, model, model_name):
    image = image.convert("RGB")
    results = model(image, verbose=False)
    detections = results[0]
    image_np = np.array(image)
    ignored = NON_DIAGNOSTIC_LABELS.get(model_name, set())
    detected_labels = []

    for r in detections.boxes:
        label = detections.names[int(r.cls[0])]
        if label in ignored:
            continue
        x1, y1, x2, y2 = map(int, r.xyxy[0])
        conf = float(r.conf[0]) * 100
        detected_labels.append(f"{label} ({conf:.1f}%)")
        cv2.rectangle(image_np, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(image_np, f"{label} ({conf:.1f}%)", (x1, max(y1 - 10, 12)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    result_text = ", ".join(detected_labels) if detected_labels else NO_DETECTION
    return image_np, result_text


# --- SIDEBAR NAVIGATION ---
PAGES = [
    "Home & Overview",
    "Doctor Portal",
    "Patient Portal",
    "Clinical Assistant",
]

st.sidebar.markdown(
    '<div style="margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid rgba(87,3,0,0.15);">'
    '<h3 style="margin:0; font-weight:800; color:#570300; font-size:20px;">Medico</h3>'
    '<p style="margin:2px 0 0 0; font-size:11px; color:#570300; font-weight:600;">Clinical Scan Assistant</p>'
    '</div>',
    unsafe_allow_html=True,
)

selected_page = st.sidebar.radio("Navigation", PAGES, index=PAGES.index(st.session_state["page"]) if st.session_state["page"] in PAGES else 0, label_visibility="collapsed")
if selected_page != st.session_state["page"]:
    st.session_state["page"] = selected_page
    st.rerun()


# ========================================================
# --- 1. HOME & OVERVIEW PAGE ---
# ========================================================
if st.session_state["page"] == "Home & Overview":
    st.markdown(
        '<div style="padding: 10px 0 24px 0; max-width: 680px;">'
        '<span style="font-size:11px; font-weight:700; text-transform:uppercase; color:#570300; background:rgba(87,3,0,0.08); border:1px solid rgba(87,3,0,0.2); padding:3px 10px; border-radius:99px;">Clinical Image Assistant</span>'
        '<h1 style="font-size:32px; font-weight:800; color:#570300; margin:8px 0 10px 0;">Inspect medical scans with clear, simple explanations</h1>'
        '<p style="font-size:14px; color:#570300; line-height:1.6; margin:0 0 20px 0; font-weight:500;">An educational tool combining computer-vision detection with plain-language medical notes. Built for clinicians reviewing scans and patients seeking clearer answers.</p>'
        '</div>',
        unsafe_allow_html=True,
    )

    portal_col1, portal_col2 = st.columns(2, gap="medium")
    with portal_col1:
        with st.container(border=True):
            st.markdown(
                '<div style="margin-bottom:12px;">'
                '<span style="font-size:11px; font-weight:700; color:#570300; text-transform:uppercase;">For Clinicians</span>'
                '<h3 style="font-size:17px; font-weight:800; color:#570300; margin:4px 0 4px 0;">Doctor Portal</h3>'
                '<p style="font-size:12px; color:#570300; margin:0 0 16px 0; font-weight:500;">Workstation for entering patient records, running specific YOLO models, and drafting clinical notes.</p>'
                '</div>',
                unsafe_allow_html=True,
            )
            if st.button("Open Doctor Portal →", key="btn_doc"):
                st.session_state["page"] = "Doctor Portal"
                st.rerun()

    with portal_col2:
        with st.container(border=True):
            st.markdown(
                '<div style="margin-bottom:12px;">'
                '<span style="font-size:11px; font-weight:700; color:#570300; text-transform:uppercase;">For Patients</span>'
                '<h3 style="font-size:17px; font-weight:800; color:#570300; margin:4px 0 4px 0;">Patient Portal</h3>'
                '<p style="font-size:12px; color:#570300; margin:0 0 16px 0; font-weight:500;">Simplified self-check: upload a scan, read what it means in plain English, and get questions for your doctor.</p>'
                '</div>',
                unsafe_allow_html=True,
            )
            if st.button("Open Patient Portal →", key="btn_pat"):
                st.session_state["page"] = "Patient Portal"
                st.rerun()

    st.markdown("<div style='margin-top:24px;'></div>", unsafe_allow_html=True)
    st.markdown("<h3 style='font-size:18px; font-weight:800; color:#570300; margin-bottom:12px;'>How to use this app</h3>", unsafe_allow_html=True)
    
    st_col1, st_col2, st_col3 = st.columns(3, gap="medium")
    with st_col1:
        st.markdown(
            '<div style="background:#FAF3EC; border:1px solid rgba(87,3,0,0.2); border-radius:10px; padding:16px;">'
            '<span style="font-size:11px; font-weight:800; color:#570300;">STEP 1</span>'
            '<h4 style="font-size:14px; font-weight:700; color:#570300; margin:6px 0 4px 0;">Choose Your Portal</h4>'
            '<p style="font-size:12px; color:#570300; margin:0; font-weight:500;">Select the Doctor Portal for case records and notes, or the Patient Portal for a simple overview.</p>'
            '</div>',
            unsafe_allow_html=True,
        )
    with st_col2:
        st.markdown(
            '<div style="background:#FAF3EC; border:1px solid rgba(87,3,0,0.2); border-radius:10px; padding:16px;">'
            '<span style="font-size:11px; font-weight:800; color:#570300;">STEP 2</span>'
            '<h4 style="font-size:14px; font-weight:700; color:#570300; margin:6px 0 4px 0;">Upload or Pick a Sample</h4>'
            '<p style="font-size:12px; color:#570300; margin:0; font-weight:500;">Upload your chest, eye, or bone image, or test immediately using our pre-loaded sample scans.</p>'
            '</div>',
            unsafe_allow_html=True,
        )
    with st_col3:
        st.markdown(
            '<div style="background:#FAF3EC; border:1px solid rgba(87,3,0,0.2); border-radius:10px; padding:16px;">'
            '<span style="font-size:11px; font-weight:800; color:#570300;">STEP 3</span>'
            '<h4 style="font-size:14px; font-weight:700; color:#570300; margin:6px 0 4px 0;">Review Findings & Notes</h4>'
            '<p style="font-size:12px; color:#570300; margin:0; font-weight:500;">View the detection score, plain-language clinical summary, and suggested questions for your doctor.</p>'
            '</div>',
            unsafe_allow_html=True,
        )


# ========================================================
# --- 2. DOCTOR PORTAL ---
# ========================================================
elif st.session_state["page"] == "Doctor Portal":
    if st.button("← Back to Home / Overview", key="btn_back_doc"):
        st.session_state["page"] = "Home & Overview"
        st.rerun()

    st.markdown(
        '<div style="padding-bottom:12px; margin-bottom:16px; border-bottom:1px solid rgba(87,3,0,0.15);">'
        '<h2 style="font-size:22px; font-weight:800; color:#570300; margin:0 0 4px 0;">Doctor Diagnostic Workstation</h2>'
        '<p style="font-size:12px; color:#570300; margin:0; font-weight:500;">Select patient scan, run YOLO inference, review AI findings, and attach clinical remarks.</p>'
        '</div>',
        unsafe_allow_html=True,
    )

    p_col1, p_col2 = st.columns(2)
    with p_col1:
        st.session_state["patient_name"] = st.text_input("Patient Full Name", value=st.session_state["patient_name"])
    with p_col2:
        st.session_state["patient_id"] = st.text_input("Medical Record ID (MRN)", value=st.session_state["patient_id"])

    col1, col2 = st.columns([1, 1.3], gap="large")

    with col1:
        st.markdown("<h4 style='color:#570300; font-size:14px; font-weight:700; margin-top:10px; margin-bottom:6px;'>1. Upload Scan Image</h4>", unsafe_allow_html=True)
        uploaded_file = st.file_uploader("Upload Scan", type=["jpg", "png", "jpeg"], label_visibility="collapsed")
        
        # Sample loader buttons
        st.markdown("<p style='font-size:11px; color:#570300; margin:4px 0 2px 0; font-weight:600;'>Or test with a pre-loaded scan:</p>", unsafe_allow_html=True)
        btn_c1, btn_c2, btn_c3 = st.columns(3)
        with btn_c1:
            if st.button("Chest X-Ray Sample", key="btn_s1"):
                sample_p = SAMPLES_DIR / "chest_sample.jpg"
                if sample_p.exists():
                    st.session_state["uploaded_image"] = Image.open(sample_p).convert("RGB")
                    st.session_state["analyzed_image"] = None
                    st.session_state["detected_disease"] = NO_DETECTION
        with btn_c2:
            if st.button("Eye Photo Sample", key="btn_s2"):
                sample_p = SAMPLES_DIR / "eye_sample.jpg"
                if sample_p.exists():
                    st.session_state["uploaded_image"] = Image.open(sample_p).convert("RGB")
                    st.session_state["analyzed_image"] = None
                    st.session_state["detected_disease"] = NO_DETECTION
        with btn_c3:
            if st.button("Bone X-Ray Sample", key="btn_s3"):
                sample_p = SAMPLES_DIR / "bone_sample.jpg"
                if sample_p.exists():
                    st.session_state["uploaded_image"] = Image.open(sample_p).convert("RGB")
                    st.session_state["analyzed_image"] = None
                    st.session_state["detected_disease"] = NO_DETECTION

        st.markdown("<h4 style='color:#570300; font-size:14px; font-weight:700; margin-top:12px; margin-bottom:6px;'>2. Select Neural Model</h4>", unsafe_allow_html=True)
        model_selection = st.selectbox("Select Model", list(MODEL_PATHS.keys()), label_visibility="collapsed")
        
        submit_button = st.button("Run Diagnostic Analysis →")

        if uploaded_file and uploaded_file != st.session_state.get("uploaded_file"):
            try:
                st.session_state["uploaded_image"] = Image.open(uploaded_file).convert("RGB")
            except Exception:
                st.error("That file is not a readable image.")
                st.session_state["uploaded_image"] = None
            st.session_state["analyzed_image"] = None
            st.session_state["detected_disease"] = NO_DETECTION
            st.session_state["report_key"] = None
            st.session_state["uploaded_file"] = uploaded_file

        if submit_button and st.session_state["uploaded_image"] is not None:
            # First validate image suitability
            with st.spinner("Validating image scan modality…"):
                val = validate_medical_scan(st.session_state["uploaded_image"], model_selection)

            if not val.get("is_valid", True):
                st.error(f"⚠️ Unsuitable Scan: {val.get('reason') or 'The image does not match the chosen modality.'}")
                st.session_state["analyzed_image"] = None
                st.session_state["detected_disease"] = "Invalid Scan / Modality Mismatch"
                st.session_state["report_key"] = None
                st.session_state["report_error"] = val.get("reason", "")
                st.session_state["report_text"] = ""
            else:
                try:
                    detection_model = load_detection_model(model_selection)
                except (UnknownModelError, FileNotFoundError) as exc:
                    st.error(str(exc))
                else:
                    with st.spinner("Analyzing image with YOLO…"):
                        analyzed_image, detected_disease = detect_disease(
                            st.session_state["uploaded_image"], detection_model, model_selection
                        )
                        st.session_state["analyzed_image"] = analyzed_image
                        st.session_state["detected_disease"] = detected_disease
                        st.session_state["report_key"] = None

    with col2:
        st.markdown("<h4 style='color:#570300; font-size:14px; font-weight:700; margin-top:10px; margin-bottom:6px;'>Diagnostic Results & Clinical Notes</h4>", unsafe_allow_html=True)

        if st.session_state["uploaded_image"] is not None:
            img_c1, img_c2 = st.columns(2)
            with img_c1:
                st.image(st.session_state["uploaded_image"], caption="Input Scan", use_container_width=True)
            with img_c2:
                if st.session_state["analyzed_image"] is not None:
                    st.image(st.session_state["analyzed_image"], caption=f"Detection: {st.session_state['detected_disease']}", use_container_width=True)
                else:
                    st.info("Awaiting analysis trigger.")

            st.success(f"Detection: {st.session_state['detected_disease']}")

            if st.session_state["analyzed_image"] is not None and st.session_state["detected_disease"] != NO_DETECTION:
                report_key = (st.session_state["detected_disease"], st.session_state["patient_name"], st.session_state["patient_id"])
                if st.session_state["report_key"] != report_key:
                    with st.spinner("Writing clinical summary…"):
                        try:
                            st.session_state["report_text"] = generate_medical_report(*report_key)
                            st.session_state["report_error"] = ""
                        except GeminiError as exc:
                            st.session_state["report_text"] = ""
                            st.session_state["report_error"] = str(exc)
                    st.session_state["report_key"] = report_key

                st.markdown("<h4 style='color:#570300; font-size:13px; font-weight:700; margin-top:12px;'>Educational Clinical Notes</h4>", unsafe_allow_html=True)
                if st.session_state["report_error"]:
                    st.warning(st.session_state["report_error"])
                else:
                    st.markdown(f"<div style='background:#ffffff; border:1px solid rgba(87,3,0,0.2); border-radius:8px; padding:14px; font-size:13px; line-height:1.6; color:#570300;'>{st.session_state['report_text'].replace(chr(10), '<br/>')}</div>", unsafe_allow_html=True)

            st.markdown("<div style='margin-top:12px;'></div>", unsafe_allow_html=True)
            st.session_state["doctor_notes"] = st.text_area("Doctor's Clinical Notes & Rx Recommendations", value=st.session_state["doctor_notes"], placeholder="Add physician observations or follow-up instructions...")
            
            if st.button("Save & Archive Patient Record"):
                st.success(f"Case for {st.session_state['patient_name']} ({st.session_state['patient_id']}) archived successfully.")
        else:
            st.markdown(
                '<div style="text-align:center; padding:48px 20px; background:#FAF3EC; border:1px dashed rgba(87,3,0,0.3); border-radius:10px;">'
                '<p style="font-size:14px; font-weight:700; color:#570300; margin:0 0 2px 0;">No Scan Loaded</p>'
                '<p style="font-size:12px; color:#570300; margin:0; font-weight:500;">Upload a scan on the left or select a sample image to begin.</p>'
                '</div>',
                unsafe_allow_html=True,
            )


# ========================================================
# --- 3. PATIENT PORTAL ---
# ========================================================
elif st.session_state["page"] == "Patient Portal":
    if st.button("← Back to Home / Overview", key="btn_back_pat"):
        st.session_state["page"] = "Home & Overview"
        st.rerun()

    st.markdown(
        '<div style="padding-bottom:12px; margin-bottom:16px; border-bottom:1px solid rgba(87,3,0,0.15);">'
        '<h2 style="font-size:22px; font-weight:800; color:#570300; margin:0 0 4px 0;">Patient Scan Checker</h2>'
        '<p style="font-size:12px; color:#570300; margin:0; font-weight:500;">A private, educational tool to help you understand your medical scans in plain terms.</p>'
        '</div>',
        unsafe_allow_html=True,
    )

    st.markdown(
        '<div style="background:#fef3c7; border:1px solid #f59e0b; border-radius:8px; padding:12px 16px; margin-bottom:20px; font-size:12px; color:#78350f; font-weight:600;">'
        '<b>Health Notice:</b> If you are experiencing sudden severe chest pain, breathing difficulty, or an acute physical injury, contact emergency services (911 or local emergency helpline) immediately.'
        '</div>',
        unsafe_allow_html=True,
    )

    with st.container(border=True):
        st.markdown("<h4 style='color:#570300; font-size:14px; font-weight:700; margin-bottom:6px;'>Upload Your Medical Scan</h4>", unsafe_allow_html=True)
        pat_file = st.file_uploader("Upload Scan", type=["jpg", "png", "jpeg"], key="pat_uploader", label_visibility="collapsed")
        
        # Sample loader
        st.markdown("<p style='font-size:11px; color:#570300; margin:4px 0 2px 0; font-weight:600;'>Or test with an instant sample scan:</p>", unsafe_allow_html=True)
        p_btn1, p_btn2, p_btn3 = st.columns(3)
        with p_btn1:
            if st.button("Chest X-Ray Sample", key="p_s1"):
                sample_p = SAMPLES_DIR / "chest_sample.jpg"
                if sample_p.exists():
                    st.session_state["pat_img"] = Image.open(sample_p).convert("RGB")
                    st.session_state["patient_finding"] = None
        with p_btn2:
            if st.button("Eye Photo Sample", key="p_s2"):
                sample_p = SAMPLES_DIR / "eye_sample.jpg"
                if sample_p.exists():
                    st.session_state["pat_img"] = Image.open(sample_p).convert("RGB")
                    st.session_state["patient_finding"] = None
        with p_btn3:
            if st.button("Bone X-Ray Sample", key="p_s3"):
                sample_p = SAMPLES_DIR / "bone_sample.jpg"
                if sample_p.exists():
                    st.session_state["pat_img"] = Image.open(sample_p).convert("RGB")
                    st.session_state["patient_finding"] = None

        if pat_file:
            st.session_state["pat_img"] = Image.open(pat_file).convert("RGB")

        st.markdown("<h4 style='color:#570300; font-size:14px; font-weight:700; margin-top:14px; margin-bottom:6px;'>What body part is this?</h4>", unsafe_allow_html=True)
        pat_model = st.selectbox(
            "Exam Area",
            ["Tuberculosis (Lung Cancer)", "Eye Disease", "Bone Fracture"],
            format_func=lambda x: "Chest or Respiratory Scan" if "Tuberculosis" in x else ("Eye or Vision Photo" if "Eye" in x else "Bone or Joint X-Ray"),
            label_visibility="collapsed"
        )
        
        if st.button("Check My Scan →", key="btn_pat_eval"):
            if "pat_img" not in st.session_state or st.session_state["pat_img"] is None:
                st.warning("Please choose an image or click a sample scan first.")
            else:
                with st.spinner("Validating scan suitability…"):
                    val = validate_medical_scan(st.session_state["pat_img"], pat_model)

                if not val.get("is_valid", True):
                    st.error(f"⚠️ Unsuitable Scan: {val.get('reason') or 'The image does not match the selected body part.'}")
                    st.session_state["patient_finding"] = "Invalid Scan / Modality Mismatch"
                else:
                    try:
                        d_model = load_detection_model(pat_model)
                    except Exception as exc:
                        st.error(str(exc))
                    else:
                        with st.spinner("Checking your scan…"):
                            _, pat_finding = detect_disease(st.session_state["pat_img"], d_model, pat_model)
                            st.session_state["patient_finding"] = pat_finding

        if st.session_state.get("patient_finding"):
            st.markdown(
                f"""
                <div style="background:#ffffff; border:2px solid #570300; border-radius:10px; padding:18px; margin-top:18px;">
                    <p style="font-size:11px; font-weight:700; text-transform:uppercase; color:#570300; margin:0 0 4px 0;">Observed Finding</p>
                    <h3 style="font-size:16px; font-weight:800; color:#570300; margin:0 0 8px 0;">{st.session_state['patient_finding']}</h3>
                    <p style="font-size:12px; color:#570300; margin:0; line-height:1.5; font-weight:500;">This is an automated preliminary check. Please bring this result to your next appointment with a certified doctor for clinical confirmation.</p>
                </div>
                """,
                unsafe_allow_html=True,
            )


# ========================================================
# --- 4. CLINICAL ASSISTANT ---
# ========================================================
elif st.session_state["page"] == "Clinical Assistant":
    if st.button("← Back to Home / Overview", key="btn_back_chat"):
        st.session_state["page"] = "Home & Overview"
        st.rerun()

    st.markdown(
        '<div style="padding-bottom:12px; margin-bottom:16px; border-bottom:1px solid rgba(87,3,0,0.15);">'
        '<h2 style="font-size:22px; font-weight:800; color:#570300; margin:0 0 4px 0;">Medical Information Assistant</h2>'
        '<p style="font-size:12px; color:#570300; margin:0; font-weight:500;">Ask questions about radiological terms, symptoms, and procedures powered by Google Gemini.</p>'
        '</div>',
        unsafe_allow_html=True,
    )

    def handle_input():
        user_query = st.session_state["user_input"].strip()
        if not user_query:
            return
        try:
            response = chat(user_query)
        except GeminiError as exc:
            response = f"Notice: {exc}"
        st.session_state["chat_history"].append((user_query, response))
        st.session_state["user_input"] = ""

    st.text_input(
        "Ask a medical query...",
        key="user_input",
        on_change=handle_input,
        placeholder="Type your question here (e.g., What does an optic disc examination check for?)...",
        label_visibility="collapsed"
    )

    for user_msg, bot_msg in reversed(st.session_state["chat_history"]):
        with st.chat_message("user"):
            st.write(user_msg)
        with st.chat_message("assistant"):
            st.write(bot_msg)

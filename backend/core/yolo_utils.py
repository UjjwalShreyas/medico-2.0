import numpy as np
from PIL import Image
from ultralytics import YOLO
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]

MODEL_PATHS = {
    "Tuberculosis (Lung Cancer)": str(ROOT_DIR / "tuberculosis(lung_cancer).pt"),
    "Eye Disease": str(ROOT_DIR / "eye_disease.pt"),
    "Bone Fracture": str(ROOT_DIR / "bone_fracture.pt"),
}

def load_detection_model(model_name):
    model_path = MODEL_PATHS.get(model_name)
    if model_path and Path(model_path).exists():
        return YOLO(model_path)
    else:
        raise FileNotFoundError(f"Model not found: {model_path}")

def detect_disease(image, model):
    results = model(image)
    detections = results[0]
    detected_labels = []
    for r in detections.boxes:
        label = detections.names[int(r.cls[0])]
        conf = float(r.conf[0]) * 100
        detected_labels.append(f"{label} ({conf:.2f}%)")
    return ", ".join(detected_labels) if detected_labels else "No Disease Detected"

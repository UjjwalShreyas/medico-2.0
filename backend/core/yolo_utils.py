import threading
from functools import lru_cache
from pathlib import Path

from ultralytics import YOLO

ROOT_DIR = Path(__file__).resolve().parents[2]

MODEL_PATHS = {
    "Tuberculosis (Lung Cancer)": str(ROOT_DIR / "tuberculosis(lung_cancer).pt"),
    "Eye Disease": str(ROOT_DIR / "eye_disease.pt"),
    "Bone Fracture": str(ROOT_DIR / "bone_fracture.pt"),
}

# Some detectors output annotation-style classes that are not findings.
# The bone model, for example, can return 'angle', 'line' and 'messed_up_angle'
# next to the real 'fracture' class. Those must never be sent on as a "disease".
NON_DIAGNOSTIC_LABELS = {
    "Bone Fracture": {"angle", "line", "messed_up_angle"},
}

NO_DETECTION = "No Disease Detected"

# YOLO predictors are not thread-safe; serialise inference on the shared models.
_INFERENCE_LOCK = threading.Lock()


class UnknownModelError(ValueError):
    """The requested model name is not one of MODEL_PATHS."""


@lru_cache(maxsize=None)
def _load_from_path(model_path):
    return YOLO(model_path)


def load_detection_model(model_name):
    """Return a cached YOLO model (loaded from disk only on first use)."""
    model_path = MODEL_PATHS.get(model_name)
    if model_path is None:
        raise UnknownModelError(
            f"Unknown model '{model_name}'. Choose one of: {', '.join(MODEL_PATHS)}"
        )
    if not Path(model_path).exists():
        raise FileNotFoundError(f"Model file is missing on the server: {Path(model_path).name}")
    return _load_from_path(model_path)


def detect_disease(image, model, model_name=None):
    """Run detection and return e.g. 'fracture (87.31%)' or 'No Disease Detected'."""
    with _INFERENCE_LOCK:
        results = model(image, verbose=False)
    detections = results[0]
    ignored = NON_DIAGNOSTIC_LABELS.get(model_name, set())

    found = []
    for box in detections.boxes:
        label = detections.names[int(box.cls[0])]
        if label in ignored:
            continue
        found.append((label, float(box.conf[0]) * 100))

    found.sort(key=lambda item: item[1], reverse=True)
    labels = [f"{label} ({conf:.2f}%)" for label, conf in found]
    return ", ".join(labels) if labels else NO_DETECTION

import logging

from django.conf import settings
from PIL import Image
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .gemini_utils import GeminiError, chat, generate_medical_report
from .yolo_utils import (
    MODEL_PATHS,
    NO_DETECTION,
    UnknownModelError,
    detect_disease,
    load_detection_model,
)

logger = logging.getLogger(__name__)

MAX_QUERY_CHARS = 2000


def error(message, http_status):
    return Response({"error": message}, status=http_status)


class AnalyzeImageAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        image_file = request.FILES.get("image")
        model_name = str(request.data.get("model") or "").strip()
        patient_name = request.data.get("patient_name") or ""
        patient_id = request.data.get("patient_id") or ""

        if image_file is None:
            return error("No image was uploaded. Send it as the 'image' field.", status.HTTP_400_BAD_REQUEST)
        if image_file.size > settings.MAX_UPLOAD_BYTES:
            return error("Image is too large (max 10 MB).", status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        if model_name not in MODEL_PATHS:
            return error(
                f"Unknown model. Choose one of: {', '.join(MODEL_PATHS)}.",
                status.HTTP_400_BAD_REQUEST,
            )

        try:
            image = Image.open(image_file)
            image.load()
            image = image.convert("RGB")
        except Exception:
            return error("That file is not a readable image (use PNG or JPG).", status.HTTP_400_BAD_REQUEST)

        try:
            model = load_detection_model(model_name)
            detected_disease = detect_disease(image, model, model_name)
        except UnknownModelError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)
        except FileNotFoundError:
            logger.exception("Model file missing for %s", model_name)
            return error("This detection model is not available on the server.", status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            logger.exception("Detection failed for model %s", model_name)
            return error("Image analysis failed. Please try a different image.", status.HTTP_500_INTERNAL_SERVER_ERROR)

        payload = {"detected_disease": detected_disease, "medical_report": ""}

        if detected_disease != NO_DETECTION:
            try:
                payload["medical_report"] = generate_medical_report(detected_disease, patient_name, patient_id)
            except GeminiError as exc:
                # Detection worked; only the written report failed. Keep the result.
                payload["report_error"] = str(exc)

        return Response(payload)


class ChatbotAPIView(APIView):
    def post(self, request):
        query = request.data.get("query")

        if not isinstance(query, str) or not query.strip():
            return error("Please type a question.", status.HTTP_400_BAD_REQUEST)
        query = query.strip()
        if len(query) > MAX_QUERY_CHARS:
            return error(f"Question is too long (max {MAX_QUERY_CHARS} characters).", status.HTTP_400_BAD_REQUEST)

        try:
            return Response({"response": chat(query)})
        except GeminiError as exc:
            return error(str(exc), status.HTTP_503_SERVICE_UNAVAILABLE)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
import google.generativeai as genai
from .yolo_utils import load_detection_model, detect_disease
from .gemini_utils import generate_medical_report
from PIL import Image

class AnalyzeImageAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    def post(self, request):
        image_file = request.FILES.get('image')
        model_name = request.POST.get('model')
        patient_name = request.POST.get('patient_name')
        patient_id = request.POST.get('patient_id')
        image = Image.open(image_file)
        model = load_detection_model(model_name)
        detected_disease = detect_disease(image, model)
        report = ""
        if detected_disease != "No Disease Detected":
            report = generate_medical_report(detected_disease, patient_name, patient_id)
        return Response({
            "detected_disease": detected_disease,
            "medical_report": report
        })

class ChatbotAPIView(APIView):
    def post(self, request):
        query = request.data.get("query")
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(query)
        return Response({"response": response.text if response and hasattr(response, "text") else "No report available."})

from django.urls import path
from .views import AnalyzeImageAPIView, ChatbotAPIView

urlpatterns = [
    path('analyze/', AnalyzeImageAPIView.as_view()),
    path('chatbot/', ChatbotAPIView.as_view()),
]

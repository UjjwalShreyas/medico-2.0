from django.db import models

class Patient(models.Model):
    name = models.CharField(max_length=100)
    patient_id = models.CharField(max_length=100)
    image = models.ImageField(upload_to="patient_images/")
    detected_disease = models.CharField(max_length=100, default="No Disease Detected")

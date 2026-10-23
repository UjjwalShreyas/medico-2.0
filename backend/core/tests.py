"""Backend tests. Run from the backend/ folder:  python manage.py test

Gemini is mocked, so no API key or internet is needed. The YOLO models are real,
so these also prove the three .pt files load and run.
"""
import io
from types import SimpleNamespace
from unittest import mock

import numpy as np
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from core import gemini_utils, yolo_utils
from core.gemini_utils import GeminiError


def make_png(mode="RGB", size=(320, 320)):
    channels = len(mode)
    arr = (np.random.rand(size[1], size[0], channels) * 255).astype("uint8")
    buf = io.BytesIO()
    Image.fromarray(arr, mode).save(buf, format="PNG")
    return buf.getvalue()


def upload(data=None, name="scan.png"):
    return SimpleUploadedFile(name, data if data is not None else make_png(), content_type="image/png")


class ApiTestCase(SimpleTestCase):
    def setUp(self):
        cache.clear()  # reset the rate limiter between tests
        self.client = APIClient()


class AnalyzeEndpointTests(ApiTestCase):
    url = "/api/analyze/"

    def post(self, **fields):
        return self.client.post(self.url, fields, format="multipart")

    def test_missing_image_is_400(self):
        r = self.post(model="Eye Disease")
        self.assertEqual(r.status_code, 400)
        self.assertIn("error", r.json())

    def test_unknown_model_is_400(self):
        r = self.post(image=upload(), model="Nope")
        self.assertEqual(r.status_code, 400)

    def test_missing_model_is_400(self):
        r = self.post(image=upload())
        self.assertEqual(r.status_code, 400)

    def test_non_image_file_is_400(self):
        r = self.post(image=upload(b"definitely not an image"), model="Eye Disease")
        self.assertEqual(r.status_code, 400)
        self.assertIn("not a readable image", r.json()["error"])

    @override_settings(MAX_UPLOAD_BYTES=100)
    def test_oversized_upload_is_413(self):
        r = self.post(image=upload(), model="Eye Disease")
        self.assertEqual(r.status_code, 413)

    def test_every_real_model_runs_on_rgb_and_rgba(self):
        for model_name in yolo_utils.MODEL_PATHS:
            for mode in ("RGB", "RGBA"):
                with self.subTest(model=model_name, mode=mode):
                    r = self.post(image=upload(make_png(mode)), model=model_name,
                                  patient_name="A", patient_id="1")
                    self.assertEqual(r.status_code, 200, r.content)
                    body = r.json()
                    self.assertIn("detected_disease", body)
                    self.assertIn("medical_report", body)

    def test_finding_triggers_report(self):
        with mock.patch("core.views.detect_disease", return_value="fracture (91.00%)"), \
             mock.patch("core.views.generate_medical_report", return_value="REPORT") as gen:
            r = self.post(image=upload(), model="Bone Fracture", patient_name="Asha", patient_id="7")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["medical_report"], "REPORT")
        gen.assert_called_once_with("fracture (91.00%)", "Asha", "7")

    def test_no_finding_skips_gemini(self):
        with mock.patch("core.views.detect_disease", return_value=yolo_utils.NO_DETECTION), \
             mock.patch("core.views.generate_medical_report") as gen:
            r = self.post(image=upload(), model="Eye Disease")
        self.assertEqual(r.json()["medical_report"], "")
        gen.assert_not_called()

    def test_gemini_failure_keeps_detection_result(self):
        with mock.patch("core.views.detect_disease", return_value="Cataracts (80.00%)"), \
             mock.patch("core.views.generate_medical_report", side_effect=GeminiError("AI is down")):
            r = self.post(image=upload(), model="Eye Disease")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["detected_disease"], "Cataracts (80.00%)")
        self.assertEqual(body["medical_report"], "")
        self.assertEqual(body["report_error"], "AI is down")

    def test_detection_crash_is_clean_500_json(self):
        with mock.patch("core.views.detect_disease", side_effect=RuntimeError("boom")):
            r = self.post(image=upload(), model="Eye Disease")
        self.assertEqual(r.status_code, 500)
        self.assertEqual(r["Content-Type"], "application/json")
        self.assertNotIn("boom", r.content.decode())  # internals are not leaked


class ChatbotEndpointTests(ApiTestCase):
    url = "/api/chatbot/"

    def post(self, payload):
        return self.client.post(self.url, payload, format="json")

    def test_empty_and_missing_query_are_400(self):
        for payload in ({}, {"query": ""}, {"query": "   "}, {"query": 123}):
            with self.subTest(payload=payload):
                self.assertEqual(self.post(payload).status_code, 400)

    def test_overlong_query_is_400(self):
        self.assertEqual(self.post({"query": "a" * 2001}).status_code, 400)

    def test_success(self):
        with mock.patch("core.views.chat", return_value="hi there"):
            r = self.post({"query": "hello"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"response": "hi there"})

    def test_gemini_failure_is_503(self):
        with mock.patch("core.views.chat", side_effect=GeminiError("down")):
            r = self.post({"query": "hello"})
        self.assertEqual(r.status_code, 503)
        self.assertEqual(r.json(), {"error": "down"})

    def test_missing_api_key_is_503_not_crash(self):
        with mock.patch.object(gemini_utils, "GEMINI_API_KEY", ""):
            r = self.post({"query": "hello"})
        self.assertEqual(r.status_code, 503)
        self.assertIn("GEMINI_API_KEY", r.json()["error"])


class CorsTests(ApiTestCase):
    def preflight(self, origin):
        return self.client.options(
            "/api/chatbot/", HTTP_ORIGIN=origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        )

    def test_allowed_origin_gets_cors_header(self):
        r = self.preflight("http://localhost:3000")
        self.assertEqual(r.headers.get("Access-Control-Allow-Origin"), "http://localhost:3000")

    def test_unknown_origin_gets_none(self):
        r = self.preflight("https://evil.example")
        self.assertIsNone(r.headers.get("Access-Control-Allow-Origin"))


class GeminiHelperTests(SimpleTestCase):
    def test_patient_details_are_not_sent_to_gemini(self):
        with mock.patch.object(gemini_utils, "_ask", return_value="BODY") as ask:
            report = gemini_utils.generate_medical_report("fracture (90.00%)", "Asha Verma", "ID-991")
        prompt = ask.call_args.args[0]
        self.assertNotIn("Asha", prompt)
        self.assertNotIn("ID-991", prompt)
        self.assertIn("Asha Verma", report)  # but our own report header has them
        self.assertIn("NOT a medical diagnosis", report)

    def test_clean_strips_control_chars_and_caps_length(self):
        self.assertEqual(gemini_utils._clean("a\nb\x00c"), "a b c")
        self.assertEqual(len(gemini_utils._clean("x" * 500)), 100)

    def test_missing_key_raises_geminierror(self):
        with mock.patch.object(gemini_utils, "GEMINI_API_KEY", ""):
            with self.assertRaises(GeminiError):
                gemini_utils.chat("hi")

    def test_sdk_failure_becomes_safe_message(self):
        fake_client = mock.Mock()
        fake_client.models.generate_content.side_effect = RuntimeError("secret internal detail")
        with mock.patch.object(gemini_utils, "GEMINI_API_KEY", "k"), \
             mock.patch.object(gemini_utils, "_get_client", return_value=fake_client):
            with self.assertRaises(GeminiError) as ctx:
                gemini_utils.chat("hi")
        self.assertNotIn("secret", str(ctx.exception))

    def test_empty_answer_is_an_error(self):
        fake_client = mock.Mock()
        fake_client.models.generate_content.return_value = SimpleNamespace(text="  ")
        with mock.patch.object(gemini_utils, "GEMINI_API_KEY", "k"), \
             mock.patch.object(gemini_utils, "_get_client", return_value=fake_client):
            with self.assertRaises(GeminiError):
                gemini_utils.chat("hi")


class YoloHelperTests(SimpleTestCase):
    def fake_model(self, detections):
        names = {0: "angle", 1: "fracture", 2: "line"}
        boxes = [SimpleNamespace(cls=[cls], conf=[conf]) for cls, conf in detections]
        result = SimpleNamespace(boxes=boxes, names=names)
        return lambda image, verbose=False: [result]

    def test_non_diagnostic_bone_labels_are_ignored(self):
        model = self.fake_model([(0, 0.9), (2, 0.8), (1, 0.55)])
        out = yolo_utils.detect_disease(object(), model, "Bone Fracture")
        self.assertEqual(out, "fracture (55.00%)")

    def test_only_artifact_labels_means_no_disease(self):
        model = self.fake_model([(0, 0.9), (2, 0.8)])
        self.assertEqual(yolo_utils.detect_disease(object(), model, "Bone Fracture"),
                         yolo_utils.NO_DETECTION)

    def test_results_sorted_by_confidence(self):
        model = self.fake_model([(1, 0.3), (1, 0.9)])
        out = yolo_utils.detect_disease(object(), model, "Eye Disease")
        self.assertEqual(out, "fracture (90.00%), fracture (30.00%)")

    def test_unknown_model_name_raises(self):
        with self.assertRaises(yolo_utils.UnknownModelError):
            yolo_utils.load_detection_model("Nope")

    def test_models_are_cached(self):
        a = yolo_utils.load_detection_model("Bone Fracture")
        b = yolo_utils.load_detection_model("Bone Fracture")
        self.assertIs(a, b)

"""
Django settings for the Medico-AI backend project.
"""

import logging
import os
from pathlib import Path

from django.core.management.utils import get_random_secret_key

from .envloader import env_bool, env_list, load_env_file

load_env_file()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Secrets / environment-specific switches -------------------------------
# Nothing secret lives in the repo any more. Set these in .env or on the host:
#   DJANGO_SECRET_KEY, DJANGO_DEBUG, DJANGO_ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS
DEBUG = env_bool("DJANGO_DEBUG", default=False)

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
	# This API uses no sessions or logins, so an ephemeral key is safe; it just
	# changes on every restart. Set DJANGO_SECRET_KEY to make it stable.
	SECRET_KEY = get_random_secret_key()
	logging.getLogger(__name__).warning(
		"DJANGO_SECRET_KEY is not set - using a temporary random key."
	)

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

# Browsers on another origin (the Vercel frontend, or Vite on :3000) need CORS.
CORS_ALLOWED_ORIGINS = env_list(
	"CORS_ALLOWED_ORIGINS",
	"http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
)

# Uploaded scans are capped at 10 MB (also re-checked in the view).
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_BYTES + 1024 * 1024

INSTALLED_APPS = [
	'corsheaders',
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
	'rest_framework',
	'core',
]

MIDDLEWARE = [
	'corsheaders.middleware.CorsMiddleware',
	'django.middleware.security.SecurityMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'medicoai.urls'

TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
		},
	},
]

WSGI_APPLICATION = 'medicoai.wsgi.application'

DATABASES = {
	'default': {
		'ENGINE': 'django.db.backends.sqlite3',
		'NAME': BASE_DIR / 'db.sqlite3',
	}
}

AUTH_PASSWORD_VALIDATORS = [
	{
		'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
	},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Django REST Framework -------------------------------------------------
# There are no user accounts yet, so the only protection against someone
# burning the Gemini quota is rate limiting per client IP. Tune as needed.
REST_FRAMEWORK = {
	'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
	'DEFAULT_THROTTLE_CLASSES': ['rest_framework.throttling.AnonRateThrottle'],
	'DEFAULT_THROTTLE_RATES': {'anon': os.environ.get('API_THROTTLE_RATE', '30/minute')},
}

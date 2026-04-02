"""
pawster/settings.py
All config read from environment variables set in docker-compose.yml
"""
import os
import base64
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-change-me")
DEBUG      = os.environ.get("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1,django").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    "django_celery_beat",
    # Pawster apps
    "apps.approvals",
    "apps.surveys",
    "apps.notifications",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "pawster.urls"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

WSGI_APPLICATION = "pawster.wsgi.application"

# ── Database — shared Postgres with Spring Boot ──────────────────────────────
DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     os.environ.get("DB_NAME",     "pawster_db"),
        "USER":     os.environ.get("DB_USER",     "user"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "password"),
        "HOST":     os.environ.get("DB_HOST",     "db"),
        "PORT":     os.environ.get("DB_PORT",     "5432"),
    }
}

# ── REST Framework — uses custom Spring Boot JWT authenticator ────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.approvals.authentication.SpringBootJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# ── Spring Boot JWT secret (base64-encoded in docker-compose) ─────────────────
# Spring Boot stores it base64-encoded; we decode it to get the raw signing key.
_raw_jwt_secret = os.environ.get(
    "JWT_SECRET",
    "Zm9ydHktdHdvLWlzLXRoZS1hbnN3ZXItdG8tbGlmZS10aGUtdW5pdmVyc2UtYW5kLWV2ZXJ5dGhpbmc="
)
try:
    SPRING_JWT_SECRET = base64.b64decode(_raw_jwt_secret)
except Exception:
    SPRING_JWT_SECRET = _raw_jwt_secret.encode()

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")
CORS_ALLOW_CREDENTIALS = True

# ── Email (shared SMTP config from Spring Boot) ───────────────────────────────
EMAIL_BACKEND         = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST            = os.environ.get("SPRING_MAIL_HOST",     "smtp.gmail.com")
EMAIL_PORT            = int(os.environ.get("SPRING_MAIL_PORT", "587"))
EMAIL_USE_TLS         = True
EMAIL_HOST_USER       = os.environ.get("SPRING_MAIL_USERNAME", "")
EMAIL_HOST_PASSWORD   = os.environ.get("SPRING_MAIL_PASSWORD", "")
DEFAULT_FROM_EMAIL    = EMAIL_HOST_USER
APP_BASE_URL          = os.environ.get("APP_BASE_URL", "http://localhost:3000")

# ── Celery ────────────────────────────────────────────────────────────────────
CELERY_BROKER_URL        = os.environ.get("CELERY_BROKER_URL",    "redis://redis:6379/0")
CELERY_RESULT_BACKEND    = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
CELERY_ACCEPT_CONTENT    = ["json"]
CELERY_TASK_SERIALIZER   = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE          = "Asia/Manila"
CELERY_BEAT_SCHEDULER    = "django_celery_beat.schedulers:DatabaseScheduler"

# ── Static / Media ────────────────────────────────────────────────────────────
STATIC_URL  = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL   = "/media/"
MEDIA_ROOT  = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LANGUAGE_CODE = "en-us"
TIME_ZONE     = "Asia/Manila"
USE_I18N = True
USE_TZ   = True
# PAWSTER — Django Backend

<!-- AUTO:START -->
> 🔍 **Auto-generated documentation** — last updated: 2026-04-02 12:51:07 UTC
> Run `node scripts/generate-readme.js django` to refresh.

---

## 🏗️ Architecture Overview

PAWSTER's Django backend is a RESTful API built with Django REST Framework (DRF). JWT authentication (via `djangorestframework-simplejwt`) secures protected routes — clients must send a valid `Authorization: Bearer <access_token>` header. Django ORM manages the database with 5 models: AdoptionRequest, RehomingRequest, Notification, FollowUpSurvey, SurveyResponse. The project follows standard Django MTV: Views → Serializers → Models.

**Installed Custom Apps:** `django_celery_beat`

## 📁 Project Structure

| File                              | Role                                                   |
| --------------------------------- | ------------------------------------------------------ |
| apps/approvals/admin.py           | Django admin registration                              |
| apps/approvals/apps.py            | App configuration (AppConfig)                          |
| apps/approvals/authentication.py  | Custom authentication backend                          |
| apps/approvals/models.py          | Django ORM models (DB schema)                          |
| apps/approvals/serializers.py     | DRF Serializers (data validation & transformation)     |
| apps/approvals/urls.py            | URL configuration (urlpatterns)                        |
| apps/approvals/views.py           | DRF Function-Based API View                            |
| apps/notifications/admin.py       | Django admin registration                              |
| apps/notifications/apps.py        | App configuration (AppConfig)                          |
| apps/notifications/models.py      | Django ORM models (DB schema)                          |
| apps/notifications/serializers.py | DRF Serializers (data validation & transformation)     |
| apps/notifications/urls.py        | URL configuration (urlpatterns)                        |
| apps/notifications/views.py       | DRF Function-Based API View                            |
| apps/surveys/admin.py             | Django admin registration                              |
| apps/surveys/apps.py              | App configuration (AppConfig)                          |
| apps/surveys/models.py            | Django ORM models (DB schema)                          |
| apps/surveys/serializers.py       | DRF Serializers (data validation & transformation)     |
| apps/surveys/tasks.py             | Celery async tasks                                     |
| apps/surveys/urls.py              | URL configuration (urlpatterns)                        |
| apps/surveys/views.py             | DRF Function-Based API View                            |
| manage.py                         | Django management CLI entry point                      |
| pawster/settings.py               | Django settings (DB, auth, installed apps, DRF config) |
| pawster/urls.py                   | URL configuration (urlpatterns)                        |
| pawster/wsgi.py                   | WSGI server entry point (production)                   |

## 🔐 Authentication Flow

```
1. POST /api/token/          → Submit credentials (username + password)
                            → Returns { access, refresh } JWT pair

2. POST /api/token/refresh/  → Submit { refresh } token
                            → Returns new { access } token

3. Protected Request         → Client: Authorization: Bearer <access_token>
                            → JWTAuthentication validates token
                            → Permission classes checked (IsAuthenticated, etc.)
                            → View executes

4. Token Expired             → 401 Unauthorized
                            → Client refreshes via /api/token/refresh/
```

**Security / Permissions:**
- Default permission: `IsAuthenticated` (JWT required on most endpoints)
- Authentication: `JWTAuthentication` via djangorestframework-simplejwt
- CORS is configured — check `CORS_ALLOWED_ORIGINS` in settings

## 🗺️ URL Structure

| Prefix             | App URLs                |
| ------------------ | ----------------------- |
| api/approvals/     | apps.approvals.urls     |
| api/surveys/       | apps.surveys.urls       |
| api/notifications/ | apps.notifications.urls |

## 🌐 API Endpoints

### /adoptions

| Method | Path                         | View  | Auth      | Description |
| ------ | ---------------------------- | ----- | --------- | ----------- |
| GET    | /adoptions/                  | views | Yes (JWT) | views       |
| GET    | /adoptions/admin/            | views | Yes (JWT) | views       |
| GET    | /adoptions/<int:pk>/approve/ | views | Yes (JWT) | views       |
| GET    | /adoptions/<int:pk>/reject/  | views | Yes (JWT) | views       |

### /rehoming

| Method | Path                        | View  | Auth      | Description |
| ------ | --------------------------- | ----- | --------- | ----------- |
| GET    | /rehoming/                  | views | Yes (JWT) | views       |
| GET    | /rehoming/admin/            | views | Yes (JWT) | views       |
| GET    | /rehoming/<int:pk>/approve/ | views | Yes (JWT) | views       |
| GET    | /rehoming/<int:pk>/reject/  | views | Yes (JWT) | views       |

### /root

| Method | Path | View  | Auth      | Description |
| ------ | ---- | ----- | --------- | ----------- |
| GET    | /    | views | Yes (JWT) | views       |

### /unread-count

| Method | Path           | View  | Auth      | Description |
| ------ | -------------- | ----- | --------- | ----------- |
| GET    | /unread-count/ | views | Yes (JWT) | views       |

### /read-all

| Method | Path       | View  | Auth      | Description |
| ------ | ---------- | ----- | --------- | ----------- |
| GET    | /read-all/ | views | Yes (JWT) | views       |

### /<int:pk>

| Method | Path            | View  | Auth      | Description |
| ------ | --------------- | ----- | --------- | ----------- |
| GET    | /<int:pk>/read/ | views | Yes (JWT) | views       |

### /user

| Method | Path   | View  | Auth      | Description |
| ------ | ------ | ----- | --------- | ----------- |
| GET    | /user/ | views | Yes (JWT) | views       |

### /response

| Method | Path       | View  | Auth      | Description |
| ------ | ---------- | ----- | --------- | ----------- |
| GET    | /response/ | views | Yes (JWT) | views       |

### /admin

| Method | Path            | View  | Auth      | Description |
| ------ | --------------- | ----- | --------- | ----------- |
| GET    | /admin/         | views | Yes (JWT) | views       |
| GET    | /admin/pending/ | views | Yes (JWT) | views       |

## 🗄️ Data Flow

```
HTTP Request
   └─► Django URL Router        (urls.py — matches path)
         └─► JWTAuthentication  (validates Bearer token)
               └─► Permission   (IsAuthenticated / custom)
                     └─► View / ViewSet (handles logic)
                           └─► Serializer (validate & serialize data)
                                 └─► Model / ORM (DB query)
                                       └─► JSON Response
```

## 🗃️ Database Models

- `AdoptionRequest`
- `RehomingRequest`
- `Notification`
- `FollowUpSurvey`
- `SurveyResponse`

## 📦 Serializers

- `AdoptionRequestSerializer`
- `RehomingRequestSerializer`
- `NotificationSerializer`
- `FollowUpSurveySerializer`
- `SurveyResponseSerializer`
- `SurveyResponseAdminSerializer`

## ⚙️ Configuration

```python
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
    "rest_framework",
    "corsheaders",
    "django_celery_beat",
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
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.approvals.authentication.SpringBootJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")
```


## 📂 File Tree

```
django/
├── ./
│   ├── Dockerfile
│   ├── apps/
│   │   ├── __init__.py
│   │   ├── approvals/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── authentication.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   ├── notifications/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   └── surveys/
│   │       ├── __init__.py
│   │       ├── admin.py
│   │       ├── apps.py
│   │       ├── models.py
│   │       ├── serializers.py
│   │       ├── tasks.py
│   │       ├── urls.py
│   │       └── views.py
│   ├── manage.py
│   ├── pawster/
│   │   ├── __init__.py
│   │   ├── celery.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── requirements.txt
```

<!-- AUTO:END -->

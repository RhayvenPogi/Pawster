# Pawster — Django Backend: System Flow

> Module-by-module breakdown of how the Django backend operates within the Pawster system.

---

## 1. Entry Points

The system exposes two entry points depending on context:

**HTTP (Production):** `pawster/wsgi.py` boots the WSGI application and hands it to Gunicorn.

**Async Tasks:** `pawster/celery.py` initializes the Celery app, sets `DJANGO_SETTINGS_MODULE`, and auto-discovers tasks from all installed apps. It also registers a periodic task (`schedule_followup_surveys`) to run every 10 seconds via Celery Beat.

---

## 2. Configuration — `pawster/settings.py`

All runtime config is injected via environment variables (set in `docker-compose.yml`). Key areas:

- **Database** — shared PostgreSQL instance with Spring Boot (`DB_HOST`, `DB_NAME`, etc.)
- **JWT Secret** — base64-decoded from `JWT_SECRET` env var; used to verify Spring Boot-issued tokens
- **CORS** — `CORS_ALLOWED_ORIGINS` allows the React frontend (`:3000`, `:5173`)
- **Email** — Brevo (formerly Sendinblue) via `BREVO_API_KEY` and `DEFAULT_FROM_EMAIL`
- **Celery** — Redis as broker and result backend; `CELERY_BEAT_SCHEDULE` drives periodic survey scheduling
- **Spring Boot** — `SPRING_BOOT_API` URL for cross-service calls (mark animal as pending/adopted, create rehomed pet listing)

---

## 3. URL Routing — `pawster/urls.py`

All API traffic is prefixed under `/api/` and delegated to three app-level routers:

```
/api/approvals/      →  apps.approvals.urls
/api/surveys/        →  apps.surveys.urls
/api/notifications/  →  apps.notifications.urls
/api/users/<pk>/photo/public/  →  approvals_views.user_photo_public
```

OpenAPI schema and Swagger/ReDoc UI are also mounted here under `/api/schema/`, `/api/docs/`, and `/api/redoc/`.

---

## 4. Authentication — `apps/approvals/authentication.py`

Every protected request passes through `SpringBootJWTAuthentication` before reaching any view.

```
Incoming Request
  └─► Extract "Authorization: Bearer <token>" header
        └─► jwt.decode(token, SPRING_JWT_SECRET, algorithms=["HS256"])
              ├─► On failure  → AuthenticationFailed (401)
              └─► On success  → Extract sub / username / email from payload
                                Extract roles → detect ROLE_ADMIN
                                User.objects.get_or_create(username=...)
                                  ├─► Created  → populate email, name, is_staff, is_superuser
                                  └─► Existing → sync is_staff/is_superuser if role changed
                                Return (user, token)
```

Django never issues its own tokens — it trusts Spring Boot's JWTs entirely. Admin status is derived from the `roles` claim and kept in sync on every request.

---

## 5. Approvals Module — `apps/approvals/`

Handles the two core request flows: pet adoption and pet rehoming.

### 5a. Models (`models.py`)

Two main tables (custom `db_table` names so they coexist with Spring Boot's schema):

| Model | Table | Purpose |
|---|---|---|
| `AdoptionRequest` | `django_adoption_requests` | Stores a user's application to adopt a listed animal |
| `RehomingRequest` | `django_rehoming_requests` | Stores a user's request to surrender or rehome their pet |

Both models carry a `status` field (`Pending` / `Approved` / `Rejected`), a `decided_by` FK to the admin who acted, and address fields (`street_address`, `city`, `province`, `zip_code`) that mirror the frontend registration form.

`RehomingRequest` also tracks `request_type` (`rehome` vs `rescue`), vaccination records (`vacc_photos`, `vaccine_type`, `last_vacc_date`, `vacc_clinic`), and behavior flags (`has_aggression`, `is_house_trained`, `good_with_children`, etc.).

### 5b. Serializers (`serializers.py`)

`AdoptionRequestSerializer` and `RehomingRequestSerializer` both extend `ModelSerializer`. Key behaviors:

- Address subfields are declared explicitly so PATCH updates work cleanly without requiring the full object.
- Boolean fields on `RehomingRequestSerializer` use `allow_null=True` so missing values from the frontend don't cause validation errors.
- `status`, `decided_by`, `decided_at`, `user`, and date fields are all `read_only` — the frontend cannot set these directly.
- `RehomingRequestSerializer.create()` / `update()` call `_resolve_owner_name()` to fall back to the authenticated user's name if `owner_name` is missing.

### 5c. Views & Endpoints (`views.py`, `urls.py`)

Each flow has 8 endpoints:

**Adoption**

| Method | Path | Permission | Action |
|---|---|---|---|
| POST | `/api/approvals/adoptions/` | User | Submit new adoption request; calls Spring Boot to mark animal as "Pending" |
| GET | `/api/approvals/adoptions/admin/` | Admin | List all adoption requests (filterable by `?status=`) |
| GET | `/api/approvals/adoptions/user/` | User | List requesting user's own submissions |
| GET | `/api/approvals/adoptions/<pk>/` | Admin | Retrieve single request detail |
| POST | `/api/approvals/adoptions/<pk>/approve/` | Admin | Approve; calls Spring Boot to mark animal "Adopted"; schedules follow-up surveys via Celery; sends notification + email |
| POST | `/api/approvals/adoptions/<pk>/reject/` | Admin | Reject with reason; sends notification + email |
| PATCH | `/api/approvals/adoptions/<pk>/update/` | Admin | Update fields (status/decided fields are stripped); sends email |
| DELETE | `/api/approvals/adoptions/<pk>/delete/` | Admin | Hard delete |

**Rehoming**

| Method | Path | Permission | Action |
|---|---|---|---|
| POST | `/api/approvals/rehoming/` | User | Submit new rehoming/rescue request |
| GET | `/api/approvals/rehoming/admin/` | Admin | List all (strips `photo_base64` from list view for bandwidth; sets `has_photo` flag instead) |
| GET | `/api/approvals/rehoming/user/` | User | List requesting user's own submissions |
| GET | `/api/approvals/rehoming/<pk>/` | Admin | Full detail including photo and vaccination data |
| POST | `/api/approvals/rehoming/<pk>/approve/` | Admin | Approve; constructs a Spring Boot animal payload from the rehoming data (including decoded photo) and POSTs to `/api/animals/from-rehoming`; sends notification + email |
| POST | `/api/approvals/rehoming/<pk>/reject/` | Admin | Reject with reason; sends notification + email |
| PATCH | `/api/approvals/rehoming/<pk>/update/` | Admin | Update fields; sends email |
| DELETE | `/api/approvals/rehoming/<pk>/delete/` | Admin | Hard delete |

### 5d. Email Helpers (`views.py`)

`_send(subject, body, to)` wraps all outgoing email. It builds a styled HTML envelope (Pawster green header, logo, body) and calls `utils/email_service.send_email`. All failures are silently swallowed — emails never crash the main request.

Specific helpers called by each action:

```
approve_adoption  → _adoption_approval_email
reject_adoption   → _adoption_rejection_email
approve_rehoming  → _rehome_approval_email
reject_rehoming   → _rehome_rejection_email
update_adoption   → _adoption_update_email
update_rehoming   → _rehome_update_email
```

---

## 6. Surveys Module — `apps/surveys/`

Manages post-adoption follow-up surveys at 7-, 30-, and 90-day intervals.

### 6a. Models (`models.py`)

| Model | Table | Purpose |
|---|---|---|
| `FollowUpSurvey` | `django_followup_surveys` | One record per survey window per adoption; tracks `status` (Pending/Completed) and `scheduled_for` datetime |
| `SurveyResponse` | `django_survey_responses` | Adopter's answers; OneToOne with `FollowUpSurvey` preventing duplicate submissions |
| `SurveyPhoto` | `django_survey_photos` | Photos attached to a response; stored as raw base64 text in the DB (no files on disk) |

`FollowUpSurvey` has a `unique_together` constraint on `(adoption, survey_type)` so the scheduler can safely call `get_or_create` without duplicating rows.

### 6b. Serializers (`serializers.py`)

- `FollowUpSurveySerializer` — exposes `animal_name` and `adoption_date` via source traversal; computes `has_response` as a method field checking for a related `response`.
- `SurveyResponseSerializer` — `validate_survey_id` looks up the survey, confirms it belongs to the requesting user, and confirms it's still `Pending`. On `create()`, it marks the survey `Completed` and records `submitted_at`.
- `SurveyResponseAdminSerializer` — enriched read-only view for admins; includes adopter name/email, a `health_flag` (maps to `showing_illness`), and nested `SurveyPhotoSerializer` output.

### 6c. Views (`views.py`)

| Method | Path | Permission | Action |
|---|---|---|---|
| GET | `/api/surveys/user/` | User | Returns `pending` and `completed` surveys for the logged-in adopter |
| POST | `/api/surveys/response/` | User | Submit answers (multipart); saves up to 5 photos as base64 `SurveyPhoto` records |
| GET | `/api/surveys/admin/` | Admin | All responses; filterable by `?survey_type=` and `?health_flag=true` |
| GET | `/api/surveys/admin/pending/` | Admin | All surveys not yet answered |

### 6d. Celery Tasks (`tasks.py`)

Two tasks handle survey lifecycle:

**`create_followup_surveys_for_adoption(adoption_id)`** — called immediately (`.delay()`) when an admin approves an adoption. Creates three `FollowUpSurvey` rows (7-, 30-, 90-day) with `scheduled_for` set relative to `adoption_date`. Also creates a "Follow-up surveys scheduled" `Notification` for the adopter.

**`schedule_followup_surveys()`** — runs every 10 seconds via Celery Beat as a safety net. Scans all approved adoptions, ensures survey rows exist (`get_or_create`), and for any survey that is `Pending` and past its `scheduled_for` time, sends an email and a `survey_due` Notification — but only once (checked via a `Notification.objects.filter(...body__icontains=...)` guard to avoid duplicates).

```
Celery Beat (every 10s)
  └─► schedule_followup_surveys()
        └─► For each Approved adoption with adoption_date and user:
              ├─► get_or_create FollowUpSurvey for 7/30/90-day windows
              └─► If Pending AND now >= scheduled_for AND no prior notification:
                    ├─► _send_survey_ready_email(user, animal_name, survey_type)
                    └─► Notification.objects.create(notif_type="survey_due")
```

---

## 7. Notifications Module — `apps/notifications/`

Lightweight in-app notification system. Records are created by other modules (approvals, surveys) and read/acknowledged by the frontend.

### 7a. Model (`models.py`)

`Notification` table (`django_notifications`) — FK to `User`, `title`, `body`, `notif_type` (one of: `adoption_approved`, `adoption_rejected`, `rehoming_approved`, `rehoming_rejected`, `survey_scheduled`, `survey_due`, `general`), `is_read` boolean, and `created_at`.

### 7b. Endpoints (`views.py`, `urls.py`)

| Method | Path | Action |
|---|---|---|
| GET | `/api/notifications/` | List up to 40 most recent notifications for the user; includes `unread_count` in response |
| GET | `/api/notifications/unread-count/` | Lightweight count-only endpoint; polled by the frontend `NotificationBell` every 60 seconds |
| POST | `/api/notifications/<pk>/read/` | Mark a single notification as read |
| POST | `/api/notifications/read-all/` | Bulk mark all as read; returns count of records updated |

---

## 8. Email Service — `utils/email_service.py`

Single function `send_email(to, subject, html)` wraps the Brevo (Sendinblue) transactional email SDK. All calls go through the `sib_api_v3_sdk.TransactionalEmailsApi`. Sender name is always "Pawster" with the address from `DEFAULT_FROM_EMAIL`.

---

## 9. Cross-Service Integration with Spring Boot

Django acts as the approval/workflow layer. Spring Boot owns the animal catalog. They communicate synchronously via HTTP:

| Django Action | Spring Boot Call | Payload |
|---|---|---|
| Adoption submitted | `POST /api/animals/mark-pending` | `{ animalName }` |
| Adoption approved | `POST /api/animals/mark-adopted` | `{ animalName }` |
| Rehoming approved | `POST /api/animals/from-rehoming` | Full animal object with decoded photo, behavior notes, health status |

All Spring Boot calls are wrapped in `try/except` with a 5–10 second timeout so a Spring Boot outage never fails a Django response.

---

## 10. End-to-End Flow Summary

### Adoption Flow

```
User submits adoption form
  └─► POST /api/approvals/adoptions/
        └─► JWT validated → AdoptionRequestSerializer.is_valid()
              └─► AdoptionRequest saved (status=Pending)
                    └─► Spring Boot: mark-pending (fire-and-forget)
                          └─► 201 response to frontend

Admin reviews and approves
  └─► POST /api/approvals/adoptions/<pk>/approve/
        └─► status=Approved, decided_by/at, adoption_date set
              ├─► Spring Boot: mark-adopted
              ├─► create_followup_surveys_for_adoption.delay(id)  [Celery]
              ├─► Notification created for adopter
              └─► Approval email sent via Brevo

Celery Beat (10s loop) detects survey is due
  └─► schedule_followup_surveys()
        └─► Survey is Pending + now >= scheduled_for
              ├─► Survey-ready email sent
              └─► survey_due Notification created

Adopter submits survey response
  └─► POST /api/surveys/response/  (multipart)
        └─► SurveyResponseSerializer validates ownership + Pending status
              ├─► SurveyResponse created
              ├─► Up to 5 SurveyPhoto records created (base64 in DB)
              └─► FollowUpSurvey status → Completed
```

### Rehoming Flow

```
User submits rehoming form (with optional photo)
  └─► POST /api/approvals/rehoming/
        └─► RehomingRequestSerializer.create()
              └─► owner_name resolved from JWT user if missing
                    └─► RehomingRequest saved (status=Pending)

Admin approves
  └─► POST /api/approvals/rehoming/<pk>/approve/
        └─► Builds Spring Boot animal payload:
              name, type, breed, age, notes (assembled from behavior/health fields)
              photo_base64 decoded from data URI or raw base64
        └─► POST /api/animals/from-rehoming → pet listed in catalog
        ├─► Notification created for owner
        └─► Approval email sent
```
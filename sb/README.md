# 🐾 Pawster — Spring Boot Backend

> **Module:** `sb` (Spring Boot API)
> **Package:** `com.pawstar.pawster`
> **Port:** `8080` (default)
> **Database:** PostgreSQL (JPA) + MongoDB (messages)

---

## Architecture Overview

Pawster's Spring Boot backend is a stateless RESTful API. Every request passes through a JWT filter before reaching any controller. The app is split into clean layers — controllers handle routing, services own business logic, and repositories talk to the database. Messages use MongoDB for flexible document storage; everything else (users, animals, adoptions, etc.) lives in PostgreSQL via Spring Data JPA.

```
HTTP Request
   └─► JwtAuthenticationFilter        (validates Bearer token or HttpOnly cookie)
         └─► Spring Security Context   (sets authenticated principal)
               └─► @RestController     (routes the request)
                     └─► @Service      (business logic, activity logging)
                           └─► @Repository
                                 ├─► PostgreSQL  (JPA — users, animals, requests…)
                                 └─► MongoDB     (messages collection)
```

---

## Project Structure

```
sb/
├── src/main/java/com/pawstar/pawster/
│   ├── PawsterApplication.java              ← @SpringBootApplication entry point
│   ├── config/
│   │   ├── MongoConfig.java                 ← Split JPA / Mongo repository scan
│   │   └── WebConfig.java                  ← Static file serving for uploads/
│   ├── controller/
│   │   ├── ActivityLogController.java
│   │   ├── AdminUserController.java
│   │   ├── AdoptionController.java
│   │   ├── AnimalController.java
│   │   ├── AuthController.java
│   │   ├── MessageController.java           ← REST + WebSocket handlers
│   │   ├── MissingPetController.java
│   │   ├── PetCommentController.java
│   │   ├── RehomeController.java
│   │   ├── SurveyController.java
│   │   └── UserController.java
│   ├── dto/
│   │   ├── AdoptionRequestDto.java          ← JOIN projection (animal + user info)
│   │   ├── AnimalDto.java                   ← Base64 photo serialization
│   │   ├── AnimalRequest.java               ← Incoming create/update payload
│   │   ├── LoginRequest.java
│   │   ├── MessageDto.java                  ← ChatMessage, MessageResponse, ConversationSummary
│   │   ├── PetCommentRequest.java
│   │   └── SignupRequest.java
│   ├── model/                               ← JPA entities (PostgreSQL)
│   │   ├── ActivityLog.java                 → activity_logs
│   │   ├── AdoptionRequest.java             → adoption_requests
│   │   ├── Animal.java                      → animals
│   │   ├── Message.java                     → MongoDB: messages collection
│   │   ├── MessageAttachment.java           → message_attachments (PostgreSQL BYTEA)
│   │   ├── MissingPet.java                  → missing_pets
│   │   ├── PetComment.java                  → pet_comments
│   │   ├── RehomeRequest.java               → rehome_requests
│   │   ├── Survey.java                      → surveys
│   │   └── User.java                        → users
│   ├── repository/
│   │   ├── ActivityLogRepository.java       ← JPA
│   │   ├── AdoptionRepository.java          ← JPA + JPQL JOIN queries → AdoptionRequestDto
│   │   ├── AnimalRepository.java            ← JPA + custom search query
│   │   ├── MessageAttachmentRepository.java ← JPA
│   │   ├── MessageRepository.java           ← MongoRepository + aggregation pipeline
│   │   ├── MissingPetRepository.java        ← JPA
│   │   ├── PetCommentRepository.java        ← JPA
│   │   ├── RehomeRepository.java            ← JPA
│   │   ├── SurveyRepository.java            ← JPA
│   │   └── UserRepository.java              ← JPA
│   ├── security/
│   │   ├── CustomUserDetailsService.java    ← Loads user by email for Spring Security
│   │   ├── DataInitializer.java             ← Seeds admin@pawster.com on startup
│   │   ├── JwtAuthenticationFilter.java     ← Cookie → Authorization header fallback
│   │   ├── JwtUtils.java                    ← Sign / validate / parse JWT (HS256)
│   │   └── SecurityConfig.java             ← Route permissions + CORS + BCrypt bean
│   └── service/
│       ├── ActivityLogService.java
│       ├── AdoptionService.java
│       ├── AnimalService.java
│       ├── EmailService.java                ← Brevo (Sendinblue) transactional email
│       ├── MessageService.java
│       ├── MissingPetService.java
│       ├── PetCommentService.java
│       ├── RehomeService.java
│       └── SurveyService.java
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/                        ← Flyway SQL migrations
│       ├── V1__create_user_table.sql
│       ├── V2__pawster_animals_and_requests.sql
│       ├── V3__missing_pets.sql
│       ├── V4__add_pet_comments_table.sql
│       ├── V5__resolved_by_user_column_for_missings.sql
│       ├── V6__add_photo_bytea.sql
│       ├── V7__animals_photo_bytea.sql
│       ├── V8__create_messages_table.sql
│       ├── V9__add_attachments_to_messages.sql
│       ├── V10__create_message_attachments.sql
│       ├── V11__add_isbot_to_messages.sql
│       ├── V12__migrate_messages_to_mongodb.sql
│       ├── V13__add_user_name_to_activity_logs.sql
│       └── V14__add_signin_coplete_identifier.sql
```

---

## Authentication & Security

### How JWT works in this app

```
1. POST /api/auth/register
      → BCrypt-hashes password
      → Saves User to PostgreSQL
      → Issues JWT, sets HttpOnly cookie "jwt"

2. POST /api/auth/login
      → Loads user via CustomUserDetailsService (by email)
      → BCrypt.matches() password check
      → JwtUtils.generateToken(email, role) — HS256, role claim included
      → Sets "jwt" HttpOnly cookie + returns token in body

3. POST /api/auth/google
      → Verifies Google ID token via GoogleIdTokenVerifier
      → Creates user if new (profileComplete = false)
      → Same JWT issue flow as above

4. PUT /api/auth/complete-profile
      → Google users fill phone, address, ID file
      → Sets profileComplete = true

5. Every protected request
      → JwtAuthenticationFilter reads cookie, falls back to Authorization: Bearer
      → JwtUtils.validateToken() → getUsernameFromToken()
      → CustomUserDetailsService.loadUserByUsername(email)
      → SecurityContextHolder.setAuthentication(...)
      → Controller runs with authenticated principal
```

### Password Reset Flow

```
POST /api/auth/forgot-password   → generates 6-digit OTP, emails via Brevo, stores in DB
POST /api/auth/verify-otp        → checks OTP + expiry (10 min), sets resetOtpVerified = true
POST /api/auth/reset-password    → BCrypt-encodes new password, clears OTP fields
```

### Role System

| Role    | Granted To                  | Spring Authority |
|---------|-----------------------------|-----------------|
| `user`  | All registered users        | `user`          |
| `admin` | Admin accounts              | `admin`         |

Roles are stored as lowercase strings in `users.role` (always `"admin"` or `"user"`). `SecurityConfig` checks them with `.hasAnyAuthority("admin", "ADMIN")`.

### Route Permissions Summary

| Access Level | Examples |
|---|---|
| **Public (no token)** | `GET /api/animals/**`, `POST /api/animals/mark-adopted`, `POST /api/animals/mark-pending`, `GET /api/missing-pets/**`, `POST /api/missing-pets`, `/api/users/*/photo/public`, `/ws/**` |
| **Authenticated users** | `POST /api/adoption`, `GET /api/adoption/my-requests`, `POST /api/rehome`, `POST /api/surveys`, `GET /api/messages/**` |
| **Admin only** | `GET /api/adoption`, `PATCH /api/adoption/{id}/status`, `/api/admin/**`, `PUT /api/animals/**`, `DELETE /api/animals/**` |

CORS is restricted to `http://localhost:3000` and `http://localhost:5173`.

---

## Database

### PostgreSQL Tables (JPA / Flyway)

| Table | Entity | Key Columns |
|---|---|---|
| `users` | `User` | id, email (unique), password_hash, role, status, profile_complete, id_file (bytea), photo (bytea) |
| `animals` | `Animal` | id, name, type, breed, age, health, status, photo_data (bytea) |
| `adoption_requests` | `AdoptionRequest` | id, user_id, pet_name, status (Pending/Approved/Rejected), reject_note |
| `rehome_requests` | `RehomeRequest` | id, user_id, pet_name, species, behavior, medical_notes, status |
| `surveys` | `Survey` | id, adoption_id, user_id, animal_name, rating (1-5), notes |
| `missing_pets` | `MissingPet` | id, type, species, area, latitude, longitude, photo (bytea), status, reporter_user_id |
| `pet_comments` | `PetComment` | id, pet_id (FK), user_id, author_name, content |
| `activity_logs` | `ActivityLog` | id, action, details, user_id, user_name |
| `login_attempts` | `LoginAttempt` | id, email (unique), attempt_count, locked_until, permanently_locked, last_attempt_at |
| `message_attachments` | `MessageAttachment` | id, data (bytea), content_type, original_filename |

### MongoDB Collection

| Collection | Model | Key Fields |
|---|---|---|
| `messages` | `Message` | id (ObjectId), user_id, sender_id, sender_role, content, is_read, is_bot, created_at, attachment_url |

`MessageRepository` uses `@Aggregation` pipeline for conversation summaries and `@Query` + `@Update` for bulk read-marking without loading documents into memory.

### Dual-Database Config

`MongoConfig` splits repository scanning so Spring doesn't confuse JPA and Mongo repos:

```java
@EnableJpaRepositories(
    basePackages = "com.pawstar.pawster.repository",
    excludeFilters = @Filter(type = ASSIGNABLE_TYPE, classes = MessageRepository.class)
)
@EnableMongoRepositories(basePackageClasses = MessageRepository.class)
```

---

## Real-Time Messaging (WebSocket / STOMP)

```
Client connects → ws/chat (SockJS fallback)
   └─► WebSocketConfig.configureClientInboundChannel()
         └─► CONNECT frame: validates JWT from "Authorization" header → stores principal in session
               └─► SEND / SUBSCRIBE frames: restores principal from session attributes
```

### STOMP Destinations

| Direction | Destination | Description |
|---|---|---|
| Client → Server | `/app/chat.send` | User sends message to admin |
| Client → Server | `/app/chat.admin.send` | Admin replies to a user |
| Server → Client | `/topic/user/{userId}` | Delivers message to specific user |
| Server → Client | `/topic/admin/inbox` | Notifies admin panel of new messages |

### File Attachments in Chat

Upload: `POST /api/messages/upload` → saves bytes to `message_attachments` (PostgreSQL), returns `/api/messages/attachment/{id}` URL. The URL is stored in the MongoDB message document and served back on demand via `GET /api/messages/attachment/{id}`.

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | Public | Email + password login, sets JWT cookie |
| POST | `/register` | Public | Multipart registration with ID file upload |
| POST | `/google` | Public | Google OAuth token exchange |
| PUT | `/complete-profile` | JWT | Google users complete missing profile fields |
| GET | `/me` | JWT | Returns current user DTO |
| POST | `/logout` | Public | Clears JWT cookie |
| GET | `/id-file/{userId}` | JWT | Serves uploaded ID file (inline) |
| POST | `/forgot-password` | Public | Sends OTP email |
| POST | `/verify-otp` | Public | Validates OTP |
| POST | `/reset-password` | Public | Sets new password after verified OTP |

### Animals — `/api/animals`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List all; filter by `?type=` and/or `?status=` |
| GET | `/{id}` | Public | Get one animal (photo as base64 in response) |
| POST | `/` (multipart) | Admin | Create animal with optional photo upload |
| POST | `/` (JSON) | Admin | Create animal with optional base64 photo |
| POST | `/from-rehoming` | Public | Internal — called by Django on rehome approval |
| PUT | `/{id}` | Admin | Update animal (multipart or JSON) |
| DELETE | `/{id}` | Admin | Delete animal |
| POST | `/mark-adopted` | Public | Called by Django to flip status → Adopted |
| POST | `/mark-pending` | Public | Called by Django when adoption submitted |

### Adoption — `/api/adoption`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Authenticated | Submit adoption application |
| GET | `/` | Admin | All applications (optional `?status=`) |
| GET | `/my-requests?userId=` | Authenticated | User's own applications |
| GET | `/{id}` | Admin | Single application with JOIN details |
| PATCH | `/{id}/status` | Admin | Approve / Reject (body: `{ status, rejectNote }`) |
| DELETE | `/{id}` | Authenticated | Cancel own request |

Approving an adoption automatically finds the matching animal by name and sets its status to `Adopted`.

### Rehome — `/api/rehome`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Authenticated | Submit rehome request |
| GET | `/` | Admin | All requests (optional `?status=`) |
| GET | `/my-requests?userId=` | Authenticated | User's own requests |
| GET | `/{id}` | Admin | Single request |
| PATCH | `/{id}/status` | Admin | Approve / Reject |
| DELETE | `/{id}` | Authenticated | Cancel |

### Missing Pets — `/api/missing-pets`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Approved reports only |
| GET | `/admin/all` | Admin | All reports regardless of status |
| GET | `/{id}/photo` | Public | Raw photo bytes |
| POST | `/` | Public | Submit report (multipart, photo optional) |
| PUT | `/{id}` | Authenticated | Update own report |
| PUT | `/admin/{id}` | Admin | Admin edit via JSON body |
| PUT | `/admin/{id}/approve` | Admin | Set status → approved |
| PUT | `/admin/{id}/reject` | Admin | Set status → rejected |
| DELETE | `/admin/{id}` | Admin | Delete report |
| PUT | `/{id}/resolve?userId=` | Authenticated | Original reporter marks resolved |

### Pet Comments — `/api/missing-pets/{petId}/comments`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | All comments for a report (oldest first) |
| POST | `/` | Public | Add comment (only on approved reports) |
| DELETE | `/{commentId}` | Admin | Delete comment |

### Messages — `/api/messages`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/history?userId=` | Authenticated | Conversation history (admin passes userId) |
| POST | `/read` | Authenticated | Mark messages as read |
| GET | `/unread-count` | Authenticated | Count of unread messages |
| GET | `/conversations` | Admin | All user conversations with last message + unread count |
| DELETE | `/conversation/{userId}` | Admin | Delete entire conversation |
| POST | `/upload` | Authenticated | Upload chat attachment (image/video/file) |
| GET | `/attachment/{id}` | Authenticated | Serve attachment bytes |
| POST | `/bot-reply` | Authenticated | Trigger a bot response to a user |

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/{id}` | Owner or Admin | Get user profile DTO |
| PUT | `/{id}` | Owner or Admin | Update profile fields + optional photo |
| PUT | `/{id}/password` | Owner | Change password (requires current password) |
| PUT | `/{id}/id-file` | Owner | Replace ID verification file |
| GET | `/{id}/photo` | Owner or Admin | Serve profile photo bytes |
| GET | `/{id}/id-file` | Owner or Admin | Serve ID file bytes |
| GET | `/{id}/photo/public` | **Public** | Profile photo (no auth, cached 7 days) |

`{id}` accepts either a numeric ID or the string `me` (resolves to the authenticated caller).

### Admin — `/api/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users` | Admin | Create user with generated password, sends welcome email |
| GET | `/activity-logs` | Admin | Recent 50 activity log entries |
| GET | `/activity-logs/by-user?userId=` | Admin | Logs for a specific user |
| GET | `/login-attempts/locked` | Admin | List all permanently locked accounts |
| POST | `/login-attempts/unlock` | Admin | Unlock an account by email |

### Surveys — `/api/surveys`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Authenticated | Submit post-adoption survey |
| GET | `/` | Admin | All surveys |
| GET | `/my-surveys?userId=` | Authenticated | User's own surveys |
| GET | `/{id}` | Admin | Single survey |

---

## Key Services

### ActivityLogService
Every write operation (create/update/delete animal, adoption status change, login, etc.) calls `activityLogService.log(action, details, userId, userName)`. Stored in `activity_logs`, surfaced via `GET /api/admin/activity-logs`.

### EmailService (Brevo)
Sends HTML emails via the Brevo REST API (not JavaMail). Two templates:
- **OTP email** — 6 individual digit boxes, 10-minute expiry notice
- **Welcome email** — shows generated credentials, sign-in link

Configured via `BREVO_API_KEY` and `app.base-url` environment variables.

### AnimalService
- `markAsAdopted(name)` and `markAsPending(name)` are called by Django via the public `/api/animals/mark-*` endpoints when adoption requests are processed externally.
- Photo update is non-destructive: if no new photo bytes are provided on update, the existing photo is preserved.

### LoginAttemptService
Tracks failed login attempts per email in the `login_attempts` table. Progressive lockout schedule: 4 failures → 1 min, 5 → 5 min, 6 → 15 min, 7–9 → 1 hour, 10+ → permanently locked. Admin can unlock accounts via `POST /api/admin/login-attempts/unlock`. Successful login resets the counter.

### AdoptionService
The `updateStatus` method handles the full approval side-effect chain: sets status → finds matching animal by name → flips animal status to `Adopted` → logs the action.

---

## Configuration

Key properties in `application.properties`:

```properties
# PostgreSQL
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5434/pawster_db}
spring.datasource.username=user
spring.datasource.password=password
spring.jpa.properties.hibernate.default_schema=springboot

# MongoDB
spring.data.mongodb.uri=<configured via env>

# JWT
jwt.secret=<base64 encoded secret>
jwt.expiration=86400000   # 24 hours in ms

# Email
BREVO_API_KEY=<your key>
app.base-url=<frontend URL for email links>

# File uploads
app.upload.dir=uploads/missing-pets
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

---

## Data Initializer

The admin account is inserted directly into the database via SQL. No seeder or startup runner is used. The password is stored as a BCrypt hash in `password_hash`. Admin login goes through the standard database authentication flow like any other user — there is no hardcoded shortcut in `AuthController`.

To insert the admin manually:
```sql
INSERT INTO users (
  first_name, last_name, email, phone,
  password_hash, address, city, province, zip_code,
  role, status, profile_complete
)
VALUES (
  'Admin', '', 'admin@pawster.com', '',
  '$2a$10$...your_bcrypt_hash...',
  '', '', '', '',
  'admin', 'active', true
)
ON CONFLICT (email) DO NOTHING;
```

---

## Photo & File Storage Strategy

All binary data is stored directly in PostgreSQL as `BYTEA` columns — no separate file storage service is used.

| Data | Column | Served via |
|---|---|---|
| User profile photo | `users.photo` | `GET /api/users/{id}/photo` |
| User ID verification file | `users.id_file` | `GET /api/users/{id}/id-file` |
| Animal photo | `animals.photo_data` | Embedded as base64 in `AnimalDto` |
| Missing pet photo | `missing_pets.photo` | `GET /api/missing-pets/{id}/photo` |
| Chat attachments | `message_attachments.data` | `GET /api/messages/attachment/{id}` |

`AnimalDto.from()` base64-encodes photo bytes so the frontend can use them directly in `<img src>` without a separate image request.

---

## Flyway Migrations

Migrations live in `src/main/resources/db/migration/` and run automatically on startup. The sequence covers table creation through the MongoDB migration for messages (V12), addition of `is_bot` to messages (V11), and user/activity log enhancements.
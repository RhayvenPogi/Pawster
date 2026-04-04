# PAWSTER — SB Backend

## 📁 File Structure

<!-- AUTO:START -->
> 🔍 **Auto-generated documentation** — last updated: 2026-04-04 14:59:00 UTC
> Run `node scripts/generate-readme.js sb` to refresh.

---

## 🏗️ Architecture Overview

PAWSTER's Spring Boot backend is a RESTful API secured with Spring Security and JWT authentication. Clients receive a signed token on login and must send it as a `Bearer` header on every protected request. Spring Data JPA handles all database access with 9 entity models: AnimalRequest, ActivityLog, AdoptionRequest, Animal, MissingPet, PetComment, RehomeRequest, Survey, User. The app follows standard Spring MVC: Controllers → Services → Repositories.

## 📁 Project Structure

| File                                                                     | Role                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------ |
| src\main\java\com\pawstar\pawster\config\WebConfig.java                  | Spring configuration                             |
| src\main\java\com\pawstar\pawster\controller\ActivityLogController.java  | REST Controller                                  |
| src\main\java\com\pawstar\pawster\controller\AdminUserController.java    | REST Controller                                  |
| src\main\java\com\pawstar\pawster\controller\AdoptionController.java     | REST Controller                                  |
| src\main\java\com\pawstar\pawster\controller\AnimalController.java       | REST Controller                                  |
| src\main\java\com\pawstar\pawster\controller\AuthController.java         | REST Controller                                  |
| src\main\java\com\pawstar\pawster\controller\MissingPetController.java   | REST Controller                                  |
| src\main\java\com\pawstar\pawster\controller\PetCommentController.java   | REST Controller                                  |
| src\main\java\com\pawstar\pawster\controller\RehomeController.java       | REST Controller                                  |
| src\main\java\com\pawstar\pawster\controller\SurveyController.java       | REST Controller                                  |
| src\main\java\com\pawstar\pawster\controller\UserController.java         | REST Controller                                  |
| src\main\java\com\pawstar\pawster\dto\AnimalRequest.java                 | JPA Entity (DB table)                            |
| src\main\java\com\pawstar\pawster\model\ActivityLog.java                 | JPA Entity (DB table)                            |
| src\main\java\com\pawstar\pawster\model\AdoptionRequest.java             | JPA Entity (DB table)                            |
| src\main\java\com\pawstar\pawster\model\Animal.java                      | JPA Entity (DB table)                            |
| src\main\java\com\pawstar\pawster\model\MissingPet.java                  | JPA Entity (DB table)                            |
| src\main\java\com\pawstar\pawster\model\PetComment.java                  | JPA Entity (DB table)                            |
| src\main\java\com\pawstar\pawster\model\RehomeRequest.java               | JPA Entity (DB table)                            |
| src\main\java\com\pawstar\pawster\model\Survey.java                      | JPA Entity (DB table)                            |
| src\main\java\com\pawstar\pawster\model\User.java                        | JPA Entity (DB table)                            |
| src\main\java\com\pawstar\pawster\PawsterApplication.java                | Spring Boot entry point (@SpringBootApplication) |
| src\main\java\com\pawstar\pawster\repository\ActivityLogRepository.java  | JPA Repository                                   |
| src\main\java\com\pawstar\pawster\repository\AdoptionRepository.java     | JPA Repository                                   |
| src\main\java\com\pawstar\pawster\repository\AnimalRepository.java       | JPA Repository                                   |
| src\main\java\com\pawstar\pawster\repository\MissingPetRepository.java   | JPA Repository                                   |
| src\main\java\com\pawstar\pawster\repository\PetCommentRepository.java   | JPA Repository                                   |
| src\main\java\com\pawstar\pawster\repository\RehomeRepository.java       | JPA Repository                                   |
| src\main\java\com\pawstar\pawster\repository\SurveyRepository.java       | JPA Repository                                   |
| src\main\java\com\pawstar\pawster\repository\UserRepository.java         | JPA Repository                                   |
| src\main\java\com\pawstar\pawster\security\CustomUserDetailsService.java | Service layer                                    |
| src\main\java\com\pawstar\pawster\security\DataInitializer.java          | Spring component                                 |
| src\main\java\com\pawstar\pawster\security\JwtAuthenticationFilter.java  | JWT request filter                               |
| src\main\java\com\pawstar\pawster\security\JwtUtils.java                 | Spring component                                 |
| src\main\java\com\pawstar\pawster\security\SecurityConfig.java           | Security configuration                           |
| src\main\java\com\pawstar\pawster\service\ActivityLogService.java        | Service layer                                    |
| src\main\java\com\pawstar\pawster\service\AdoptionService.java           | Service layer                                    |
| src\main\java\com\pawstar\pawster\service\AnimalService.java             | Service layer                                    |
| src\main\java\com\pawstar\pawster\service\EmailService.java              | Service layer                                    |
| src\main\java\com\pawstar\pawster\service\MissingPetService.java         | Service layer                                    |
| src\main\java\com\pawstar\pawster\service\PetCommentService.java         | Service layer                                    |
| src\main\java\com\pawstar\pawster\service\RehomeService.java             | Service layer                                    |
| src\main\java\com\pawstar\pawster\service\SurveyService.java             | Service layer                                    |
| src\main\resources\application.properties                                | App configuration (DB, JWT, mail, server)        |

## 🔐 Authentication Flow

```
1. POST /api/auth/register  → Hash password (BCrypt) + save to DB
                           → Return success

2. POST /api/auth/login     → CustomUserDetailsService loads user
                           → JwtUtils.generateToken() signs JWT
                           → Return { token, user info }

3. Protected Request        → Client: Authorization: Bearer <token>
                           → JwtAuthenticationFilter validates token
                           → Spring Security context set
                           → Controller executes
```

**Security Rules:**
- Public (no auth): HttpMethod.GET,/api/animals/**, HttpMethod.POST,/api/animals/mark-adopted, HttpMethod.POST,/api/animals/mark-pending, HttpMethod.POST,/api/animals, /uploads/**, HttpMethod.GET,/api/missing-pets/**, HttpMethod.POST,/api/missing-pets, /api/users/*/photo/public
- All other requests require JWT Bearer token
- CORS is configured in SecurityConfig

## 🌐 API Endpoints

### ActivityLogController

| Method | Path                                             | Auth      | Description |
| ------ | ------------------------------------------------ | --------- | ----------- |
| GET    | /api/admin/activity-logs/api/admin/activity-logs | Yes (JWT) |             |
| GET    | /api/admin/activity-logs                         | Yes (JWT) | Get Recent  |
| GET    | /api/admin/activity-logs/by-user                 | Yes (JWT) | Get By User |

### AdminUserController

| Method | Path                             | Auth      | Description |
| ------ | -------------------------------- | --------- | ----------- |
| GET    | /api/admin/users/api/admin/users | Yes (JWT) |             |
| POST   | /api/admin/users                 | Yes (JWT) | Create User |

### AdoptionController

| Method | Path                       | Auth      | Description   |
| ------ | -------------------------- | --------- | ------------- |
| GET    | /api/adoption/api/adoption | Yes (JWT) |               |
| POST   | /api/adoption              | Yes (JWT) | Create        |
| GET    | /api/adoption              | Yes (JWT) | Get All       |
| GET    | /api/adoption/my-requests  | Yes (JWT) | My Requests   |
| GET    | /api/adoption/{id}         | Yes (JWT) | Get One       |
| PATCH  | /api/adoption/{id}/status  | Yes (JWT) | Update Status |
| DELETE | /api/adoption/{id}         | Yes (JWT) | Cancel        |

### AnimalController

| Method | Path                      | Auth      | Description  |
| ------ | ------------------------- | --------- | ------------ |
| GET    | /api/animals/api/animals  | Yes (JWT) |              |
| GET    | /api/animals              | Yes (JWT) | Get All      |
| GET    | /api/animals/{id}         | Yes (JWT) | Get One      |
| POST   | /api/animals              | Yes (JWT) | Create       |
| PUT    | /api/animals/{id}         | Yes (JWT) | Update       |
| DELETE | /api/animals/{id}         | Yes (JWT) | Delete       |
| POST   | /api/animals/mark-adopted | Yes (JWT) | Mark Adopted |
| POST   | /api/animals/mark-pending | Yes (JWT) | Mark Pending |

### AuthController

| Method | Path                       | Auth      | Description     |
| ------ | -------------------------- | --------- | --------------- |
| GET    | /api/auth/api/auth         | Yes (JWT) |                 |
| POST   | /api/auth/forgot-password  | Yes (JWT) | Forgot Password |
| POST   | /api/auth/verify-otp       | Yes (JWT) | Verify Otp      |
| POST   | /api/auth/reset-password   | Yes (JWT) | Reset Password  |
| POST   | /api/auth/login            | Yes (JWT) | Login           |
| POST   | /api/auth/register         | Yes (JWT) | Register        |
| GET    | /api/auth/id-file/{userId} | Yes (JWT) | Get Id File     |
| POST   | /api/auth/logout           | Yes (JWT) | Logout          |
| GET    | /api/auth/me               | Yes (JWT) | Me              |

### MissingPetController

| Method | Path                                 | Auth      | Description     |
| ------ | ------------------------------------ | --------- | --------------- |
| GET    | /api/missing-pets/api/missing-pets   | Yes (JWT) |                 |
| GET    | /api/missing-pets                    | Yes (JWT) | Get Approved    |
| GET    | /api/missing-pets/admin/all          | Yes (JWT) | Get All         |
| POST   | /api/missing-pets                    | Yes (JWT) | Report          |
| PUT    | /api/missing-pets/admin/{id}/approve | Yes (JWT) | Approve         |
| PUT    | /api/missing-pets/admin/{id}/reject  | Yes (JWT) | Reject          |
| PUT    | /api/missing-pets/admin/{id}         | Yes (JWT) | Admin Update    |
| PUT    | /api/missing-pets/{id}               | Yes (JWT) | Update          |
| DELETE | /api/missing-pets/admin/{id}         | Yes (JWT) | Delete          |
| PUT    | /api/missing-pets/{id}/resolve       | Yes (JWT) | Resolve By User |

### PetCommentController

| Method | Path                                                                 | Auth      | Description    |
| ------ | -------------------------------------------------------------------- | --------- | -------------- |
| GET    | /api/missing-pets/{petId}/comments/api/missing-pets/{petId}/comments | Yes (JWT) |                |
| GET    | /api/missing-pets/{petId}/comments                                   | Yes (JWT) | Get Comments   |
| POST   | /api/missing-pets/{petId}/comments                                   | Yes (JWT) | Add Comment    |
| DELETE | /api/missing-pets/{petId}/comments/{commentId}                       | Yes (JWT) | Delete Comment |

### RehomeController

| Method | Path                    | Auth      | Description   |
| ------ | ----------------------- | --------- | ------------- |
| GET    | /api/rehome/api/rehome  | Yes (JWT) |               |
| POST   | /api/rehome             | Yes (JWT) | Create        |
| GET    | /api/rehome             | Yes (JWT) | Get All       |
| GET    | /api/rehome/my-requests | Yes (JWT) | My Requests   |
| GET    | /api/rehome/{id}        | Yes (JWT) | Get One       |
| PATCH  | /api/rehome/{id}/status | Yes (JWT) | Update Status |
| DELETE | /api/rehome/{id}        | Yes (JWT) | Cancel        |

### SurveyController

| Method | Path                     | Auth      | Description |
| ------ | ------------------------ | --------- | ----------- |
| GET    | /api/surveys/api/surveys | Yes (JWT) |             |
| POST   | /api/surveys             | Yes (JWT) | Create      |
| GET    | /api/surveys             | Yes (JWT) | Get All     |
| GET    | /api/surveys/my-surveys  | Yes (JWT) | My Surveys  |
| GET    | /api/surveys/{id}        | Yes (JWT) | Get One     |

### UserController

| Method | Path                         | Auth      | Description      |
| ------ | ---------------------------- | --------- | ---------------- |
| GET    | /api/users/api/users         | Yes (JWT) |                  |
| GET    | /api/users/{id}              | Yes (JWT) | Get User         |
| PUT    | /api/users/{id}              | Yes (JWT) | Update User      |
| PUT    | /api/users/{id}/password     | Yes (JWT) | Change Password  |
| PUT    | /api/users/{id}/id-file      | Yes (JWT) | Upload Id File   |
| GET    | /api/users/{id}/photo        | Yes (JWT) | Get Photo        |
| GET    | /api/users/{id}/id-file      | Yes (JWT) | Get Id File      |
| GET    | /api/users/{id}/photo/public | Yes (JWT) | Get Photo Public |

## 🗄️ Data Flow

```
HTTP Request
   └─► JwtAuthenticationFilter   (validates Bearer token)
         └─► Spring Security      (sets auth context)
               └─► @RestController (handles route)
                     └─► @Service  (business logic)
                           └─► @Repository / JPA (DB query)
                                 └─► JSON Response
```

## ⚙️ Configuration

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.jpa.properties.hibernate.default_schema=springboot
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5434/pawster_db}
spring.datasource.username=user
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver
jwt.secret=Zm9ydHktdHdvLWlzLXRoZS1hbnN3ZXItdG8tbGlmZS10aGUtdW5pdmVyc2UtYW5kLWV2ZXJ5dGhpbmc=
jwt.expiration=86400000
```

## 🗃️ Database Entities

- `AnimalRequest`
- `ActivityLog`
- `AdoptionRequest`
- `Animal`
- `MissingPet`
- `PetComment`
- `RehomeRequest`
- `Survey`
- `User`


## 📂 File Tree

```
sb/
├── src/main/java/com/pawstar/pawster/
│   ├── PawsterApplication.java
│   ├── config/
│   │   └── WebConfig.java
│   ├── controller/
│   │   ├── ActivityLogController.java
│   │   ├── AdminUserController.java
│   │   ├── AdoptionController.java
│   │   ├── AnimalController.java
│   │   ├── AuthController.java
│   │   ├── MissingPetController.java
│   │   ├── PetCommentController.java
│   │   ├── RehomeController.java
│   │   ├── SurveyController.java
│   │   └── UserController.java
│   ├── dto/
│   │   ├── AdoptionRequestDto.java
│   │   ├── AnimalRequest.java
│   │   ├── LoginRequest.java
│   │   ├── PetCommentRequest.java
│   │   └── SignupRequest.java
│   ├── model/
│   │   ├── ActivityLog.java
│   │   ├── AdoptionRequest.java
│   │   ├── Animal.java
│   │   ├── MissingPet.java
│   │   ├── PetComment.java
│   │   ├── RehomeRequest.java
│   │   ├── Survey.java
│   │   └── User.java
│   ├── repository/
│   │   ├── ActivityLogRepository.java
│   │   ├── AdoptionRepository.java
│   │   ├── AnimalRepository.java
│   │   ├── MissingPetRepository.java
│   │   ├── PetCommentRepository.java
│   │   ├── RehomeRepository.java
│   │   ├── SurveyRepository.java
│   │   └── UserRepository.java
│   ├── security/
│   │   ├── CustomUserDetailsService.java
│   │   ├── DataInitializer.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── JwtUtils.java
│   │   └── SecurityConfig.java
│   └── service/
│       ├── ActivityLogService.java
│       ├── AdoptionService.java
│       ├── AnimalService.java
│       ├── EmailService.java
│       ├── MissingPetService.java
│       ├── PetCommentService.java
│       ├── RehomeService.java
│       └── SurveyService.java
├── src/main/resources/
│   ├── application.properties
│   └── db/
│       └── migration/
│           ├── V1__create_user_table.sql
│           ├── V2__pawster_animals_and_requests.sql
│           ├── V3__missing_pets.sql
│           ├── V4__add_pet_comments_table.sql
│           └── V5__resolved_by_user_column_for_missings.sql
```

<!-- AUTO:END -->

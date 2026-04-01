# PAWSTER — SB Backend

## 📁 File Structure

<!-- AUTO:START -->
> 🤖 **Auto-generated file tree** — last updated: 2026-04-01 13:40:58 UTC
> Run `node scripts/generate-readme.js sb` to refresh.

```
sb/
├── src/main/java/com/pawstar/pawster/
│   ├── PawsterApplication.java   # Main Spring Boot entry point
│   ├── config/
│   │   └── WebConfig.java   # CORS and web configuration
│   ├── controller/
│   │   ├── ActivityLogController.java   # Activity log endpoints
│   │   ├── AdminUserController.java   # Admin user management endpoints
│   │   ├── AdoptionController.java   # Adoption request endpoints
│   │   ├── AnimalController.java   # Animal listing CRUD endpoints
│   │   ├── AuthController.java   # Auth endpoints (register/login/logout/verify)
│   │   ├── MissingPetController.java   # Missing pet report endpoints
│   │   ├── RehomeController.java   # Rehoming request endpoints
│   │   ├── SurveyController.java   # Post-adoption survey endpoints
│   │   └── UserController.java   # User profile endpoints
│   ├── dto/
│   │   ├── AdoptionRequestDto.java
│   │   ├── AnimalRequest.java
│   │   ├── LoginRequest.java
│   │   └── SignupRequest.java
│   ├── model/
│   │   ├── ActivityLog.java
│   │   ├── AdoptionRequest.java
│   │   ├── Animal.java
│   │   ├── MissingPet.java
│   │   ├── RehomeRequest.java
│   │   ├── Survey.java
│   │   └── User.java
│   ├── repository/
│   │   ├── ActivityLogRepository.java
│   │   ├── AdoptionRepository.java
│   │   ├── AnimalRepository.java
│   │   ├── MissingPetRepository.java
│   │   ├── RehomeRepository.java
│   │   ├── SurveyRepository.java
│   │   └── UserRepository.java
│   ├── security/
│   │   ├── CustomUserDetailsService.java   # Loads user from DB for Spring Security
│   │   ├── DataInitializer.java   # Seeds default admin/data on startup
│   │   ├── JwtAuthenticationFilter.java   # Validates JWT on every request
│   │   ├── JwtUtils.java   # JWT generation and validation
│   │   └── SecurityConfig.java   # Spring Security filter chain
│   └── service/
│       ├── ActivityLogService.java
│       ├── AdoptionService.java
│       ├── AnimalService.java
│       ├── EmailService.java
│       ├── MissingPetService.java
│       ├── RehomeService.java
│       └── SurveyService.java
```
<!-- AUTO:END -->

// AuthController.java — FULL FILE

package com.pawstar.pawster.controller;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.pawstar.pawster.model.ActivityLog;
import com.pawstar.pawster.model.User;
import com.pawstar.pawster.repository.ActivityLogRepository;
import com.pawstar.pawster.repository.UserRepository;
import com.pawstar.pawster.security.JwtUtils;
import com.pawstar.pawster.service.EmailService;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String ADMIN_EMAIL    = "admin@pawster.com";
    private static final String ADMIN_PASSWORD = "admin123";

    private static final List<String> ALLOWED_MIME_TYPES =
            List.of("image/jpeg", "image/png", "application/pdf");
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    @Value("${google.client.id:placeholder}")
    private String googleClientId;

    @Autowired private AuthenticationManager  authenticationManager;
    @Autowired private UserRepository         userRepository;
    @Autowired private PasswordEncoder        encoder;
    @Autowired private JwtUtils               jwtUtils;
    @Autowired private EmailService           emailService;
    @Autowired private ActivityLogRepository  activityLogRepository;

    // ── Cookie helpers ────────────────────────────────────────────────────────

    private void addJwtCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(Duration.ofMillis(jwtExpirationMs))
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearJwtCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(Duration.ZERO)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // ── Activity log helper ───────────────────────────────────────────────────

    private void logLogin(String userName, Integer userId, String details) {
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("Login");
            log.setDetails(details);
            log.setUserName(userName);
            log.setUserId(userId);
            activityLogRepository.save(log);
        } catch (Exception e) {
            // non-fatal
        }
    }

    // =========================================================================
    // POST /api/auth/login
    // =========================================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestParam("email")    String email,
            @RequestParam("password") String password,
            HttpServletResponse response) {

        email    = email    == null ? "" : email.trim();
        password = password == null ? "" : password;

        if (email.isEmpty() || password.isEmpty())
            return bad("Please enter both email and password.");

        // Static admin shortcut
        if (ADMIN_EMAIL.equals(email) && ADMIN_PASSWORD.equals(password)) {
            String jwt = jwtUtils.generateToken(ADMIN_EMAIL, "admin");
            addJwtCookie(response, jwt);
            logLogin("Admin", null, "Admin logged in");
            return ResponseEntity.ok(Map.of(
                    "success",         true,
                    "message",         "Admin login successful!",
                    "role",            "admin",
                    "token",           jwt,
                    "profileComplete", true,
                    "redirect",        "php/admin_dashboard.php"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false,
                            "message", "No account found with this email."));

        if (!encoder.matches(password, user.getPassword()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid password."));

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Authentication failed."));
        }

        String jwt      = jwtUtils.generateToken(user.getEmail(), user.getRole());
        String redirect = "admin".equals(user.getRole())
                ? "php/admin_dashboard.php"
                : "php/index.php";

        addJwtCookie(response, jwt);
        logLogin(
            user.getFirstName() + " " + user.getLastName(),
            user.getId(),
            user.getRole() + " logged in");
        return ResponseEntity.ok(toDtoNoToken(user, redirect, jwt));
    }

    // =========================================================================
    // POST /api/auth/register
    // =========================================================================
    @PostMapping(value = "/register", consumes = "multipart/form-data")
    public ResponseEntity<?> register(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName")  String lastName,
            @RequestParam("email")     String email,
            @RequestParam("phone")     String phone,
            @RequestParam("password")  String password,
            @RequestParam("address")   String address,
            @RequestParam("city")      String city,
            @RequestParam("province")  String province,
            @RequestParam("zip")       String zip,
            @RequestParam("idFile")    MultipartFile idFile,
            HttpServletResponse response) {

        if (isBlank(firstName) || isBlank(lastName) || isBlank(email) ||
                isBlank(phone) || isBlank(password) || isBlank(address) ||
                isBlank(city)  || isBlank(province)  || isBlank(zip))
            return bad("All required fields must be filled.");

        if (!email.trim().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))
            return bad("Invalid email format.");

        if (password.length() < 8)
            return bad("Password must be at least 8 characters long.");

        if (userRepository.findByEmail(email.trim()).isPresent())
            return bad("Email already registered.");

        if (idFile == null || idFile.isEmpty())
            return bad("ID file is required.");

        if (idFile.getSize() > MAX_FILE_SIZE)
            return bad("File must be under 5MB.");

        String contentType = idFile.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType))
            return bad("Invalid file type. Allowed: PDF, JPG, PNG.");

        byte[] fileBytes;
        try {
            fileBytes = idFile.getBytes();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to read ID file."));
        }

        User user = new User(
                firstName.trim(), lastName.trim(), email.trim(),
                phone.trim(), encoder.encode(password),
                address.trim(), city.trim(), province.trim(),
                zip.trim(), fileBytes, contentType,
                idFile.getOriginalFilename());

        // Normal registration = profile is complete
        user.setProfileComplete(true);
        userRepository.save(user);

        String jwt = jwtUtils.generateToken(user.getEmail(), user.getRole());
        addJwtCookie(response, jwt);

        Map<String, Object> dto = toDto(user);
        dto.put("success", true);
        dto.put("message", "Registration successful!");
        dto.put("token",   jwt);
        return ResponseEntity.ok(dto);
    }

    // =========================================================================
    // POST /api/auth/google
    // =========================================================================
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(
            @RequestBody Map<String, String> request,
            HttpServletResponse response) {

        String idTokenString = request.get("token");
        if (isBlank(idTokenString))
            return bad("Google ID token is required.");

        GoogleIdToken idToken;
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            idToken = verifier.verify(idTokenString);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Token verification failed."));
        }

        if (idToken == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid Google ID token."));

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email     = payload.getEmail();
        String firstName = (String) payload.get("given_name");
        String lastName  = (String) payload.get("family_name");

        if (isBlank(firstName)) firstName = email.split("@")[0];
        if (isBlank(lastName))  lastName  = "";

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Brand-new Google user — profileComplete stays false
            user = new User(
                    firstName, lastName, email,
                    /*phone*/      "",
                    /*password*/   encoder.encode(UUID.randomUUID().toString()),
                    /*address*/    "",
                    /*city*/       "",
                    /*province*/   "",
                    /*zip*/        "",
                    /*idFile*/     null,
                    /*idFileType*/ null,
                    /*idFileName*/ null);
            user.setProfileComplete(false);  // ← must complete profile
            userRepository.save(user);
        }
        // Existing Google user — profileComplete stays as whatever it was in DB

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String jwt      = jwtUtils.generateToken(user.getEmail(), user.getRole());
        String redirect = "admin".equals(user.getRole())
                ? "php/admin_dashboard.php"
                : "php/index.php";

        addJwtCookie(response, jwt);
        logLogin(
            user.getFirstName() + " " + user.getLastName(),
            user.getId(),
            "Google login");
        return ResponseEntity.ok(toDtoNoToken(user, redirect, jwt));
    }

    // =========================================================================
    // PUT /api/auth/complete-profile   ← NEW
    // =========================================================================

@PutMapping(value = "/complete-profile", consumes = "multipart/form-data")
public ResponseEntity<?> completeProfile(
        @RequestParam("phone")    String phone,
        @RequestParam("address")  String address,
        @RequestParam("city")     String city,
        @RequestParam("province") String province,
        @RequestParam("zip")      String zip,
        @RequestParam("idFile")   MultipartFile idFile) {

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()
            || "anonymousUser".equals(auth.getPrincipal())) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("success", false, "message", "Not authenticated."));
    }

    String callerEmail = auth.getName();
    User user = userRepository.findByEmail(callerEmail).orElse(null);
    if (user == null)
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("success", false, "message", "User not found."));

    phone    = phone    == null ? "" : phone.trim();
    address  = address  == null ? "" : address.trim();
    city     = city     == null ? "" : city.trim();
    province = province == null ? "" : province.trim();
    zip      = zip      == null ? "" : zip.trim();

    if (phone.isEmpty())    return bad("Phone number is required.");
    if (address.isEmpty())  return bad("Address is required.");
    if (city.isEmpty())     return bad("City is required.");
    if (province.isEmpty()) return bad("Province is required.");
    if (zip.isEmpty())      return bad("Zip code is required.");
    if (!phone.matches("^(09\\d{9}|\\+639\\d{9})$"))
        return bad("Enter a valid PH number (e.g. 09171234567).");

    // ── ID file validation ──────────────────────────────────────────────
    if (idFile == null || idFile.isEmpty())
        return bad("A government-issued ID is required.");
    if (idFile.getSize() > MAX_FILE_SIZE)
        return bad("File must be under 5 MB.");
    String contentType = idFile.getContentType();
    if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType))
        return bad("Invalid file type. Allowed: PDF, JPG, PNG.");

    byte[] fileBytes;
    try {
        fileBytes = idFile.getBytes();
    } catch (IOException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Failed to read ID file."));
    }

    user.setPhone(phone);
    user.setAddress(address);
    user.setCity(city);
    user.setProvince(province);
    user.setZip(zip);
    user.setIdFile(fileBytes);
    user.setIdFileType(contentType);
    user.setIdFileName(idFile.getOriginalFilename());
    user.setProfileComplete(true);
    userRepository.save(user);

    Map<String, Object> dto = toDto(user);
    dto.put("success", true);
    dto.put("message", "Profile completed successfully!");
    return ResponseEntity.ok(dto);
}
    // =========================================================================
    // GET /api/auth/id-file/{userId}
    // =========================================================================
    @GetMapping("/id-file/{userId}")
    public ResponseEntity<byte[]> getIdFile(@PathVariable Integer userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getIdFile() == null)
            return ResponseEntity.notFound().build();

        String mime     = user.getIdFileType()  != null ? user.getIdFileType()  : "application/octet-stream";
        String filename = user.getIdFileName() != null ? user.getIdFileName() : "id_file";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mime))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + filename + "\"")
                .body(user.getIdFile());
    }

    // =========================================================================
    // POST /api/auth/logout
    // =========================================================================
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        clearJwtCookie(response);
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out"));
    }

    // =========================================================================
    // GET /api/auth/me
    // =========================================================================
    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String email = auth.getName();

        if (ADMIN_EMAIL.equals(email))
            return ResponseEntity.ok(Map.of(
                    "email",           ADMIN_EMAIL,
                    "firstName",       "Admin",
                    "lastName",        "",
                    "role",            "admin",
                    "status",          "active",
                    "isActive",        true,
                    "profileComplete", true));

        return userRepository.findByEmail(email)
                .map(u -> ResponseEntity.ok((Object) toDto(u)))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // =========================================================================
    // POST /api/auth/forgot-password
    // =========================================================================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (isBlank(email)) return bad("Email is required.");

        userRepository.findByEmail(email.trim()).ifPresent(user -> {
            String otp = String.format("%06d", new java.util.Random().nextInt(999999));
            user.setResetOtp(otp);
            user.setResetOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
            user.setResetOtpVerified(false);
            userRepository.save(user);
            emailService.sendOtpEmail(email.trim(), otp);
        });

        return ResponseEntity.ok(Map.of("success", true,
                "message", "If that email exists, an OTP has been sent."));
    }

    // =========================================================================
    // POST /api/auth/verify-otp
    // =========================================================================
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp   = body.get("otp");
        if (isBlank(email) || isBlank(otp))
            return bad("Email and OTP are required.");

        User user = userRepository.findByEmail(email.trim()).orElse(null);
        if (user == null || !otp.equals(user.getResetOtp()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid OTP."));

        if (user.getResetOtpExpiresAt().isBefore(LocalDateTime.now())) {
            user.setResetOtp(null);
            user.setResetOtpExpiresAt(null);
            userRepository.save(user);
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(Map.of("success", false,
                            "message", "OTP has expired. Please request a new one."));
        }

        user.setResetOtpVerified(true);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "OTP verified."));
    }

    // =========================================================================
    // POST /api/auth/reset-password
    // =========================================================================
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email       = body.get("email");
        String newPassword = body.get("newPassword");
        if (isBlank(email) || isBlank(newPassword))
            return bad("Email and new password are required.");
        if (newPassword.length() < 8)
            return bad("Password must be at least 8 characters.");

        User user = userRepository.findByEmail(email.trim()).orElse(null);
        if (user == null || !user.isResetOtpVerified())
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "OTP not verified."));

        user.setPassword(encoder.encode(newPassword));
        user.setResetOtp(null);
        user.setResetOtpExpiresAt(null);
        user.setResetOtpVerified(false);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true,
                "message", "Password reset successfully."));
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private ResponseEntity<?> bad(String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", message));
    }

    private Map<String, Object> toDto(User u) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id",              u.getId());
        dto.put("firstName",       u.getFirstName());
        dto.put("lastName",        u.getLastName()   != null ? u.getLastName()   : "");
        dto.put("email",           u.getEmail());
        dto.put("phone",           u.getPhone()      != null ? u.getPhone()      : "");
        dto.put("address",         u.getAddress()    != null ? u.getAddress()    : "");
        dto.put("city",            u.getCity()       != null ? u.getCity()       : "");
        dto.put("province",        u.getProvince()   != null ? u.getProvince()   : "");
        dto.put("zip",             u.getZip()        != null ? u.getZip()        : "");
        dto.put("role",            u.getRole());
        dto.put("status",          u.getStatus());
        dto.put("isActive",        u.getIsActive());
        dto.put("idFileName",      u.getIdFileName() != null ? u.getIdFileName() : "");
        dto.put("photoUrl",        u.getPhoto()      != null
                                       ? "/api/users/" + u.getId() + "/photo" : "");
        dto.put("createdAt",       u.getCreatedAt());
        dto.put("profileComplete", u.isProfileComplete());  // ← included in every response
        return dto;
    }

    private Map<String, Object> toDtoNoToken(User u, String redirect, String jwt) {
        Map<String, Object> dto = toDto(u);
        dto.put("success",  true);
        dto.put("redirect", redirect);
        dto.put("message",  "Login successful!");
        dto.put("token",    jwt);
        return dto;
    }
}
package com.pawstar.pawster.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import com.pawstar.pawster.model.User;
import com.pawstar.pawster.repository.UserRepository;
import com.pawstar.pawster.security.JwtUtils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // ── Static admin (mirrors PHP hardcoded check) ───────────────────────────
    private static final String ADMIN_EMAIL    = "admin@pawster.com";
    private static final String ADMIN_PASSWORD = "admin123";

    // ── File upload constraints ──────────────────────────────────────────────
    private static final List<String> ALLOWED_MIME_TYPES =
            List.of("image/jpeg", "image/png", "application/pdf");
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5 MB

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository        userRepository;
    @Autowired private PasswordEncoder       encoder;
    @Autowired private JwtUtils              jwtUtils;

    // ── Cookie helpers ───────────────────────────────────────────────────────

    private Cookie buildJwtCookie(String token) {
        Cookie c = new Cookie("jwt", token);
        c.setHttpOnly(true);
        c.setPath("/");
        c.setMaxAge(jwtExpirationMs / 1000);
        // c.setSecure(true); // enable in production (HTTPS)
        return c;
    }

    private Cookie expiredJwtCookie() {
        Cookie c = new Cookie("jwt", "");
        c.setHttpOnly(true);
        c.setPath("/");
        c.setMaxAge(0);
        return c;
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

        if (email.isEmpty() || password.isEmpty()) {
            return bad("Please enter both email and password.");
        }

        // Static admin shortcut
        if (ADMIN_EMAIL.equals(email) && ADMIN_PASSWORD.equals(password)) {
            String jwt = jwtUtils.generateToken(ADMIN_EMAIL);
            response.addCookie(buildJwtCookie(jwt));
            return ResponseEntity.ok(Map.of(
                    "success",  true,
                    "message",  "Admin login successful!",
                    "role",     "admin",
                    "redirect", "php/admin_dashboard.php"
            ));
        }

        // Look up by email
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false,
                                 "message", "No account found with this email."));
        }

        // BCrypt verify
        if (!encoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid password."));
        }

        // Update last_login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Authentication failed."));
        }

        String redirect = "admin".equals(user.getRole())
                ? "php/admin_dashboard.php"
                : "php/index.php";

        String jwt = jwtUtils.generateToken(user.getEmail());
        response.addCookie(buildJwtCookie(jwt));

        return ResponseEntity.ok(Map.of(
                "success",   true,
                "message",   "Login successful!",
                "role",      user.getRole(),
                "redirect",  redirect,
                "email",     user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName",  user.getLastName() != null ? user.getLastName() : "",
                "status",    user.getStatus()
        ));
    }

    // =========================================================================
    // POST /api/auth/register
    // File bytes are read with idFile.getBytes() and stored directly in the DB.
    // No folder, no disk path — everything lives in the users table.
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

        // 1. Required fields
        if (isBlank(firstName) || isBlank(lastName) || isBlank(email)   ||
            isBlank(phone)     || isBlank(password)  || isBlank(address) ||
            isBlank(city)      || isBlank(province)  || isBlank(zip)) {
            return bad("All required fields must be filled.");
        }

        // 2. Email format
        if (!email.trim().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return bad("Invalid email format.");
        }

        // 3. Password length
        if (password.length() < 8) {
            return bad("Password must be at least 8 characters long.");
        }

        // 4. Duplicate email
        if (userRepository.findByEmail(email.trim()).isPresent()) {
            return bad("Email already registered.");
        }

        // 5. File presence
        if (idFile == null || idFile.isEmpty()) {
            return bad("ID file is required.");
        }

        // 6. File size
        if (idFile.getSize() > MAX_FILE_SIZE) {
            return bad("File must be under 5MB.");
        }

        // 7. MIME type
        String contentType = idFile.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            return bad("Invalid file type. Allowed: PDF, JPG, PNG.");
        }

        // 8. Read bytes — store directly in DB, no folder needed
        byte[] fileBytes;
        try {
            fileBytes = idFile.getBytes();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to read ID file."));
        }

        // 9. Persist user with file bytes embedded
        User user = new User(
                firstName.trim(), lastName.trim(), email.trim(),
                phone.trim(),     encoder.encode(password),
                address.trim(),   city.trim(), province.trim(),
                zip.trim(),
                fileBytes,
                contentType,
                idFile.getOriginalFilename()
        );
        userRepository.save(user);

        String jwt = jwtUtils.generateToken(user.getEmail());
        response.addCookie(buildJwtCookie(jwt));

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Registration successful!",
                "email",   user.getEmail()
        ));
    }

    // =========================================================================
    // GET /api/auth/id-file/{userId}
    // Serves the stored ID file back as a download/preview.
    // =========================================================================
    @GetMapping("/id-file/{userId}")
    public ResponseEntity<byte[]> getIdFile(@PathVariable Integer userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getIdFile() == null) {
            return ResponseEntity.notFound().build();
        }

        String mime     = user.getIdFileType()  != null ? user.getIdFileType()  : "application/octet-stream";
        String filename = user.getIdFileName()  != null ? user.getIdFileName()  : "id_file";

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
        response.addCookie(expiredJwtCookie());
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out"));
    }

    // =========================================================================
    // GET /api/auth/me
    // =========================================================================
    @GetMapping("/me")
public ResponseEntity<?> me() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()
            || "anonymousUser".equals(auth.getPrincipal())) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    String email = auth.getName();

    // Static admin is not in the DB — handle separately
    if (ADMIN_EMAIL.equals(email)) {
        return ResponseEntity.ok(Map.of(
            "email",     ADMIN_EMAIL,
            "firstName", "Admin",
            "lastName",  "",
            "role",      "admin",
            "status",    "active",
            "isActive",  true
        ));
    }

    return userRepository.findByEmail(email)
            .map(u -> ResponseEntity.ok(Map.of(
                    "email",     u.getEmail(),
                    "firstName", u.getFirstName(),
                    "lastName",  u.getLastName() != null ? u.getLastName() : "",
                    "role",      u.getRole(),
                    "status",    u.getStatus(),
                    "isActive",  u.getIsActive()
            )))
            .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
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
}
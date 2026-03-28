package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.User;
import com.pawstar.pawster.repository.UserRepository;
import com.pawstar.pawster.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    @Autowired private UserRepository  userRepository;
    @Autowired private PasswordEncoder encoder;
    @Autowired private EmailService    emailService;

    private static final String CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {

        System.out.println("✅ AdminUserController hit");
        System.out.println("Body received: " + body);

        String firstName = body.getOrDefault("firstName", "").trim();
        String lastName  = body.getOrDefault("lastName",  "").trim();
        String email     = body.getOrDefault("email",     "").trim();
        String phone     = body.getOrDefault("phone",     "").trim();
        String role      = body.getOrDefault("role",      "user").trim().toLowerCase();

        // ── Validation ───────────────────────────────────────────────────────
        if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty() || phone.isEmpty()) {
            return bad("firstName, lastName, email and phone are required.");
        }
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return bad("Invalid email format.");
        }
        if (!phone.matches("^09\\d{9}$")) {
            return bad("Invalid PH phone number (e.g. 09123456789).");
        }
        if (!role.equals("user") && !role.equals("admin")) {
            return bad("Role must be 'user' or 'admin'.");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return bad("Email already registered.");
        }

        // ── Generate random password ─────────────────────────────────────────
        String plainPassword = generatePassword(12);
        System.out.println("Generated password for " + email + ": " + plainPassword);

        // ── Persist ──────────────────────────────────────────────────────────
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(encoder.encode(plainPassword));  // ✅ BCrypt hashed
        user.setRole(role);
        user.setStatus("approved");
        user.setIsActive(1);
        userRepository.save(user);

        System.out.println("✅ User saved to DB with id: " + user.getId());

        // ── Email credentials ─────────────────────────────────────────────────
        emailService.sendWelcomeEmail(email, firstName, role, plainPassword);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "User created and credentials emailed to " + email,
                "userId",  user.getId()
        ));
    }

    // ── Random password generator ─────────────────────────────────────────────
    private String generatePassword(int length) {
        SecureRandom rng = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        sb.append(pickFrom("ABCDEFGHJKLMNPQRSTUVWXYZ", rng));
        sb.append(pickFrom("abcdefghjkmnpqrstuvwxyz",  rng));
        sb.append(pickFrom("23456789",                  rng));
        sb.append(pickFrom("!@#$",                      rng));
        for (int i = 4; i < length; i++) {
            sb.append(CHARS.charAt(rng.nextInt(CHARS.length())));
        }
        char[] arr = sb.toString().toCharArray();
        for (int i = arr.length - 1; i > 0; i--) {
            int j = rng.nextInt(i + 1);
            char tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return new String(arr);
    }

    private char pickFrom(String pool, SecureRandom rng) {
        return pool.charAt(rng.nextInt(pool.length()));
    }

    private ResponseEntity<?> bad(String msg) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", msg));
    }
}
package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.User;
import com.pawstar.pawster.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final List<String> ALLOWED_IMAGE_TYPES =
            List.of("image/jpeg", "image/png", "image/webp");
    private static final List<String> ALLOWED_ID_TYPES =
            List.of("image/jpeg", "image/png", "application/pdf");
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5 MB

    @Autowired private UserRepository  userRepository;
    @Autowired private PasswordEncoder encoder;

    // ── resolve "me" or a numeric id, and verify caller owns the record ──────
    private User resolveAndAuthorise(String idParam) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String callerEmail = auth.getName();

        if ("me".equals(idParam)) {
            return userRepository.findByEmail(callerEmail).orElse(null);
        }

        try {
            int id = Integer.parseInt(idParam);
            User user = userRepository.findById(id).orElse(null);
            if (user == null) return null;
            // allow access only if caller owns the record or is admin
            boolean isAdmin = userRepository.findByEmail(callerEmail)
                    .map(u -> "admin".equals(u.getRole())).orElse(false);
            if (!callerEmail.equals(user.getEmail()) && !isAdmin) return null;
            return user;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // =========================================================================
    // GET /api/users/{id}
    // =========================================================================
    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        User user = resolveAndAuthorise(id);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return ResponseEntity.ok(toDto(user));
    }

    // =========================================================================
    // PUT /api/users/{id}   — update profile info + optional photo
    // =========================================================================
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateUser(
            @PathVariable String id,
            @RequestParam(value = "firstName",  required = false) String firstName,
            @RequestParam(value = "lastName",   required = false) String lastName,
            @RequestParam(value = "email",      required = false) String email,
            @RequestParam(value = "phone",      required = false) String phone,
            @RequestParam(value = "address",    required = false) String address,
            @RequestParam(value = "city",       required = false) String city,
            @RequestParam(value = "province",   required = false) String province,
            @RequestParam(value = "zip",        required = false) String zip,
            @RequestParam(value = "photo",      required = false) MultipartFile photo) {

        User user = resolveAndAuthorise(id);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        // Update text fields if provided
        if (firstName != null && !firstName.isBlank()) user.setFirstName(firstName.trim());
        if (lastName  != null && !lastName.isBlank())  user.setLastName(lastName.trim());
        if (phone     != null && !phone.isBlank())     user.setPhone(phone.trim());
        if (address   != null)                         user.setAddress(address.trim());
        if (city      != null)                         user.setCity(city.trim());
        if (province  != null)                         user.setProvince(province.trim());
        if (zip       != null)                         user.setZip(zip.trim());

        // Email change — check for duplicates
        if (email != null && !email.isBlank() && !email.trim().equals(user.getEmail())) {
            if (userRepository.findByEmail(email.trim()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Email already in use."));
            }
            user.setEmail(email.trim());
        }

        // Photo upload
        if (photo != null && !photo.isEmpty()) {
            if (photo.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Photo must be under 5 MB."));
            }
            String mime = photo.getContentType();
            if (mime == null || !ALLOWED_IMAGE_TYPES.contains(mime)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Photo must be JPG, PNG, or WEBP."));
            }
            try {
                user.setPhoto(photo.getBytes());
                user.setPhotoType(mime);
                user.setPhotoName(photo.getOriginalFilename());
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("success", false, "message", "Failed to read photo."));
            }
        }

        userRepository.save(user);
        return ResponseEntity.ok(toDto(user));
    }

    // =========================================================================
    // PUT /api/users/{id}/password
    // =========================================================================
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        User user = resolveAndAuthorise(id);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String currentPassword = body.getOrDefault("currentPassword", "");
        String newPassword     = body.getOrDefault("newPassword", "");

        if (!encoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Incorrect current password."));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Password must be at least 8 characters."));
        }

        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password updated."));
    }

    // =========================================================================
    // PUT /api/users/{id}/id-file
    // =========================================================================
    @PutMapping(value = "/{id}/id-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadIdFile(
            @PathVariable String id,
            @RequestParam("idFile") MultipartFile idFile) {

        User user = resolveAndAuthorise(id);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (idFile == null || idFile.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "No file provided."));
        }
        if (idFile.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "File must be under 5 MB."));
        }
        String mime = idFile.getContentType();
        if (mime == null || !ALLOWED_ID_TYPES.contains(mime)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Allowed types: PDF, JPG, PNG."));
        }

        try {
            user.setIdFile(idFile.getBytes());
            user.setIdFileType(mime);
            user.setIdFileName(idFile.getOriginalFilename());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to read file."));
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "ID file updated."));
    }

    // =========================================================================
    // GET /api/users/{id}/photo   — serves the photo bytes back to the browser
    // =========================================================================
    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getPhoto(@PathVariable String id) {
        User user = resolveAndAuthorise(id);
        if (user == null || user.getPhoto() == null) {
            return ResponseEntity.notFound().build();
        }
        String mime = user.getPhotoType() != null ? user.getPhotoType() : "image/jpeg";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mime))
                .body(user.getPhoto());
    }

    // =========================================================================
    // DTO — never send password hash or raw file bytes to the client
    // =========================================================================
   private Map<String, Object> toDto(User u) {
    Map<String, Object> dto = new java.util.HashMap<>();
    dto.put("id",         u.getId());
    dto.put("firstName",  u.getFirstName());
    dto.put("lastName",   u.getLastName()   != null ? u.getLastName()   : "");
    dto.put("email",      u.getEmail());
    dto.put("phone",      u.getPhone()      != null ? u.getPhone()      : "");
    dto.put("address",    u.getAddress()    != null ? u.getAddress()    : "");
    dto.put("city",       u.getCity()       != null ? u.getCity()       : "");
    dto.put("province",   u.getProvince()   != null ? u.getProvince()   : "");
    dto.put("zip",        u.getZip()        != null ? u.getZip()        : "");
    dto.put("role",       u.getRole());
    dto.put("status",     u.getStatus());
    dto.put("idFileName", u.getIdFileName() != null ? u.getIdFileName() : "");
    dto.put("photoUrl",   u.getPhoto()      != null
                              ? "/api/users/" + u.getId() + "/photo"
                              : "");
    return dto;
    }
}
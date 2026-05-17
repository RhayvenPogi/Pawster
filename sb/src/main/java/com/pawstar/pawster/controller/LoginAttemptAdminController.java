package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.LoginAttempt;
import com.pawstar.pawster.service.LoginAttemptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/login-attempts")
public class LoginAttemptAdminController {

    @Autowired
    private LoginAttemptService loginAttemptService;

    /** List all permanently locked accounts */
    @GetMapping("/locked")
    public ResponseEntity<?> getLockedAccounts() {
        List<LoginAttempt> locked = loginAttemptService.getPermanentlyLocked();
        return ResponseEntity.ok(Map.of("success", true, "data", locked));
    }

    /** Admin unlocks an account */
    @PostMapping("/unlock")
    public ResponseEntity<?> unlockAccount(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Email is required."));

        boolean unlocked = loginAttemptService.unlockAccount(email.trim());
        if (!unlocked)
            return ResponseEntity.ok(Map.of("success", false,
                    "message", "No lock record found for that email."));

        return ResponseEntity.ok(Map.of("success", true,
                "message", "Account unlocked successfully for " + email));
    }
}
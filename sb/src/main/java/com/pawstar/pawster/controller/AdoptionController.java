package com.pawstar.pawster.controller;

import com.pawstar.pawster.dto.AdoptionRequestDto;
import com.pawstar.pawster.model.AdoptionRequest;
import com.pawstar.pawster.service.AdoptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/adoption")
public class AdoptionController {

    @Autowired
    private AdoptionService adoptionService;

    // POST /api/adoption  — authenticated user submits application
    // Body: { petName, name, email, phone, address, reason, userId }
    @PostMapping
    public ResponseEntity<?> create(@RequestBody AdoptionRequest req) {
        try {
            AdoptionRequestDto saved = adoptionService.create(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return bad(e.getMessage());
        }
    }

    // GET /api/adoption  — ADMIN: all applications, optional ?status=Pending
    @GetMapping
    public List<AdoptionRequestDto> getAll(
            @RequestParam(required = false) String status) {
        return status != null
                ? adoptionService.getByStatus(status)
                : adoptionService.getAll();
    }

    // GET /api/adoption/my-requests?userId=3  — user's own applications
    @GetMapping("/my-requests")
    public List<AdoptionRequestDto> myRequests(@RequestParam Integer userId) {
        return adoptionService.getByUser(userId);
    }

    // GET /api/adoption/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(adoptionService.getById(id));
        } catch (RuntimeException e) {
            return notFound(e.getMessage());
        }
    }

    // PATCH /api/adoption/{id}/status  — ADMIN approve or reject
    // Body: { "status": "Approved", "rejectNote": "optional reason" }
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        try {
            String status     = body.getOrDefault("status", "");
            String rejectNote = body.get("rejectNote");

            if (!List.of("Approved", "Rejected", "Pending").contains(status)) {
                return bad("Status must be Approved, Rejected, or Pending.");
            }

            String adminName = auth != null ? auth.getName() : "admin";
            return ResponseEntity.ok(
                adoptionService.updateStatus(id, status, rejectNote, null, adminName)
            );
        } catch (RuntimeException e) {
            return notFound(e.getMessage());
        }
    }

    // DELETE /api/adoption/{id}  — user cancels their own request
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancel(@PathVariable Integer id) {
        try {
            adoptionService.delete(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Application cancelled."));
        } catch (RuntimeException e) {
            return notFound(e.getMessage());
        }
    }

    private ResponseEntity<?> bad(String msg) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", msg));
    }

    private ResponseEntity<?> notFound(String msg) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", msg));
    }
}
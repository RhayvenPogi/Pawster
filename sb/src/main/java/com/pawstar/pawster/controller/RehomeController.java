package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.RehomeRequest;
import com.pawstar.pawster.service.RehomeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rehome")
public class RehomeController {

    @Autowired
    private RehomeService rehomeService;

    // POST /api/rehome
    @PostMapping
    public ResponseEntity<?> create(@RequestBody RehomeRequest req) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(rehomeService.create(req));
        } catch (RuntimeException e) {
            return bad(e.getMessage());
        }
    }

    // GET /api/rehome?status=Pending  — ADMIN
    @GetMapping
    public List<RehomeRequest> getAll(@RequestParam(required = false) String status) {
        return status != null ? rehomeService.getByStatus(status) : rehomeService.getAll();
    }

    // GET /api/rehome/my-requests?userId=3
    @GetMapping("/my-requests")
    public List<RehomeRequest> myRequests(@RequestParam Integer userId) {
        return rehomeService.getByUser(userId);
    }

    // GET /api/rehome/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(rehomeService.getById(id));
        } catch (RuntimeException e) {
            return notFound(e.getMessage());
        }
    }

    // PATCH /api/rehome/{id}/status  — ADMIN approve/reject
    // Body: { "status": "Approved", "rejectNote": "optional" }
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        try {
            String status     = body.getOrDefault("status", "");
            String rejectNote = body.getOrDefault("rejectNote", null);

            if (!List.of("Approved", "Rejected", "Pending").contains(status)) {
                return bad("Status must be Approved, Rejected, or Pending.");
            }

            String adminName = auth != null ? auth.getName() : "admin";
            return ResponseEntity.ok(
                rehomeService.updateStatus(id, status, rejectNote, null, adminName)
            );
        } catch (RuntimeException e) {
            return notFound(e.getMessage());
        }
    }

    // DELETE /api/rehome/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancel(@PathVariable Integer id) {
        try {
            rehomeService.delete(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Rehome request cancelled."));
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
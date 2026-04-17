package com.pawstar.pawster.controller;

import com.pawstar.pawster.dto.PetCommentRequest;
import com.pawstar.pawster.model.PetComment;
import com.pawstar.pawster.service.PetCommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/missing-pets/{petId}/comments")
public class PetCommentController {

    private final PetCommentService service;

    public PetCommentController(PetCommentService service) {
        this.service = service;
    }

    // GET all comments for a report
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getComments(@PathVariable Long petId) {
        return ResponseEntity.ok(
            service.getComments(petId).stream().map(this::toMap).toList()
        );
    }

    // POST a new comment (authenticated users only)
    @PostMapping
    public ResponseEntity<Map<String, Object>> addComment(
        @PathVariable Long petId,
        @RequestBody PetCommentRequest req
    ) {
        PetComment c = service.addComment(petId, req);
        return ResponseEntity.ok(toMap(c));
    }

    // DELETE a comment (admin only)
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        service.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }

    // ── Helper: serialize only safe fields, avoids lazy MissingPet traversal ──
    private Map<String, Object> toMap(PetComment c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",         c.getId());
        m.put("userId",     c.getUserId());
        m.put("authorName", c.getAuthorName());
        m.put("content",    c.getContent());
        m.put("createdAt",  c.getCreatedAt());
        return m;
    }
}
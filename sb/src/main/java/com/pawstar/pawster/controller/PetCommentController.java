package com.pawstar.pawster.controller;

import com.pawstar.pawster.dto.PetCommentRequest;
import com.pawstar.pawster.model.PetComment;
import com.pawstar.pawster.service.PetCommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missing-pets/{petId}/comments")
@CrossOrigin(origins = "*")
public class PetCommentController {

    private final PetCommentService service;

    public PetCommentController(PetCommentService service) {
        this.service = service;
    }

    // GET all comments for a report
    @GetMapping
    public ResponseEntity<List<PetComment>> getComments(@PathVariable Long petId) {
        return ResponseEntity.ok(service.getComments(petId));
    }

    // POST a new comment
    @PostMapping
    public ResponseEntity<PetComment> addComment(
        @PathVariable Long petId,
        @RequestBody PetCommentRequest req
    ) {
        return ResponseEntity.ok(service.addComment(petId, req));
    }

    // DELETE a comment (admin only)
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        service.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
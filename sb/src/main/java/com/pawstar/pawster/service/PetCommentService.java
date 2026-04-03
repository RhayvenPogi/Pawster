package com.pawstar.pawster.service;

import com.pawstar.pawster.dto.PetCommentRequest;
import com.pawstar.pawster.model.MissingPet;
import com.pawstar.pawster.model.PetComment;
import com.pawstar.pawster.repository.MissingPetRepository;
import com.pawstar.pawster.repository.PetCommentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PetCommentService {

    private final PetCommentRepository commentRepo;
    private final MissingPetRepository petRepo;

    public PetCommentService(PetCommentRepository commentRepo,
                             MissingPetRepository petRepo) {
        this.commentRepo = commentRepo;
        this.petRepo = petRepo;
    }

    public PetComment addComment(Long petId, PetCommentRequest req) {
        MissingPet pet = petRepo.findById(petId)
            .orElseThrow(() -> new RuntimeException("Pet report not found: " + petId));

        if (!"approved".equals(pet.getStatus())) {
            throw new IllegalStateException("Comments are only allowed on approved reports.");
        }

        PetComment comment = new PetComment();
        comment.setPet(pet);
        comment.setUserId(req.getUserId());       // FK to users table
        comment.setAuthorName(req.getAuthorName().trim());
        comment.setContent(req.getContent().trim());
        return commentRepo.save(comment);
    }

    public List<PetComment> getComments(Long petId) {
        return commentRepo.findByPetIdOrderByCreatedAtAsc(petId);
    }

    public void deleteComment(Long commentId) {
        commentRepo.deleteById(commentId);
    }
}
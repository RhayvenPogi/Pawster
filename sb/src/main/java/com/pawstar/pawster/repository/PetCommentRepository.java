package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.PetComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetCommentRepository extends JpaRepository<PetComment, Long> {
    List<PetComment> findByPetIdOrderByCreatedAtAsc(Long petId);
}
package com.pawstar.pawster.repository;

import com.pawstar.pawster.dto.AdoptionRequestDto;
import com.pawstar.pawster.model.AdoptionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdoptionRepository extends JpaRepository<AdoptionRequest, Integer> {

    // ── Base JOIN query ────────────────────────────────────────────────────────
    // Joins adoption_requests → users → animals (LEFT JOIN so missing matches
    // don't drop rows — animal may have been deleted, user may be null).
    // Animal is matched by name (case-insensitive) since adoption_requests
    // stores petName as varchar, not a FK.

    String JOIN_QUERY = """
            SELECT new com.pawstar.pawster.dto.AdoptionRequestDto(
                ar.id,
                ar.userId,
                ar.petName,
                ar.name,
                ar.email,
                ar.phone,
                ar.address,
                ar.reason,
                ar.status,
                ar.rejectNote,
                ar.createdAt,
                u.firstName,
                u.lastName,
                u.email,
                a.type,
                a.breed,
                a.age,
                a.health,
                a.photo
            )
            FROM AdoptionRequest ar
            LEFT JOIN User u        ON u.id    = ar.userId
            LEFT JOIN Animal a      ON LOWER(a.name) = LOWER(ar.petName)
            """;

    @Query(JOIN_QUERY + " ORDER BY ar.createdAt DESC")
    List<AdoptionRequestDto> findAllWithDetails();

    @Query(JOIN_QUERY + " WHERE ar.userId = :userId ORDER BY ar.createdAt DESC")
    List<AdoptionRequestDto> findByUserIdWithDetails(@Param("userId") Integer userId);

    @Query(JOIN_QUERY + " WHERE ar.status = :status ORDER BY ar.createdAt DESC")
    List<AdoptionRequestDto> findByStatusWithDetails(@Param("status") String status);

    @Query(JOIN_QUERY + " WHERE ar.id = :id")
    Optional<AdoptionRequestDto> findByIdWithDetails(@Param("id") Integer id);

    // ── Plain queries (still needed for internal service logic) ───────────────
    List<AdoptionRequest> findByUserId(Integer userId);

    List<AdoptionRequest> findByStatus(String status);
}
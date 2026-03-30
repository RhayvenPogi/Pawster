package com.pawstar.pawster.service;

import com.pawstar.pawster.dto.AdoptionRequestDto;
import com.pawstar.pawster.model.AdoptionRequest;
import com.pawstar.pawster.repository.AdoptionRepository;
import com.pawstar.pawster.repository.AnimalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdoptionService {

    @Autowired private AdoptionRepository adoptionRepository;
    @Autowired private AnimalRepository   animalRepository;
    @Autowired private ActivityLogService activityLogService;

    // ── Create ─────────────────────────────────────────────────────────────────

    public AdoptionRequestDto create(AdoptionRequest req) {
        req.setStatus("Pending");
        AdoptionRequest saved = adoptionRepository.save(req);
        activityLogService.log(
            "ADOPTION_REQUEST",
            "New adoption request for: " + req.getPetName() + " by " + req.getName(),
            req.getUserId(), req.getName()
        );
        // Re-fetch with JOIN so the response includes user + animal details
        return adoptionRepository.findByIdWithDetails(saved.getId())
                .orElseThrow(() -> new RuntimeException("Failed to load saved request."));
    }

    // ── Reads (all via single JOIN query) ─────────────────────────────────────

    public List<AdoptionRequestDto> getAll() {
        return adoptionRepository.findAllWithDetails();
    }

    public List<AdoptionRequestDto> getByUser(Integer userId) {
        return adoptionRepository.findByUserIdWithDetails(userId);
    }

    public List<AdoptionRequestDto> getByStatus(String status) {
        return adoptionRepository.findByStatusWithDetails(status);
    }

    public AdoptionRequestDto getById(Integer id) {
        return adoptionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Adoption request not found: " + id));
    }

    // ── Admin: approve / reject ────────────────────────────────────────────────

    public AdoptionRequestDto updateStatus(Integer id, String status, String rejectNote,
                                           Integer adminId, String adminName) {
        AdoptionRequest req = adoptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Adoption request not found: " + id));

        req.setStatus(status);
        if (rejectNote != null) req.setRejectNote(rejectNote);
        adoptionRepository.save(req);

        // When approved → mark the animal as Adopted
        if ("Approved".equals(status) && req.getPetName() != null) {
            animalRepository.findByNameContainingIgnoreCase(req.getPetName()).stream()
                    .filter(a -> "Available".equals(a.getStatus()) || "Pending".equals(a.getStatus()))
                    .findFirst()
                    .ifPresent(a -> {
                        a.setStatus("Adopted");
                        animalRepository.save(a);
                    });
        }

        activityLogService.log(
            "ADOPTION_" + status.toUpperCase(),
            "Adoption request #" + id + " for " + req.getPetName() + " → " + status,
            adminId, adminName
        );

        // Return updated DTO with JOIN
        return adoptionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Failed to reload request."));
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    public void delete(Integer id) {
        adoptionRepository.deleteById(id);
    }
}
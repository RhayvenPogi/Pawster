package com.pawstar.pawster.service;

import com.pawstar.pawster.dto.AdoptionRequestDto;
import com.pawstar.pawster.model.AdoptionRequest;
import com.pawstar.pawster.model.Animal;
import com.pawstar.pawster.model.User;
import com.pawstar.pawster.repository.AdoptionRepository;
import com.pawstar.pawster.repository.AnimalRepository;
import com.pawstar.pawster.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdoptionService {

    @Autowired private AdoptionRepository  adoptionRepository;
    @Autowired private AnimalRepository    animalRepository;
    @Autowired private UserRepository      userRepository;
    @Autowired private ActivityLogService  activityLogService;

    // ── Create ─────────────────────────────────────────────────────────────────

    public AdoptionRequestDto create(AdoptionRequest req) {
        req.setStatus("Pending");
        AdoptionRequest saved = adoptionRepository.save(req);
        activityLogService.log(
            "ADOPTION_REQUEST",
            "New adoption request for: " + req.getPetName() + " by " + req.getName(),
            req.getUserId(), req.getName()
        );
        return toDto(saved);
    }

    // ── Reads ──────────────────────────────────────────────────────────────────

    public List<AdoptionRequestDto> getAll() {
        return adoptionRepository.findAll().stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public List<AdoptionRequestDto> getByUser(Integer userId) {
        return adoptionRepository.findByUserId(userId).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public List<AdoptionRequestDto> getByStatus(String status) {
        return adoptionRepository.findByStatus(status).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public AdoptionRequestDto getById(Integer id) {
        return toDto(findOrThrow(id));
    }

    // ── Admin: approve / reject ────────────────────────────────────────────────

    public AdoptionRequestDto updateStatus(Integer id, String status, String rejectNote,
                                           Integer adminId, String adminName) {
        AdoptionRequest req = findOrThrow(id);
        req.setStatus(status);
        if (rejectNote != null) req.setRejectNote(rejectNote);
        adoptionRepository.save(req);

        // When approved → mark the animal as Adopted (matched by pet name)
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
        return toDto(req);
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    public void delete(Integer id) {
        adoptionRepository.deleteById(id);
    }

    // ── Entity → DTO mapper ────────────────────────────────────────────────────

    private AdoptionRequestDto toDto(AdoptionRequest req) {
        AdoptionRequestDto dto = new AdoptionRequestDto();

        // adoption_requests fields
        dto.setId(req.getId());
        dto.setUserId(req.getUserId());
        dto.setPetName(req.getPetName());
        dto.setName(req.getName());
        dto.setEmail(req.getEmail());
        dto.setPhone(req.getPhone());
        dto.setAddress(req.getAddress());
        dto.setReason(req.getReason());
        dto.setStatus(req.getStatus());
        dto.setRejectNote(req.getRejectNote());
        dto.setCreatedAt(req.getCreatedAt());

        // Join: users table
        if (req.getUserId() != null) {
            userRepository.findById(req.getUserId()).ifPresent(u -> {
                dto.setUserFirstName(u.getFirstName());
                dto.setUserLastName(u.getLastName());
                dto.setUserEmail(u.getEmail());
            });
        }

        // Join: animals table (matched by pet name)
        if (req.getPetName() != null) {
            animalRepository.findByNameContainingIgnoreCase(req.getPetName())
                    .stream().findFirst().ifPresent(a -> {
                        dto.setAnimalType(a.getType());
                        dto.setAnimalBreed(a.getBreed());
                        dto.setAnimalAge(a.getAge());
                        dto.setAnimalHealth(a.getHealth());
                        dto.setAnimalPhoto(a.getPhoto());
                    });
        }

        return dto;
    }

    private AdoptionRequest findOrThrow(Integer id) {
        return adoptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Adoption request not found: " + id));
    }
}
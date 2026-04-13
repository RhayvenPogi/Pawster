package com.pawstar.pawster.service;

import com.pawstar.pawster.model.MissingPet;
import com.pawstar.pawster.repository.MissingPetRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MissingPetService {

    private final MissingPetRepository repo;

    public MissingPetService(MissingPetRepository repo) {
        this.repo = repo;
    }

    // ── Create ────────────────────────────────────────────────────────────────
    public MissingPet save(String type, String name, String species, String breed,
            String area, String address, String color, String details,
            Double latitude, Double longitude,
            Integer reporterUserId,
            MultipartFile photo) {

        MissingPet pet = new MissingPet();
        pet.setType(type);
        pet.setName(name);
        pet.setSpecies(species);
        pet.setBreed(breed);
        pet.setArea(area);
        pet.setAddress(address);
        pet.setColor(color);
        pet.setDetails(details);
        pet.setLatitude(latitude);
        pet.setLongitude(longitude);
        pet.setReporterUserId(reporterUserId);

        if (photo != null && !photo.isEmpty()) {
            try {
                pet.setPhoto(photo.getBytes());
                pet.setPhotoType(photo.getContentType());
            } catch (IOException e) {
                System.err.println("Photo read failed: " + e.getMessage());
            }
        }

        return repo.save(pet);
    }

    // ── Read ──────────────────────────────────────────────────────────────────
    public List<MissingPet> findAll() {
        return repo.findAll();
    }

    public List<MissingPet> findByStatus(String status) {
        return repo.findByStatus(status);
    }

    public MissingPet findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found: " + id));
    }

    // ── Update status only (admin approve/reject) ─────────────────────────────
    public MissingPet updateStatus(Long id, String status) {
        MissingPet pet = findById(id);
        pet.setStatus(status);
        return repo.save(pet);
    }

    // ── Full update via multipart (user-facing) ───────────────────────────────
    public MissingPet update(Long id, String type, String name, String species, String breed,
            String area, String address, String color, String details,
            Double latitude, Double longitude, MultipartFile photo) {

        MissingPet pet = findById(id);
        pet.setType(type);
        pet.setName(name);
        pet.setSpecies(species);
        pet.setBreed(breed);
        pet.setArea(area);
        pet.setAddress(address);
        pet.setColor(color);
        pet.setDetails(details);
        pet.setLatitude(latitude);
        pet.setLongitude(longitude);

        if (photo != null && !photo.isEmpty()) {
            try {
                pet.setPhoto(photo.getBytes());
                pet.setPhotoType(photo.getContentType());
            } catch (IOException e) {
                System.err.println("Photo read failed: " + e.getMessage());
            }
        }

        return repo.save(pet);
    }

    // ── Update via JSON body (admin panel) ────────────────────────────────────
    public MissingPet updateFromBody(Long id, MissingPet updated) {
        MissingPet pet = findById(id);
        pet.setName(updated.getName());
        pet.setSpecies(updated.getSpecies());
        pet.setBreed(updated.getBreed());
        pet.setColor(updated.getColor());
        pet.setArea(updated.getArea());
        pet.setAddress(updated.getAddress());
        pet.setDetails(updated.getDetails());
        return repo.save(pet);
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public void delete(Long id) {
        repo.deleteById(id);
    }

    // ── Resolve by original reporter ──────────────────────────────────────────
    public MissingPet resolveByUser(Long petId, Integer requestingUserId) {
        MissingPet pet = findById(petId);

        if (!requestingUserId.equals(pet.getReporterUserId())) {
            throw new SecurityException("Only the original reporter can resolve this report.");
        }
        if (Boolean.TRUE.equals(pet.getResolvedByUser())) {
            throw new IllegalStateException("This report is already marked as resolved.");
        }

        pet.setResolvedByUser(true);
        pet.setResolvedAt(LocalDateTime.now());
        pet.setStatus("resolved");
        return repo.save(pet);
    }
}
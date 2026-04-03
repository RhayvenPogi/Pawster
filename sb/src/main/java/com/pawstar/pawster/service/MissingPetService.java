package com.pawstar.pawster.service;

import com.pawstar.pawster.model.MissingPet;
import com.pawstar.pawster.repository.MissingPetRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MissingPetService {

    private final MissingPetRepository repo;

    @Value("${app.upload.dir:uploads/missing-pets}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public MissingPetService(MissingPetRepository repo) {
        this.repo = repo;
    }

    // ── Shared photo-save helper ──────────────────────────────────────────────
    private String savePhoto(MultipartFile photo) {
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "_" + photo.getOriginalFilename()
                    .replaceAll("\\s+", "-")
                    .replaceAll("[^a-zA-Z0-9._-]", "");
            Files.copy(photo.getInputStream(), dir.resolve(filename),
                    StandardCopyOption.REPLACE_EXISTING);
            System.out.println("Saved photo to: " + dir.resolve(filename).toAbsolutePath());
            return "/uploads/missing-pets/" + filename;
        } catch (IOException e) {
            System.err.println("Photo upload failed: " + e.getMessage());
            return null;
        }
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
            String photoUrl = savePhoto(photo);
            if (photoUrl != null) {
                pet.setPhotoUrl(photoUrl);
                System.out.println("PhotoUrl stored: " + photoUrl);
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

    // ── Update status only (admin approve/reject) ─────────────────────────────
    public MissingPet updateStatus(Long id, String status) {
        MissingPet pet = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        pet.setStatus(status);
        return repo.save(pet);
    }

    // ── Full update via multipart (public / user-facing) ──────────────────────
    public MissingPet update(Long id, String type, String name, String species, String breed,
                             String area, String address, String color, String details,
                             Double latitude, Double longitude, MultipartFile photo) {

        MissingPet pet = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

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
            String photoUrl = savePhoto(photo);
            if (photoUrl != null) {
                pet.setPhotoUrl(photoUrl);
            }
        }

        return repo.save(pet);
    }

    // ── Update via JSON body (admin panel) ────────────────────────────────────
    public MissingPet updateFromBody(Long id, MissingPet updated) {
        MissingPet pet = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        pet.setName(updated.getName());
        pet.setSpecies(updated.getSpecies());
        pet.setBreed(updated.getBreed());
        pet.setColor(updated.getColor());
        pet.setArea(updated.getArea());
        pet.setAddress(updated.getAddress());
        pet.setDetails(updated.getDetails());

        // Preserve type, latitude, longitude, and photo — not editable via JSON body
        // Uncomment below if you ever want to allow those fields from the admin panel:
        // if (updated.getType()      != null) pet.setType(updated.getType());
        // if (updated.getLatitude()  != null) pet.setLatitude(updated.getLatitude());
        // if (updated.getLongitude() != null) pet.setLongitude(updated.getLongitude());

        return repo.save(pet);
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public void delete(Long id) {
        repo.deleteById(id);
    }

    // ── Resolve by original reporter ──────────────────────────────────────────
    public MissingPet resolveByUser(Long petId, Integer requestingUserId) {
        MissingPet pet = repo.findById(petId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + petId));

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
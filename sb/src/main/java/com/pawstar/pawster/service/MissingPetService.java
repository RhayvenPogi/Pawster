package com.pawstar.pawster.service;

import com.pawstar.pawster.model.MissingPet;
import com.pawstar.pawster.repository.MissingPetRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
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

    public MissingPet save(String type, String name, String species, String breed,
                           String area, String address, String color, String details,
                           Double latitude, Double longitude, MultipartFile photo) {
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

        if (photo != null && !photo.isEmpty()) {
            try {
                Path dir = Paths.get(uploadDir);
                Files.createDirectories(dir);
                String filename = UUID.randomUUID() + "_" + photo.getOriginalFilename();
                Files.copy(photo.getInputStream(), dir.resolve(filename),
                           StandardCopyOption.REPLACE_EXISTING);
                pet.setPhotoUrl("/uploads/missing-pets/" + filename);
            } catch (IOException e) {
                // photo upload failed — continue without photo
            }
        }

        return repo.save(pet);
    }

    public List<MissingPet> findAll() {
        return repo.findAll();
    }

    public List<MissingPet> findByStatus(String status) {
        return repo.findByStatus(status);
    }

    public MissingPet updateStatus(Long id, String status) {
        MissingPet pet = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Report not found"));
        pet.setStatus(status);
        return repo.save(pet);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}
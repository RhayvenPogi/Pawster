package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.MissingPet;
import com.pawstar.pawster.service.MissingPetService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/missing-pets")
@CrossOrigin(origins = "*")
public class MissingPetController {

    private final MissingPetService service;

    public MissingPetController(MissingPetService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MissingPet>> getApproved() {
        return ResponseEntity.ok(service.findByStatus("approved"));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<MissingPet>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getPhoto(@PathVariable Long id) {
        MissingPet pet = service.findById(id);
        if (pet.getPhoto() == null) return ResponseEntity.notFound().build();
        String contentType = pet.getPhotoType() != null ? pet.getPhotoType() : "image/jpeg";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(pet.getPhoto());
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<MissingPet> report(
            @RequestParam String type,
            @RequestParam(required = false) String name,
            @RequestParam String species,
            @RequestParam(required = false) String breed,
            @RequestParam String area,
            @RequestParam String address,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String details,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Integer reporterUserId,
            @RequestParam(required = false) MultipartFile photo) {

        return ResponseEntity.ok(
                service.save(type, name, species, breed, area, address,
                        color, details, latitude, longitude, reporterUserId, photo));
    }

    @PutMapping("/admin/{id}/approve")
    public ResponseEntity<MissingPet> approve(@PathVariable Long id) {
        return ResponseEntity.ok(service.updateStatus(id, "approved"));
    }

    @PutMapping("/admin/{id}/reject")
    public ResponseEntity<MissingPet> reject(@PathVariable Long id) {
        return ResponseEntity.ok(service.updateStatus(id, "rejected"));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<MissingPet> adminUpdate(
            @PathVariable Long id,
            @RequestBody MissingPet updatedPet) {
        return ResponseEntity.ok(service.updateFromBody(id, updatedPet));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<MissingPet> update(
            @PathVariable Long id,
            @RequestParam String type,
            @RequestParam(required = false) String name,
            @RequestParam String species,
            @RequestParam(required = false) String breed,
            @RequestParam String area,
            @RequestParam String address,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String details,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) MultipartFile photo) {

        return ResponseEntity.ok(
                service.update(id, type, name, species, breed, area, address,
                        color, details, latitude, longitude, photo));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<MissingPet> resolveByUser(
            @PathVariable Long id,
            @RequestParam Integer userId) {
        return ResponseEntity.ok(service.resolveByUser(id, userId));
    }
}
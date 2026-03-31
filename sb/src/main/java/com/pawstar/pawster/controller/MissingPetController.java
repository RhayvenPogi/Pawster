package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.MissingPet;
import com.pawstar.pawster.service.MissingPetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/missing-pets")
@CrossOrigin(origins = "*")
public class MissingPetController {

    private final MissingPetService service;

    public MissingPetController(MissingPetService service) {
        this.service = service;
    }

    // Public — only returns approved reports
    @GetMapping
    public ResponseEntity<List<MissingPet>> getApproved() {
        return ResponseEntity.ok(service.findByStatus("approved"));
    }

    // Admin — returns all reports regardless of status
    @GetMapping("/admin/all")
    public ResponseEntity<List<MissingPet>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    // Submit report with optional photo
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
        @RequestParam(required = false) MultipartFile photo
    ) {
        return ResponseEntity.ok(
            service.save(type, name, species, breed, area, address,
                         color, details, latitude, longitude, photo)
        );
    }

    // Admin — approve a report
    @PutMapping("/admin/{id}/approve")
    public ResponseEntity<MissingPet> approve(@PathVariable Long id) {
        return ResponseEntity.ok(service.updateStatus(id, "approved"));
    }

    // Admin — reject a report
    @PutMapping("/admin/{id}/reject")
    public ResponseEntity<MissingPet> reject(@PathVariable Long id) {
        return ResponseEntity.ok(service.updateStatus(id, "rejected"));
    }

    // Admin — delete a report
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
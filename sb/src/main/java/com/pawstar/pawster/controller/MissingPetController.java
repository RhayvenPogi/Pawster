package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.MissingPet;
import com.pawstar.pawster.service.MissingPetService;
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

    // ── Public — approved reports only ───────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<MissingPet>> getApproved() {
        return ResponseEntity.ok(service.findByStatus("approved"));
    }

    // ── Admin — all reports ───────────────────────────────────────────────────
    @GetMapping("/admin/all")
    public ResponseEntity<List<MissingPet>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    // ── Submit new report (multipart) ─────────────────────────────────────────
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

    // ── Admin — approve ───────────────────────────────────────────────────────
    @PutMapping("/admin/{id}/approve")
    public ResponseEntity<MissingPet> approve(@PathVariable Long id) {
        return ResponseEntity.ok(service.updateStatus(id, "approved"));
    }

    // ── Admin — reject ────────────────────────────────────────────────────────
    @PutMapping("/admin/{id}/reject")
    public ResponseEntity<MissingPet> reject(@PathVariable Long id) {
        return ResponseEntity.ok(service.updateStatus(id, "rejected"));
    }

    // ── Admin — update via JSON body (used by the React admin panel) ──────────
    @PutMapping("/admin/{id}")
    public ResponseEntity<MissingPet> adminUpdate(
            @PathVariable Long id,
            @RequestBody MissingPet updatedPet) {

        return ResponseEntity.ok(service.updateFromBody(id, updatedPet));
    }

    // ── User-facing — update via multipart (with optional new photo) ──────────
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

    // ── Admin — delete ────────────────────────────────────────────────────────
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── User — mark as resolved ───────────────────────────────────────────────
    @PutMapping("/{id}/resolve")
    public ResponseEntity<MissingPet> resolveByUser(
            @PathVariable Long id,
            @RequestParam Integer userId) {

        return ResponseEntity.ok(service.resolveByUser(id, userId));
    }
}
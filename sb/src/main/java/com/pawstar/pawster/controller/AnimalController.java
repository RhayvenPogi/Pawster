package com.pawstar.pawster.controller;

import com.pawstar.pawster.dto.AnimalRequest;
import com.pawstar.pawster.model.Animal;
import com.pawstar.pawster.service.AnimalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/animals")
public class AnimalController {

    @Autowired
    private AnimalService animalService;

    // GET /api/animals?type=Dog&status=Available
    @GetMapping
    public List<Animal> getAll(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {

        if (type != null && status != null)
            return animalService.getByTypeAndStatus(type, status);
        if (type != null)
            return animalService.getByType(type);
        if (status != null)
            return animalService.getByStatus(status);
        return animalService.getAll();
    }

    // GET /api/animals/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(animalService.getById(id));
        } catch (RuntimeException e) {
            return notFound(e.getMessage());
        }
    }

    // POST /api/animals — ADMIN only
    @PostMapping
    public ResponseEntity<?> create(@RequestBody AnimalRequest dto, Authentication auth) {
        try {
            String adminName = auth != null ? auth.getName() : "admin";
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(animalService.create(toEntity(dto), null, adminName));
        } catch (RuntimeException e) {
            return bad(e.getMessage());
        }
    }

    // PUT /api/animals/{id} — ADMIN only
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id,
            @RequestBody AnimalRequest dto,
            Authentication auth) {
        try {
            String adminName = auth != null ? auth.getName() : "admin";
            return ResponseEntity.ok(animalService.update(id, toEntity(dto), null, adminName));
        } catch (RuntimeException e) {
            return notFound(e.getMessage());
        }
    }

    // DELETE /api/animals/{id} — ADMIN only
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication auth) {
        try {
            String adminName = auth != null ? auth.getName() : "admin";
            animalService.delete(id, null, adminName);
            return ResponseEntity.ok(Map.of("success", true, "message", "Animal deleted."));
        } catch (RuntimeException e) {
            return notFound(e.getMessage());
        }
    }

    // ✅ POST /api/animals/mark-adopted — called by Django after approval
    // Body: { "animalName": "Buddy" }
    @PostMapping("/mark-adopted")
    public ResponseEntity<?> markAdopted(@RequestBody Map<String, String> body) {
        String animalName = body.get("animalName");
        if (animalName == null || animalName.isBlank()) {
            return bad("animalName is required.");
        }
        boolean updated = animalService.markAsAdopted(animalName);
        if (updated) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Animal marked as Adopted."));
        } else {
            return ResponseEntity.ok(Map.of("success", false, "message", "No available animal found with that name."));
        }
    }

    // POST /api/animals/mark-pending — called by Django on submission
    @PostMapping("/mark-pending")
    public ResponseEntity<?> markPending(@RequestBody Map<String, String> body) {
        String animalName = body.get("animalName");
        if (animalName == null || animalName.isBlank()) {
            return bad("animalName is required.");
        }
        boolean updated = animalService.markAsPending(animalName);
        return ResponseEntity.ok(Map.of("success", true, "updated", updated));
    }

    // ── DTO → Entity ───────────────────────────────────────────────────────────

    private Animal toEntity(AnimalRequest dto) {
        Animal a = new Animal();
        a.setName(dto.getName());
        a.setType(dto.getType() != null ? dto.getType() : "Dog");
        a.setBreed(dto.getBreed());
        a.setAge(dto.getAge());
        a.setHealth(dto.getHealth() != null ? dto.getHealth() : "Healthy");
        a.setStatus(dto.getStatus() != null ? dto.getStatus() : "Available");
        a.setPhoto(dto.getPhoto());
        a.setNotes(dto.getNotes());
        return a;
    }

    private ResponseEntity<?> bad(String msg) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", msg));
    }

    private ResponseEntity<?> notFound(String msg) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", msg));
    }
}
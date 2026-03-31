package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.MissingPet;
import com.pawstar.pawster.service.MissingPetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missing-pets")
public class MissingPetController {

    private final MissingPetService service;

    public MissingPetController(MissingPetService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MissingPet> report(@RequestBody MissingPet pet) {
        return ResponseEntity.ok(service.save(pet));
    }

    @GetMapping
    public ResponseEntity<List<MissingPet>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }
}
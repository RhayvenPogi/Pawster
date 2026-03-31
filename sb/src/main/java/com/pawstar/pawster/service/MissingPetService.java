package com.pawstar.pawster.service;

import com.pawstar.pawster.model.MissingPet;
import com.pawstar.pawster.repository.MissingPetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MissingPetService {

    private final MissingPetRepository repo;

    public MissingPetService(MissingPetRepository repo) {
        this.repo = repo;
    }

    public MissingPet save(MissingPet pet) {
        return repo.save(pet);
    }

    public List<MissingPet> findAll() {
        return repo.findAll();
    }
}
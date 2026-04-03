package com.pawstar.pawster.service;

import com.pawstar.pawster.model.Animal;
import com.pawstar.pawster.repository.AnimalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnimalService {

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private ActivityLogService activityLogService;

    public Animal create(Animal animal, Integer adminId, String adminName) {
        if (animal.getStatus() == null || animal.getStatus().isBlank()) {
            animal.setStatus("Available");
        }
        Animal saved = animalRepository.save(animal);
        activityLogService.log(
                "ADD_ANIMAL",
                "Added animal: " + saved.getName() + " (" + saved.getType() + ")",
                adminId, adminName);
        return saved;
    }

    public List<Animal> getAll() {
        return animalRepository.findAll();
    }

    public List<Animal> getByStatus(String status) {
        return animalRepository.findByStatus(status);
    }

    public List<Animal> getByType(String type) {
        return animalRepository.findByType(type);
    }

    public List<Animal> getByTypeAndStatus(String type, String status) {
        return animalRepository.findByTypeAndStatus(type, status);
    }

    public Animal getById(Integer id) {
        return animalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Animal not found with id: " + id));
    }

    public Animal update(Integer id, Animal updated, Integer adminId, String adminName) {
        Animal animal = getById(id);
        animal.setName(updated.getName());
        animal.setType(updated.getType());
        animal.setBreed(updated.getBreed());
        animal.setAge(updated.getAge());
        animal.setHealth(updated.getHealth());
        animal.setStatus(updated.getStatus());
        animal.setPhoto(updated.getPhoto());
        animal.setNotes(updated.getNotes());
        Animal saved = animalRepository.save(animal);
        activityLogService.log(
                "UPDATE_ANIMAL",
                "Updated animal: " + saved.getName() + " → status=" + saved.getStatus(),
                adminId, adminName);
        return saved;
    }

    public void delete(Integer id, Integer adminId, String adminName) {
        Animal animal = getById(id);
        animalRepository.deleteById(id);
        activityLogService.log(
                "DELETE_ANIMAL",
                "Deleted animal: " + animal.getName(),
                adminId, adminName);
    }

    // ✅ Called by Django after approving an adoption
    public boolean markAsAdopted(String animalName) {
        return animalRepository.findByNameContainingIgnoreCase(animalName).stream()
                .filter(a -> "Available".equals(a.getStatus()) || "Pending".equals(a.getStatus()))
                .findFirst()
                .map(a -> {
                    a.setStatus("Adopted");
                    animalRepository.save(a);
                    activityLogService.log(
                            "MARK_ADOPTED",
                            "Animal marked as Adopted via approval: " + a.getName(),
                            null, "system");
                    return true;
                })
                .orElse(false);
    }

    // ✅ Called by Django when a user submits an adoption request
    public boolean markAsPending(String animalName) {
        return animalRepository.findByNameContainingIgnoreCase(animalName).stream()
                .filter(a -> "Available".equals(a.getStatus()))
                .findFirst()
                .map(a -> {
                    a.setStatus("Pending");
                    animalRepository.save(a);
                    activityLogService.log(
                            "MARK_PENDING",
                            "Animal marked as Pending via adoption request: " + a.getName(),
                            null, "system");
                    return true;
                })
                .orElse(false);
    }
}
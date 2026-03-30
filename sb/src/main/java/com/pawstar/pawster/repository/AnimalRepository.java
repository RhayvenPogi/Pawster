// ─── AnimalRepository.java ───────────────────────────────────────────────────
package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Integer> {

    List<Animal> findByStatus(String status);

    List<Animal> findByType(String type);

    List<Animal> findByTypeAndStatus(String type, String status);

    List<Animal> findByNameContainingIgnoreCase(String name);
}
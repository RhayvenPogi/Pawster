package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Integer> {

    List<Animal> findByStatus(String status);

    List<Animal> findByType(String type);

    List<Animal> findByTypeAndStatus(String type, String status);

    List<Animal> findByNameContainingIgnoreCase(String name);

    @Query("SELECT a FROM Animal a WHERE " +
            "(LOWER(a.name) LIKE :q OR LOWER(a.breed) LIKE :q OR LOWER(a.type) LIKE :q " +
            "OR LOWER(a.age) LIKE :q OR LOWER(a.health) LIKE :q) " +
            "AND (:type IS NULL OR a.type = :type) " +
            "AND (:status IS NULL OR a.status = :status)")
    List<Animal> searchAnimals(@Param("q") String q,
            @Param("type") String type,
            @Param("status") String status);
}
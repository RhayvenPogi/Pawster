package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.MissingPet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MissingPetRepository extends JpaRepository<MissingPet, Long> {
    List<MissingPet> findByStatus(String status);
}
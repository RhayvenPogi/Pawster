package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.MissingPet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MissingPetRepository extends JpaRepository<MissingPet, Long> {}
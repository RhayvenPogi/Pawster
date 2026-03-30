package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.AdoptionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdoptionRepository extends JpaRepository<AdoptionRequest, Integer> {

    List<AdoptionRequest> findByUserId(Integer userId);

    List<AdoptionRequest> findByStatus(String status);

    List<AdoptionRequest> findByPetNameContainingIgnoreCase(String petName);
}
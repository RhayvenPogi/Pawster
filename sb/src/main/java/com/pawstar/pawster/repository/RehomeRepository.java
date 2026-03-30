package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.RehomeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RehomeRepository extends JpaRepository<RehomeRequest, Integer> {

    List<RehomeRequest> findByUserId(Integer userId);

    List<RehomeRequest> findByStatus(String status);
}
package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Integer> {

    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(Integer userId);

    List<ActivityLog> findTop50ByOrderByCreatedAtDesc();
}
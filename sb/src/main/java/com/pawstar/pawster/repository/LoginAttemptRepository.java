package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    Optional<LoginAttempt> findByEmail(String email);
    List<LoginAttempt> findByPermanentlyLockedTrue();
}
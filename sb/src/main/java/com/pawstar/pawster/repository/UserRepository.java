package com.pawstar.pawster.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pawstar.pawster.model.User;
 
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // User entity has no 'username' field — authentication is by email
    Optional<User> findByEmail(String email);
}
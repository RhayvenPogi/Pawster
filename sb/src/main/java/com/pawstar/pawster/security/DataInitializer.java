package com.pawstar.pawster.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.pawstar.pawster.model.User;
import com.pawstar.pawster.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired 
    UserRepository userRepository;

    @Autowired 
    PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@pawster.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@pawster.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setPhone("09123456789");   // <-- REQUIRED
            admin.setRole("ADMIN");
            admin.setStatus("approved");     // optional, default is "pending"
            userRepository.save(admin);
    }
}
}
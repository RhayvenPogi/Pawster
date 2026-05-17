package com.pawstar.pawster.service;

import com.pawstar.pawster.model.LoginAttempt;
import com.pawstar.pawster.repository.LoginAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LoginAttemptService {

    @Autowired
    private LoginAttemptRepository loginAttemptRepository;

    /**
     * Returns the existing record or a new transient one (not yet saved).
     */
    public LoginAttempt getOrCreate(String email) {
        return loginAttemptRepository.findByEmail(email).orElseGet(() -> {
            LoginAttempt a = new LoginAttempt();
            a.setEmail(email);
            return a;
        });
    }

    /**
     * Call this after a SUCCESSFUL login to wipe the attempt counter.
     */
    public void resetAttempts(String email) {
        loginAttemptRepository.findByEmail(email).ifPresent(a -> {
            a.setAttemptCount(0);
            a.setLockedUntil(null);
            // do NOT touch permanentlyLocked — admin must clear that manually
            loginAttemptRepository.save(a);
        });
    }

    /**
     * Call this after a FAILED login.
     * Returns the updated LoginAttempt so the controller can build the response.
     */
    public LoginAttempt recordFailure(String email) {
        LoginAttempt a = getOrCreate(email);

        // Never increment past permanently-locked state
        if (a.isPermanentlyLocked()) {
            return a;
        }

        int count = a.getAttemptCount() + 1;
        a.setAttemptCount(count);
        a.setLastAttemptAt(LocalDateTime.now());

        LocalDateTime now = LocalDateTime.now();
        switch (count) {
            case 4  -> a.setLockedUntil(now.plusMinutes(1));
            case 5  -> a.setLockedUntil(now.plusMinutes(5));
            case 6  -> a.setLockedUntil(now.plusMinutes(15));
            case 7, 8, 9 -> a.setLockedUntil(now.plusHours(1));
            default -> {
                if (count >= 10) {
                    a.setPermanentlyLocked(true);
                    a.setLockedUntil(null);
                }
            }
        }

        return loginAttemptRepository.save(a);
    }

    /**
     * Checks whether this email is currently locked.
     * Returns null when not locked; returns the LoginAttempt when locked.
     */
    public LoginAttempt checkLock(String email) {
        return loginAttemptRepository.findByEmail(email).map(a -> {
            if (a.isPermanentlyLocked()) return a;
            if (a.getLockedUntil() != null && LocalDateTime.now().isBefore(a.getLockedUntil())) return a;
            return null;
        }).orElse(null);
    }

    /**
     * Admin: unlock an account completely.
     */
    public boolean unlockAccount(String email) {
        return loginAttemptRepository.findByEmail(email).map(a -> {
            a.setAttemptCount(0);
            a.setLockedUntil(null);
            a.setPermanentlyLocked(false);
            loginAttemptRepository.save(a);
            return true;
        }).orElse(false);
    }

    /**
     * Admin: list all permanently-locked accounts.
     */
    public List<LoginAttempt> getPermanentlyLocked() {
        return loginAttemptRepository.findByPermanentlyLockedTrue();
    }
}
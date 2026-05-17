package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts")
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "permanently_locked", nullable = false)
    private boolean permanentlyLocked = false;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId()                          { return id; }
    public void setId(Long id)                   { this.id = id; }

    public String getEmail()                     { return email; }
    public void setEmail(String email)           { this.email = email; }

    public int getAttemptCount()                 { return attemptCount; }
    public void setAttemptCount(int v)           { this.attemptCount = v; }

    public LocalDateTime getLockedUntil()        { return lockedUntil; }
    public void setLockedUntil(LocalDateTime v)  { this.lockedUntil = v; }

    public boolean isPermanentlyLocked()         { return permanentlyLocked; }
    public void setPermanentlyLocked(boolean v)  { this.permanentlyLocked = v; }

    public LocalDateTime getLastAttemptAt()      { return lastAttemptAt; }
    public void setLastAttemptAt(LocalDateTime v){ this.lastAttemptAt = v; }

    public LocalDateTime getCreatedAt()          { return createdAt; }
    public LocalDateTime getUpdatedAt()          { return updatedAt; }
}
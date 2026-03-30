package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(columnDefinition = "text")
    private String details;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "user_name", length = 160)
    private String userName;

    @Column(name = "created_at", updatable = false,
            columnDefinition = "timestamptz default now()")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer        getId()                        { return id; }
    public void           setId(Integer v)               { this.id = v; }

    public String         getAction()                    { return action; }
    public void           setAction(String v)            { this.action = v; }

    public String         getDetails()                   { return details; }
    public void           setDetails(String v)           { this.details = v; }

    public Integer        getUserId()                    { return userId; }
    public void           setUserId(Integer v)           { this.userId = v; }

    public String         getUserName()                  { return userName; }
    public void           setUserName(String v)          { this.userName = v; }

    public OffsetDateTime getCreatedAt()                 { return createdAt; }
    public void           setCreatedAt(OffsetDateTime v) { this.createdAt = v; }
}
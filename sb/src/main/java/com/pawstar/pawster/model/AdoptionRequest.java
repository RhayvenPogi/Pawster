package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "adoption_requests")
public class AdoptionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** FK → users.id  (nullable: SET NULL on delete) */
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "pet_name", length = 120)
    private String petName;

    /** Full name of the applicant */
    @Column(length = 160)
    private String name;

    @Column(length = 180)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(columnDefinition = "text")
    private String reason;

    /** Pending | Approved | Rejected */
    @Column(nullable = false, length = 40)
    private String status = "Pending";

    @Column(name = "reject_note", columnDefinition = "text")
    private String rejectNote;

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

    public Integer        getUserId()                    { return userId; }
    public void           setUserId(Integer v)           { this.userId = v; }

    public String         getPetName()                   { return petName; }
    public void           setPetName(String v)           { this.petName = v; }

    public String         getName()                      { return name; }
    public void           setName(String v)              { this.name = v; }

    public String         getEmail()                     { return email; }
    public void           setEmail(String v)             { this.email = v; }

    public String         getPhone()                     { return phone; }
    public void           setPhone(String v)             { this.phone = v; }

    public String         getAddress()                   { return address; }
    public void           setAddress(String v)           { this.address = v; }

    public String         getReason()                    { return reason; }
    public void           setReason(String v)            { this.reason = v; }

    public String         getStatus()                    { return status; }
    public void           setStatus(String v)            { this.status = v; }

    public String         getRejectNote()                { return rejectNote; }
    public void           setRejectNote(String v)        { this.rejectNote = v; }

    public OffsetDateTime getCreatedAt()                 { return createdAt; }
    public void           setCreatedAt(OffsetDateTime v) { this.createdAt = v; }
}
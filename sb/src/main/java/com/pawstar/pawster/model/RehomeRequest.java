package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "rehome_requests")
public class RehomeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** FK → users.id  (nullable: SET NULL on delete) */
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "animal_name", length = 120)
    private String animalName;

    @Column(name = "owner_name", length = 160)
    private String ownerName;

    /** Email of the owner */
    @Column(length = 180)
    private String contact;

    /** Phone number */
    @Column(name = "contact_no", length = 30)
    private String contactNo;

    @Column(length = 120)
    private String city;

    @Column(columnDefinition = "text")
    private String description;

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

    public String         getAnimalName()                { return animalName; }
    public void           setAnimalName(String v)        { this.animalName = v; }

    public String         getOwnerName()                 { return ownerName; }
    public void           setOwnerName(String v)         { this.ownerName = v; }

    public String         getContact()                   { return contact; }
    public void           setContact(String v)           { this.contact = v; }

    public String         getContactNo()                 { return contactNo; }
    public void           setContactNo(String v)         { this.contactNo = v; }

    public String         getCity()                      { return city; }
    public void           setCity(String v)              { this.city = v; }

    public String         getDescription()               { return description; }
    public void           setDescription(String v)       { this.description = v; }

    public String         getStatus()                    { return status; }
    public void           setStatus(String v)            { this.status = v; }

    public String         getRejectNote()                { return rejectNote; }
    public void           setRejectNote(String v)        { this.rejectNote = v; }

    public OffsetDateTime getCreatedAt()                 { return createdAt; }
    public void           setCreatedAt(OffsetDateTime v) { this.createdAt = v; }
}
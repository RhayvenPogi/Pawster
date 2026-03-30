package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "animals")
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 120)
    private String name;

    /** Dog | Cat | Bird | Rabbit | Other */
    @Column(nullable = false, length = 40)
    private String type = "Dog";

    @Column(length = 120)
    private String breed;

    /** Stored as text, e.g. "2 years", "6 months" */
    @Column(length = 40)
    private String age;

    /** Healthy | Needs Care | Under Treatment */
    @Column(nullable = false, length = 40)
    private String health = "Healthy";

    /** Available | Pending | Adopted | Not Available */
    @Column(nullable = false, length = 40)
    private String status = "Available";

    @Column(length = 255)
    private String photo;

    @Column(columnDefinition = "text")
    private String notes;

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

    public String         getName()                      { return name; }
    public void           setName(String v)              { this.name = v; }

    public String         getType()                      { return type; }
    public void           setType(String v)              { this.type = v; }

    public String         getBreed()                     { return breed; }
    public void           setBreed(String v)             { this.breed = v; }

    public String         getAge()                       { return age; }
    public void           setAge(String v)               { this.age = v; }

    public String         getHealth()                    { return health; }
    public void           setHealth(String v)            { this.health = v; }

    public String         getStatus()                    { return status; }
    public void           setStatus(String v)            { this.status = v; }

    public String         getPhoto()                     { return photo; }
    public void           setPhoto(String v)             { this.photo = v; }

    public String         getNotes()                     { return notes; }
    public void           setNotes(String v)             { this.notes = v; }

    public OffsetDateTime getCreatedAt()                 { return createdAt; }
    public void           setCreatedAt(OffsetDateTime v) { this.createdAt = v; }
}

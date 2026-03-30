package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "surveys")
public class Survey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "adoption_id")
    private Integer adoptionId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "adopter_name", length = 160)
    private String adopterName;

    @Column(name = "animal_name", length = 120)
    private String animalName;

    /** 1–5 star rating */
    @Column
    private Short rating;

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

    public Integer        getAdoptionId()                { return adoptionId; }
    public void           setAdoptionId(Integer v)       { this.adoptionId = v; }

    public Integer        getUserId()                    { return userId; }
    public void           setUserId(Integer v)           { this.userId = v; }

    public String         getAdopterName()               { return adopterName; }
    public void           setAdopterName(String v)       { this.adopterName = v; }

    public String         getAnimalName()                { return animalName; }
    public void           setAnimalName(String v)        { this.animalName = v; }

    public Short          getRating()                    { return rating; }
    public void           setRating(Short v)             { this.rating = v; }

    public String         getNotes()                     { return notes; }
    public void           setNotes(String v)             { this.notes = v; }

    public OffsetDateTime getCreatedAt()                 { return createdAt; }
    public void           setCreatedAt(OffsetDateTime v) { this.createdAt = v; }
}
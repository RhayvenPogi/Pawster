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

    @Column(nullable = false, length = 40)
    private String type = "Dog";

    @Column(length = 120)
    private String breed;

    @Column(length = 40)
    private String age;

    @Column(nullable = false, length = 40)
    private String health = "Healthy";

    @Column(nullable = false, length = 40)
    private String status = "Available";

    @Column(name = "photo_data", columnDefinition = "bytea")
    private byte[] photoData;

    @Column(name = "photo_type", length = 100)
    private String photoType;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "created_at", updatable = false,
            columnDefinition = "timestamptz default now()")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

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

    public byte[]         getPhotoData()                 { return photoData; }
    public void           setPhotoData(byte[] v)         { this.photoData = v; }

    public String         getPhotoType()                 { return photoType; }
    public void           setPhotoType(String v)         { this.photoType = v; }

    public String         getNotes()                     { return notes; }
    public void           setNotes(String v)             { this.notes = v; }

    public OffsetDateTime getCreatedAt()                 { return createdAt; }
    public void           setCreatedAt(OffsetDateTime v) { this.createdAt = v; }
}
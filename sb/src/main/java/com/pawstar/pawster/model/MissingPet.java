package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "missing_pets")
public class MissingPet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // "lost" or "found"
    private String name;
    private String species;
    private String breed;
    private String area;
    private String color;

    @Column(columnDefinition = "TEXT")
    private String details;

    private LocalDate reportedDate;

    @PrePersist
    public void prePersist() {
        this.reportedDate = LocalDate.now();
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }
    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDate getReportedDate() { return reportedDate; }
    public void setReportedDate(LocalDate reportedDate) { this.reportedDate = reportedDate; }
}
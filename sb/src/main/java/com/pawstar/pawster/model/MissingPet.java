package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    private String address; // full address where lost/found
    private Double latitude; // geocoded lat for map
    private Double longitude; // geocoded lng for map
    private String photoUrl; // uploaded photo path
    private String status;

    @Column(name = "reporter_user_id")
    private Integer reporterUserId;

    @Column(name = "resolved_by_user")
    private Boolean resolvedByUser = false;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        this.reportedDate = LocalDate.now();
    }

    // Getters & Setters

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDate getReportedDate() {
        return reportedDate;
    }

    public void setReportedDate(LocalDate reportedDate) {
        this.reportedDate = reportedDate;
    }

    public Integer getReporterUserId() {
        return reporterUserId;
    }

    public void setReporterUserId(Integer reporterUserId) {
        this.reporterUserId = reporterUserId;
    }

    public Boolean getResolvedByUser() {
        return resolvedByUser;
    }

    public void setResolvedByUser(Boolean resolvedByUser) {
        this.resolvedByUser = resolvedByUser;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
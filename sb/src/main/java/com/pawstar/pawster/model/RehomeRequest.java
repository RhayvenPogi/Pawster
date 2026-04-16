package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "rehome_requests")
public class RehomeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** FK → users.id (nullable: SET NULL on delete) */
    @Column(name = "user_id")
    private Integer userId;

    // ── Owner Info ─────────────────────────────────────────────────────────────

    @Column(name = "owner_name", length = 160)
    private String ownerName;

    @Column(length = 180)
    private String contact; // owner email

    @Column(name = "contact_no", length = 30)
    private String contactNo; // owner phone

    @Column(length = 120)
    private String city;

    // ── Pet Info ───────────────────────────────────────────────────────────────

    @Column(name = "pet_name", length = 120)
    private String petName;

    @Column(length = 60)
    private String species; // Dog, Cat, etc.

    @Column(length = 120)
    private String breed;

    @Column(length = 40)
    private String age;

    @Column(name = "photo_base64", columnDefinition = "text")
    private String photoBase64;

    // ── Pet Traits ─────────────────────────────────────────────────────────────

    @Column(columnDefinition = "text")
    private String behavior;

    @Column(name = "behavior_other", columnDefinition = "text")
    private String behaviorOther;

    @Column(name = "medical_notes", columnDefinition = "text")
    private String medicalNotes;

    @Column(name = "ideal_home_desc", columnDefinition = "text")
    private String idealHomeDesc;

    @Column(name = "good_with_children")
    private Boolean goodWithChildren;

    @Column(name = "good_with_pets")
    private Boolean goodWithPets;

    @Column(name = "is_house_trained")
    private Boolean isHouseTrained;

    @Column(name = "is_leash_trained")
    private Boolean isLeashTrained;

    @Column(name = "is_vaccinated")
    private Boolean isVaccinated;

    @Column(name = "vaccine_type", length = 120)
    private String vaccineType;

    // ── Request Status ─────────────────────────────────────────────────────────

    /** Pending | Approved | Rejected */
    @Column(nullable = false, length = 40)
    private String status = "Pending";

    @Column(name = "reject_note", columnDefinition = "text")
    private String rejectNote;

    @Column(name = "created_at", updatable = false, columnDefinition = "timestamptz default now()")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null)
            createdAt = OffsetDateTime.now();
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer getId() { return id; }
    public void setId(Integer v) { this.id = v; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer v) { this.userId = v; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String v) { this.ownerName = v; }

    public String getContact() { return contact; }
    public void setContact(String v) { this.contact = v; }

    public String getContactNo() { return contactNo; }
    public void setContactNo(String v) { this.contactNo = v; }

    public String getCity() { return city; }
    public void setCity(String v) { this.city = v; }

    public String getPetName() { return petName; }
    public void setPetName(String v) { this.petName = v; }

    public String getSpecies() { return species; }
    public void setSpecies(String v) { this.species = v; }

    public String getBreed() { return breed; }
    public void setBreed(String v) { this.breed = v; }

    public String getAge() { return age; }
    public void setAge(String v) { this.age = v; }

    public String getPhotoBase64() { return photoBase64; }
    public void setPhotoBase64(String v) { this.photoBase64 = v; }

    public String getBehavior() { return behavior; }
    public void setBehavior(String v) { this.behavior = v; }

    public String getBehaviorOther() { return behaviorOther; }
    public void setBehaviorOther(String v) { this.behaviorOther = v; }

    public String getMedicalNotes() { return medicalNotes; }
    public void setMedicalNotes(String v) { this.medicalNotes = v; }

    public String getIdealHomeDesc() { return idealHomeDesc; }
    public void setIdealHomeDesc(String v) { this.idealHomeDesc = v; }

    public Boolean getGoodWithChildren() { return goodWithChildren; }
    public void setGoodWithChildren(Boolean v) { this.goodWithChildren = v; }

    public Boolean getGoodWithPets() { return goodWithPets; }
    public void setGoodWithPets(Boolean v) { this.goodWithPets = v; }

    public Boolean getIsHouseTrained() { return isHouseTrained; }
    public void setIsHouseTrained(Boolean v) { this.isHouseTrained = v; }

    public Boolean getIsLeashTrained() { return isLeashTrained; }
    public void setIsLeashTrained(Boolean v) { this.isLeashTrained = v; }

    public Boolean getIsVaccinated() { return isVaccinated; }
    public void setIsVaccinated(Boolean v) { this.isVaccinated = v; }

    public String getVaccineType() { return vaccineType; }
    public void setVaccineType(String v) { this.vaccineType = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getRejectNote() { return rejectNote; }
    public void setRejectNote(String v) { this.rejectNote = v; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { this.createdAt = v; }
}
package com.pawstar.pawster.dto;

import java.time.OffsetDateTime;

/**
 * DTO returned to the frontend for adoption request data.
 * Combines fields from adoption_requests + animals + users
 * so the UI gets everything it needs in one response — no extra calls.
 *
 * GET /api/adoption
 * GET /api/adoption/{id}
 * GET /api/adoption/my-requests
 */
public class AdoptionRequestDto {

    // ── From adoption_requests ─────────────────────────────────────────────────
    private Integer       id;
    private String        petName;
    private String        name;         // applicant full name
    private String        email;
    private String        phone;
    private String        address;
    private String        reason;
    private String        status;       // Pending | Approved | Rejected
    private String        rejectNote;
    private OffsetDateTime createdAt;

    // ── From users (joined by userId) ─────────────────────────────────────────
    private Integer       userId;
    private String        userFirstName;
    private String        userLastName;
    private String        userEmail;

    // ── From animals (matched by petName) ─────────────────────────────────────
    private String        animalType;   // Dog | Cat | Bird | Rabbit | Other
    private String        animalBreed;
    private String        animalAge;
    private String        animalHealth;
    private String        animalPhoto;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer        getId()                         { return id; }
    public void           setId(Integer v)                { this.id = v; }

    public String         getPetName()                    { return petName; }
    public void           setPetName(String v)            { this.petName = v; }

    public String         getName()                       { return name; }
    public void           setName(String v)               { this.name = v; }

    public String         getEmail()                      { return email; }
    public void           setEmail(String v)              { this.email = v; }

    public String         getPhone()                      { return phone; }
    public void           setPhone(String v)              { this.phone = v; }

    public String         getAddress()                    { return address; }
    public void           setAddress(String v)            { this.address = v; }

    public String         getReason()                     { return reason; }
    public void           setReason(String v)             { this.reason = v; }

    public String         getStatus()                     { return status; }
    public void           setStatus(String v)             { this.status = v; }

    public String         getRejectNote()                 { return rejectNote; }
    public void           setRejectNote(String v)         { this.rejectNote = v; }

    public OffsetDateTime getCreatedAt()                  { return createdAt; }
    public void           setCreatedAt(OffsetDateTime v)  { this.createdAt = v; }

    public Integer        getUserId()                     { return userId; }
    public void           setUserId(Integer v)            { this.userId = v; }

    public String         getUserFirstName()              { return userFirstName; }
    public void           setUserFirstName(String v)      { this.userFirstName = v; }

    public String         getUserLastName()               { return userLastName; }
    public void           setUserLastName(String v)       { this.userLastName = v; }

    public String         getUserEmail()                  { return userEmail; }
    public void           setUserEmail(String v)          { this.userEmail = v; }

    public String         getAnimalType()                 { return animalType; }
    public void           setAnimalType(String v)         { this.animalType = v; }

    public String         getAnimalBreed()                { return animalBreed; }
    public void           setAnimalBreed(String v)        { this.animalBreed = v; }

    public String         getAnimalAge()                  { return animalAge; }
    public void           setAnimalAge(String v)          { this.animalAge = v; }

    public String         getAnimalHealth()               { return animalHealth; }
    public void           setAnimalHealth(String v)       { this.animalHealth = v; }

    public String         getAnimalPhoto()                { return animalPhoto; }
    public void           setAnimalPhoto(String v)        { this.animalPhoto = v; }
}
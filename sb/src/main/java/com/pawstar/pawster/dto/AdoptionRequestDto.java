package com.pawstar.pawster.dto;

import java.time.OffsetDateTime;
import java.util.Base64;

/**
 * DTO returned for all adoption request endpoints.
 * Fields are populated in a single JOIN query — no N+1, no extra repo calls.
 *
 * The all-args constructor matches the field order in AdoptionRepository's
 * JPQL SELECT new ... expression exactly.
 */
public class AdoptionRequestDto {

    // ── adoption_requests columns ──────────────────────────────────────────────
    private Integer        id;
    private Integer        userId;
    private String         petName;
    private String         name;
    private String         email;
    private String         phone;
    private String         address;
    private String         reason;
    private String         status;
    private String         rejectNote;
    private OffsetDateTime createdAt;

    // ── joined from users ──────────────────────────────────────────────────────
    private String         userFirstName;
    private String         userLastName;
    private String         userEmail;

    // ── joined from animals ───────────────────────────────────────────────────
    private String         animalType;
    private String         animalBreed;
    private String         animalAge;
    private String         animalHealth;
    private byte[]         animalPhotoData;   // raw bytes from DB
    private String         animalPhotoType;   // e.g. "image/jpeg"

    // ── No-arg constructor (required by Jackson) ───────────────────────────────
    public AdoptionRequestDto() {}

    // ── All-args constructor (required by JPQL SELECT new ...()) ──────────────
    // Order must match the SELECT field list in AdoptionRepository exactly.
    public AdoptionRequestDto(
            Integer        id,
            Integer        userId,
            String         petName,
            String         name,
            String         email,
            String         phone,
            String         address,
            String         reason,
            String         status,
            String         rejectNote,
            OffsetDateTime createdAt,
            String         userFirstName,
            String         userLastName,
            String         userEmail,
            String         animalType,
            String         animalBreed,
            String         animalAge,
            String         animalHealth,
            byte[]         animalPhotoData,
            String         animalPhotoType
    ) {
        this.id              = id;
        this.userId          = userId;
        this.petName         = petName;
        this.name            = name;
        this.email           = email;
        this.phone           = phone;
        this.address         = address;
        this.reason          = reason;
        this.status          = status;
        this.rejectNote      = rejectNote;
        this.createdAt       = createdAt;
        this.userFirstName   = userFirstName;
        this.userLastName    = userLastName;
        this.userEmail       = userEmail;
        this.animalType      = animalType;
        this.animalBreed     = animalBreed;
        this.animalAge       = animalAge;
        this.animalHealth    = animalHealth;
        this.animalPhotoData = animalPhotoData;
        this.animalPhotoType = animalPhotoType;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer getId()                          { return id; }
    public void    setId(Integer v)                 { this.id = v; }

    public Integer getUserId()                      { return userId; }
    public void    setUserId(Integer v)             { this.userId = v; }

    public String  getPetName()                     { return petName; }
    public void    setPetName(String v)             { this.petName = v; }

    public String  getName()                        { return name; }
    public void    setName(String v)                { this.name = v; }

    public String  getEmail()                       { return email; }
    public void    setEmail(String v)               { this.email = v; }

    public String  getPhone()                       { return phone; }
    public void    setPhone(String v)               { this.phone = v; }

    public String  getAddress()                     { return address; }
    public void    setAddress(String v)             { this.address = v; }

    public String  getReason()                      { return reason; }
    public void    setReason(String v)              { this.reason = v; }

    public String  getStatus()                      { return status; }
    public void    setStatus(String v)              { this.status = v; }

    public String  getRejectNote()                  { return rejectNote; }
    public void    setRejectNote(String v)          { this.rejectNote = v; }

    public OffsetDateTime getCreatedAt()            { return createdAt; }
    public void    setCreatedAt(OffsetDateTime v)   { this.createdAt = v; }

    public String  getUserFirstName()               { return userFirstName; }
    public void    setUserFirstName(String v)       { this.userFirstName = v; }

    public String  getUserLastName()                { return userLastName; }
    public void    setUserLastName(String v)        { this.userLastName = v; }

    public String  getUserEmail()                   { return userEmail; }
    public void    setUserEmail(String v)           { this.userEmail = v; }

    public String  getAnimalType()                  { return animalType; }
    public void    setAnimalType(String v)          { this.animalType = v; }

    public String  getAnimalBreed()                 { return animalBreed; }
    public void    setAnimalBreed(String v)         { this.animalBreed = v; }

    public String  getAnimalAge()                   { return animalAge; }
    public void    setAnimalAge(String v)           { this.animalAge = v; }

    public String  getAnimalHealth()                { return animalHealth; }
    public void    setAnimalHealth(String v)        { this.animalHealth = v; }

    // Raw bytes setter (used internally / by JPQL)
    public byte[]  getAnimalPhotoData()             { return animalPhotoData; }
    public void    setAnimalPhotoData(byte[] v)     { this.animalPhotoData = v; }

    public String  getAnimalPhotoType()             { return animalPhotoType; }
    public void    setAnimalPhotoType(String v)     { this.animalPhotoType = v; }

    /**
     * Jackson serializes THIS getter as "animalPhoto".
     * Returns a ready-to-use data URL, or null if no photo stored.
     * Frontend can drop it straight into <img src={dto.animalPhoto} />
     */
    public String  getAnimalPhoto() {
        if (animalPhotoData == null || animalPhotoData.length == 0) return null;
        String mime = animalPhotoType != null ? animalPhotoType : "image/jpeg";
        return "data:" + mime + ";base64," +
               Base64.getEncoder().encodeToString(animalPhotoData);
    }
}
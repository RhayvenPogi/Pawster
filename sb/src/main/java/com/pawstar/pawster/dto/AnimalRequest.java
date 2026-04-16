package com.pawstar.pawster.dto;

import java.util.Base64;

/**
 * DTO received from the frontend when creating or updating an animal.
 * photoData = raw base64 string (no "data:...;base64," prefix)
 * photoType = MIME type, e.g. "image/jpeg"
 */
public class AnimalRequest {

    private String name;
    private String type;
    private String breed;
    private String age;
    private String health;
    private String status;
    private String notes;

    /** Raw base64 string from the frontend (no data: prefix) */
    private String photoData;

    /** MIME type e.g. "image/jpeg", "image/png" */
    private String photoType;

    /** True when the user explicitly removed the photo */
    private boolean removePhoto;

    // ── Convenience: decode base64 → bytes ────────────────────────────────────
    public byte[] decodePhotoData() {
        if (photoData == null || photoData.isBlank()) return null;
        return Base64.getDecoder().decode(photoData);
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public String  getName()                   { return name; }
    public void    setName(String v)           { this.name = v; }

    public String  getType()                   { return type; }
    public void    setType(String v)           { this.type = v; }

    public String  getBreed()                  { return breed; }
    public void    setBreed(String v)          { this.breed = v; }

    public String  getAge()                    { return age; }
    public void    setAge(String v)            { this.age = v; }

    public String  getHealth()                 { return health; }
    public void    setHealth(String v)         { this.health = v; }

    public String  getStatus()                 { return status; }
    public void    setStatus(String v)         { this.status = v; }

    public String  getNotes()                  { return notes; }
    public void    setNotes(String v)          { this.notes = v; }

    public String  getPhotoData()              { return photoData; }
    public void    setPhotoData(String v)      { this.photoData = v; }

    public String  getPhotoType()              { return photoType; }
    public void    setPhotoType(String v)      { this.photoType = v; }

    public boolean isRemovePhoto()             { return removePhoto; }
    public void    setRemovePhoto(boolean v)   { this.removePhoto = v; }
}
package com.pawstar.pawster.dto;

/**
 * DTO received from the frontend when creating or updating an animal.
 * Keeps @Entity (Animal.java) clean — no raw user input touches the model directly.
 *
 * POST /api/animals        → create
 * PUT  /api/animals/{id}   → update
 */
public class AnimalRequest {

    private String name;

    /** Dog | Cat | Bird | Rabbit | Other */
    private String type;

    private String breed;

    /** Free-text age, e.g. "2 years", "6 months" */
    private String age;

    /** Healthy | Needs Care | Under Treatment */
    private String health;

    /** Available | Pending | Adopted | Not Available */
    private String status;

    /** URL or relative path to the animal's photo */
    private String photo;

    private String notes;

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public String getName()              { return name; }
    public void   setName(String v)      { this.name = v; }

    public String getType()              { return type; }
    public void   setType(String v)      { this.type = v; }

    public String getBreed()             { return breed; }
    public void   setBreed(String v)     { this.breed = v; }

    public String getAge()               { return age; }
    public void   setAge(String v)       { this.age = v; }

    public String getHealth()            { return health; }
    public void   setHealth(String v)    { this.health = v; }

    public String getStatus()            { return status; }
    public void   setStatus(String v)    { this.status = v; }

    public String getPhoto()             { return photo; }
    public void   setPhoto(String v)     { this.photo = v; }

    public String getNotes()             { return notes; }
    public void   setNotes(String v)     { this.notes = v; }
}         
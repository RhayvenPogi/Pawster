package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String password;

    @Column(columnDefinition = "text")
    private String address;

    @Column(length = 50)
    private String city;

    @Column(length = 50)
    private String province;

    @Column(name = "zip_code", length = 15)
    private String zip;

    /**
     * Raw file bytes stored directly in the DB (PostgreSQL bytea column).
     * Replaces the old file-path approach — no folder needed.
     */
    @Lob
    @Column(name = "id_file_path", columnDefinition = "bytea")
    private byte[] idFile;

    /** Original MIME type of the uploaded file (e.g. "image/jpeg"). */
    @Column(name = "id_file_type", length = 50)
    private String idFileType;

    /** Original filename so it can be served back with the right name. */
    @Column(name = "id_file_name", length = 255)
    private String idFileName;

    @Column(name = "created_at", updatable = false,
            columnDefinition = "timestamp default CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    /** pending | approved | rejected */
    @Column(nullable = false, length = 20)
    private String status = "pending";

    /** user | admin */
    @Column(nullable = false, length = 20)
    private String role = "user";

    @Column(name = "is_active")
    private Integer isActive = 1;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    // ── Constructors ──────────────────────────────────────────────────────────

    public User() {}

    public User(String firstName, String lastName, String email,
                String phone,    String password,  String address,
                String city,     String province,  String zip,
                byte[] idFile,   String idFileType, String idFileName) {
        this.firstName   = firstName;
        this.lastName    = lastName;
        this.email       = email;
        this.phone       = phone;
        this.password    = password;
        this.address     = address;
        this.city        = city;
        this.province    = province;
        this.zip         = zip;
        this.idFile      = idFile;
        this.idFileType  = idFileType;
        this.idFileName  = idFileName;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Integer       getId()                       { return id; }
    public void          setId(Integer v)              { this.id = v; }

    public String        getFirstName()                { return firstName; }
    public void          setFirstName(String v)        { this.firstName = v; }

    public String        getLastName()                 { return lastName; }
    public void          setLastName(String v)         { this.lastName = v; }

    public String        getEmail()                    { return email; }
    public void          setEmail(String v)            { this.email = v; }

    public String        getPhone()                    { return phone; }
    public void          setPhone(String v)            { this.phone = v; }

    public String        getPassword()                 { return password; }
    public void          setPassword(String v)         { this.password = v; }

    public String        getAddress()                  { return address; }
    public void          setAddress(String v)          { this.address = v; }

    public String        getCity()                     { return city; }
    public void          setCity(String v)             { this.city = v; }

    public String        getProvince()                 { return province; }
    public void          setProvince(String v)         { this.province = v; }

    public String        getZip()                      { return zip; }
    public void          setZip(String v)              { this.zip = v; }

    public byte[]        getIdFile()                   { return idFile; }
    public void          setIdFile(byte[] v)           { this.idFile = v; }

    public String        getIdFileType()               { return idFileType; }
    public void          setIdFileType(String v)       { this.idFileType = v; }

    public String        getIdFileName()               { return idFileName; }
    public void          setIdFileName(String v)       { this.idFileName = v; }

    public LocalDateTime getCreatedAt()                { return createdAt; }
    public void          setCreatedAt(LocalDateTime v) { this.createdAt = v; }

    public String        getStatus()                   { return status; }
    public void          setStatus(String v)           { this.status = v; }

    public String        getRole()                     { return role; }
    public void          setRole(String v)             { this.role = v; }

    public Integer       getIsActive()                 { return isActive; }
    public void          setIsActive(Integer v)        { this.isActive = v; }

    public LocalDateTime getLastLogin()                { return lastLogin; }
    public void          setLastLogin(LocalDateTime v) { this.lastLogin = v; }
}
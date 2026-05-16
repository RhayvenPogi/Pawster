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

    // ── Profile photo ─────────────────────────────────────────────────────────

    @Column(name = "photo", columnDefinition = "bytea")
    private byte[] photo;

    @Column(name = "photo_type", length = 50)
    private String photoType;

    @Column(name = "photo_name", length = 255)
    private String photoName;

    // ── ID verification file ──────────────────────────────────────────────────

    @Column(name = "id_file", columnDefinition = "bytea")
    private byte[] idFile;

    @Column(name = "id_file_type", length = 50)
    private String idFileType;

    @Column(name = "id_file_name", length = 255)
    private String idFileName;

    @Column(name = "created_at", updatable = false, columnDefinition = "timestamp default CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(nullable = false, length = 20)
    private String status = "pending";

    @Column(nullable = false, length = 20)
    private String role = "user";

    @Column(name = "is_active")
    private Integer isActive = 1;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // ── Password reset OTP ────────────────────────────────────────────────────

    @Column(name = "reset_otp", length = 6)
    private String resetOtp;

    @Column(name = "reset_otp_expires_at")
    private LocalDateTime resetOtpExpiresAt;

    @Column(name = "reset_otp_verified")
    private boolean resetOtpVerified = false;

    @Column(name = "profile_complete", nullable = false)
    private boolean profileComplete = false;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        if (createdAt == null)
            createdAt = LocalDateTime.now();
    }

    // ── Constructors ──────────────────────────────────────────────────────────

    public User() {
    }

    public User(String firstName, String lastName, String email,
            String phone, String password, String address,
            String city, String province, String zip,
            byte[] idFile, String idFileType, String idFileName) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.address = address;
        this.city = city;
        this.province = province;
        this.zip = zip;
        this.idFile = idFile;
        this.idFileType = idFileType;
        this.idFileName = idFileName;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getZip() {
        return zip;
    }

    public void setZip(String zip) {
        this.zip = zip;
    }

    public byte[] getPhoto() {
        return photo;
    }

    public void setPhoto(byte[] photo) {
        this.photo = photo;
    }

    public String getPhotoType() {
        return photoType;
    }

    public void setPhotoType(String photoType) {
        this.photoType = photoType;
    }

    public String getPhotoName() {
        return photoName;
    }

    public void setPhotoName(String photoName) {
        this.photoName = photoName;
    }

    public byte[] getIdFile() {
        return idFile;
    }

    public void setIdFile(byte[] idFile) {
        this.idFile = idFile;
    }

    public String getIdFileType() {
        return idFileType;
    }

    public void setIdFileType(String idFileType) {
        this.idFileType = idFileType;
    }

    public String getIdFileName() {
        return idFileName;
    }

    public void setIdFileName(String idFileName) {
        this.idFileName = idFileName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Integer getIsActive() {
        return isActive;
    }

    public void setIsActive(Integer isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public String getResetOtp() {
        return resetOtp;
    }

    public void setResetOtp(String resetOtp) {
        this.resetOtp = resetOtp;
    }

    public LocalDateTime getResetOtpExpiresAt() {
        return resetOtpExpiresAt;
    }

    public void setResetOtpExpiresAt(LocalDateTime resetOtpExpiresAt) {
        this.resetOtpExpiresAt = resetOtpExpiresAt;
    }

    public boolean isResetOtpVerified() {
        return resetOtpVerified;
    }

    public void setResetOtpVerified(boolean resetOtpVerified) {
        this.resetOtpVerified = resetOtpVerified;
    }

    public boolean isProfileComplete() {
        return profileComplete;
    }

    public void setProfileComplete(boolean profileComplete) {
        this.profileComplete = profileComplete;
    }
}
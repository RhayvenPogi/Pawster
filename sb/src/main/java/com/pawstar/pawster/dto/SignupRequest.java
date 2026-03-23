package com.pawstar.pawster.dto;


public class SignupRequest {

    // Step 1 – Personal Info
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String password;

    // Step 2 – Location
    private String address;
    private String city;
    private String province;
    private String zip;

    // Step 3 – Verification (handled separately as MultipartFile)
    // idFile is NOT included here; it is received as @RequestParam in the controller

    // ── Getters & Setters ───────────────────────────────────────

    public String getFirstName()              { return firstName; }
    public void   setFirstName(String v)      { this.firstName = v; }

    public String getLastName()               { return lastName; }
    public void   setLastName(String v)       { this.lastName = v; }

    public String getEmail()                  { return email; }
    public void   setEmail(String v)          { this.email = v; }

    public String getPhone()                  { return phone; }
    public void   setPhone(String v)          { this.phone = v; }

    public String getPassword()               { return password; }
    public void   setPassword(String v)       { this.password = v; }

    public String getAddress()                { return address; }
    public void   setAddress(String v)        { this.address = v; }

    public String getCity()                   { return city; }
    public void   setCity(String v)           { this.city = v; }

    public String getProvince()               { return province; }
    public void   setProvince(String v)       { this.province = v; }

    public String getZip()                    { return zip; }
    public void   setZip(String v)            { this.zip = v; }
}
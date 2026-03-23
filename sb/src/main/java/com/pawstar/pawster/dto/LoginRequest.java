package com.pawstar.pawster.dto;

/**
 * Login payload.
 * The PHP login.php identifies users by EMAIL, so the field is named
 * "email" here; the AuthController maps it to Spring Security's
 * "username" slot when calling the AuthenticationManager.
 */
public class LoginRequest {

    private String email;
    private String password;

    // ── Constructors ────────────────────────────────────────────

    public LoginRequest() {}

    public LoginRequest(String email, String password) {
        this.email    = email;
        this.password = password;
    }

    // ── Getters & Setters ───────────────────────────────────────

    public String getEmail()             { return email; }
    public void   setEmail(String v)     { this.email = v; }

    /**
     * Convenience alias so Spring Security's UsernamePasswordAuthenticationToken
     * integration in AuthController can still call getUsername().
     */
    public String getUsername()          { return email; }

    public String getPassword()          { return password; }
    public void   setPassword(String v)  { this.password = v; }
}

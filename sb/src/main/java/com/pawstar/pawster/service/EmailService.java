package com.pawstar.pawster.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class EmailService {

    @Value("${BREVO_API_KEY}")
    private String brevoApiKey;

    @Value("${app.base-url}")
    private String baseUrl;

    private static final String LOGO_URL = "https://i.imgur.com/qVRCfX7.png";

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public void sendOtpEmail(String toEmail, String otp) {
        sendEmail(toEmail, "Pawster — Your Password Reset PIN", buildOtpHtml(otp));
    }

    public void sendWelcomeEmail(String toEmail, String firstName, String role, String plainPassword) {
        String roleLabel = "admin".equalsIgnoreCase(role) ? "Administrator" : "User";
        sendEmail(toEmail, "Welcome to Pawster — Your Account is Ready!", buildWelcomeHtml(firstName, roleLabel, toEmail, plainPassword));
    }

    private void sendEmail(String to, String subject, String html) {
        try {
            String jsonBody = "{"
                + "\"sender\":{\"name\":\"Pawster\",\"email\":\"PawsterPawnagayat@gmail.com\"},"
                + "\"to\":[{\"email\":\"" + to + "\"}],"
                + "\"subject\":\"" + escapeJson(subject) + "\","
                + "\"htmlContent\":\"" + escapeJson(html) + "\""
                + "}";

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", brevoApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("✅ Email sent to " + to + " | status: " + response.statusCode());
            } else {
                System.err.println("⚠️ Brevo API error " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send email to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "")
                .replace("\t", "\\t");
    }

    private String buildOtpHtml(String otp) {
        StringBuilder digits = new StringBuilder();
        for (char c : otp.toCharArray()) {
            digits.append("<span style=\"display:inline-block;width:48px;height:56px;line-height:56px;"
                + "text-align:center;background:#fff;border:2px solid #1c4f09;"
                + "border-radius:10px;font-size:28px;font-weight:900;color:#1c4f09;margin:4px;\">"
                + c + "</span>");
        }
        return "<div style=\"font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"
            + "background:#fffdf5;border:1.5px solid #e8d8a0;border-radius:16px;overflow:hidden;\">"
            + "<div style=\"background:#1c4f09;padding:28px 32px;text-align:center;\">"
            + "<img src=\"" + LOGO_URL + "\" alt=\"Pawster\" style=\"height:64px;width:auto;margin-bottom:10px;\" />"
            + "<h1 style=\"margin:0;color:#fff;font-size:26px;font-weight:900;\">Pawster</h1>"
            + "<p style=\"margin:6px 0 0;color:#a8d890;font-size:13px;\">Every Pet Deserves Love</p>"
            + "</div><div style=\"padding:32px;\">"
            + "<h2 style=\"color:#1a4a08;\">Password Reset Request</h2>"
            + "<p style=\"color:#3a5020;font-size:14px;\">Use the PIN below. Valid for <strong>10 minutes</strong>.</p>"
            + "<div style=\"background:#f0f7e8;border:1.5px solid #b0d890;border-radius:12px;padding:28px;text-align:center;\">"
            + "<p style=\"font-weight:700;color:#3a5020;\">Your One-Time PIN</p>"
            + "<div>" + digits + "</div></div></div>"
            + "<div style=\"background:#f5f0e0;padding:16px 32px;text-align:center;\">"
            + "<p style=\"font-size:11px;color:#9a8a60;\">Do not share this PIN with anyone.</p>"
            + "</div></div>";
    }

    private String buildWelcomeHtml(String firstName, String roleLabel, String email, String password) {
        return "<div style=\"font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"
            + "background:#fffdf5;border:1.5px solid #e8d8a0;border-radius:16px;overflow:hidden;\">"
            + "<div style=\"background:#1c4f09;padding:28px 32px;text-align:center;\">"
            + "<img src=\"" + LOGO_URL + "\" alt=\"Pawster\" style=\"height:64px;width:auto;margin-bottom:10px;\" />"
            + "<h1 style=\"margin:0;color:#fff;font-size:26px;font-weight:900;\">Pawster</h1>"
            + "</div><div style=\"padding:32px;\">"
            + "<h2 style=\"color:#1a4a08;\">Welcome, " + firstName + "! 👋</h2>"
            + "<p>Your account has been created as <strong>" + roleLabel + "</strong>.</p>"
            + "<p>Email: <strong>" + email + "</strong></p>"
            + "<p>Password: <code style=\"background:#f0f7e8;padding:3px 8px;border-radius:4px;\">" + password + "</code></p>"
            + "<a href=\"" + baseUrl + "\" style=\"display:inline-block;background:#1c4f09;color:#fff;"
            + "padding:13px 36px;border-radius:50px;text-decoration:none;font-weight:900;\">Sign In →</a>"
            + "</div></div>";
    }
}
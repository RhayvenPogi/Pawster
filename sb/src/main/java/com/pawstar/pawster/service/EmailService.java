package com.pawstar.pawster.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    /**
     * Sends a welcome email with login credentials to a newly created user/admin.
     */
    public void sendWelcomeEmail(String toEmail, String firstName, String role, String plainPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🐾 Welcome to Pawster — Your Account is Ready!");

            String roleLabel = "admin".equalsIgnoreCase(role) ? "Administrator" : "User";

            String html = """
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;
                    background:#fffdf5;border:1.5px solid #e8d8a0;border-radius:16px;overflow:hidden;">
          <div style="background:#1c4f09;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;">🐾 Pawster</h1>
            <p style="margin:6px 0 0;color:#a8d890;font-size:13px;">Every Pet Deserves Love</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#1a4a08;font-size:20px;margin:0 0 8px;">Welcome, %s! 👋</h2>
            <p style="color:#3a5020;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Your account has been created as a <strong>%s</strong>. Use the credentials below to sign in.
            </p>
            <div style="background:#f0f7e8;border:1.5px solid #b0d890;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:13px;color:#3a5020;font-weight:700;">🔐 Your Login Credentials</p>
              <table style="width:100%%;">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#6a7a50;width:90px;">Email</td>
                  <td style="padding:6px 0;font-size:13px;color:#1a4a08;font-weight:800;">%s</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#6a7a50;">Password</td>
                  <td style="padding:6px 0;">
                    <code style="background:#fff;border:1px solid #c8e0a0;border-radius:6px;
                                 padding:3px 10px;font-size:14px;color:#1c4f09;font-weight:900;">%s</code>
                  </td>
                </tr>
              </table>
            </div>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="%s" style="display:inline-block;background:#1c4f09;color:#fff;text-decoration:none;
                                  padding:13px 36px;border-radius:50px;font-size:14px;font-weight:900;">
                Sign In to Pawster →
              </a>
            </div>
            <div style="background:#fff8e8;border:1px solid #e8d080;border-radius:10px;padding:14px 18px;">
              <p style="margin:0;font-size:12px;color:#7a6020;">
                ⚠️ <strong>Security tip:</strong> Please change your password after your first login.
              </p>
            </div>
          </div>
          <div style="background:#f5f0e0;padding:16px 32px;text-align:center;border-top:1px solid #e0d0a0;">
            <p style="margin:0;font-size:11px;color:#9a8a60;">
              This email was sent by Pawster. If you did not expect this, please ignore it.
            </p>
          </div>
        </div>
        """.formatted(firstName, roleLabel, toEmail, plainPassword, baseUrl);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            // Log but don't crash — user was already saved
            System.err.println("⚠️  Failed to send welcome email to " + toEmail + ": " + e.getMessage());
        }
    }
}
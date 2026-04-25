package com.pawstar.pawster.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The non-admin user in the conversation.
     * Every message (whether sent by user or admin) is filed under this userId.
     */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** Who actually sent this message */
    @Column(name = "sender_id", nullable = false)
    private Integer senderId;

    /** "user" or "admin" */
    @Column(name = "sender_role", nullable = false, length = 20)
    private String senderRole;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now(ZoneOffset.UTC);

    /** Relative URL of the uploaded file, e.g. /uploads/messages/uuid_filename.jpg */
    @Column(name = "attachment_url")
    private String attachmentUrl;

    /** One of: "image", "video", "file" */
    @Column(name = "attachment_type", length = 20)
    private String attachmentType;

    @Column(name = "is_bot", nullable = false)
    private boolean isBot = false;

    public Message() {}

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }

    public boolean isBot()           { return isBot; }
    public void    setBot(boolean b) { this.isBot = b; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getSenderId() { return senderId; }
    public void setSenderId(Integer senderId) { this.senderId = senderId; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public String getAttachmentType() { return attachmentType; }
    public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }
}
package com.pawstar.pawster.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;


@Document(collection = "messages")
public class Message {

    @Id
    private String id;

    @Indexed
    @Field("user_id")
    private Integer userId;

    @Field("sender_id")
    private Integer senderId;

    @Field("sender_role")
    private String senderRole;

    @Field("content")
    private String content;

    @Field("is_read")
    private boolean isRead = false;

    @Field("created_at")
    @Indexed
    private Instant createdAt = Instant.now();

    @Field("attachment_url")
    private String attachmentUrl;

    @Field("attachment_type")
    private String attachmentType;

    @Field("is_bot")
    private boolean isBot = false;

    public Message() {}

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId()          { return id; }
    public void   setId(String id) { this.id = id; }

    public boolean isBot()           { return isBot; }
    public void    setBot(boolean b) { this.isBot = b; }

    public Integer getUserId()                   { return userId; }
    public void    setUserId(Integer userId)     { this.userId = userId; }

    public Integer getSenderId()                 { return senderId; }
    public void    setSenderId(Integer senderId) { this.senderId = senderId; }

    public String getSenderRole()                  { return senderRole; }
    public void   setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getContent()               { return content; }
    public void   setContent(String content) { this.content = content; }

    public boolean isRead()              { return isRead; }
    public void    setRead(boolean read) { isRead = read; }

    public Instant getCreatedAt()                         { return createdAt; }
    public void           setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getAttachmentUrl()                       { return attachmentUrl; }
    public void   setAttachmentUrl(String attachmentUrl)   { this.attachmentUrl = attachmentUrl; }

    public String getAttachmentType()                      { return attachmentType; }
    public void   setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }
}
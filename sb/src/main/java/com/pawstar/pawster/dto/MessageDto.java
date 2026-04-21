package com.pawstar.pawster.dto;

import java.time.OffsetDateTime;

public class MessageDto {

    // ── Inbound payload from WebSocket client ─────────────────────────────────
    public static class ChatMessage {
        private String content;
        /**
         * Only needed when the ADMIN sends: which user's conversation to reply to.
         * Users leave this null (server fills it from their own userId).
         */
        private Integer targetUserId;

        /** Set by server after a file upload — not sent directly by client over WS */
        private String attachmentUrl;
        private String attachmentType;

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public Integer getTargetUserId() { return targetUserId; }
        public void setTargetUserId(Integer targetUserId) { this.targetUserId = targetUserId; }

        public String getAttachmentUrl() { return attachmentUrl; }
        public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

        public String getAttachmentType() { return attachmentType; }
        public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }
    }

    // ── Outbound payload pushed to WebSocket subscribers ─────────────────────
    public static class MessageResponse {
        private Long id;
        private Integer userId;
        private Integer senderId;
        private String senderRole;
        private String senderName;
        private String content;
        private boolean isRead;
        private OffsetDateTime createdAt;
        private String attachmentUrl;
        private String attachmentType;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Integer getUserId() { return userId; }
        public void setUserId(Integer userId) { this.userId = userId; }

        public Integer getSenderId() { return senderId; }
        public void setSenderId(Integer senderId) { this.senderId = senderId; }

        public String getSenderRole() { return senderRole; }
        public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }

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

    // ── Conversation thread summary (used in admin inbox list) ────────────────
    public static class ConversationSummary {
        private Integer userId;
        private String userName;
        private String lastMessage;
        private OffsetDateTime lastMessageAt;
        private long unreadCount;

        public Integer getUserId() { return userId; }
        public void setUserId(Integer userId) { this.userId = userId; }

        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }

        public String getLastMessage() { return lastMessage; }
        public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }

        public OffsetDateTime getLastMessageAt() { return lastMessageAt; }
        public void setLastMessageAt(OffsetDateTime lastMessageAt) { this.lastMessageAt = lastMessageAt; }

        public long getUnreadCount() { return unreadCount; }
        public void setUnreadCount(long unreadCount) { this.unreadCount = unreadCount; }
    }
}
package com.pawstar.pawster.dto;

import java.time.Instant;

public class MessageDto {

    public static class ChatMessage {
        private String content;
        private Integer targetUserId;
        private String attachmentUrl;
        private String attachmentType;
        private Boolean isBot;

        public String getContent() { return content; }
        public void setContent(String c) { this.content = c; }

        public Integer getTargetUserId() { return targetUserId; }
        public void setTargetUserId(Integer t) { this.targetUserId = t; }

        public String getAttachmentUrl() { return attachmentUrl; }
        public void setAttachmentUrl(String u) { this.attachmentUrl = u; }

        public String getAttachmentType() { return attachmentType; }
        public void setAttachmentType(String t) { this.attachmentType = t; }

        public Boolean getIsBot() { return isBot; }
        public void setIsBot(Boolean isBot) { this.isBot = isBot; }
    }

    public static class MessageResponse {
        private String id;
        private Integer userId;
        private Integer senderId;
        private String senderRole;
        private String senderName;
        private String content;
        private boolean isRead;
        private boolean isBot;
        private Instant createdAt;
        private String attachmentUrl;
        private String attachmentType;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public Integer getUserId() { return userId; }
        public void setUserId(Integer u) { this.userId = u; }

        public Integer getSenderId() { return senderId; }
        public void setSenderId(Integer s) { this.senderId = s; }

        public String getSenderRole() { return senderRole; }
        public void setSenderRole(String s) { this.senderRole = s; }

        public String getSenderName() { return senderName; }
        public void setSenderName(String n) { this.senderName = n; }

        public String getContent() { return content; }
        public void setContent(String c) { this.content = c; }

        public boolean isRead() { return isRead; }
        public void setRead(boolean r) { this.isRead = r; }

        public boolean isBot() { return isBot; }
        public void setBot(boolean b) { this.isBot = b; }

        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant t) { this.createdAt = t; }

        public String getAttachmentUrl() { return attachmentUrl; }
        public void setAttachmentUrl(String u) { this.attachmentUrl = u; }

        public String getAttachmentType() { return attachmentType; }
        public void setAttachmentType(String t) { this.attachmentType = t; }
    }

    public static class ConversationSummary {
        private Integer userId;
        private String userName;
        private String lastMessage;
        private Instant lastMessageAt;
        private long unreadCount;

        public Integer getUserId() { return userId; }
        public void setUserId(Integer u) { this.userId = u; }

        public String getUserName() { return userName; }
        public void setUserName(String n) { this.userName = n; }

        public String getLastMessage() { return lastMessage; }
        public void setLastMessage(String m) { this.lastMessage = m; }

        public Instant getLastMessageAt() { return lastMessageAt; }
        public void setLastMessageAt(Instant t) { this.lastMessageAt = t; }

        public long getUnreadCount() { return unreadCount; }
        public void setUnreadCount(long c) { this.unreadCount = c; }
    }
}
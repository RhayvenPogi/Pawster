package com.pawstar.pawster.dto;

public class PetCommentRequest {
    private Integer userId;      // logged-in user's ID from session/JWT
    private String authorName;   // display name
    private String content;

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
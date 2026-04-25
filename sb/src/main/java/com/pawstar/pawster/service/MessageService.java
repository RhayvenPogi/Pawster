package com.pawstar.pawster.service;

import com.pawstar.pawster.dto.MessageDto;
import com.pawstar.pawster.model.Message;
import com.pawstar.pawster.model.User;
import com.pawstar.pawster.repository.MessageRepository;
import com.pawstar.pawster.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MessageService {

    @Autowired private MessageRepository messageRepository;
    @Autowired private UserRepository    userRepository;

    // ── Save (text only) ──────────────────────────────────────────────────────
    public MessageDto.MessageResponse save(Integer senderId, String senderRole,
                                           Integer userId, String content) {
        return save(senderId, senderRole, userId, content, null, null, false);
    }

    // ── Save (with attachment, no isBot) ──────────────────────────────────────
    public MessageDto.MessageResponse save(Integer senderId, String senderRole,
                                           Integer userId, String content,
                                           String attachmentUrl, String attachmentType) {
        return save(senderId, senderRole, userId, content, attachmentUrl, attachmentType, false);
    }

    // ── Save (full — with isBot) ──────────────────────────────────────────────
    public MessageDto.MessageResponse save(Integer senderId, String senderRole,
                                           Integer userId, String content,
                                           String attachmentUrl, String attachmentType,
                                           boolean isBot) {
        Message msg = new Message();
        msg.setSenderId(senderId);
        msg.setSenderRole(senderRole);
        msg.setUserId(userId);
        msg.setContent(content);
        msg.setAttachmentUrl(attachmentUrl);
        msg.setAttachmentType(attachmentType);
        msg.setBot(isBot);              // ← set isBot
        Message saved = messageRepository.save(msg);
        return toResponse(saved);
    }

    // ── History ───────────────────────────────────────────────────────────────
    public List<MessageDto.MessageResponse> getConversation(Integer userId) {
        return messageRepository.findByUserIdOrderByCreatedAtAsc(userId)
                .stream().map(this::toResponse).toList();
    }

    // ── Unread counts ─────────────────────────────────────────────────────────
    public long countUnreadForUser(Integer userId) {
        return messageRepository.countUnreadForUser(userId);
    }

    public long countUnreadForAdmin() {
        return messageRepository.countUnreadForAdmin();
    }

    // ── Mark as read ──────────────────────────────────────────────────────────
    public void markReadForUser(Integer userId) {
        messageRepository.markAdminMessagesReadForUser(userId);
    }

    public void markReadForAdmin(Integer userId) {
        messageRepository.markUserMessagesReadForAdmin(userId);
    }

    // ── Admin conversation list ───────────────────────────────────────────────
    public List<MessageDto.ConversationSummary> getConversationSummaries() {
        List<Object[]> rows = messageRepository.findConversationSummariesRaw();
        List<MessageDto.ConversationSummary> result = new ArrayList<>();
        for (Object[] row : rows) {
            MessageDto.ConversationSummary summary = new MessageDto.ConversationSummary();
            Integer uid = ((Number) row[0]).intValue();
            summary.setUserId(uid);
            userRepository.findById(uid).ifPresentOrElse(
                u -> summary.setUserName(u.getFirstName() + " " + u.getLastName()),
                () -> summary.setUserName("Unknown User")
            );
            summary.setLastMessage(row[1] != null ? row[1].toString() : "");
            if (row[2] instanceof java.sql.Timestamp ts)
                summary.setLastMessageAt(ts.toInstant().atOffset(ZoneOffset.UTC));
            summary.setUnreadCount(row[3] != null ? ((Number) row[3]).longValue() : 0L);
            result.add(summary);
        }
        return result;
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private MessageDto.MessageResponse toResponse(Message msg) {
        MessageDto.MessageResponse r = new MessageDto.MessageResponse();
        r.setId(msg.getId());
        r.setUserId(msg.getUserId());
        r.setSenderId(msg.getSenderId());
        r.setSenderRole(msg.getSenderRole());
        r.setRead(msg.isRead());
        r.setBot(msg.isBot());              // ← map isBot
        r.setCreatedAt(msg.getCreatedAt());
        r.setContent(msg.getContent());
        r.setAttachmentUrl(msg.getAttachmentUrl());
        r.setAttachmentType(msg.getAttachmentType());
        userRepository.findById(msg.getSenderId()).ifPresent(u ->
                r.setSenderName(u.getFirstName() + " " + u.getLastName()));
        return r;
    }
}
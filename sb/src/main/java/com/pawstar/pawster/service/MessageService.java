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

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    // ── Send a message ────────────────────────────────────────────────────────

    /**
     * Persists a message and returns the enriched response DTO.
     *
     * @param senderId   ID of the authenticated sender
     * @param senderRole "user" or "admin"
     * @param userId     The non-admin user in the conversation
     * @param content    Message text
     */
    public MessageDto.MessageResponse save(Integer senderId,
                                           String senderRole,
                                           Integer userId,
                                           String content) {
        Message msg = new Message();
        msg.setSenderId(senderId);
        msg.setSenderRole(senderRole);
        msg.setUserId(userId);
        msg.setContent(content);
        Message saved = messageRepository.save(msg);

        return toResponse(saved);
    }

    // ── History ───────────────────────────────────────────────────────────────

    public List<MessageDto.MessageResponse> getConversation(Integer userId) {
        return messageRepository.findByUserIdOrderByCreatedAtAsc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Unread counts (for badge notifications) ───────────────────────────────

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

            // row[0] = user_id (Integer)
            Integer uid = ((Number) row[0]).intValue();
            summary.setUserId(uid);

            // Resolve user name
            Optional<User> userOpt = userRepository.findById(uid);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                summary.setUserName(u.getFirstName() + " " + u.getLastName());
            } else {
                summary.setUserName("Unknown User");
            }

            // row[1] = last message content
            summary.setLastMessage(row[1] != null ? row[1].toString() : "");

            // row[2] = last message created_at (Timestamp → LocalDateTime)
            if (row[2] instanceof java.sql.Timestamp ts) {
    summary.setLastMessageAt(ts.toInstant().atOffset(ZoneOffset.UTC));
}

            // row[3] = unread count (BigInteger from native query)
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
        r.setCreatedAt(msg.getCreatedAt());
        r.setContent(msg.getContent());

        // Resolve sender name
        userRepository.findById(msg.getSenderId()).ifPresent(u ->
                r.setSenderName(u.getFirstName() + " " + u.getLastName()));

        return r;
    }
}
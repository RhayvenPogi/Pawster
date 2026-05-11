package com.pawstar.pawster.service;

import com.pawstar.pawster.dto.MessageDto;
import com.pawstar.pawster.model.Message;
import com.pawstar.pawster.repository.MessageRepository;
import com.pawstar.pawster.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    // ── Save (text only)
    public MessageDto.MessageResponse save(Integer senderId, String senderRole,
                                           Integer userId, String content) {
        return save(senderId, senderRole, userId, content, null, null, false);
    }

    // ── Save (with attachment)
    public MessageDto.MessageResponse save(Integer senderId, String senderRole,
                                           Integer userId, String content,
                                           String attachmentUrl, String attachmentType) {
        return save(senderId, senderRole, userId, content, attachmentUrl, attachmentType, false);
    }

    // ── Full save (bot supported)
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
        msg.setBot(isBot);

        // ✅ FIX: use Instant instead of OffsetDateTime
        msg.setCreatedAt(Instant.now());

        Message saved = messageRepository.save(msg);
        return toResponse(saved);
    }

    // ── Conversation history
    public List<MessageDto.MessageResponse> getConversation(Integer userId) {
        return messageRepository.findByUserIdOrderByCreatedAtAsc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Unread counts
    public long countUnreadForUser(Integer userId) {
        return messageRepository.countByUserIdAndSenderRoleAndIsReadFalse(userId, "admin");
    }

    public long countUnreadForAdmin() {
        return messageRepository.countBySenderRoleAndIsReadFalse("user");
    }

    // ── Mark read
    public void markReadForUser(Integer userId) {
        messageRepository.markAdminMessagesReadForUser(userId);
    }

    public void markReadForAdmin(Integer userId) {
        messageRepository.markUserMessagesReadForAdmin(userId);
    }

    // ── Conversation summaries
    public List<MessageDto.ConversationSummary> getConversationSummaries() {

        List<MessageRepository.ConversationSummaryProjection> rows =
                messageRepository.findConversationSummaries();

        List<MessageDto.ConversationSummary> result = new ArrayList<>();

        for (var row : rows) {

            MessageDto.ConversationSummary summary = new MessageDto.ConversationSummary();

            Integer uid = row.get_id();
            summary.setUserId(uid);

            userRepository.findById(uid).ifPresentOrElse(
                    u -> summary.setUserName(u.getFirstName() + " " + u.getLastName()),
                    () -> summary.setUserName("Unknown User")
            );

            summary.setLastMessage(
                    row.getLastMessage() != null ? row.getLastMessage() : ""
            );

            // ✅ FIX: store as Instant (no OffsetDateTime conversion here)
            Object rawDate = row.getLastMessageAt();
            if (rawDate instanceof java.util.Date d) {
                summary.setLastMessageAt(d.toInstant());
            } else if (rawDate instanceof Instant i) {
                summary.setLastMessageAt(i);
            }

            summary.setUnreadCount(
                    row.getUnreadCount() != null ? row.getUnreadCount() : 0L
            );

            result.add(summary);
        }

        return result;
    }

    // ── Mapper
    private MessageDto.MessageResponse toResponse(Message msg) {

        MessageDto.MessageResponse r = new MessageDto.MessageResponse();

        r.setId(msg.getId());
        r.setUserId(msg.getUserId());
        r.setSenderId(msg.getSenderId());
        r.setSenderRole(msg.getSenderRole());
        r.setRead(msg.isRead());
        r.setBot(msg.isBot());
        r.setContent(msg.getContent());
        r.setAttachmentUrl(msg.getAttachmentUrl());
        r.setAttachmentType(msg.getAttachmentType());

        // ✅ FIX: Instant everywhere
        r.setCreatedAt(msg.getCreatedAt());

        userRepository.findById(msg.getSenderId()).ifPresent(u ->
                r.setSenderName(u.getFirstName() + " " + u.getLastName())
        );

        return r;
    }
}
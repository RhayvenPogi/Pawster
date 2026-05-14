package com.pawstar.pawster.controller;

import com.pawstar.pawster.dto.MessageDto;
import com.pawstar.pawster.model.Message;
import com.pawstar.pawster.model.MessageAttachment;
import com.pawstar.pawster.model.User;
import com.pawstar.pawster.repository.MessageAttachmentRepository;
import com.pawstar.pawster.repository.UserRepository;
import com.pawstar.pawster.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
public class MessageController {

    @Autowired private MessageService                 messageService;
    @Autowired private SimpMessagingTemplate          messagingTemplate;
    @Autowired private UserRepository                 userRepository;
    @Autowired private MessageAttachmentRepository    messageAttachmentRepository;

    // ── WebSocket handlers ────────────────────────────────────────────────────

    @MessageMapping("/chat.send")
    public void handleUserMessage(
            @Payload MessageDto.ChatMessage payload,
            Principal principal) {

        User sender = resolveFromPrincipal(principal);
        if (sender == null) return;

        MessageDto.MessageResponse response = messageService.save(
                sender.getId(), "user", sender.getId(),
                payload.getContent(),
                payload.getAttachmentUrl(),
                payload.getAttachmentType()
        );

        messagingTemplate.convertAndSend("/topic/user/" + sender.getId(), response);
        messagingTemplate.convertAndSend("/topic/admin/inbox", response);
    }

    @MessageMapping("/chat.admin.send")
public void handleAdminMessage(
        @Payload MessageDto.ChatMessage payload,
        Principal principal) {

    User sender = resolveFromPrincipal(principal);
    if (sender == null) return;
    if (payload.getTargetUserId() == null) return;

    boolean isBot    = Boolean.TRUE.equals(payload.getIsBot());
    boolean isAdmin  = "admin".equalsIgnoreCase(sender.getRole());

    // Regular users can only send bot messages targeting themselves
    if (!isAdmin && !isBot) return;
    if (!isAdmin && isBot) {
        if (!sender.getId().equals(payload.getTargetUserId())) return;
    }

    MessageDto.MessageResponse response = messageService.save(
            sender.getId(), "admin",
            payload.getTargetUserId(),
            payload.getContent(),
            payload.getAttachmentUrl(),
            payload.getAttachmentType(),
            isBot                           // ← pass isBot
    );

    messagingTemplate.convertAndSend("/topic/user/" + payload.getTargetUserId(), response);
    messagingTemplate.convertAndSend("/topic/admin/inbox", response);
}

    // ── File Upload — saves to DB ─────────────────────────────────────────────

    @PostMapping("/api/messages/upload")
    public ResponseEntity<Map<String, Object>> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetUserId", required = false) Integer targetUserId,
            @AuthenticationPrincipal UserDetails principal) throws IOException {

        User caller = resolveUser(principal);
        if (caller == null) return ResponseEntity.status(401).build();

        String mime = file.getContentType() != null ? file.getContentType() : "";
        String attachmentType;
        if (mime.startsWith("image/")) {
            attachmentType = "image";
        } else if (mime.startsWith("video/")) {
            attachmentType = "video";
        } else {
            attachmentType = "file";
        }

        MessageAttachment attachment = new MessageAttachment();
        attachment.setOriginalFilename(
            file.getOriginalFilename() != null ? file.getOriginalFilename() : "file"
        );
        attachment.setContentType(mime);
        attachment.setFileSize(file.getSize());
        attachment.setData(file.getBytes());
        MessageAttachment saved = messageAttachmentRepository.save(attachment);

        String url = "/api/messages/attachment/" + saved.getId();

        return ResponseEntity.ok(Map.of(
                "url",      url,
                "type",     attachmentType,
                "fileName", attachment.getOriginalFilename(),
                "fileSize", file.getSize()
        ));
    }

    // ── Serve attachment from DB ──────────────────────────────────────────────

    @GetMapping("/api/messages/attachment/{id}")
    public ResponseEntity<byte[]> serveAttachment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        User caller = resolveUser(principal);
        if (caller == null) return ResponseEntity.status(401).build();

        return messageAttachmentRepository.findById(id)
            .map(a -> ResponseEntity.ok()
                .header("Content-Type", a.getContentType())
                .header("Content-Disposition",
                    "inline; filename=\"" + a.getOriginalFilename() + "\"")
                .header("Cache-Control", "private, max-age=86400")
                .body(a.getData()))
            .orElse(ResponseEntity.notFound().build());
    }

    // ── REST endpoints ────────────────────────────────────────────────────────

    @GetMapping("/api/messages/history")
    public ResponseEntity<List<MessageDto.MessageResponse>> getHistory(
            @RequestParam(required = false) Integer userId,
            @AuthenticationPrincipal UserDetails principal) {

        User caller = resolveUser(principal);
        if (caller == null) return ResponseEntity.status(401).build();

        Integer targetUserId = "admin".equalsIgnoreCase(caller.getRole()) && userId != null
                ? userId
                : caller.getId();

        return ResponseEntity.ok(messageService.getConversation(targetUserId));
    }

    @PostMapping("/api/messages/read")
    public ResponseEntity<Map<String, Boolean>> markRead(
            @RequestBody(required = false) Map<String, Integer> body,
            @AuthenticationPrincipal UserDetails principal) {

        User caller = resolveUser(principal);
        if (caller == null) return ResponseEntity.status(401).build();

        if ("admin".equalsIgnoreCase(caller.getRole())) {
            Integer uid = body != null ? body.get("userId") : null;
            if (uid != null) messageService.markReadForAdmin(uid);
        } else {
            messageService.markReadForUser(caller.getId());
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/api/messages/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @AuthenticationPrincipal UserDetails principal) {

        User caller = resolveUser(principal);
        if (caller == null) return ResponseEntity.status(401).build();

        long count = "admin".equalsIgnoreCase(caller.getRole())
                ? messageService.countUnreadForAdmin()
                : messageService.countUnreadForUser(caller.getId());

        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/api/messages/conversations")
    public ResponseEntity<List<MessageDto.ConversationSummary>> conversations(
            @AuthenticationPrincipal UserDetails principal) {

        User caller = resolveUser(principal);
        if (caller == null || !"admin".equalsIgnoreCase(caller.getRole())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(messageService.getConversationSummaries());
    }

    @DeleteMapping("/api/messages/conversation/{userId}")
    public ResponseEntity<Map<String, Boolean>> deleteConversation(
            @PathVariable Integer userId,
            @AuthenticationPrincipal UserDetails principal) {

        User caller = resolveUser(principal);
        if (caller == null) return ResponseEntity.status(401).build();
        if (!"admin".equalsIgnoreCase(caller.getRole())) return ResponseEntity.status(403).build();

        messageService.deleteConversation(userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/api/messages/bot-reply")
    public ResponseEntity<Map<String, Object>> botReply(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails principal) {

        User caller = resolveUser(principal);
        if (caller == null) return ResponseEntity.status(401).build();

        String content = (String) body.get("content");
        Integer targetUserId = caller.getId();

        // Find admin user to use as sender
        User adminUser = userRepository.findByRole("admin").stream().findFirst().orElse(null);
        Integer adminSenderId = adminUser != null ? adminUser.getId() : targetUserId;

        MessageDto.MessageResponse response = messageService.save(
                targetUserId, "admin", adminSenderId,
                content, null, null, true
        );

        messagingTemplate.convertAndSend("/topic/user/" + targetUserId, response);
        messagingTemplate.convertAndSend("/topic/admin/inbox", response);

        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User resolveFromPrincipal(Principal principal) {
        if (principal == null) return null;
        String email = principal.getName();
        if (email == null) return null;
        return userRepository.findByEmail(email).orElse(null);
    }

    private User resolveUser(UserDetails principal) {
        if (principal == null) return null;
        return userRepository.findByEmail(principal.getUsername()).orElse(null);
    }
}
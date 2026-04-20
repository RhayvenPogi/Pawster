package com.pawstar.pawster.controller;

import com.pawstar.pawster.dto.MessageDto;
import com.pawstar.pawster.model.User;
import com.pawstar.pawster.repository.UserRepository;
import com.pawstar.pawster.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class MessageController {

    @Autowired private MessageService        messageService;
    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private UserRepository        userRepository;

    // ── WebSocket handlers ────────────────────────────────────────────────────

    @MessageMapping("/chat.send")
    public void handleUserMessage(
            @Payload MessageDto.ChatMessage payload,
            Principal principal) {                          // ← Principal, not @AuthenticationPrincipal UserDetails

        User sender = resolveFromPrincipal(principal);
        if (sender == null) return;

        MessageDto.MessageResponse response =
                messageService.save(sender.getId(), "user", sender.getId(), payload.getContent());

        messagingTemplate.convertAndSend("/topic/user/" + sender.getId(), response);
        messagingTemplate.convertAndSend("/topic/admin/inbox", response);
    }

    @MessageMapping("/chat.admin.send")
    public void handleAdminMessage(
            @Payload MessageDto.ChatMessage payload,
            Principal principal) {                          // ← Principal, not @AuthenticationPrincipal UserDetails

        User admin = resolveFromPrincipal(principal);
        if (admin == null || !"admin".equalsIgnoreCase(admin.getRole())) return;
        if (payload.getTargetUserId() == null) return;

        MessageDto.MessageResponse response =
                messageService.save(admin.getId(), "admin",
                        payload.getTargetUserId(), payload.getContent());

        messagingTemplate.convertAndSend("/topic/user/" + payload.getTargetUserId(), response);
        messagingTemplate.convertAndSend("/topic/admin/inbox", response);
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    // For @MessageMapping — reads the Principal set by WebSocketConfig interceptor
    private User resolveFromPrincipal(Principal principal) {
        if (principal == null) return null;
        // Our interceptor sets UsernamePasswordAuthenticationToken as the principal
        // Its name is the email (from UserDetails.getUsername())
        String email = principal.getName();
        if (email == null) return null;
        return userRepository.findByEmail(email).orElse(null);
    }

    // For REST @AuthenticationPrincipal — works via servlet security context
    private User resolveUser(UserDetails principal) {
        if (principal == null) return null;
        return userRepository.findByEmail(principal.getUsername()).orElse(null);
    }
}
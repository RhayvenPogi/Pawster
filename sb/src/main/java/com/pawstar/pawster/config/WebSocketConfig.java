package com.pawstar.pawster.config;

import com.pawstar.pawster.security.JwtUtils;
import com.pawstar.pawster.security.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns(
                        "http://localhost:3000",
                        "http://localhost:5173")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null) return message;

                StompCommand command = accessor.getCommand();

                // ── On CONNECT: validate token and store principal on session ──
                if (StompCommand.CONNECT.equals(command)) {
                    String token = extractToken(accessor);

                    if (token != null && jwtUtils.validateToken(token)) {
                        String email = jwtUtils.getUsernameFromToken(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());

                        // This attaches the principal to the WebSocket SESSION
                        // so it persists for all subsequent frames
                        accessor.setUser(auth);
                    }
                }

                // ── On SEND/SUBSCRIBE: re-attach session principal so
                //    @AuthenticationPrincipal resolves correctly ──────────────
                if (StompCommand.SEND.equals(command) ||
                    StompCommand.SUBSCRIBE.equals(command)) {

                    Principal sessionUser = accessor.getUser();

                    // If the session already has a principal (set at CONNECT),
                    // make sure it is propagated — nothing extra needed.
                    // If somehow it is missing, try the Authorization header
                    // as a fallback (some clients resend it on every frame).
                    if (sessionUser == null) {
                        String token = extractToken(accessor);
                        if (token != null && jwtUtils.validateToken(token)) {
                            String email = jwtUtils.getUsernameFromToken(token);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                            UsernamePasswordAuthenticationToken auth =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities());
                            accessor.setUser(auth);
                        }
                    }
                }

                return message;
            }

            private String extractToken(StompHeaderAccessor accessor) {
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    return authHeader.substring(7);
                }
                return accessor.getFirstNativeHeader("token");
            }
        });
    }
}
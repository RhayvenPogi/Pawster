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
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired private JwtUtils                  jwtUtils;
    @Autowired private CustomUserDetailsService  userDetailsService;

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

            private static final String SESSION_PRINCIPAL_KEY = "STOMP_PRINCIPAL";

            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null) return message;

                StompCommand command = accessor.getCommand();

                if (StompCommand.CONNECT.equals(command)) {
                    // Authenticate on CONNECT and store principal in session attributes
                    UsernamePasswordAuthenticationToken auth = buildAuth(accessor);
                    if (auth != null) {
                        accessor.setUser(auth);
                        // Also store in session attributes so SEND frames can retrieve it
                        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes != null) {
                            sessionAttributes.put(SESSION_PRINCIPAL_KEY, auth);
                        }
                    }
                } else if (StompCommand.SEND.equals(command) ||
                           StompCommand.SUBSCRIBE.equals(command)) {

                    // Restore principal from session attributes if not already set
                    Principal sessionUser = accessor.getUser();
                    if (sessionUser == null) {
                        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes != null) {
                            Principal stored = (Principal) sessionAttributes.get(SESSION_PRINCIPAL_KEY);
                            if (stored != null) {
                                accessor.setUser(stored);
                            }
                        }
                    }

                    // Final fallback: try Authorization header on this frame
                    if (accessor.getUser() == null) {
                        UsernamePasswordAuthenticationToken auth = buildAuth(accessor);
                        if (auth != null) accessor.setUser(auth);
                    }
                }

                return message;
            }

            private UsernamePasswordAuthenticationToken buildAuth(StompHeaderAccessor accessor) {
                String token = extractToken(accessor);
                if (token == null) return null;
                try {
                    if (!jwtUtils.validateToken(token)) return null;
                    String email = jwtUtils.getUsernameFromToken(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    return new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                } catch (Exception e) {
                    return null;
                }
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
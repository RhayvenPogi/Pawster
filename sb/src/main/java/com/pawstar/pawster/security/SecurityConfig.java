package com.pawstar.pawster.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Autowired
        private JwtAuthenticationFilter jwtAuthFilter;

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration authConfig) throws Exception {
                return authConfig.getAuthenticationManager();
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(Customizer.withDefaults())
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth

                                                // ── Public auth endpoints ──────────────────────────────────
                                                .requestMatchers(
                                                                "/api/auth/login",
                                                                "/api/auth/register",
                                                                "/api/auth/logout",
                                                                "/api/auth/me",
                                                                "/api/auth/forgot-password",
                                                                "/api/auth/verify-otp",
                                                                "/api/auth/reset-password",
                                                                "/swagger-ui.html",
                                                                "/error")
                                                .permitAll()

                                                // ── WebSocket handshake endpoints ──────────────────────────
                                                .requestMatchers("/ws/**").permitAll()

                                                // ── Animals: anyone can browse ─────────────────────────────
                                                .requestMatchers(HttpMethod.GET, "/api/animals/**").permitAll()

                                                // ── Animals: specific POST routes that must be permitAll ───
                                                .requestMatchers(HttpMethod.POST, "/api/animals/from-rehoming").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/animals/mark-adopted").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/animals/mark-pending").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/animals").permitAll()

                                                // ── Animals: wildcard write rules (admin only) ─────────────
                                                .requestMatchers(HttpMethod.POST, "/api/animals/**")
                                                .hasAnyAuthority("admin", "ADMIN")
                                                .requestMatchers(HttpMethod.PUT, "/api/animals/**")
                                                .hasAnyAuthority("admin", "ADMIN")
                                                .requestMatchers(HttpMethod.DELETE, "/api/animals/**")
                                                .hasAnyAuthority("admin", "ADMIN")

                                                // ── Adoption ──────────────────────────────────────────────
                                                .requestMatchers(HttpMethod.POST, "/api/adoption").authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/adoption/my-requests")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.DELETE, "/api/adoption/**").authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/adoption/**")
                                                .hasAnyAuthority("admin", "ADMIN")
                                                .requestMatchers(HttpMethod.PATCH, "/api/adoption/**")
                                                .hasAnyAuthority("admin", "ADMIN")

                                                // ── Rehome ────────────────────────────────────────────────
                                                .requestMatchers(HttpMethod.POST, "/api/rehome").authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/rehome/my-requests")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.DELETE, "/api/rehome/**").authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/rehome/**")
                                                .hasAnyAuthority("admin", "ADMIN")
                                                .requestMatchers(HttpMethod.PATCH, "/api/rehome/**")
                                                .hasAnyAuthority("admin", "ADMIN")

                                                // ── Surveys ───────────────────────────────────────────────
                                                .requestMatchers(HttpMethod.POST, "/api/surveys").authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/surveys/my-surveys")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/surveys/**")
                                                .hasAnyAuthority("admin", "ADMIN")

                                                // ── Admin-only routes ──────────────────────────────────────
                                                .requestMatchers("/api/admin/**").hasAnyAuthority("admin", "ADMIN")

                                                // ── Static uploads (public) ────────────────────────────────
                                                .requestMatchers("/uploads/**").permitAll()

                                                // ── Messages REST endpoints (all authenticated) ────────────
                                                .requestMatchers("/api/messages/**").authenticated()

                                                // ── Missing Pets ──────────────────────────────────────────
                                                .requestMatchers(HttpMethod.GET, "/api/missing-pets/**").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/missing-pets").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/missing-pets/*/comments").permitAll()

                                                // ── User photo: public read ────────────────────────────────
                                                .requestMatchers("/api/users/*/photo/public").permitAll()

                                                .anyRequest().authenticated())

                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((req, res, e) -> {
                                                        res.setContentType("application/json");
                                                        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        res.getWriter().write("{\"error\":\"Unauthorized\"}");
                                                })
                                                .accessDeniedHandler((req, res, e) -> {
                                                        res.setContentType("application/json");
                                                        res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                                        res.getWriter().write("{\"error\":\"Forbidden\"}");
                                                }));

                http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of(
                                "http://localhost:3000",
                                "http://localhost:5173"));

                config.setAllowedMethods(Arrays.asList(
                                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

                config.setAllowedHeaders(Arrays.asList(
                                "Authorization",
                                "Cache-Control",
                                "Content-Type",
                                "Accept"));

                config.setAllowCredentials(true);
                config.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }
}
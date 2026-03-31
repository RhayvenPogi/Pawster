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
                                "/error")
                        .permitAll()

                        // ── Animals: anyone can browse, only admin can write ───────
                        .requestMatchers(HttpMethod.GET, "/api/animals/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/animals/**").hasAnyAuthority("admin", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/animals/**").hasAnyAuthority("admin", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/animals/**").hasAnyAuthority("admin", "ADMIN")

                        // ── Adoption: authenticated users submit, admin manages ────
                        .requestMatchers(HttpMethod.POST, "/api/adoption").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/adoption/my-requests").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/adoption/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/adoption/**").hasAnyAuthority("admin", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/adoption/**").hasAnyAuthority("admin", "ADMIN")

                        // ── Rehome: authenticated users submit, admin manages ──────
                        .requestMatchers(HttpMethod.POST, "/api/rehome").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/rehome/my-requests").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/rehome/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/rehome/**").hasAnyAuthority("admin", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/rehome/**").hasAnyAuthority("admin", "ADMIN")

                        // ── Surveys: authenticated users submit, admin reads all ───
                        .requestMatchers(HttpMethod.POST, "/api/surveys").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/surveys/my-surveys").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/surveys/**").hasAnyAuthority("admin", "ADMIN")

                        // ── Admin-only routes ──────────────────────────────────────
                        .requestMatchers("/api/admin/**").hasAnyAuthority("admin", "ADMIN")

                        // ── Missing Pets: anyone can view & report ──────────
                        .requestMatchers(HttpMethod.GET, "/api/missing-pets/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/missing-pets").permitAll()
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
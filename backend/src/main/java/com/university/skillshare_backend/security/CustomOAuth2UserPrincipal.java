package com.university.skillshare_backend.security;

import com.university.skillshare_backend.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

public class CustomOAuth2UserPrincipal implements OAuth2User {

    private final User user;
    private final Map<String, Object> attributes;

    public CustomOAuth2UserPrincipal(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // You can derive authorities from user.getRoles() if you have roles
        return Collections.emptyList(); // Keep it simple for now
    }

    @Override
    public String getName() {
        // Return a unique identifier, email is usually good
        return user.getEmail();
    }

    // --- Custom methods to access your User entity ---

    public String getId() {
        return user.getId();
    }

    public String getEmail() {
        return user.getEmail();
    }

    public String getUsername() {
        return user.getUsername();
    }
    
    public User getUser() {
        return user;
    }
}

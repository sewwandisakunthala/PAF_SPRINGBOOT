package com.university.skillshare_backend.service;

import com.university.skillshare_backend.model.User;
import com.university.skillshare_backend.repository.UserRepository;
import com.university.skillshare_backend.security.CustomOAuth2UserPrincipal; // Import the custom principal
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        logger.debug("Loaded OAuth2User attributes: {}", oauth2User.getAttributes());

        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String googleId = oauth2User.getName(); // Or use 'sub' attribute

        Optional<User> userOptional = userRepository.findByEmail(email);

        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            logger.info("Found existing user with email: {}", email);
            user.setUsername(name); // Update name on login
            // Optionally update googleId if it wasn't stored before
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
            }
        } else {
            logger.info("User with email {} not found. Creating new user.", email);
            // User does not exist, create a new user
            user = new User();
            user.setEmail(email);
            user.setUsername(name); // Use Google name as initial username. Consider making it unique if needed.
            user.setFullName(name); // Use Google name as full name
            user.setGoogleId(googleId);
            user.setPassword(null); // No password for OAuth2 users
            user.setRole(User.UserRole.LEARNER); // Default role
            user.setVerified(true); // Assume verified via Google
            user.setBio(null); // Default bio
            user.setSpecializations(null); // Default specializations

            // Try to get profile picture from Google attributes
            String pictureUrl = oauth2User.getAttribute("picture");
            user.setProfileImage(pictureUrl);
        }

        try {
            userRepository.save(user);
            logger.info("Successfully saved user with email: {}", email);
        } catch (Exception e) {
            logger.error("Error saving user with email {}: {}", email, e.getMessage(), e);
            // Create a standard OAuth2Error
            OAuth2Error error = new OAuth2Error("save_user_error", "Failed to save user data after OAuth2 login.", null);
            // Re-throw with the error and the original cause
            throw new OAuth2AuthenticationException(error, e);
        }

        // Return the custom principal wrapping your User entity and original attributes
        CustomOAuth2UserPrincipal customPrincipal = new CustomOAuth2UserPrincipal(user, oauth2User.getAttributes());
        logger.info("Returning CustomOAuth2UserPrincipal for email: {}", email);
        return customPrincipal;
    }
}

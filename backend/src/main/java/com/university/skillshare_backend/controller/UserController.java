package com.university.skillshare_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import com.university.skillshare_backend.dto.UserUpdateRequest;
import com.university.skillshare_backend.exception.ResourceNotFoundException;
import com.university.skillshare_backend.model.User;
import com.university.skillshare_backend.repository.UserRepository;
import com.university.skillshare_backend.repository.FollowRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Consider restricting this in production
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FollowRepository followRepository;

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User savedUser = userRepository.save(user);
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    }
    
    @GetMapping("/users/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String query) {
        List<User> users = userRepository.findByUsernameContainingIgnoreCase(query);
        users.forEach(user -> {
            user.setPassword(null);
            user.setEmail(null);
        });
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/users/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return ResponseEntity.ok(user);
    }
    
    @GetMapping("/users/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/users/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable String userId, @RequestBody UserUpdateRequest userUpdateRequest) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (userUpdateRequest.getUsername() != null && 
            !userUpdateRequest.getUsername().equals(existingUser.getUsername())) {
            if (userRepository.findByUsername(userUpdateRequest.getUsername()).isPresent()) {
                Map<String, String> response = new HashMap<>();
                response.put("error", "Username is already taken");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
            existingUser.setUsername(userUpdateRequest.getUsername());
        }
        
        if (userUpdateRequest.getEmail() != null && 
            !userUpdateRequest.getEmail().equals(existingUser.getEmail())) {
            if (userRepository.findByEmail(userUpdateRequest.getEmail()).isPresent()) {
                Map<String, String> response = new HashMap<>();
                response.put("error", "Email is already registered");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
            existingUser.setEmail(userUpdateRequest.getEmail());
        }
        
        if (userUpdateRequest.getBio() != null) {
            existingUser.setBio(userUpdateRequest.getBio());
        }

        if (userUpdateRequest.getRole() != null) {
            existingUser.setRole(userUpdateRequest.getRole());
        }

        if (userUpdateRequest.getFullName() != null) {
            existingUser.setFullName(userUpdateRequest.getFullName());
        }

        if (userUpdateRequest.getSpecializations() != null) {
            existingUser.setSpecializations(userUpdateRequest.getSpecializations());
        }
        
        User updatedUser = userRepository.save(existingUser);
        updatedUser.setPassword(null); // Don't return password
        
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/users/{userId}/counts")
    public ResponseEntity<Map<String, Long>> getUserCounts(@PathVariable String userId) {
        Map<String, Long> counts = new HashMap<>();
        counts.put("followers", followRepository.countByFollowedId(userId));
        counts.put("following", followRepository.countByFollowerId(userId));
        return ResponseEntity.ok(counts);
    }
    
    @GetMapping("/user/current")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal != null) {
            String email = principal.getAttribute("email");
            if (email != null) {
                Optional<User> userOptional = userRepository.findByEmail(email);
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    user.setPassword(null);
                    System.out.println("Current user fetched from session: " + user.getUsername());
                    return ResponseEntity.ok(user);
                } else {
                    // Create new user record for first-time OAuth2 login
                    String name = principal.getAttribute("name");
                    String googleId = principal.getName();
                    String pictureUrl = principal.getAttribute("picture");
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setUsername(name != null ? name : email);
                    newUser.setFullName(name);
                    newUser.setGoogleId(googleId);
                    newUser.setPassword(null);
                    newUser.setRole(User.UserRole.LEARNER);
                    newUser.setVerified(true);
                    newUser.setProfileImage(pictureUrl);
                    newUser.setBio(null);
                    newUser.setSpecializations(null);

                    User savedUser = userRepository.save(newUser);
                    savedUser.setPassword(null);
                    System.out.println("Created new user for email: " + email);
                    return ResponseEntity.ok(savedUser);
                }
            } else {
                 System.err.println("OAuth2 principal does not contain email attribute.");
                 return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Could not extract email from principal");
            }
        } else {
            // No user authenticated via session
             System.out.println("No active session found for /user/current");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No active session");
        }
    }
}

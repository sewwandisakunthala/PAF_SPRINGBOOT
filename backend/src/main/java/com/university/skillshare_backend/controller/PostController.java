package com.university.skillshare_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.university.skillshare_backend.exception.ResourceNotFoundException;
import com.university.skillshare_backend.exception.UnauthorizedException;
import com.university.skillshare_backend.model.Post;
import com.university.skillshare_backend.repository.PostRepository;
import com.university.skillshare_backend.repository.UserRepository;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PostController implements WebMvcConfigurer {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public PostController(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Create a new post
     * 
     * @param userId User ID
     * @param title Post title
     * @param content Post content
     * @param images List of image files
     * @param video Video file
     * @return The created post
     */
    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
            @RequestParam String userId,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) List<MultipartFile> images,
            @RequestParam(required = false) MultipartFile video) {
        try {
            // Validate input
            if (userId == null || userId.isEmpty()) {
                throw new IllegalArgumentException("User ID is required.");
            }
            if (title == null || title.isEmpty()) {
                throw new IllegalArgumentException("Title is required.");
            }
            if (content == null || content.isEmpty()) {
                throw new IllegalArgumentException("Content is required.");
            }

            // Verify user exists
            userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            List<String> imageUrls = new ArrayList<>();
            String videoUrl = null;

            // Handle image uploads
            if (images != null && !images.isEmpty()) {
                for (MultipartFile image : images) {
                    if (image.isEmpty()) {
                        throw new IllegalArgumentException("One of the uploaded images is empty.");
                    }
                    String imageUrl = uploadFile(image, "image");
                    imageUrls.add(imageUrl);
                }
            }

            // Handle video upload
            if (video != null && !video.isEmpty()) {
                videoUrl = uploadFile(video, "video");
            }

            // Create and save the post
            Post post = new Post();
            post.setUserId(userId);
            post.setTitle(title);
            post.setContent(content);
            post.setImageUrls(imageUrls);
            post.setVideoUrl(videoUrl);
            Post savedPost = postRepository.save(post);

            return ResponseEntity.ok(savedPost);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    private String uploadFile(MultipartFile file, String type) throws IOException {
        String uploadDir = "uploads/";
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String fileName = UUID.randomUUID().toString() + extension;

        Path targetPath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/" + fileName;
    }
    
    /**
     * Get all posts
     * 
     * @return List of posts
     */
    @GetMapping("/posts")
    public ResponseEntity<List<Post>> getAllPosts() {
        List<Post> posts = postRepository.findAll();
        return ResponseEntity.ok(posts);
    }
    
    /**
     * Get post by ID
     * 
     * @param postId Post ID
     * @return Post details
     */
    @GetMapping("/posts/{postId}") 
    public ResponseEntity<?> getPostById(@PathVariable String postId) {
        try {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new ResourceNotFoundException("Post not found with id : '" + postId + "'"));
            return ResponseEntity.ok(post);
        } catch (ResourceNotFoundException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            response.put("status", HttpStatus.NOT_FOUND.value());
            response.put("timestamp", new Date());
            response.put("details", "uri=/api/posts/" + postId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "An unexpected error occurred");
            response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            response.put("timestamp", new Date());
            response.put("details", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Get posts by user ID
     * 
     * @param userId User ID
     * @return List of posts by the user
     */
    @GetMapping("/users/{userId}/posts")
    public ResponseEntity<List<Post>> getPostsByUserId(@PathVariable String userId) {
        try {
            userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                
            List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/posts/upload")
    public ResponseEntity<Map<String, Object>> uploadImages(
            @RequestParam("file") List<MultipartFile> files,
            @RequestParam String userId,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) String videoUrl) {
        try {
            // Validate input
            if (files == null || files.isEmpty()) {
                throw new IllegalArgumentException("No files provided for upload.");
            }
            if (userId == null || userId.isEmpty()) {
                throw new IllegalArgumentException("User ID is required.");
            }
            if (title == null || title.isEmpty()) {
                throw new IllegalArgumentException("Title is required.");
            }
            if (content == null || content.isEmpty()) {
                throw new IllegalArgumentException("Content is required.");
            }

            // Verify user exists
            userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            List<String> fileUrls = new ArrayList<>();
            String uploadDir = "uploads/";

            // Create uploads directory if it doesn't exist
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // Save each file and collect URLs
            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    throw new IllegalArgumentException("Uploaded file is empty.");
                }
                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                Path path = Paths.get(uploadDir + fileName);
                Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                fileUrls.add("/api/uploads/" + fileName);
            }

            // Create and save the post
            Post post = new Post();
            post.setUserId(userId);
            post.setTitle(title);
            post.setContent(content);
            post.setImageUrls(fileUrls);
            post.setVideoUrl(videoUrl);
            Post savedPost = postRepository.save(post);

            Map<String, Object> response = new HashMap<>();
            response.put("post", savedPost);
            response.put("message", "Post created successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to upload files"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }
    
    // Add configuration to serve static files from uploads directory
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<?> updatePost(
            @PathVariable String postId,
            @RequestParam String userId,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) List<MultipartFile> images, // New images
            @RequestParam(required = false) MultipartFile video, // New video
            @RequestParam(required = false) List<String> existingImageUrls, // Existing image URLs
            @RequestParam(required = false) String existingVideoUrl, // Existing video URL
            @RequestParam(required = false, defaultValue = "false") boolean deleteVideo // Flag to delete video
    ) {
        try {
            // Fetch the existing post
            Post existingPost = postRepository.findById(postId)
                    .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

            // Verify user exists and ownership
            userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            if (!existingPost.getUserId().equals(userId)) {
                throw new UnauthorizedException("Not authorized to edit this post");
            }

            // Update fields while preserving creation date and ID
            existingPost.setTitle(title);
            existingPost.setContent(content);

            // Handle new image uploads and combine with existing images
            List<String> updatedImageUrls = new ArrayList<>(existingImageUrls != null ? existingImageUrls : new ArrayList<>());
            if (images != null && !images.isEmpty()) {
                for (MultipartFile image : images) {
                    if (image.isEmpty()) {
                        throw new IllegalArgumentException("One of the uploaded images is empty.");
                    }
                    String imageUrl = uploadFile(image, "image");
                    updatedImageUrls.add(imageUrl);
                }
            }
            existingPost.setImageUrls(updatedImageUrls);

            // Handle video update or deletion
            if (deleteVideo) {
                existingPost.setVideoUrl(null); // Remove video
            } else if (video != null && !video.isEmpty()) {
                String videoUrl = uploadFile(video, "video");
                existingPost.setVideoUrl(videoUrl);
            } else if (existingVideoUrl != null) {
                existingPost.setVideoUrl(existingVideoUrl); // Preserve existing video
            }

            Post savedPost = postRepository.save(existingPost);
            return ResponseEntity.ok(savedPost);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable String postId,
            @RequestParam String userId) {
        try {
            Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
                
            // Verify user exists and ownership
            userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
            if (!post.getUserId().equals(userId)) {
                throw new UnauthorizedException("Not authorized to delete this post");
            }
            
            postRepository.delete(post);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Post deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("Error deleting post: " + e.getMessage());
        }
    }

    @GetMapping("/posts/user/{userId}")
    public ResponseEntity<?> getPostsByUserIdOrdered(@PathVariable String userId) {
        try {
            // Verify user exists
            userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                
            List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

package com.university.skillshare_backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileUploadController {
    
    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "image") String type) {
        try {
            // Validate file
            if (file.isEmpty()) {
                logger.warn("File upload failed: File is empty");
                throw new IllegalArgumentException("File is empty");
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null) {
                logger.warn("File upload failed: Content type is missing");
                throw new IllegalArgumentException("Content type is missing");
            }

            if (type.equals("video") && !contentType.startsWith("video/")) {
                logger.warn("File upload failed: Invalid video file format");
                throw new IllegalArgumentException("Invalid video file format");
            } else if (type.equals("image") && !contentType.startsWith("image/")) {
                logger.warn("File upload failed: Invalid image file format");
                throw new IllegalArgumentException("Invalid image file format");
            }

            // Create absolute upload directory path
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath); // Ensure directories exist

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
            String fileName = UUID.randomUUID().toString() + extension;

            // Create complete file path
            Path targetPath = uploadPath.resolve(fileName);

            // Copy file to target location
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Return success response with file URL
            Map<String, String> response = new HashMap<>();
            response.put("url", "/uploads/" + fileName);
            response.put("type", type); // Include the file type in the response

            logger.info("File uploaded successfully: {}", fileName);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            logger.error("Failed to upload file due to IOException", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid upload attempt: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error during file upload", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }
}

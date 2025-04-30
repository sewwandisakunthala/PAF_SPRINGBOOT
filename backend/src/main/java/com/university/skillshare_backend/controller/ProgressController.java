package com.university.skillshare_backend.controller;

import com.university.skillshare_backend.model.Progress;
import com.university.skillshare_backend.repository.ProgressRepository;
import com.university.skillshare_backend.exception.ResourceNotFoundException;
import com.university.skillshare_backend.exception.UnauthorizedException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProgressController {

    @Autowired
    private ProgressRepository progressRepository;

    // Get all progress entries for a specific user
    @GetMapping("/users/{userId}/progress")
    public ResponseEntity<List<Progress>> getUserProgress(@PathVariable String userId) {
        List<Progress> progressList = progressRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        return ResponseEntity.ok(progressList);
    }

    // Get progress by id
    @GetMapping("/progress/{id}")
    public ResponseEntity<?> getProgressById(@PathVariable String id, @RequestParam String userId) {
        Progress progress = progressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Progress not found"));
        
        // Check if the user has permission to view this progress
        if (!progress.getUserId().equals(userId)) {
            throw new UnauthorizedException("Not authorized to view this progress");
        }
        
        return ResponseEntity.ok(progress);
    }

    // Create a new progress
    @PostMapping("/progress")
    public ResponseEntity<Progress> createProgress(@RequestBody Progress progress) {
        progress.setCreatedAt(new Date());
        progress.setUpdatedAt(new Date());
        Progress savedProgress = progressRepository.save(progress);
        return new ResponseEntity<>(savedProgress, HttpStatus.CREATED);
    }

    // Update progress
    @PutMapping("/progress/{id}")
    public ResponseEntity<?> updateProgress(
            @PathVariable String id, 
            @RequestParam String userId,
            @RequestBody Progress updatedProgress) {
        
        Progress progress = progressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Progress not found"));
        
        // Check if the user has permission to update this progress
        if (!progress.getUserId().equals(userId)) {
            throw new UnauthorizedException("Not authorized to update this progress");
        }
        
        // Update the progress fields
        progress.setTitle(updatedProgress.getTitle());
        progress.setDescription(updatedProgress.getDescription());
        progress.setCompletionPercentage(updatedProgress.getCompletionPercentage());
        progress.setStatus(updatedProgress.getStatus());
        progress.setTargetDate(updatedProgress.getTargetDate());
        
        if (updatedProgress.getSkills() != null) {
            progress.setSkills(updatedProgress.getSkills());
        }
        
        // If status is changed to COMPLETED, set completedDate
        if ("COMPLETED".equals(updatedProgress.getStatus()) && progress.getCompletedDate() == null) {
            progress.setCompletedDate(new Date());
        } else if (!"COMPLETED".equals(updatedProgress.getStatus())) {
            progress.setCompletedDate(null);
        }
        
        progress.setUpdatedAt(new Date());
        
        Progress savedProgress = progressRepository.save(progress);
        return ResponseEntity.ok(savedProgress);
    }

    // Delete progress
    @DeleteMapping("/progress/{id}")
    public ResponseEntity<?> deleteProgress(@PathVariable String id, @RequestParam String userId) {
        Progress progress = progressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Progress not found"));
        
        // Check if the user has permission to delete this progress
        if (!progress.getUserId().equals(userId)) {
            throw new UnauthorizedException("Not authorized to delete this progress");
        }
        
        progressRepository.delete(progress);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Progress deleted successfully");
        return ResponseEntity.ok(response);
    }

    // Get progress status summary for a user
    @GetMapping("/users/{userId}/progress/summary")
    public ResponseEntity<?> getProgressSummary(@PathVariable String userId) {
        List<Progress> allProgress = progressRepository.findByUserId(userId);
        
        int totalCount = allProgress.size();
        int notStartedCount = 0;
        int inProgressCount = 0;
        int completedCount = 0;
        int totalPercentage = 0;
        
        for (Progress progress : allProgress) {
            if ("NOT_STARTED".equals(progress.getStatus())) {
                notStartedCount++;
            } else if ("IN_PROGRESS".equals(progress.getStatus())) {
                inProgressCount++;
                totalPercentage += progress.getCompletionPercentage();
            } else if ("COMPLETED".equals(progress.getStatus())) {
                completedCount++;
                totalPercentage += 100;
            }
        }
        
        double averageCompletion = totalCount > 0 ? (double) totalPercentage / totalCount : 0;
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCount", totalCount);
        summary.put("notStartedCount", notStartedCount);
        summary.put("inProgressCount", inProgressCount);
        summary.put("completedCount", completedCount);
        summary.put("averageCompletion", Math.round(averageCompletion * 100.0) / 100.0);
        
        return ResponseEntity.ok(summary);
    }
}

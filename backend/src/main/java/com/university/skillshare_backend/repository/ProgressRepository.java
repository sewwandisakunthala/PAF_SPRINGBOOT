package com.university.skillshare_backend.repository;

import com.university.skillshare_backend.model.Progress;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProgressRepository extends MongoRepository<Progress, String> {
    List<Progress> findByUserId(String userId);
    List<Progress> findByUserIdOrderByUpdatedAtDesc(String userId);
    List<Progress> findByUserIdAndStatus(String userId, String status);
}

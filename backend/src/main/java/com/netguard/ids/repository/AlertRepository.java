package com.netguard.ids.repository;

import com.netguard.ids.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countBySeverity(String severity);

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.createdAt >= :since")
    long countSince(Instant since);
}

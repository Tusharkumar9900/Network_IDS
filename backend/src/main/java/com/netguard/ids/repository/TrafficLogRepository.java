package com.netguard.ids.repository;

import com.netguard.ids.entity.TrafficLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface TrafficLogRepository extends JpaRepository<TrafficLog, Long> {

    List<TrafficLog> findBySourceIpAndCreatedAtAfterOrderByCreatedAtAsc(String sourceIp, Instant since);
}

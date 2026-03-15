package com.netguard.ids.web;

import com.netguard.ids.dto.StatsDto;
import com.netguard.ids.repository.AlertRepository;
import com.netguard.ids.repository.BlacklistedIPRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final AlertRepository alertRepository;
    private final BlacklistedIPRepository blacklistedIPRepository;

    public StatsController(AlertRepository alertRepository, BlacklistedIPRepository blacklistedIPRepository) {
        this.alertRepository = alertRepository;
        this.blacklistedIPRepository = blacklistedIPRepository;
    }

    @GetMapping
    public ResponseEntity<StatsDto> getStats() {
        long total = alertRepository.count();
        long critical = alertRepository.countBySeverity("CRITICAL");
        long high = alertRepository.countBySeverity("HIGH");
        long medium = alertRepository.countBySeverity("MEDIUM");
        long low = alertRepository.countBySeverity("LOW");
        long blacklisted = blacklistedIPRepository.count();
        return ResponseEntity.ok(new StatsDto(total, critical, high, medium, low, blacklisted));
    }
}

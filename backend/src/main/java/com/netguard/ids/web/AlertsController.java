package com.netguard.ids.web;

import com.netguard.ids.dto.AlertDto;
import com.netguard.ids.entity.Alert;
import com.netguard.ids.repository.AlertRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alerts")
public class AlertsController {

    private final AlertRepository alertRepository;

    public AlertsController(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @GetMapping
    public ResponseEntity<List<AlertDto>> getAlerts(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String severity
    ) {
        int size = Math.min(Math.max(limit, 1), 500);
        var page = PageRequest.of(0, severity != null && !severity.isBlank() ? 500 : size, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Alert> alerts = alertRepository.findAllByOrderByCreatedAtDesc(page);
        if (severity != null && !severity.isBlank()) {
            alerts = alerts.stream()
                .filter(a -> severity.equalsIgnoreCase(a.getSeverity()))
                .limit(size)
                .toList();
        }
        return ResponseEntity.ok(alerts.stream().map(AlertDto::fromEntity).toList());
    }
}

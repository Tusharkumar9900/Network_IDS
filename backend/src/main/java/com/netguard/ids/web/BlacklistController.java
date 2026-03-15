package com.netguard.ids.web;

import com.netguard.ids.entity.BlacklistedIP;
import com.netguard.ids.repository.BlacklistedIPRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/blacklist")
public class BlacklistController {

    private final BlacklistedIPRepository blacklistedIPRepository;

    public BlacklistController(BlacklistedIPRepository blacklistedIPRepository) {
        this.blacklistedIPRepository = blacklistedIPRepository;
    }

    @PostMapping
    public ResponseEntity<?> addToBlacklist(@RequestBody Map<String, String> body) {
        String ip = body.get("ip");
        String reason = body.get("reason");
        if (ip == null || ip.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ip is required"));
        }
        if (blacklistedIPRepository.existsByIp(ip)) {
            return ResponseEntity.ok(Map.of("message", "IP already blacklisted", "ip", ip));
        }
        BlacklistedIP entry = new BlacklistedIP();
        entry.setIp(ip.trim());
        entry.setReason(reason != null ? reason.trim() : "Manual block");
        blacklistedIPRepository.save(entry);
        return ResponseEntity.ok(Map.of("message", "IP blacklisted", "ip", entry.getIp(), "id", entry.getId()));
    }

    @DeleteMapping("/{ip}")
    public ResponseEntity<?> removeFromBlacklist(@PathVariable String ip) {
        if (ip == null || ip.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ip is required"));
        }
        return blacklistedIPRepository.findByIp(ip)
            .map(entry -> {
                blacklistedIPRepository.delete(entry);
                return ResponseEntity.ok(Map.of("message", "IP removed from blacklist", "ip", ip));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}

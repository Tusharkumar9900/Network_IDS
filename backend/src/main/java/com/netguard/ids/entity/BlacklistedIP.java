package com.netguard.ids.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ip_blacklist")
public class BlacklistedIP {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ip;

    private String reason;
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public BlacklistedIP() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

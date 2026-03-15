package com.netguard.ids.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sourceIp;

    private Integer sourcePort;
    private String destIp;
    private Integer destPort;
    private String protocol;
    private String alertType;   // e.g. PORT_SCAN, BRUTE_FORCE, DDoS, SQL_INJECTION
    private String severity;    // CRITICAL, HIGH, MEDIUM, LOW
    private String signature;
    private Long packets;
    private Long bytes;
    private String action;     // monitoring, blocked, investigating

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Alert() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSourceIp() { return sourceIp; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }
    public Integer getSourcePort() { return sourcePort; }
    public void setSourcePort(Integer sourcePort) { this.sourcePort = sourcePort; }
    public String getDestIp() { return destIp; }
    public void setDestIp(String destIp) { this.destIp = destIp; }
    public Integer getDestPort() { return destPort; }
    public void setDestPort(Integer destPort) { this.destPort = destPort; }
    public String getProtocol() { return protocol; }
    public void setProtocol(String protocol) { this.protocol = protocol; }
    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }
    public Long getPackets() { return packets; }
    public void setPackets(Long packets) { this.packets = packets; }
    public Long getBytes() { return bytes; }
    public void setBytes(Long bytes) { this.bytes = bytes; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

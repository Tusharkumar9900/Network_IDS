package com.netguard.ids.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "traffic_logs", indexes = {
    @Index(name = "idx_traffic_source_ts", columnList = "sourceIp, createdAt"),
    @Index(name = "idx_traffic_created", columnList = "createdAt")
})
public class TrafficLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sourceIp;
    private Integer sourcePort;
    private String destIp;
    private Integer destPort;
    private String protocol;
    private Integer packetSize;
    private Long bytes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public TrafficLog() {}

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
    public Integer getPacketSize() { return packetSize; }
    public void setPacketSize(Integer packetSize) { this.packetSize = packetSize; }
    public Long getBytes() { return bytes; }
    public void setBytes(Long bytes) { this.bytes = bytes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

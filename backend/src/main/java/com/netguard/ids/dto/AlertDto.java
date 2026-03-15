package com.netguard.ids.dto;

import java.time.Instant;

public record AlertDto(
    Long id,
    String sourceIp,
    Integer sourcePort,
    String destIp,
    Integer destPort,
    String protocol,
    String alertType,
    String severity,
    String signature,
    Long packets,
    Long bytes,
    String action,
    Instant createdAt
) {
    public static AlertDto fromEntity(com.netguard.ids.entity.Alert a) {
        return new AlertDto(
            a.getId(),
            a.getSourceIp(),
            a.getSourcePort(),
            a.getDestIp(),
            a.getDestPort(),
            a.getProtocol(),
            a.getAlertType(),
            a.getSeverity(),
            a.getSignature(),
            a.getPackets(),
            a.getBytes(),
            a.getAction(),
            a.getCreatedAt()
        );
    }
}

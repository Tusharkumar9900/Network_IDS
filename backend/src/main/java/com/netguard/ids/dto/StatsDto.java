package com.netguard.ids.dto;

public record StatsDto(
    long totalAlerts,
    long criticalCount,
    long highCount,
    long mediumCount,
    long lowCount,
    long blacklistedCount
) {}

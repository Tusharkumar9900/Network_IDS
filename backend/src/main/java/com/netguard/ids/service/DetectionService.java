package com.netguard.ids.service;

import com.netguard.ids.entity.Alert;
import com.netguard.ids.entity.TrafficLog;
import com.netguard.ids.repository.AlertRepository;
import com.netguard.ids.repository.BlacklistedIPRepository;
import com.netguard.ids.repository.TrafficLogRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DetectionService {

    private final AlertRepository alertRepository;
    private final BlacklistedIPRepository blacklistedIPRepository;
    private final TrafficLogRepository trafficLogRepository;

    @Value("${netguard.port-scan-threshold:20}")
    private int portScanThreshold;

    @Value("${netguard.port-scan-window-seconds:5}")
    private int portScanWindowSeconds;

    public DetectionService(AlertRepository alertRepository,
                            BlacklistedIPRepository blacklistedIPRepository,
                            TrafficLogRepository trafficLogRepository) {
        this.alertRepository = alertRepository;
        this.blacklistedIPRepository = blacklistedIPRepository;
        this.trafficLogRepository = trafficLogRepository;
    }

    /** Persist packet as traffic log and run rule-based checks (e.g. port scan). Returns new alert if one was created. */
    @Transactional
    public Optional<Alert> processPacket(String sourceIp, Integer sourcePort, String destIp, Integer destPort,
                                        String protocol, Integer packetSize, Long bytes) {
        if (sourceIp == null || sourceIp.isBlank()) return Optional.empty();
        if (blacklistedIPRepository.existsByIp(sourceIp)) return Optional.empty();

        TrafficLog log = new TrafficLog();
        log.setSourceIp(sourceIp);
        log.setSourcePort(sourcePort);
        log.setDestIp(destIp);
        log.setDestPort(destPort);
        log.setProtocol(protocol);
        log.setPacketSize(packetSize);
        log.setBytes(bytes != null ? bytes : (packetSize != null ? (long) packetSize : 0L));
        trafficLogRepository.save(log);

        return checkPortScan(sourceIp);
    }

    private Optional<Alert> checkPortScan(String sourceIp) {
        Instant since = Instant.now().minusSeconds(portScanWindowSeconds);
        List<TrafficLog> logs = trafficLogRepository.findBySourceIpAndCreatedAtAfterOrderByCreatedAtAsc(sourceIp, since);
        Set<Integer> distinctPorts = logs.stream()
            .map(TrafficLog::getDestPort)
            .filter(p -> p != null && p > 0)
            .collect(Collectors.toSet());

        if (distinctPorts.size() >= portScanThreshold) {
            Alert alert = new Alert();
            alert.setSourceIp(sourceIp);
            alert.setSourcePort(logs.isEmpty() ? null : logs.get(0).getSourcePort());
            alert.setDestIp(null);
            alert.setDestPort(null);
            alert.setProtocol("TCP");
            alert.setAlertType("PORT_SCAN");
            alert.setSeverity("HIGH");
            alert.setSignature("Port scan detected: " + distinctPorts.size() + " distinct ports in " + portScanWindowSeconds + "s");
            alert.setPackets((long) logs.size());
            alert.setBytes(logs.stream().mapToLong(TrafficLog::getBytes).sum());
            alert.setAction("monitoring");
            alert = alertRepository.save(alert);
            return Optional.of(alert);
        }
        return Optional.empty();
    }
}

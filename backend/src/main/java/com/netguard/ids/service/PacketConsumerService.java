package com.netguard.ids.service;

import com.netguard.ids.dto.RawPacketDto;
import com.netguard.ids.entity.Alert;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PacketConsumerService {

    private final DetectionService detectionService;
    private final AlertBroadcastService alertBroadcastService;

    public PacketConsumerService(DetectionService detectionService,
                                 AlertBroadcastService alertBroadcastService) {
        this.detectionService = detectionService;
        this.alertBroadcastService = alertBroadcastService;
    }

    @KafkaListener(topics = "raw-packets", groupId = "netguard-ids-consumer")
    public void consumeRawPacket(RawPacketDto packet) {
        if (packet == null) return;

        Optional<Alert> newAlert = detectionService.processPacket(
            packet.getSourceIp(),
            packet.getSourcePort(),
            packet.getDestIp(),
            packet.getDestPort(),
            packet.getProtocol(),
            packet.getPacketSize(),
            packet.getBytes()
        );

        newAlert.ifPresent(alertBroadcastService::broadcastNewAlert);
    }
}

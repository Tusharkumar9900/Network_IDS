package com.netguard.ids.service;

import com.netguard.ids.dto.AlertDto;
import com.netguard.ids.entity.Alert;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class AlertBroadcastService {

    public static final String TOPIC_ALERTS = "/topic/alerts";

    private final SimpMessagingTemplate messagingTemplate;

    public AlertBroadcastService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastNewAlert(Alert alert) {
        messagingTemplate.convertAndSend(TOPIC_ALERTS, AlertDto.fromEntity(alert));
    }
}

package com.netguard.ids.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Optional client for Python Flask ML microservice (Phase 6).
 * When netguard.ml-service-enabled=true, call POST /classify with packet features.
 */
@Service
@ConditionalOnProperty(name = "netguard.ml-service-enabled", havingValue = "true")
public class MlClassificationService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String baseUrl;

    public MlClassificationService(@Value("${netguard.ml-service-url:http://localhost:5000}") String baseUrl) {
        this.baseUrl = baseUrl;
    }

    /** Call ML service /classify with packet features; returns attack label or "normal". */
    public String classify(Map<String, Object> features) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(baseUrl + "/classify", features, Map.class);
            if (response != null && response.containsKey("label")) {
                return String.valueOf(response.get("label"));
            }
        } catch (Exception ignored) {
            // ML service unavailable — fall back to rule-based only
        }
        return "normal";
    }
}

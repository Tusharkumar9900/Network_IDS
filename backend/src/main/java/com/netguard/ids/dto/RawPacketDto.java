package com.netguard.ids.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * JSON payload from Python sniffer (Kafka raw-packets topic).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RawPacketDto {

    private String sourceIp;
    private Integer sourcePort;
    private String destIp;
    private Integer destPort;
    private String protocol;
    private Integer packetSize;
    private Long bytes;
    @JsonProperty("timestamp")
    private String timestamp;  // ISO or epoch ms string

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
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}

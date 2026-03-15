#!/usr/bin/env python3
"""
NetGuard IDS — Packet sniffer. Captures packets and pushes JSON to Kafka raw-packets topic.
Usage: pip install -r requirements.txt  then  python sniffer.py
Requires: Kafka running, topic raw-packets created (or enable auto-create).
Optional: run as root/sudo on Linux for raw capture; on Windows use Npcap.
"""
import json
import os
import sys
from datetime import datetime

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP
except ImportError:
    print("Install scapy: pip install scapy")
    sys.exit(1)

try:
    from kafka import KafkaProducer
except ImportError:
    print("Install kafka-python: pip install kafka-python")
    sys.exit(1)

KAFKA_BOOTSTRAP = os.environ.get("KAFKA_BOOTSTRAP", "localhost:9092")
TOPIC = os.environ.get("KAFKA_TOPIC", "raw-packets")
# Interface: None = default, or "eth0", "en0", "\\Device\\NPF_..."
IFACE = os.environ.get("SNIFF_INTERFACE", None)
MAX_PACKETS = int(os.environ.get("SNIFF_MAX_PACKETS", "0"))  # 0 = infinite


def packet_to_dict(pkt):
    """Convert Scapy packet to JSON-serializable dict for Kafka."""
    d = {
        "sourceIp": None,
        "sourcePort": None,
        "destIp": None,
        "destPort": None,
        "protocol": "OTHER",
        "packetSize": len(pkt) if pkt else 0,
        "bytes": len(pkt) if pkt else 0,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    if not pkt:
        return d
    if pkt.haslayer(IP):
        ip = pkt[IP]
        d["sourceIp"] = ip.src
        d["destIp"] = ip.dst
        d["bytes"] = len(pkt)
    if pkt.haslayer(TCP):
        d["protocol"] = "TCP"
        d["sourcePort"] = int(pkt[TCP].sport)
        d["destPort"] = int(pkt[TCP].dport)
    elif pkt.haslayer(UDP):
        d["protocol"] = "UDP"
        d["sourcePort"] = int(pkt[UDP].sport)
        d["destPort"] = int(pkt[UDP].dport)
    elif pkt.haslayer(ICMP):
        d["protocol"] = "ICMP"
    d["packetSize"] = d["bytes"]
    return d


def main():
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
    except Exception as e:
        print(f"Kafka connection failed: {e}")
        sys.exit(1)

    count = [0]  # use list so callback can mutate

    def on_packet(pkt):
        try:
            doc = packet_to_dict(pkt)
            producer.send(TOPIC, value=doc)
            count[0] += 1
            if count[0] <= 5 or count[0] % 100 == 0:
                print(f"Sent #{count[0]} -> {doc.get('sourceIp')}:{doc.get('sourcePort')} -> {doc.get('destIp')}:{doc.get('destPort')} [{doc.get('protocol')}]")
        except Exception as e:
            print("Error:", e)
        if MAX_PACKETS and count[0] >= MAX_PACKETS:
            raise KeyboardInterrupt("Reached max packets")

    print(f"Sniffing on {IFACE or 'default'} -> Kafka {KAFKA_BOOTSTRAP} topic {TOPIC}. Ctrl+C to stop.")
    try:
        sniff(iface=IFACE, prn=on_packet, store=False)
    except KeyboardInterrupt:
        pass
    producer.flush()
    producer.close()
    print(f"Total sent: {count[0]}")


if __name__ == "__main__":
    main()

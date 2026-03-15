# NetGuard IDS — Backend

Spring Boot API + Python packet capture and ML stub.

## Stack

- **Spring Boot 3**: REST, WebSocket (STOMP), JPA, Kafka consumer
- **PostgreSQL**: `alerts`, `ip_blacklist`, `traffic_logs`
- **Kafka**: consume `raw-packets` topic (produced by Python sniffer)
- **Python**: `sniffer.py` (Scapy → Kafka), `ml_service.py` (Flask ML stub)

---

## 1. PostgreSQL

Create DB and user:

```sql
CREATE DATABASE netguard_ids;
-- use user/postgres or create one; set password in application.yml
```

Update `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/netguard_ids
    username: postgres
    password: YOUR_PASSWORD
```

---

## 2. Kafka

- Install and start Kafka (e.g. single node).
- Create topic (or rely on auto-create):

```bash
# Kafka 2.x+
kafka-topics.sh --create --topic raw-packets --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

---

## 3. Run Spring Boot

```bash
cd backend
./mvnw spring-boot:run
# Or: mvn spring-boot:run
```

- **REST**: http://localhost:8080  
  - `GET /api/alerts` — list alerts (optional `?severity=CRITICAL&limit=50`)  
  - `GET /api/stats` — counts (total, by severity, blacklist)  
  - `POST /api/blacklist` — body `{"ip":"1.2.3.4","reason":"manual"}`  
  - `DELETE /api/blacklist/{ip}` — remove from blacklist  
- **WebSocket**: ws://localhost:8080/ws (STOMP). Subscribe to `/topic/alerts` for real-time new alerts.

If Kafka is not running, the app may fail to start (consumer). Temporarily disable Kafka:

```yaml
spring:
  kafka:
    consumer:
      auto-startup: false
```

---

## 4. Python — Packet capture (Phase 5)

```bash
cd backend/python
pip install -r requirements.txt
# On Linux, raw capture may need: sudo python sniffer.py
python sniffer.py
```

Env (optional):

- `KAFKA_BOOTSTRAP=localhost:9092`
- `KAFKA_TOPIC=raw-packets`
- `SNIFF_INTERFACE=` (default) or `eth0` / `en0`
- `SNIFF_MAX_PACKETS=1000` (0 = infinite)

Packets are sent as JSON to Kafka; Spring Boot consumes them, runs rule-based detection (e.g. port scan: >20 ports in 5s), persists to DB and pushes new alerts over WebSocket.

---

## 5. Python — ML service (Phase 6)

Train on CICIDS2017 → export `model.pkl` into `backend/python/`. Then:

```bash
cd backend/python
pip install -r requirements.txt
python ml_service.py
```

- **Health**: `GET http://localhost:5000/health`
- **Classify**: `POST http://localhost:5000/classify` with JSON body, e.g.  
  `{"packet_size": 64, "protocol": "tcp"}`  
  Returns `{"label": "normal"}` or attack label.

Enable in Spring Boot:

```yaml
netguard:
  ml-service-enabled: true
  ml-service-url: http://localhost:5000
```

---

## 6. Connect React frontend

- **API base**: `http://localhost:8080` (or set in frontend env).
- **WebSocket**: connect to `http://localhost:8080/ws` with SockJS + STOMP; subscribe to `/topic/alerts` to receive new alerts in real time.

---

## Project layout

```
backend/
├── pom.xml
├── README.md
├── src/main/java/com/netguard/ids/
│   ├── NetGuardIdsApplication.java
│   ├── config/          # WebSocket, CORS
│   ├── dto/             # AlertDto, StatsDto, RawPacketDto
│   ├── entity/          # Alert, BlacklistedIP, TrafficLog
│   ├── repository/     # JPA
│   ├── service/         # Detection, Kafka consumer, WebSocket broadcast, optional ML client
│   └── web/             # REST: alerts, stats, blacklist
├── src/main/resources/
│   └── application.yml
└── python/
    ├── requirements.txt
    ├── sniffer.py       # Scapy → Kafka raw-packets
    └── ml_service.py    # Flask /classify stub (+ model.pkl when ready)
```

# NetGuard IDS

Network Intrusion Detection System — React dashboard, Spring Boot backend, Python Scapy capture, Kafka, PostgreSQL.

## Project structure

```
network-ids/
├── frontend/    # React + Vite + Recharts — connects to backend API + WebSocket
├── backend/     # Spring Boot API, Kafka consumer, WebSocket, PostgreSQL
└── README.md
```

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. In dev, the frontend proxies `/api` and `/ws` to the backend (http://localhost:8080). Start the backend first so Overview and Alerts tabs show live data.

## Run backend

See `backend/README.md`. Summary: PostgreSQL + Kafka, then `cd backend && mvn spring-boot:run`. Alerts tab uses `GET /api/alerts`, `GET /api/stats`, `POST /api/blacklist`, and WebSocket `/ws` (subscribe to `/topic/alerts`) for real-time alerts.

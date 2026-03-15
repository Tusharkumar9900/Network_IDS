/**
 * NetGuard IDS — Backend API client.
 * Base URL: VITE_API_URL or http://localhost:8080
 */

// Use relative URLs in dev so Vite proxy can forward to backend; override with VITE_API_URL if needed
const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:8080");

/** WebSocket base: same origin as API (e.g. ws from http) */
function getWsBase() {
  if (API_BASE && API_BASE.startsWith("http")) {
    const u = new URL(API_BASE);
    const protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${u.host}`;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
  }
  return "ws://localhost:8080";
}

async function request(path, options = {}) {
  const base = API_BASE || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080");
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") return null;
  return res.json();
}

export async function getAlerts(params = {}) {
  const sp = new URLSearchParams();
  if (params.severity) sp.set("severity", params.severity);
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return request(`/api/alerts${q ? `?${q}` : ""}`);
}

export async function getStats() {
  return request("/api/stats");
}

export async function addToBlacklist(ip, reason = "Manual block") {
  return request("/api/blacklist", {
    method: "POST",
    body: JSON.stringify({ ip, reason }),
  });
}

/**
 * Backend AlertDto → UI alert shape for AlertsTab
 */
export function mapAlertFromApi(dto) {
  const createdAt = dto.createdAt ? new Date(dto.createdAt) : null;
  const time = createdAt ? createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "—";
  const type = (dto.alertType || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: dto.id,
    ip: dto.sourceIp || "—",
    srcPort: dto.sourcePort ?? null,
    dstIp: dto.destIp || "—",
    dstPort: dto.destPort ?? null,
    type: type || "—",
    severity: dto.severity || "LOW",
    time,
    packets: dto.packets ?? 0,
    bytes: dto.bytes ?? 0,
    country: "—",
    city: "—",
    protocol: dto.protocol || "—",
    signature: dto.signature || "—",
    action: dto.action || "monitoring",
  };
}

/**
 * Subscribe to real-time alerts via WebSocket (STOMP over SockJS).
 * Calls onAlert(AlertDto) for each new alert. Returns disconnect function.
 */
export function connectAlertsSocket(onAlert) {
  let stompClient = null;
  let sock = null;

  (async () => {
    try {
      const { Client } = await import("@stomp/stompjs");
      const SockJS = (await import("sockjs-client")).default;
      const wsBase = getWsBase();
    const sockUrl = `${wsBase.replace(/^wss?/, wsBase.startsWith("wss") ? "https" : "http")}/ws`;
      sock = new SockJS(sockUrl);
      stompClient = new Client({
        webSocketFactory: () => sock,
        reconnectDelay: 5000,
        onConnect: () => {
          stompClient.subscribe("/topic/alerts", (msg) => {
            try {
              const dto = JSON.parse(msg.body);
              if (dto && onAlert) onAlert(dto);
            } catch (_) {}
          });
        },
      });
      stompClient.activate();
    } catch (_) {}
  })();

  return () => {
    if (stompClient) {
      stompClient.deactivate?.();
      stompClient = null;
    }
    if (sock) {
      sock.close?.();
      sock = null;
    }
  };
}

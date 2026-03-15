import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function nextPoint(prev) {
  const t = prev.t + 1;
  const inbound = Math.max(40, Math.min(980, prev.inbound + (Math.random() - 0.45) * 130));
  const outbound = Math.max(20, Math.min(600, prev.outbound + (Math.random() - 0.48) * 90));
  const blocked = Math.max(0, Math.min(80, prev.blocked + (Math.random() - 0.5) * 18));
  const now = new Date();
  const label = `${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  return { t, inbound, outbound, blocked, label };
}

const PROTOCOLS = [
  { name: "TCP", value: 38, color: "#00b4d8" },
  { name: "UDP", value: 24, color: "#00e676" },
  { name: "HTTP", value: 18, color: "#a78bfa" },
  { name: "DNS", value: 12, color: "#ff9f43" },
  { name: "ICMP", value: 8, color: "#ffd60a" },
];

const INITIAL_FLOWS = [
  { id: 1, src: "172.16.5.23:80", dst: "10.0.0.1:*", proto: "UDP", bytes: 963440, status: "blocked" },
  { id: 2, src: "10.0.0.87:52341", dst: "10.0.0.5:22", proto: "SSH", bytes: 71280, status: "blocked" },
  { id: 3, src: "192.168.1.104:45821", dst: "10.0.0.1:22", proto: "TCP", bytes: 187280, status: "monitoring" },
  { id: 4, src: "203.0.113.5:55123", dst: "10.0.0.10:80", proto: "HTTP", bytes: 1840, status: "blocked" },
  { id: 5, src: "10.10.1.45:0", dst: "10.0.0.3:443", proto: "TLS", bytes: 45360, status: "investigating" },
  { id: 6, src: "192.168.3.212:43219", dst: "10.0.0.8:3306", proto: "TCP", bytes: 10720, status: "monitoring" },
];

const STATUS_COLOR = {
  blocked: "#ff4d6d",
  monitoring: "#ff9f43",
  investigating: "#a78bfa",
};

function fmtBytes(b) {
  if (b > 1e6) return `${(b / 1e6).toFixed(2)} MB/s`;
  if (b > 1e3) return `${(b / 1e3).toFixed(1)} KB/s`;
  return `${b} B/s`;
}

function BandwidthArc({ label, value, max, color }) {
  const pct = Math.min(1, value / max);
  const r = 54;
  const cx = 80;
  const cy = 76;
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweep = (endAngle - startAngle) * pct;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(startAngle + sweep);
  const y2 = cy + r * Math.sin(startAngle + sweep);
  const large = pct > 0.5 ? 1 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="160" height="90" viewBox="0 0 160 90">
        {/* Track */}
        <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="10" strokeLinecap="round" />
        {/* Value arc */}
        {pct > 0.01 && (
          <path d={`M ${x1},${y1} A ${r},${r} 0 ${large},1 ${x2},${y2}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" from={`0 ${Math.PI * r}`} to={`${Math.PI * r * pct} ${Math.PI * r * (1 - pct)}`} dur=".8s" fill="freeze" />
          </path>
        )}
        <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize="18" fontWeight="800" fontFamily="'Space Mono',monospace">{Math.round(pct * 100)}%</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,.3)" fontSize="9" fontFamily="'DM Sans',sans-serif" letterSpacing="1">{label}</text>
      </svg>
    </div>
  );
}

function buildInitialHistory() {
  const pts = [];
  let p = { t: 0, inbound: 450, outbound: 280, blocked: 25, label: "00:00" };
  for (let i = 0; i < 40; i++) {
    p = nextPoint(p);
    pts.push(p);
  }
  return pts;
}

export function TrafficTab() {
  const counterRef = useRef(0);
  const [history, setHistory] = useState(buildInitialHistory);
  const [flows, setFlows] = useState(() => INITIAL_FLOWS.map(f => ({ ...f, pkts: Math.floor(rand(50, 5000)) })));
  const [anomaly, setAnomaly] = useState(false);
  const [pps, setPps] = useState(2843);

  const latest = history[history.length - 1];

  useEffect(() => {
    const id = setInterval(() => {
      counterRef.current += 1;
      setHistory(prev => {
        const last = prev[prev.length - 1];
        let newPt = nextPoint(last);
        if (Math.random() < 0.05) newPt = { ...newPt, inbound: Math.min(980, newPt.inbound + 300) };
        return [...prev.slice(1), newPt];
      });
      setPps(p => Math.max(800, Math.min(8000, p + Math.floor(rand(-300, 300)))));
      setFlows(prev => prev.map(f => ({
        ...f,
        pkts: f.pkts + Math.floor(rand(0, f.status === "blocked" ? 50 : 10)),
        bytes: f.bytes + Math.floor(rand(0, 5000)),
      })));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const peakInbound = history[history.length - 1]?.inbound ?? 0;
    setAnomaly(peakInbound > 800);
  }, [history]);

  const inboundMbps = latest ? (latest.inbound * 1024) / 1000 : 0;
  const outboundMbps = latest ? (latest.outbound * 1024) / 1000 : 0;
  const blockRate = latest ? ((latest.blocked / (latest.inbound + 1)) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "idsIn .4s ease" }}>

      {/* Live metric cards */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { label: "Inbound", val: `${inboundMbps.toFixed(1)} Mbps`, sub: "↓ inbound", color: "#00e676", icon: "📥" },
          { label: "Outbound", val: `${outboundMbps.toFixed(1)} Mbps`, sub: "↑ outbound", color: "#00b4d8", icon: "📤" },
          { label: "Packets/sec", val: pps.toLocaleString(), sub: "live rate", color: "#a78bfa", icon: "⚡" },
          { label: "Block Rate", val: `${blockRate.toFixed(1)}%`, sub: "of total traffic", color: "#ff4d6d", icon: "🚫" },
        ].map(m => (
          <div key={m.label} style={{
            flex: 1, minWidth: 150, background: "rgba(255,255,255,.025)",
            border: `1px solid ${m.color}25`, borderRadius: 14, padding: "16px 20px", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: m.color, opacity: .06, filter: "blur(20px)" }} />
            <div style={{ fontSize: 18, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: -1 }}>{m.val}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: m.color, marginTop: 4, fontFamily: "'Space Mono',monospace" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Live chart */}
      <div style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Live Network Traffic</div>
              {anomaly && (
                <div style={{ background: "rgba(255,77,109,.15)", border: "1px solid rgba(255,77,109,.4)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#ff4d6d", fontWeight: 700, letterSpacing: 1, animation: "idsPing 1s ease infinite" }}>
                  ⚠ ANOMALY
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 3 }}>Real-time · updates every 1.4s · last 40 samples</div>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
            {[["Inbound", "#00e676"], ["Outbound", "#00b4d8"], ["Blocked", "#ff4d6d"]].map(([l, c]) => (
              <span key={l} style={{ color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />{l}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tgIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e676" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tgOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tgBlk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,.2)", fontSize: 9 }} axisLine={false} tickLine={false} interval={7} />
            <YAxis tick={{ fill: "rgba(255,255,255,.2)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#0d1520", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
            <Area isAnimationActive={false} type="monotone" dataKey="inbound" stroke="#00e676" strokeWidth={2} fill="url(#tgIn)" name="Inbound (Mbps)" />
            <Area isAnimationActive={false} type="monotone" dataKey="outbound" stroke="#00b4d8" strokeWidth={2} fill="url(#tgOut)" name="Outbound (Mbps)" />
            <Area isAnimationActive={false} type="monotone" dataKey="blocked" stroke="#ff4d6d" strokeWidth={1.5} fill="url(#tgBlk)" name="Blocked" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>

        {/* Top flows */}
        <div style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Top Active Flows</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 16 }}>Live packet count · auto-updating</div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 60px 80px 90px", gap: 8, padding: "4px 8px", marginBottom: 8 }}>
            {["SOURCE", "DESTINATION", "PROTO", "BYTES", "STATUS"].map(h => (
              <div key={h} style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {flows.map(f => (
              <div key={f.id} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 60px 80px 90px",
                gap: 8, alignItems: "center", padding: "9px 8px",
                background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)",
                borderRadius: 9,
              }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#e8eaf0" }}>{f.src}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,.6)" }}>{f.dst}</div>
                <div style={{ fontSize: 11, color: "#00b4d8", fontFamily: "'Space Mono',monospace" }}>{f.proto}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,.5)" }}>{fmtBytes(f.bytes)}</div>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase",
                  color: STATUS_COLOR[f.status], background: `${STATUS_COLOR[f.status]}15`,
                  border: `1px solid ${STATUS_COLOR[f.status]}30`,
                  borderRadius: 5, padding: "2px 6px", textAlign: "center",
                }}>{f.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Protocol dist + gauge */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Gauge */}
          <div style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "16px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", alignSelf: "flex-start", marginLeft: 12, marginBottom: 4 }}>Bandwidth Utilization</div>
            <div style={{ display: "flex", gap: 0, justifyContent: "center" }}>
              <BandwidthArc label="INBOUND" value={inboundMbps} max={1000} color="#00e676" />
              <BandwidthArc label="OUTBOUND" value={outboundMbps} max={1000} color="#00b4d8" />
            </div>
          </div>

          {/* Protocol pie */}
          <div style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 20, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Protocol Mix</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 10 }}>By packet volume</div>
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={PROTOCOLS} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" stroke="none">
                  {PROTOCOLS.map((e, i) => <Cell key={i} fill={e.color} opacity={0.85} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1520", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {PROTOCOLS.map(p => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: p.color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)", flex: 1 }}>{p.name}</span>
                  <div style={{ width: 50, height: 3, borderRadius: 2, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
                    <div style={{ width: `${p.value}%`, height: "100%", background: p.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: p.color, width: 26, textAlign: "right" }}>{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

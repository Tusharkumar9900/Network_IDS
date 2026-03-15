import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { AlertsTab } from "./AlertsTab";
import { TopologyTab } from "./TopologyTab";
import { TrafficTab } from "./TrafficTab";
import { getStats, getAlerts, mapAlertFromApi } from "./api";

const trafficData = [
  { time: "00:00", normal: 420, suspicious: 12, blocked: 3 },
  { time: "02:00", normal: 310, suspicious: 8, blocked: 1 },
  { time: "04:00", normal: 280, suspicious: 5, blocked: 0 },
  { time: "06:00", normal: 390, suspicious: 20, blocked: 7 },
  { time: "08:00", normal: 820, suspicious: 45, blocked: 18 },
  { time: "10:00", normal: 1240, suspicious: 89, blocked: 34 },
  { time: "12:00", normal: 1580, suspicious: 120, blocked: 52 },
  { time: "14:00", normal: 1320, suspicious: 67, blocked: 28 },
  { time: "16:00", normal: 980, suspicious: 43, blocked: 15 },
  { time: "18:00", normal: 760, suspicious: 31, blocked: 9 },
  { time: "20:00", normal: 540, suspicious: 22, blocked: 6 },
  { time: "22:00", normal: 430, suspicious: 15, blocked: 4 },
];

const attackTypes = [
  { name: "Port Scan", value: 34, color: "#ff4d6d" },
  { name: "DDoS", value: 22, color: "#ff9f43" },
  { name: "SQL Inject", value: 18, color: "#ffd60a" },
  { name: "MITM", value: 14, color: "#7b2d8b" },
  { name: "Brute Force", value: 12, color: "#0096c7" },
];

// Overview alerts: loaded from API (fallback to empty)

const topSuspiciousIPs = [
  { ip: "172.16.5.23", hits: 12043, risk: 95 },
  { ip: "10.0.0.87", hits: 891, risk: 87 },
  { ip: "192.168.1.104", hits: 2341, risk: 74 },
  { ip: "10.10.1.45", hits: 567, risk: 62 },
  { ip: "192.168.3.212", hits: 134, risk: 41 },
];

const protocolData = [
  { name: "TCP", packets: 8420 },
  { name: "UDP", packets: 3210 },
  { name: "ICMP", packets: 1580 },
  { name: "HTTP", packets: 5430 },
  { name: "DNS", packets: 2890 },
  { name: "SSH", packets: 430 },
];

const severityColor = {
  CRITICAL: { bg: "rgba(255,77,109,0.15)", text: "#ff4d6d", border: "#ff4d6d" },
  HIGH: { bg: "rgba(255,159,67,0.15)", text: "#ff9f43", border: "#ff9f43" },
  MEDIUM: { bg: "rgba(255,214,10,0.12)", text: "#ffd60a", border: "#ffd60a" },
  LOW: { bg: "rgba(0,230,118,0.12)", text: "#00e676", border: "#00e676" },
};

function PulsingDot({ color }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 10, height: 10 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, animation: "ping 1.4s ease-in-out infinite", opacity: 0.6
      }} />
      <span style={{ position: "absolute", inset: "2px", borderRadius: "50%", background: color }} />
    </span>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 16,
      padding: "20px 24px",
      position: "relative",
      overflow: "hidden",
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", background: color, opacity: 0.08, filter: "blur(20px)"
      }} />
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Space Mono', monospace", letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 6, fontFamily: "'Space Mono', monospace" }}>{sub}</div>}
    </div>
  );
}

export default function IDSDashboard() {
  const [livePackets, setLivePackets] = useState(482103);
  const [activeTab, setActiveTab] = useState("overview");
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [overviewAlerts, setOverviewAlerts] = useState([]);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    getAlerts({ limit: 6 })
      .then((list) => setOverviewAlerts((list || []).map(mapAlertFromApi)))
      .catch(() => setOverviewAlerts([]));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setLivePackets(p => p + Math.floor(Math.random() * 40 + 10));
      setTime(new Date());
    }, 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c14",
      color: "#e8eaf0",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes ping { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(2.2);opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes idsIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        @keyframes idsPing { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(255,77,109,.4)} 50%{opacity:.9;box-shadow:0 0 0 6px rgba(255,77,109,0)} }
        .card-hover { transition: border-color 0.2s, transform 0.2s; }
        .card-hover:hover { border-color: rgba(0,230,118,0.25) !important; transform: translateY(-1px); }
        .tab-btn { background:none;border:none;cursor:pointer;transition:all 0.2s; }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(0,230,118,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,118,0.03) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        pointerEvents: "none"
      }} />
      <div style={{ position: "fixed", top: "10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,77,109,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #00e676, #00b4d8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, boxShadow: "0 0 20px rgba(0,230,118,0.3)"
            }}>🛡️</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5, color: "#fff" }}>
                NetGuard <span style={{ color: "#00e676" }}>IDS</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase" }}>Intrusion Detection System</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              <PulsingDot color="#00e676" />
              <span style={{ fontFamily: "'Space Mono', monospace", color: "#00e676" }}>MONITORING ACTIVE</span>
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              {time.toLocaleTimeString()}
            </div>
            <div style={{
              background: "rgba(255,77,109,0.15)", border: "1px solid rgba(255,77,109,0.4)",
              borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#ff4d6d",
              fontWeight: 600, display: "flex", alignItems: "center", gap: 6
            }}>
              <PulsingDot color="#ff4d6d" />
              {stats ? stats.criticalCount : 0} CRITICAL
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {["overview", "alerts", "traffic", "topology"].map(tab => (
            <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{
              padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: 1.5,
              color: activeTab === tab ? "#00e676" : "rgba(255,255,255,0.35)",
              background: activeTab === tab ? "rgba(0,230,118,0.1)" : "transparent",
              border: activeTab === tab ? "1px solid rgba(0,230,118,0.25)" : "1px solid transparent",
            }}>{tab}</button>
          ))}
        </div>

        {activeTab === "alerts" && (
          <div style={{ padding: "20px 0 0" }}>
            <AlertsTab />
          </div>
        )}

        {activeTab === "overview" && (
        <>
        <div style={{ display: "flex", gap: 16, padding: "20px 0 0", flexWrap: "wrap" }}>
          <StatCard label="Packets Analyzed" value={livePackets.toLocaleString()} sub="↑ live stream" color="#00e676" icon="📦" />
          <StatCard label="Threats Detected" value={stats ? String(stats.totalAlerts) : "—"} sub={stats ? "from backend" : "connect backend"} color="#ff4d6d" icon="⚠️" />
          <StatCard label="IPs Blocked" value={stats ? String(stats.blacklistedCount) : "—"} sub="blacklist" color="#ff9f43" icon="🚫" />
          <StatCard label="Avg Latency" value="2.4ms" sub="↓ optimal" color="#00b4d8" icon="⚡" />
          <StatCard label="Uptime" value="99.97%" sub="14d 6h 32m" color="#a78bfa" icon="🟢" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginTop: 20 }}>
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: 24, animation: "fadeIn 0.5s ease"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Network Traffic Overview</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>Last 24 hours · packets/min</div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
                {[["Normal", "#00e676"], ["Suspicious", "#ff9f43"], ["Blocked", "#ff4d6d"]].map(([l, c]) => (
                  <span key={l} style={{ color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="gNorm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSusp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9f43" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ff9f43" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBlk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="normal" stroke="#00e676" strokeWidth={2} fill="url(#gNorm)" />
                <Area type="monotone" dataKey="suspicious" stroke="#ff9f43" strokeWidth={2} fill="url(#gSusp)" />
                <Area type="monotone" dataKey="blocked" stroke="#ff4d6d" strokeWidth={2} fill="url(#gBlk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: 24
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Attack Distribution</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>By type · today</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={attackTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                  dataKey="value" stroke="none">
                  {attackTypes.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {attackTypes.map(a => (
                <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: a.color, display: "inline-block" }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{ width: `${a.value}%`, height: "100%", background: a.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: a.color }}>{a.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16, marginBottom: 24 }}>
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: 24
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Live Alerts</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Real-time threat feed</div>
              </div>
              <div style={{ background: "rgba(255,77,109,0.12)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#ff4d6d", fontWeight: 600 }}>
                {overviewAlerts.length} ACTIVE
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {overviewAlerts.length === 0 && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", padding: 12 }}>No alerts yet. Start the backend and Python sniffer to see live alerts.</div>
              )}
              {overviewAlerts.map(a => {
                const s = severityColor[a.severity];
                return (
                  <div key={a.id} className="card-hover" style={{
                    background: s.bg, border: `1px solid ${s.border}22`,
                    borderRadius: 10, padding: "10px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        background: s.bg, border: `1px solid ${s.border}44`,
                        borderRadius: 6, padding: "2px 7px", fontSize: 9,
                        color: s.text, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase"
                      }}>{a.severity}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "'Space Mono', monospace" }}>{a.ip}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{a.type} · {a.country}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: s.text }}>{a.packets.toLocaleString()} pkts</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{a.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 24, flex: 1
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Protocol Breakdown</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>Packets by protocol type</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={protocolData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="packets" fill="#00b4d8" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 24
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Top Suspicious IPs</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>Risk score · packet count</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topSuspiciousIPs.map((ip, i) => (
                  <div key={ip.ip} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", width: 14 }}>#{i + 1}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#fff", flex: 1 }}>{ip.ip}</div>
                    <div style={{ flex: 2, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{
                        width: `${ip.risk}%`, height: "100%", borderRadius: 2,
                        background: ip.risk > 80 ? "#ff4d6d" : ip.risk > 60 ? "#ff9f43" : "#ffd60a"
                      }} />
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: ip.risk > 80 ? "#ff4d6d" : ip.risk > 60 ? "#ff9f43" : "#ffd60a", width: 36, textAlign: "right" }}>
                      {ip.risk}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {activeTab === "traffic" && (
          <div style={{ padding: "20px 0 0" }}>
            <TrafficTab />
          </div>
        )}
        {activeTab === "topology" && (
          <div style={{ padding: "20px 0 0" }}>
            <TopologyTab />
          </div>
        )}
      </div>
    </div>
  );
}

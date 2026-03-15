import { useState } from "react";

const NODES = [
  { id: "internet", label: "Internet", sublabel: "External Cloud", icon: "🌐", x: 450, y: 50, status: "normal", ip: "0.0.0.0/0", os: "—", openPorts: "All", alerts: 0, inbound: "482 Mbps", outbound: "145 Mbps" },
  { id: "firewall", label: "Firewall", sublabel: "pfSense 2.7", icon: "🔥", x: 450, y: 148, status: "normal", ip: "10.0.0.254", os: "FreeBSD 14", openPorts: "443, 80 (filtered)", alerts: 0, inbound: "480 Mbps", outbound: "143 Mbps" },
  { id: "router", label: "Core Router", sublabel: "Cisco ASR 1001", icon: "⚡", x: 450, y: 254, status: "warning", ip: "10.0.0.1", os: "IOS-XE 17.6", openPorts: "BGP 179, SNMP 161", alerts: 3, inbound: "476 Mbps", outbound: "140 Mbps" },
  { id: "dmz", label: "DMZ Switch", sublabel: "HP ProCurve", icon: "🔀", x: 210, y: 360, status: "critical", ip: "10.1.0.1", os: "ProVision 15.20", openPorts: "All trunked", alerts: 7, inbound: "220 Mbps", outbound: "110 Mbps" },
  { id: "intsw", label: "Int. Switch", sublabel: "Cisco Cat 9300", icon: "🔀", x: 690, y: 360, status: "normal", ip: "10.2.0.1", os: "IOS-XE 17.4", openPorts: "All trunked", alerts: 1, inbound: "256 Mbps", outbound: "30 Mbps" },
  { id: "web", label: "Web Server", sublabel: "nginx 1.24", icon: "🖥️", x: 60, y: 470, status: "critical", ip: "10.1.0.10", os: "Ubuntu 22.04", openPorts: "80, 443", alerts: 5, inbound: "112 Mbps", outbound: "64 Mbps" },
  { id: "mail", label: "Mail Server", sublabel: "Postfix 3.7", icon: "📧", x: 210, y: 470, status: "normal", ip: "10.1.0.20", os: "Debian 12", openPorts: "25, 465, 587", alerts: 0, inbound: "18 Mbps", outbound: "12 Mbps" },
  { id: "db", label: "DB Server", sublabel: "PostgreSQL 16", icon: "🗄️", x: 360, y: 470, status: "warning", ip: "10.1.0.30", os: "RHEL 9.2", openPorts: "5432, 3306", alerts: 2, inbound: "90 Mbps", outbound: "34 Mbps" },
  { id: "ws1", label: "WS-01", sublabel: "Finance Dept", icon: "💻", x: 570, y: 470, status: "critical", ip: "10.2.0.10", os: "Windows 11", openPorts: "RDP 3389, SMB 445", alerts: 4, inbound: "88 Mbps", outbound: "14 Mbps" },
  { id: "ws2", label: "WS-02", sublabel: "IT Dept", icon: "💻", x: 690, y: 470, status: "normal", ip: "10.2.0.11", os: "Windows 11", openPorts: "RDP 3389", alerts: 0, inbound: "24 Mbps", outbound: "8 Mbps" },
  { id: "ws3", label: "WS-03", sublabel: "HR Dept", icon: "💻", x: 810, y: 470, status: "normal", ip: "10.2.0.12", os: "macOS 14.4", openPorts: "RDP 3389", alerts: 0, inbound: "16 Mbps", outbound: "5 Mbps" },
];

const EDGES = [
  { from: "internet", to: "firewall", status: "normal",   packets: 2, speed: 2.0 },
  { from: "firewall", to: "router",   status: "normal",   packets: 2, speed: 2.2 },
  { from: "router",   to: "dmz",      status: "critical", packets: 5, speed: 1.1 },
  { from: "router",   to: "intsw",    status: "normal",   packets: 2, speed: 2.4 },
  { from: "dmz",      to: "web",      status: "critical", packets: 6, speed: 0.9 },
  { from: "dmz",      to: "mail",     status: "normal",   packets: 1, speed: 3.0 },
  { from: "dmz",      to: "db",       status: "warning",  packets: 3, speed: 1.6 },
  { from: "intsw",    to: "ws1",      status: "critical", packets: 5, speed: 1.2 },
  { from: "intsw",    to: "ws2",      status: "normal",   packets: 1, speed: 3.5 },
  { from: "intsw",    to: "ws3",      status: "normal",   packets: 1, speed: 4.0 },
];

const SC = {
  normal:   { stroke: "#00e676", bg: "rgba(0,230,118,0.1)",   glow: "#00e676", text: "#00e676" },
  warning:  { stroke: "#ff9f43", bg: "rgba(255,159,67,0.12)", glow: "#ff9f43", text: "#ff9f43" },
  critical: { stroke: "#ff4d6d", bg: "rgba(255,77,109,0.14)", glow: "#ff4d6d", text: "#ff4d6d" },
};

const STATUS_LABEL = { normal: "ONLINE", warning: "WARNING", critical: "COMPROMISED" };

const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

export function TopologyTab() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? nodeMap[selectedId] : null;

  const counts = {
    online: NODES.filter(n => n.status === "normal").length,
    warning: NODES.filter(n => n.status === "warning").length,
    critical: NODES.filter(n => n.status === "critical").length,
    totalAlerts: NODES.reduce((s, n) => s + n.alerts, 0),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "idsIn .4s ease" }}>

      {/* Stat bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Nodes Online", val: counts.online, color: "#00e676", bg: "rgba(0,230,118,0.08)", icon: "🟢" },
          { label: "Warning", val: counts.warning, color: "#ff9f43", bg: "rgba(255,159,67,0.08)", icon: "⚠️" },
          { label: "Compromised", val: counts.critical, color: "#ff4d6d", bg: "rgba(255,77,109,0.1)", icon: "🔴" },
          { label: "Active Alerts", val: counts.totalAlerts, color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "🚨" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 12, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: 1.5 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Main area */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 300px" : "1fr", gap: 16 }}>

        {/* SVG Map */}
        <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: 16, overflow: "hidden" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
            {["normal", "warning", "critical"].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: SC[s].stroke }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 1.2 }}>{STATUS_LABEL[s]}</span>
              </div>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 2, background: "rgba(255,255,255,.15)" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>Normal Flow</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 2, background: "#ff4d6d", opacity: .7 }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>Threat Flow</span>
              </div>
            </div>
          </div>

          <svg viewBox="0 0 900 540" style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              {/* Glow filters */}
              <filter id="topo-glow-critical" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="topo-glow-warning" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Subtle grid */}
              <pattern id="topo-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Grid bg */}
            <rect width="900" height="540" fill="url(#topo-grid)" />

            {/* Edges — lines */}
            {EDGES.map(edge => {
              const fn = nodeMap[edge.from];
              const tn = nodeMap[edge.to];
              const isThreat = edge.status === "critical";
              const isWarn = edge.status === "warning";
              return (
                <line
                  key={`line-${edge.from}-${edge.to}`}
                  x1={fn.x} y1={fn.y} x2={tn.x} y2={tn.y}
                  stroke={isThreat ? "rgba(255,77,109,0.45)" : isWarn ? "rgba(255,159,67,0.3)" : "rgba(255,255,255,0.1)"}
                  strokeWidth={isThreat ? 2 : 1}
                  strokeDasharray={isThreat ? "8 5" : isWarn ? "5 4" : "none"}
                />
              );
            })}

            {/* Animated packets */}
            {EDGES.map(edge => {
              const fn = nodeMap[edge.from];
              const tn = nodeMap[edge.to];
              return Array.from({ length: edge.packets }, (_, i) => (
                <circle key={`pkt-${edge.from}-${edge.to}-${i}`} r={edge.status === "critical" ? 3.5 : 2.5} fill={SC[edge.status].stroke} opacity={0.9}>
                  <animateMotion
                    dur={`${edge.speed}s`}
                    repeatCount="indefinite"
                    begin={`${-(i * edge.speed / edge.packets).toFixed(2)}s`}
                    path={`M ${fn.x},${fn.y} L ${tn.x},${tn.y}`}
                  />
                </circle>
              ));
            })}

            {/* Nodes */}
            {NODES.map(node => {
              const sc = SC[node.status];
              const isSel = selectedId === node.id;
              const isCrit = node.status === "critical";
              const isWarn = node.status === "warning";
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedId(selectedId === node.id ? null : node.id)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Pulse ring for critical */}
                  {isCrit && (
                    <>
                      <circle cx={node.x} cy={node.y} r="34" fill="none" stroke="#ff4d6d" strokeWidth="1.5" opacity="0">
                        <animate attributeName="r" values="30;44;30" dur="2.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.8s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}

                  {/* Warning ring */}
                  {isWarn && (
                    <circle cx={node.x} cy={node.y} r="31" fill="none" stroke="#ff9f43" strokeWidth="1" strokeDasharray="4 3" opacity="0.4">
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${node.x} ${node.y}`} to={`360 ${node.x} ${node.y}`} dur="8s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Selection ring */}
                  {isSel && (
                    <circle cx={node.x} cy={node.y} r="36" fill="none" stroke={sc.stroke} strokeWidth="2" opacity="0.6" strokeDasharray="5 3" />
                  )}

                  {/* Node circle */}
                  <circle
                    cx={node.x} cy={node.y} r="26"
                    fill={sc.bg}
                    stroke={sc.stroke}
                    strokeWidth={isSel ? 2.5 : 1.5}
                    filter={isCrit ? "url(#topo-glow-critical)" : isWarn ? "url(#topo-glow-warning)" : undefined}
                  />

                  {/* Icon */}
                  <text x={node.x} y={node.y + 7} textAnchor="middle" fontSize="17" style={{ userSelect: "none", pointerEvents: "none" }}>
                    {node.icon}
                  </text>

                  {/* Label */}
                  <text x={node.x} y={node.y + 42} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="10" fontFamily="'DM Sans',sans-serif" style={{ userSelect: "none" }}>
                    {node.label}
                  </text>

                  {/* Alert badge */}
                  {node.alerts > 0 && (
                    <g>
                      <circle cx={node.x + 19} cy={node.y - 19} r="9" fill="#ff4d6d" />
                      <text x={node.x + 19} y={node.y - 15} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" fontFamily="'Space Mono',monospace" style={{ userSelect: "none" }}>
                        {node.alerts}
                      </text>
                    </g>
                  )}

                  {/* Status dot */}
                  {node.alerts === 0 && (
                    <circle cx={node.x + 19} cy={node.y - 19} r="5" fill={sc.stroke} />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            background: "rgba(255,255,255,.025)",
            border: `1px solid ${SC[selected.status].stroke}40`,
            borderRadius: 16, padding: 22,
            display: "flex", flexDirection: "column", gap: 14,
            animation: "idsIn .2s ease",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{
                  background: SC[selected.status].bg,
                  border: `1px solid ${SC[selected.status].stroke}50`,
                  borderRadius: 6, padding: "2px 9px",
                  fontSize: 9, color: SC[selected.status].text,
                  fontWeight: 700, letterSpacing: 1,
                  display: "inline-block", marginBottom: 8, textTransform: "uppercase",
                }}>
                  {STATUS_LABEL[selected.status]}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{selected.icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{selected.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{selected.sublabel}</div>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.3)", cursor: "pointer", fontSize: 18, padding: 4 }}>✕</button>
            </div>

            {/* Info grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "IP Address", val: selected.ip },
                { label: "Operating System", val: selected.os },
                { label: "Open Ports", val: selected.openPorts },
                { label: "Active Alerts", val: selected.alerts, color: selected.alerts > 0 ? "#ff4d6d" : "#00e676" },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,.04)", borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{item.label}</span>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: item.color ?? "#e8eaf0" }}>{item.val}</span>
                </div>
              ))}
            </div>

            {/* Traffic stats */}
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Traffic</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: "rgba(0,230,118,.08)", border: "1px solid rgba(0,230,118,.2)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "rgba(0,230,118,.6)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Inbound</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: "#00e676", fontWeight: 700 }}>{selected.inbound}</div>
                </div>
                <div style={{ flex: 1, background: "rgba(0,180,216,.08)", border: "1px solid rgba(0,180,216,.2)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "rgba(0,180,216,.6)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Outbound</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: "#00b4d8", fontWeight: 700 }}>{selected.outbound}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Actions</div>
              {selected.status === "critical" && (
                <button style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid rgba(255,77,109,.5)", background: "rgba(255,77,109,.15)", color: "#ff4d6d", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  🔒 Isolate Node
                </button>
              )}
              <button style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid rgba(167,139,250,.4)", background: "rgba(167,139,250,.1)", color: "#a78bfa", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                🔍 Deep Inspect
              </button>
              <button style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                View Full Logs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

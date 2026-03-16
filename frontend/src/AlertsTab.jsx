import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { getAlerts, addToBlacklist, mapAlertFromApi, connectAlertsSocket } from "./api";

const SEV = {
  CRITICAL: { bg: "rgba(255,77,109,0.15)", text: "#ff4d6d", border: "#ff4d6d", dim: "rgba(255,77,109,0.08)" },
  HIGH:     { bg: "rgba(255,159,67,0.15)", text: "#ff9f43", border: "#ff9f43", dim: "rgba(255,159,67,0.08)" },
  MEDIUM:   { bg: "rgba(255,214,10,0.12)", text: "#ffd60a", border: "#ffd60a", dim: "rgba(255,214,10,0.06)" },
  LOW:      { bg: "rgba(0,230,118,0.12)",  text: "#00e676", border: "#00e676", dim: "rgba(0,230,118,0.06)" },
};

const TIMELINE_DATA = [
  { h: "00", count: 3, critical: 0 }, { h: "02", count: 5, critical: 1 }, { h: "04", count: 2, critical: 0 },
  { h: "06", count: 8, critical: 2 }, { h: "08", count: 22, critical: 3 }, { h: "10", count: 45, critical: 5 },
  { h: "12", count: 52, critical: 8 }, { h: "14", count: 38, critical: 6 }, { h: "16", count: 28, critical: 4 },
  { h: "18", count: 14, critical: 2 }, { h: "20", count: 9, critical: 1 }, { h: "22", count: 5, critical: 0 },
];

const FLAG = { CN: "🇨🇳", RU: "🇷🇺", US: "🇺🇸", BR: "🇧🇷", DE: "🇩🇪", IN: "🇮🇳", KR: "🇰🇷", NG: "🇳🇬", NL: "🇳🇱" };
const ACTION_COLOR = { blocked: "#ff4d6d", monitoring: "#ff9f43", investigating: "#a78bfa" };

function fmtBytes(b) {
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b > 1e3) return `${(b / 1e3).toFixed(1)} KB`;
  return `${b} B`;
}

export function AlertsTab() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [blocked, setBlocked] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAlerts({ limit: 200 })
      .then((list) => {
        if (cancelled) return;
        const mapped = (list || []).map(mapAlertFromApi);
        setAlerts(mapped);
        const blockedIds = new Set(mapped.filter(a => a.action === "blocked").map(a => a.id));
        setBlocked(blockedIds);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load alerts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const disconnect = connectAlertsSocket((dto) => {
      setAlerts((prev) => [mapAlertFromApi(dto), ...prev]);
    });
    return disconnect;
  }, []);

  const counts = useMemo(() => ({
    total: alerts.length,
    CRITICAL: alerts.filter(a => a.severity === "CRITICAL").length,
    HIGH: alerts.filter(a => a.severity === "HIGH").length,
    MEDIUM: alerts.filter(a => a.severity === "MEDIUM").length,
    LOW: alerts.filter(a => a.severity === "LOW").length,
  }), [alerts]);

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      const matchSev = filter === "ALL" || a.severity === filter;
      const q = search.toLowerCase();
      const matchSearch = !q || (a.ip && a.ip.toLowerCase().includes(q)) || (a.type && a.type.toLowerCase().includes(q)) || (a.country && a.country.toLowerCase().includes(q));
      return matchSev && matchSearch;
    });
  }, [alerts, filter, search]);

  const detail = selected !== null ? alerts.find(a => a.id === selected) : null;

  const blockIP = async (id) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert?.ip) return;
    try {
      await addToBlacklist(alert.ip, "Blocked from dashboard");
      setBlocked((prev) => new Set([...prev, id]));
    } catch (_) {}
  };

  if (loading && alerts.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,.5)", fontSize: 14 }}>Loading alerts…</div>
    );
  }
  if (error && alerts.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#ff9f43", fontSize: 14 }}>
        {error}
        <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,.4)" }}>Ensure backend is running at {import.meta.env.VITE_API_URL || "http://localhost:8081"}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "idsIn .4s ease" }}>

      {/* Severity stat pills */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Total Alerts", val: counts.total, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
          { label: "Critical", val: counts.CRITICAL, color: "#ff4d6d", bg: "rgba(255,77,109,0.1)" },
          { label: "High", val: counts.HIGH, color: "#ff9f43", bg: "rgba(255,159,67,0.1)" },
          { label: "Medium", val: counts.MEDIUM, color: "#ffd60a", bg: "rgba(255,214,10,0.08)" },
          { label: "Low", val: counts.LOW, color: "#00e676", bg: "rgba(0,230,118,0.08)" },
        ].map(p => (
          <div key={p.label} style={{ background: p.bg, border: `1px solid ${p.color}30`, borderRadius: 12, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 22, fontWeight: 800, color: p.color }}>{p.val}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: 1.5 }}>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Timeline chart */}
      <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Alert Timeline</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 14 }}>Alerts per 2-hour window · today</div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={TIMELINE_DATA} barSize={18} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
            <XAxis dataKey="h" tick={{ fill: "rgba(255,255,255,.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}:00`} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "#0d1520", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} labelFormatter={v => `${v}:00`} />
            <Bar dataKey="count" name="Total" radius={[3, 3, 0, 0]}>
              {TIMELINE_DATA.map((d, i) => (
                <Cell key={i} fill={d.critical > 4 ? "#ff4d6d" : d.critical > 1 ? "#ff9f43" : "#00b4d8"} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filter + search + list */}
      <div style={{ display: "grid", gridTemplateColumns: detail ? "1fr 340px" : "1fr", gap: 16 }}>

        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, minWidth: 0 }}>

          {/* Filter bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(f => {
                const c = f === "ALL" ? "#a78bfa" : SEV[f].text;
                const active = filter === f;
                const countVal = f === "ALL" ? counts.total : counts[f];
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    letterSpacing: 1, textTransform: "uppercase",
                    color: active ? c : "rgba(255,255,255,.35)",
                    background: active ? `${c}18` : "transparent",
                    border: active ? `1px solid ${c}40` : "1px solid transparent",
                    transition: "all .18s", fontFamily: "'DM Sans',sans-serif",
                  }}>{f} {f !== "ALL" && <span style={{ opacity: .6 }}>({countVal})</span>}</button>
                );
              })}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, opacity: .4 }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search IP, type, country…"
                style={{
                  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8, padding: "6px 12px 6px 30px", color: "#e8eaf0", fontSize: 12,
                  outline: "none", fontFamily: "'DM Sans',sans-serif", width: 220,
                }}
              />
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 80px 90px 80px 90px", gap: 8, padding: "6px 10px", marginBottom: 6 }}>
            {["SEVERITY", "SOURCE IP", "TYPE", "PROTO", "COUNTRY", "PACKETS", "STATUS"].map(h => (
              <div key={h} style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>

          {/* Alert rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.25)", fontSize: 13 }}>No alerts match filters</div>
            )}
            {filtered.map(a => {
              const s = SEV[a.severity];
              const isBlocked = blocked.has(a.id);
              const isSelected = selected === a.id;
              return (
                <div key={a.id}
                  onClick={() => setSelected(isSelected ? null : a.id)}
                  style={{
                    display: "grid", gridTemplateColumns: "80px 1fr 100px 80px 90px 80px 90px",
                    gap: 8, alignItems: "center", padding: "10px 10px",
                    background: isSelected ? s.dim : "rgba(255,255,255,.02)",
                    border: `1px solid ${isSelected ? s.border + "50" : "rgba(255,255,255,.06)"}`,
                    borderRadius: 10, cursor: "pointer", transition: "all .18s",
                  }}
                >
                  <div style={{ background: s.bg, border: `1px solid ${s.border}40`, borderRadius: 5, padding: "2px 6px", fontSize: 9, color: s.text, fontWeight: 700, letterSpacing: 1, textAlign: "center" }}>
                    {a.severity}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "#fff" }}>{a.ip}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 1 }}>{a.type}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>{a.type}</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#00b4d8" }}>{a.protocol}</div>
                  <div style={{ fontSize: 12 }}>{a.country && FLAG[a.country] ? FLAG[a.country] : "🌍"} <span style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>{a.country || "—"}</span></div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,.6)" }}>{a.packets.toLocaleString()}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: isBlocked ? "#ff4d6d" : ACTION_COLOR[a.action],
                    background: isBlocked ? "rgba(255,77,109,.12)" : `${ACTION_COLOR[a.action]}15`,
                    border: `1px solid ${isBlocked ? "rgba(255,77,109,.3)" : ACTION_COLOR[a.action] + "30"}`,
                    borderRadius: 5, padding: "2px 7px", textAlign: "center", letterSpacing: .5, textTransform: "uppercase",
                  }}>
                    {isBlocked ? "BLOCKED" : (a.action || "monitoring")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {detail && (
          <div style={{
            background: "rgba(255,255,255,.025)", border: `1px solid ${SEV[detail.severity].border}40`,
            borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 16,
            animation: "idsIn .25s ease",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ background: SEV[detail.severity].bg, border: `1px solid ${SEV[detail.severity].border}50`, borderRadius: 6, padding: "3px 9px", fontSize: 10, color: SEV[detail.severity].text, fontWeight: 700, letterSpacing: 1, display: "inline-block", marginBottom: 8 }}>
                  {detail.severity}
                </div>
                <div style={{ fontSize: 18, fontFamily: "'Space Mono',monospace", color: "#fff", fontWeight: 700 }}>{detail.ip}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 4 }}>{detail.city || "—"}, {detail.country || "—"} {detail.country && FLAG[detail.country] ? FLAG[detail.country] : ""}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.3)", cursor: "pointer", fontSize: 18, padding: 4 }}>✕</button>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Type", val: detail.type },
                { label: "Protocol", val: detail.protocol },
                { label: "Src Port", val: detail.srcPort || "N/A" },
                { label: "Dst Port", val: detail.dstPort || "N/A" },
                { label: "Packets", val: detail.packets.toLocaleString() },
                { label: "Data", val: fmtBytes(detail.bytes) },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,.04)", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "#fff" }}>{item.val != null ? String(item.val) : "—"}</div>
                </div>
              ))}
            </div>

            {/* Signature */}
            <div style={{ background: "rgba(255,77,109,.07)", border: "1px solid rgba(255,77,109,.2)", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 9, color: "rgba(255,77,109,.7)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Attack Signature</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", lineHeight: 1.6 }}>{detail.signature}</div>
            </div>

            {/* Destination */}
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
              → Targeting <span style={{ fontFamily: "'Space Mono',monospace", color: "#00b4d8" }}>{detail.dstIp}:{detail.dstPort || "ALL"}</span> · detected at <span style={{ color: "#fff" }}>{detail.time}</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Actions</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!blocked.has(detail.id) ? (
                  <button onClick={() => blockIP(detail.id)} style={{
                    flex: 1, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,77,109,.5)",
                    background: "rgba(255,77,109,.15)", color: "#ff4d6d", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .2s",
                  }}>🚫 Block IP</button>
                ) : (
                  <div style={{ flex: 1, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,77,109,.3)", background: "rgba(255,77,109,.08)", color: "rgba(255,77,109,.6)", fontSize: 12, fontWeight: 700, textAlign: "center" }}>✓ IP Blocked</div>
                )}
                <button style={{
                  flex: 1, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(167,139,250,.4)",
                  background: "rgba(167,139,250,.1)", color: "#a78bfa", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                }}>🔍 Investigate</button>
              </div>
              <button style={{
                width: "100%", padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)",
                background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.4)", fontSize: 12,
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}>Dismiss Alert</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

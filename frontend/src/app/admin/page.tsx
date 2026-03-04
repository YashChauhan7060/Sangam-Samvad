"use client";
import { useEffect, useState } from "react";

const SERVICES = [
  { name: "user-service",   port: 5000, color: "#6366f1", label: "User Service"   },
  { name: "author-service", port: 5001, color: "#f59e0b", label: "Author Service" },
  { name: "blog-service",   port: 5002, color: "#10b981", label: "Blog Service"   },
];

const CAPACITY_MAP: Record<string, { capacity: number; type: string }> = {
  strict: { capacity: 5,   type: "strict" },
  normal: { capacity: 30,  type: "normal" },
  read:   { capacity: 100, type: "read"   },
  write:  { capacity: 10,  type: "write"  },
};

const typeColors: Record<string, string> = {
  strict: "#ef4444",
  write:  "#f97316",
  normal: "#3b82f6",
  read:   "#10b981",
};

export default function RateLimitDashboard() {
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh]   = useState(true);

  async function fetchStats() {
    const results = [];

    for (const service of SERVICES) {
      try {
        const res  = await fetch(
          `http://localhost:${service.port}/api/v1/admin/stats`,
          { signal: AbortSignal.timeout(3000) }
        );
        const data = await res.json();

        const stats: any[] = [];
        let blockedRequests = 0;

        for (const item of data) {
          if (item.key.includes("_time:")) continue;

          const parts    = item.key.split(":");
          const prefix   = parts[0];
          const ip       = parts[2] || "unknown";
          const route    = parts[3] || "/";
          const count    = parseInt(item.value || "0");
          const meta     = CAPACITY_MAP[prefix];
          if (!meta) continue;

          const remaining = Math.max(0, meta.capacity - count);
          if (count >= meta.capacity) blockedRequests++;

          stats.push({
            ip, route,
            currentCount: count,
            capacity: meta.capacity,
            remaining,
            type: meta.type,
          });
        }

        results.push({
          serviceName:     service.label,
          port:            service.port,
          color:           service.color,
          stats,
          totalRequests:   stats.reduce((a, b) => a + b.currentCount, 0),
          blockedRequests,
          online:          true,
        });
      } catch {
        results.push({
          serviceName: service.label,
          port:        service.port,
          color:       service.color,
          stats:       [],
          totalRequests:   0,
          blockedRequests: 0,
          online:      false,
        });
      }
    }

    setServicesData(results);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", fontFamily: "Inter, sans-serif", padding: "24px" }}>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              🪣 Leaky Bucket Dashboard
            </h1>
            <p style={{ color: "#64748b", marginTop: "6px", fontSize: "14px" }}>
              Real-time rate limit monitoring — SANGAM Microservices
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {lastUpdated && (
              <span style={{ fontSize: "12px", color: "#475569" }}>
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: autoRefresh ? "#10b981" : "#334155", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
            >
              {autoRefresh ? "⏸ Auto Refresh ON" : "▶ Auto Refresh OFF"}
            </button>
            <button
              onClick={fetchStats}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#6366f1", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color }} />
              <span style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" }}>
                {type} ({CAPACITY_MAP[type]?.capacity}/min)
              </span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#475569" }}>
          <p style={{ fontSize: "40px" }}>⏳</p>
          <p>Connecting to services...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "32px" }}>
            {servicesData.map((svc) => (
              <div key={svc.port} style={{ backgroundColor: "#1e293b", borderRadius: "12px", padding: "20px", borderLeft: `4px solid ${svc.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>Port {svc.port}</p>
                    <h3 style={{ margin: "4px 0 0", fontSize: "16px", color: "#f1f5f9" }}>{svc.serviceName}</h3>
                  </div>
                  <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "20px", backgroundColor: svc.online ? "#10b98122" : "#ef444422", color: svc.online ? "#10b981" : "#ef4444", height: "fit-content" }}>
                    {svc.online ? "● ONLINE" : "● OFFLINE"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "16px" }}>
                  {[
                    { label: "REQUESTS", value: svc.totalRequests, color: "#f8fafc" },
                    { label: "BLOCKED",  value: svc.blockedRequests, color: svc.blockedRequests > 0 ? "#ef4444" : "#10b981" },
                    { label: "ACTIVE IPs", value: svc.stats.length, color: "#94a3b8" },
                  ].map((card) => (
                    <div key={card.label} style={{ backgroundColor: "#0f172a", borderRadius: "8px", padding: "10px" }}>
                      <p style={{ color: "#475569", fontSize: "10px", margin: 0 }}>{card.label}</p>
                      <p style={{ color: card.color, fontSize: "20px", fontWeight: 700, margin: "4px 0 0" }}>{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Traffic bar */}
                <div style={{ marginTop: "12px" }}>
                  <div style={{ backgroundColor: "#0f172a", borderRadius: "4px", height: "4px" }}>
                    <div style={{ backgroundColor: svc.color, borderRadius: "4px", height: "4px", width: `${Math.min(100, (svc.totalRequests / 50) * 100)}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Table Per Service */}
          {servicesData.map((svc) => (
            <div key={svc.port} style={{ backgroundColor: "#1e293b", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#f1f5f9" }}>
                  <span style={{ color: svc.color }}>● </span>{svc.serviceName}
                </h2>
                <span style={{ fontSize: "12px", backgroundColor: "#0f172a", padding: "4px 12px", borderRadius: "20px", color: "#94a3b8" }}>
                  localhost:{svc.port}
                </span>
              </div>

              {svc.stats.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#475569", backgroundColor: "#0f172a", borderRadius: "8px" }}>
                  {svc.online ? "No requests tracked yet — make some API calls!" : "⚠️ Service is offline"}
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #334155" }}>
                      {["IP Address", "Route", "Type", "Count", "Capacity", "Remaining", "Usage"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {svc.stats.map((stat: any, i: number) => {
                      const pct    = (stat.currentCount / stat.capacity) * 100;
                      const isCrit = pct >= 80;
                      const isWarn = pct >= 50;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #0f172a" }}>
                          <td style={{ padding: "12px", fontSize: "13px", fontFamily: "monospace", color: "#94a3b8" }}>{stat.ip}</td>
                          <td style={{ padding: "12px", fontSize: "13px", fontFamily: "monospace", color: "#e2e8f0" }}>{stat.route}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", backgroundColor: `${typeColors[stat.type]}22`, color: typeColors[stat.type] }}>
                              {stat.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "12px", fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>{stat.currentCount}</td>
                          <td style={{ padding: "12px", fontSize: "13px", color: "#64748b" }}>{stat.capacity}</td>
                          <td style={{ padding: "12px", fontSize: "14px", fontWeight: 700, color: isCrit ? "#ef4444" : "#10b981" }}>{stat.remaining}</td>
                          <td style={{ padding: "12px", minWidth: "130px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ flex: 1, backgroundColor: "#334155", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                                <div style={{ backgroundColor: isCrit ? "#ef4444" : isWarn ? "#f59e0b" : "#10b981", height: "6px", width: `${pct}%`, transition: "width 0.5s" }} />
                              </div>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>{Math.round(pct)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
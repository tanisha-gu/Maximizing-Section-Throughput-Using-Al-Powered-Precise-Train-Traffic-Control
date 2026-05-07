import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://localhost:8000";

// ─── Utilities ────────────────────────────────────────────────────────────────
const priorityColor = (p) => ({
  CRITICAL: "#ff3b30", HIGH: "#ff9500", MEDIUM: "#ffd60a", LOW: "#34c759"
}[p] || "#8e8e93");

const statusColor = (s) => ({
  ON_TIME: "#34c759", DELAYED: "#ff3b30", EARLY: "#007aff",
  HELD: "#ff9500", RUNNING: "#30d158", SLOW_ORDER: "#ff6b35", CANCELLED: "#8e8e93"
}[s] || "#8e8e93");

const trainTypeIcon = (t) => ({
  RAJDHANI: "🔵", SHATABDI: "🟣", EXPRESS: "🟠", MAIL: "🟡",
  PASSENGER: "⚪", FREIGHT: "🟤", SUBURBAN: "🟢", SPECIAL: "⭐", MAINTENANCE: "🔧"
}[t] || "🚂");

async function apiFetch(path, opts = {}) {
  try {
    const r = await fetch(API_BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...opts
    });
    return await r.json();
  } catch (e) {
    console.error(path, e);
    return null;
  }
}

// ─── Components ───────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
      letterSpacing: 0.5, fontFamily: "monospace"
    }}>{label}</span>
  );
}

function StatCard({ icon, label, value, sub, color = "#e8d5a3" }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, padding: "18px 22px", flex: 1, minWidth: 140,
      borderTop: `3px solid ${color}`
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'Space Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#8a8a8a", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TrainCard({ train, onOverride }) {
  const [expanded, setExpanded] = useState(false);
  const pc = priorityColor(train.priority);
  const sc = statusColor(train.status);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.07)`,
      borderLeft: `4px solid ${pc}`, borderRadius: 10, padding: "14px 16px",
      cursor: "pointer", transition: "all 0.2s",
      marginBottom: 8
    }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{trainTypeIcon(train.train_type)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#f0e6c8", fontFamily: "monospace" }}>
              {train.train_id}
            </span>
            <span style={{ fontSize: 13, color: "#a09070" }}>{train.train_name}</span>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {train.current_station} → {train.next_station}
            {train.platform && <span style={{ marginLeft: 8, color: "#555" }}>Pf.{train.platform}</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <Badge label={train.status} color={sc} />
          <Badge label={train.priority} color={pc} />
        </div>
        <div style={{ textAlign: "right", minWidth: 60 }}>
          <div style={{
            fontSize: 18, fontWeight: 800, fontFamily: "monospace",
            color: train.delay_minutes > 0 ? "#ff4444" : train.delay_minutes < 0 ? "#34c759" : "#888"
          }}>
            {train.delay_minutes > 0 ? `+${train.delay_minutes}` : train.delay_minutes}m
          </div>
          <div style={{ fontSize: 10, color: "#555" }}>{train.speed_kmh} km/h</div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "#888" }}>
              Scheduled: <span style={{ color: "#ccc" }}>{train.scheduled_arrival}</span>
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              Actual: <span style={{ color: "#ccc" }}>{train.actual_arrival}</span>
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              Dir: <span style={{ color: "#ccc" }}>{train.direction}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["HOLD", "PROCEED", "SLOW"].map(action => (
              <button key={action} onClick={(e) => { e.stopPropagation(); onOverride(train.train_id, action); }}
                style={{
                  padding: "5px 12px", fontSize: 11, fontWeight: 700, borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
                  background: action === "HOLD" ? "#ff3b3022" : action === "PROCEED" ? "#34c75922" : "#ff950022",
                  color: action === "HOLD" ? "#ff3b30" : action === "PROCEED" ? "#34c759" : "#ff9500",
                  fontFamily: "monospace"
                }}>{action}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ConflictAlert({ conflicts }) {
  if (!conflicts.length) return (
    <div style={{ padding: "14px", background: "#34c75911", border: "1px solid #34c75933", borderRadius: 8,
      color: "#34c759", fontSize: 13, textAlign: "center" }}>✅ No conflicts detected</div>
  );

  return (
    <div>
      {conflicts.map((c, i) => (
        <div key={i} style={{
          background: c.severity === "CRITICAL" ? "#ff3b3011" : "#ff950011",
          border: `1px solid ${c.severity === "CRITICAL" ? "#ff3b3044" : "#ff950044"}`,
          borderRadius: 8, padding: "12px 14px", marginBottom: 8
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "#e8c870" }}>
              {c.conflict_id} · {c.conflict_type}
            </span>
            <Badge label={c.severity} color={c.severity === "CRITICAL" ? "#ff3b30" : "#ff9500"} />
          </div>
          <div style={{ fontSize: 12, color: "#ccc" }}>
            <span style={{ color: "#ff9500" }}>{c.train_a}</span> ↔ <span style={{ color: "#ff9500" }}>{c.train_b}</span>
            <span style={{ color: "#666", marginLeft: 8 }}>@ {c.location}</span>
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            💡 {c.recommended_action}
          </div>
        </div>
      ))}
    </div>
  );
}

function KPIPanel({ kpi }) {
  if (!kpi) return <div style={{ color: "#555", padding: 20 }}>Loading KPIs...</div>;
  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard icon="⏱" label="Punctuality" value={`${kpi.punctuality_percent}%`} color="#34c759" />
        <StatCard icon="⚡" label="Avg Delay" value={`${kpi.average_delay_minutes}m`} color="#ff9500" />
        <StatCard icon="🚂" label="Trains" value={kpi.total_trains} color="#007aff" />
        <StatCard icon="📊" label="Throughput" value={`${kpi.throughput_trains_per_hour}/h`} color="#e8c870" />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard icon="✅" label="On Time" value={kpi.trains_on_time} color="#34c759" />
        <StatCard icon="🔴" label="Delayed" value={kpi.trains_delayed} color="#ff3b30" />
        <StatCard icon="🔵" label="Early" value={kpi.trains_early} color="#007aff" />
        <StatCard icon="⚙️" label="Utilization" value={`${kpi.section_utilization_percent}%`} color="#bf5af2" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Top Delay Causes</div>
        {(kpi.top_delay_causes || []).map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 90, fontSize: 11, color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.cause}
            </div>
            <div style={{ flex: 1, height: 6, background: "#1a1a1a", borderRadius: 3 }}>
              <div style={{
                height: "100%", borderRadius: 3, background: "#e8c870",
                width: `${c.frequency}%`, transition: "width 1s"
              }} />
            </div>
            <div style={{ fontSize: 11, color: "#666", width: 30, textAlign: "right" }}>{c.frequency}%</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#555" }}>
        Report: {kpi.period} · Opt runs: {kpi.optimizations_run} · Conflicts resolved: {kpi.conflicts_resolved}
      </div>
    </div>
  );
}

function WhatIfPanel({ trains }) {
  const [scenario, setScenario] = useState({
    scenario_name: "Scenario 1", scenario_type: "DELAY",
    affected_trains: [], delay_minutes: 30, duration_minutes: 60, description: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runScenario = async () => {
    setLoading(true);
    const r = await apiFetch("/api/whatif", {
      method: "POST",
      body: JSON.stringify({
        ...scenario,
        affected_trains: scenario.affected_trains.length ? scenario.affected_trains : trains.slice(0, 2).map(t => t.train_id)
      })
    });
    setResult(r);
    setLoading(false);
  };

  const riskColor = { LOW: "#34c759", MEDIUM: "#ff9500", HIGH: "#ff6b35", CRITICAL: "#ff3b30" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Scenario Name</label>
          <input value={scenario.scenario_name}
            onChange={e => setScenario(s => ({ ...s, scenario_name: e.target.value }))}
            style={{
              width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 6,
              padding: "7px 10px", color: "#f0e6c8", fontSize: 13, boxSizing: "border-box"
            }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Type</label>
          <select value={scenario.scenario_type}
            onChange={e => setScenario(s => ({ ...s, scenario_type: e.target.value }))}
            style={{
              width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 6,
              padding: "7px 10px", color: "#f0e6c8", fontSize: 13, boxSizing: "border-box"
            }}>
            {["DELAY", "BREAKDOWN", "WEATHER", "EXTRA_TRAIN", "TRACK_BLOCK"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Delay (min)</label>
          <input type="number" value={scenario.delay_minutes}
            onChange={e => setScenario(s => ({ ...s, delay_minutes: +e.target.value }))}
            style={{
              width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 6,
              padding: "7px 10px", color: "#f0e6c8", fontSize: 13, boxSizing: "border-box"
            }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Duration (min)</label>
          <input type="number" value={scenario.duration_minutes}
            onChange={e => setScenario(s => ({ ...s, duration_minutes: +e.target.value }))}
            style={{
              width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 6,
              padding: "7px 10px", color: "#f0e6c8", fontSize: 13, boxSizing: "border-box"
            }} />
        </div>
      </div>
      <button onClick={runScenario} disabled={loading}
        style={{
          width: "100%", padding: "10px", background: loading ? "#333" : "#2a4a3a",
          border: "1px solid #4a8a5a", borderRadius: 8, color: "#7dff9a", fontWeight: 700,
          fontSize: 13, cursor: loading ? "not-allowed" : "pointer", marginBottom: 14
        }}>
        {loading ? "⏳ Simulating..." : "▶ Run What-If Simulation"}
      </button>

      {result && (
        <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: "#e8c870" }}>{result.scenario_name}</span>
            <Badge label={result.risk_level} color={riskColor[result.risk_level] || "#888"} />
          </div>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 10 }}>{result.impact_summary}</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#ff6b35", fontFamily: "monospace" }}>
                {result.baseline_delay_minutes}m
              </div>
              <div style={{ fontSize: 10, color: "#555" }}>Baseline</div>
            </div>
            <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#ff3b30", fontFamily: "monospace" }}>
                {result.simulated_delay_minutes}m
              </div>
              <div style={{ fontSize: 10, color: "#555" }}>Simulated</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Recommended Actions:</div>
          {result.recommended_actions?.map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: "#ccc", padding: "4px 0", borderBottom: "1px solid #1a1a1a" }}>
              → {a}
            </div>
          ))}
          {result.alternative_schedules?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Alternatives:</div>
              {result.alternative_schedules.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                  <span style={{ color: "#ccc" }}>{a.name}</span>
                  <span style={{ color: "#e8c870" }}>~{a.estimated_delay_min}m · {a.feasibility}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OptimizePanel({ trains, onResult }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runOptimize = async () => {
    setLoading(true);
    const r = await apiFetch("/api/optimize", {
      method: "POST",
      body: JSON.stringify({
        train_ids: trains.map(t => t.train_id),
        horizon_minutes: 120,
        objective: "balanced"
      })
    });
    setResult(r);
    onResult && onResult(r);
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 12, padding: "10px 14px", background: "#0a1a2a", border: "1px solid #1a3a5a",
        borderRadius: 8, fontSize: 13, color: "#7ab8ff" }}>
        🤖 AI optimizer will resolve conflicts and re-sequence trains using Priority-Greedy + SA algorithm
      </div>
      <button onClick={runOptimize} disabled={loading}
        style={{
          width: "100%", padding: "12px", background: loading ? "#222" : "#1a2a4a",
          border: "1px solid #2a4a8a", borderRadius: 8, color: "#7ab8ff", fontWeight: 800,
          fontSize: 14, cursor: loading ? "not-allowed" : "pointer", marginBottom: 14,
          letterSpacing: 1
        }}>
        {loading ? "⚙️ Optimizing..." : "⚡ RUN OPTIMIZATION"}
      </button>

      {result && (
        <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: "#e8c870" }}>Result: {result.status}</span>
            <span style={{ fontFamily: "monospace", color: "#34c759", fontSize: 13 }}>
              {result.computation_time_ms}ms
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <StatCard icon="📈" label="Improvement" value={`${result.improvement_percent}%`} color="#34c759" />
            <StatCard icon="⚠️" label="Conflicts" value={result.resolved_conflicts?.length || 0} color="#ff9500" />
            <StatCard icon="⏰" label="Total Delay" value={`${result.total_delay_minutes}m`} color="#ff3b30" />
          </div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
            Algorithm: <span style={{ color: "#aaa" }}>{result.algorithm_used}</span>
          </div>
          {result.recommendations?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Recommendations:</div>
              {result.recommendations.map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: "#ccc", padding: "4px 0",
                  borderBottom: "1px solid #1a1a1a" }}>💡 {r}</div>
              ))}
            </div>
          )}
          {result.warnings?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {result.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: 12, color: "#ff9500", padding: "4px 0" }}>⚠️ {w}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScheduleView({ schedule }) {
  if (!schedule?.length) return <div style={{ color: "#555", padding: 20, textAlign: "center" }}>No schedule data</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
            {["Train", "From", "To", "Sched", "Trk", "Pf", "Status", "Action"].map(h => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#666", fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedule.map((s, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #111", background: i % 2 ? "rgba(255,255,255,0.01)" : "transparent" }}>
              <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "#e8c870" }}>{s.train_id}</td>
              <td style={{ padding: "8px 10px", color: "#aaa" }}>{s.from}</td>
              <td style={{ padding: "8px 10px", color: "#aaa" }}>{s.to}</td>
              <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "#ccc" }}>{s.scheduled}</td>
              <td style={{ padding: "8px 10px", color: "#888" }}>{s.track}</td>
              <td style={{ padding: "8px 10px", color: "#888" }}>{s.platform}</td>
              <td style={{ padding: "8px 10px" }}>
                <Badge label={s.status} color={statusColor(s.status)} />
              </td>
              <td style={{ padding: "8px 10px" }}>
                <Badge label={s.action} color={s.action === "PROCEED" ? "#34c759" : "#ff9500"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditLog({ logs }) {
  return (
    <div style={{ fontFamily: "monospace", fontSize: 11 }}>
      {logs.slice(-20).reverse().map((log, i) => (
        <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #111",
          display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ color: "#555", whiteSpace: "nowrap" }}>
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          <span style={{
            background: "#2a2a1a", border: "1px solid #4a4a2a", borderRadius: 3,
            padding: "1px 6px", color: "#e8c870", whiteSpace: "nowrap", fontSize: 10
          }}>{log.action}</span>
          <span style={{ color: "#aaa", wordBreak: "break-all" }}>
            {JSON.stringify(Object.fromEntries(Object.entries(log).filter(([k]) => !["timestamp", "action"].includes(k))))}
          </span>
        </div>
      ))}
    </div>
  );
}

function NetworkMap({ trains }) {
  const stations = [
    { id: "NDLS", x: 50, y: 200, label: "New Delhi" },
    { id: "GZB", x: 130, y: 180, label: "Ghaziabad" },
    { id: "TKJ", x: 200, y: 200, label: "Tuglakabad" },
    { id: "ALJN", x: 280, y: 170, label: "Aligarh" },
    { id: "MTJ", x: 370, y: 200, label: "Mathura" },
    { id: "AGC", x: 440, y: 180, label: "Agra" },
    { id: "JHS", x: 530, y: 200, label: "Jhansi" },
    { id: "CNB", x: 620, y: 180, label: "Kanpur" },
  ];

  const trainPositions = trains.slice(0, 6).map((t, i) => {
    const fromSt = stations.find(s => s.id === t.current_station) || stations[i % stations.length];
    const toSt = stations.find(s => s.id === t.next_station) || stations[(i + 1) % stations.length];
    const progress = 0.3 + (i * 0.1);
    return {
      ...t,
      x: fromSt.x + (toSt.x - fromSt.x) * progress,
      y: fromSt.y + (toSt.y - fromSt.y) * progress + (t.direction === "UP" ? -12 : 12)
    };
  });

  return (
    <div style={{ position: "relative", background: "#0a0a0a", borderRadius: 10, overflow: "hidden" }}>
      <svg viewBox="0 0 700 380" style={{ width: "100%", height: 300 }}>
        {/* Track lines */}
        <path d={`M ${stations.map(s => `${s.x},${s.y}`).join(" L ")}`}
          stroke="#2a3a2a" strokeWidth="4" fill="none" />
        <path d={`M ${stations.map(s => `${s.x},${s.y + 20}`).join(" L ")}`}
          stroke="#1a2a1a" strokeWidth="3" fill="none" strokeDasharray="5,3" />

        {/* Station nodes */}
        {stations.map(s => (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r="8" fill="#1a2a1a" stroke="#3a5a3a" strokeWidth="2" />
            <circle cx={s.x} cy={s.y} r="4" fill="#5a9a5a" />
            <text x={s.x} y={s.y - 14} textAnchor="middle" fill="#5a7a5a" fontSize="9" fontFamily="monospace">
              {s.id}
            </text>
          </g>
        ))}

        {/* Train markers */}
        {trainPositions.map((t, i) => (
          <g key={t.train_id}>
            <rect x={t.x - 16} y={t.y - 7} width={32} height={14} rx={3}
              fill={priorityColor(t.priority) + "33"} stroke={priorityColor(t.priority)} strokeWidth="1.5" />
            <text x={t.x} y={t.y + 4} textAnchor="middle" fill={priorityColor(t.priority)}
              fontSize="7" fontFamily="monospace" fontWeight="bold">{t.train_id.slice(0, 5)}</text>
          </g>
        ))}

        {/* Legend */}
        <text x="20" y="360" fill="#333" fontSize="9" fontFamily="monospace">
          ● CRITICAL  ● HIGH  ● MEDIUM  ● LOW
        </text>
        {[["#ff3b30", 50], ["#ff9500", 110], ["#ffd60a", 165], ["#34c759", 210]].map(([c, x]) => (
          <circle key={x} cx={x} cy={356} r="4" fill={c} opacity={0.7} />
        ))}
      </svg>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [trains, setTrains] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [sectionConfig, setSectionConfig] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const intervalRef = useRef();

  const addNotification = useCallback((msg, type = "info") => {
    const id = Date.now();
    setNotifications(n => [...n.slice(-4), { id, msg, type }]);
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 4000);
  }, []);

  const loadAll = useCallback(async () => {
    const [t, c, k, s, a, sc] = await Promise.all([
      apiFetch("/api/trains"),
      apiFetch("/api/conflicts"),
      apiFetch("/api/kpi"),
      apiFetch("/api/schedule"),
      apiFetch("/api/audit?limit=30"),
      apiFetch("/api/section-config")
    ]);
    if (t) setTrains(t);
    if (c?.conflicts) setConflicts(c.conflicts);
    if (k) setKpi(k);
    if (s?.schedule) setSchedule(s.schedule);
    if (a?.logs) setAuditLogs(a.logs);
    if (sc) setSectionConfig(sc);
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    loadAll();
    intervalRef.current = setInterval(loadAll, 8000);
    return () => clearInterval(intervalRef.current);
  }, [loadAll]);

  const handleOverride = async (trainId, action) => {
    const r = await apiFetch(`/api/trains/${trainId}/override?action=${action}&reason=Controller+action`, { method: "POST" });
    if (r?.status === "applied") {
      addNotification(`Override ${action} applied to train ${trainId}`, "success");
      await loadAll();
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "trains", label: "Trains", icon: "🚂" },
    { id: "conflicts", label: "Conflicts", icon: "⚠️" },
    { id: "optimize", label: "Optimize", icon: "⚡" },
    { id: "whatif", label: "What-If", icon: "🔮" },
    { id: "schedule", label: "Schedule", icon: "📋" },
    { id: "kpi", label: "KPIs", icon: "📈" },
    { id: "audit", label: "Audit", icon: "📜" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#080808", color: "#e8e0d0",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: "#0d0d0d", borderBottom: "1px solid #1a1a1a",
        padding: "0 24px", display: "flex", alignItems: "center", gap: 16,
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ padding: "14px 0", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: "#1a3a1a", border: "2px solid #3a6a3a",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
          }}>🚆</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5, color: "#e8c870" }}>
              IR · INTELLIGENT DSS
            </div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>
              DECISION SUPPORT SYSTEM · SECTION CONTROL
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {sectionConfig && (
          <div style={{ fontSize: 11, color: "#555", textAlign: "right" }}>
            <div style={{ color: "#888" }}>{sectionConfig.section_name}</div>
            <div>{sectionConfig.from_station} ↔ {sectionConfig.to_station} · {sectionConfig.distance_km}km</div>
          </div>
        )}

        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
          background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 6
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34c759",
            boxShadow: "0 0 6px #34c759", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: "#34c759" }}>LIVE</span>
          {lastUpdate && <span style={{ fontSize: 10, color: "#444" }}>{lastUpdate}</span>}
        </div>
      </div>

      {/* Notifications */}
      <div style={{ position: "fixed", top: 70, right: 20, zIndex: 200, display: "flex", flexDirection: "column", gap: 6 }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            background: n.type === "success" ? "#0a2a0a" : "#1a1a0a",
            border: `1px solid ${n.type === "success" ? "#2a5a2a" : "#4a4a1a"}`,
            borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#ccc",
            maxWidth: 300, boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
          }}>{n.msg}</div>
        ))}
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 65px)" }}>
        {/* Sidebar */}
        <div style={{
          width: 180, background: "#0a0a0a", borderRight: "1px solid #1a1a1a",
          padding: "16px 8px", display: "flex", flexDirection: "column", gap: 2, flexShrink: 0
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
                background: tab === t.id ? "#1a2a1a" : "transparent",
                color: tab === t.id ? "#7dff9a" : "#666",
                borderLeft: tab === t.id ? "3px solid #34c759" : "3px solid transparent",
                fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                transition: "all 0.15s"
              }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.id === "conflicts" && conflicts.length > 0 && (
                <span style={{
                  marginLeft: "auto", background: "#ff3b30", color: "white",
                  borderRadius: "50%", width: 18, height: 18, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800
                }}>{conflicts.length}</span>
              )}
            </button>
          ))}

          <div style={{ flex: 1 }} />
          <div style={{ padding: "10px 12px", fontSize: 10, color: "#333" }}>
            <div>Trains Active: {trains.length}</div>
            <div>Section Load: {sectionConfig ? `${Math.round(trains.length / sectionConfig.line_capacity_trains_per_hour * 100)}%` : "—"}</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          
          {tab === "dashboard" && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 18, color: "#e8c870", fontWeight: 700 }}>
                Section Overview
              </h2>
              {kpi && (
                <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                  <StatCard icon="⏱" label="Punctuality" value={`${kpi.punctuality_percent}%`} color="#34c759" />
                  <StatCard icon="⚡" label="Avg Delay" value={`${kpi.average_delay_minutes}m`} color="#ff9500" />
                  <StatCard icon="🚂" label="Active Trains" value={kpi.total_trains} color="#007aff" />
                  <StatCard icon="⚠️" label="Conflicts" value={conflicts.length} color={conflicts.length > 0 ? "#ff3b30" : "#34c759"} />
                  <StatCard icon="📊" label="Section Load" value={`${kpi.section_utilization_percent}%`} color="#bf5af2" />
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>Network Map — Delhi Division</div>
                <NetworkMap trains={trains} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>🚨 Active Conflicts</div>
                  <ConflictAlert conflicts={conflicts.slice(0, 3)} />
                </div>
                <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>🚂 Priority Trains</div>
                  {trains.filter(t => t.priority === "CRITICAL" || t.priority === "HIGH").slice(0, 4).map(t => (
                    <TrainCard key={t.train_id} train={t} onOverride={handleOverride} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "trains" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#e8c870", fontWeight: 700 }}>All Trains</h2>
                <button onClick={loadAll} style={{
                  padding: "7px 14px", background: "#1a1a1a", border: "1px solid #333",
                  borderRadius: 6, color: "#888", cursor: "pointer", fontSize: 12
                }}>↻ Refresh</button>
              </div>
              {trains.map(t => <TrainCard key={t.train_id} train={t} onOverride={handleOverride} />)}
            </div>
          )}

          {tab === "conflicts" && (
            <div>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#e8c870", fontWeight: 700 }}>
                Conflict Detection ({conflicts.length})
              </h2>
              <ConflictAlert conflicts={conflicts} />
            </div>
          )}

          {tab === "optimize" && (
            <div>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#e8c870", fontWeight: 700 }}>
                AI Optimization Engine
              </h2>
              <OptimizePanel trains={trains} onResult={() => { loadAll(); addNotification("Optimization complete!", "success"); }} />
            </div>
          )}

          {tab === "whatif" && (
            <div>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#e8c870", fontWeight: 700 }}>
                What-If Simulator
              </h2>
              <WhatIfPanel trains={trains} />
            </div>
          )}

          {tab === "schedule" && (
            <div>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#e8c870", fontWeight: 700 }}>
                Optimized Schedule
              </h2>
              <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16 }}>
                <ScheduleView schedule={schedule} />
              </div>
            </div>
          )}

          {tab === "kpi" && (
            <div>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#e8c870", fontWeight: 700 }}>
                Performance Dashboard
              </h2>
              <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16 }}>
                <KPIPanel kpi={kpi} />
              </div>
            </div>
          )}

          {tab === "audit" && (
            <div>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#e8c870", fontWeight: 700 }}>
                Audit Trail
              </h2>
              <div style={{
                background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16,
                maxHeight: "75vh", overflow: "auto"
              }}>
                <AuditLog logs={auditLogs} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        select option { background: #1a1a1a; }
      `}</style>
    </div>
  );
}

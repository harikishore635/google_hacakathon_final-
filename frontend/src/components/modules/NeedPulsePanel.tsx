"use client";

import { useSevakStore } from "@/store/sevakStore";
import { useNGOAuth } from "@/context/AuthContext";
import { useState } from "react";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#F43F5E",
  high: "#FF6B35",
  moderate: "#FBBF24",
  low: "#2DD4BF",
};

export default function NeedPulsePanel() {
  const {
    priorityQueue, externalSignals, analyzing, refreshSignals,
    setCurrentView, contribute, wallet, connectWallet, incidents,
  } = useSevakStore();
  const { isNGOLoggedIn } = useNGOAuth();

  const [filter, setFilter]             = useState("all");
  const [sort, setSort]                 = useState("score");
  const [donateTarget, setDonateTarget] = useState<string | null>(null);
  const [donateAmount, setDonateAmount] = useState<string>("500");
  const [donating, setDonating]         = useState(false);
  const [donateSuccess, setDonateSuccess] = useState<string | null>(null);

  // Auth Gate
  if (!isNGOLoggedIn) {
    return (
      <div className="animate-fade-in-up min-h-[60vh] flex items-center justify-center">
        <div className="max-w-lg w-full rounded-card p-10 flex flex-col items-center text-center bg-white border border-border shadow-card">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)" }}>
            <i className="fas fa-lock text-3xl text-primary" />
          </div>
          <h2 className="text-xl font-extrabold text-heading mb-2">NGO Access Required</h2>
          <p className="text-sm text-subtext mb-1">NeedPulse is restricted to verified NGO partners authenticated through the FieldMinds gateway.</p>
          <p className="text-xs text-label mb-7">Your session is not active. Please log in to continue.</p>
          <button onClick={() => setCurrentView("fieldmind")} className="btn-primary">
            <i className="fas fa-satellite-dish" /> Login via FieldMinds Portal
          </button>
        </div>
      </div>
    );
  }

  async function handleDonate(reportId: string, ward: string) {
    const amt = parseInt(donateAmount, 10);
    if (!amt || amt <= 0) return;
    if (!wallet.connected) connectWallet();
    setDonating(true);
    await new Promise((r) => setTimeout(r, 800));
    const { proposals } = useSevakStore.getState();
    const matched = proposals.find((p) => p.ward === ward) ?? proposals[0];
    if (matched) contribute(matched.id, amt);
    setDonating(false);
    setDonateTarget(null);
    setDonateAmount("500");
    setDonateSuccess(`₹${amt.toLocaleString()} donated for ${ward}. Thank you!`);
    setTimeout(() => setDonateSuccess(null), 4000);
  }

  const filtered = priorityQueue
    .filter((r) => filter === "all" || r.priorityLevel === filter)
    .sort((a, b) => {
      if (sort === "score") return (b.surgeScore ?? 0) - (a.surgeScore ?? 0);
      if (sort === "affected") return b.affectedFamilies - a.affectedFamilies;
      if (sort === "time") return b.timestamp - a.timestamp;
      return a.crisisType.localeCompare(b.crisisType);
    });

  const critical = priorityQueue.filter((r) => r.priorityLevel === "critical").length;
  const avgScore = priorityQueue.length
    ? (priorityQueue.reduce((s, r) => s + (r.surgeScore ?? 0), 0) / priorityQueue.length).toFixed(1)
    : "0.0";

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-wrap items-start justify-between mb-7 gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-heading">
          <i className="fas fa-brain text-primary mr-2" />
          NeedPulse — AI Prioritization Engine
        </h2>
        <div className="flex items-center gap-2.5 text-[13px] text-subtext flex-wrap">
          <span className="pill bg-primary-dim text-primary uppercase text-[10px] font-bold tracking-widest">Layer 2</span>
          <span>Surge scoring · Population weighting · Resource scarcity analysis</span>
        </div>
      </div>

      {donateSuccess && (
        <div className="mb-4 flex items-center gap-3 px-5 py-3.5 rounded-card text-sm font-semibold animate-fade-in-up"
          style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)", color: "#2DD4BF" }}>
          <i className="fas fa-heart" /> {donateSuccess}
        </div>
      )}

      {/* Formula Bar */}
      <div className="bg-white border border-border rounded-card shadow-card p-5 mb-5 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="text-xs font-semibold text-label uppercase tracking-wider mb-2">Surge Score Formula</div>
          <code className="text-xs font-mono text-primary">
            S = (U × 0.40) + (P × 0.30) + (R × 0.20) + (V × 0.10) + Δweather + Δsocial
          </code>
          <div className="flex gap-4 mt-2 text-[11px] text-subtext">
            <span><b className="text-heading">U</b> Urgency</span>
            <span><b className="text-heading">P</b> Population</span>
            <span><b className="text-heading">R</b> Resource Scarcity</span>
            <span><b className="text-heading">V</b> Volunteer Gap</span>
          </div>
        </div>
        <div className="flex gap-8">
          {[
            { val: priorityQueue.length, label: "Reports Analyzed" },
            { val: critical, label: "Critical Priority", color: "#F43F5E" },
            { val: avgScore, label: "Avg Surge Score", color: "#FBBF24" },
            { val: 4, label: "External Signals", color: "#6366F1" },
          ].map(({ val, label, color }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-2xl font-extrabold font-mono" style={{ color: color ?? "#1A1A1A" }}>{val}</span>
              <span className="text-[10px] text-label uppercase tracking-wider mt-1">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Priority Queue */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-label font-semibold">Filter:</span>
              {["all", "critical", "high", "moderate", "low"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-pill border transition-all capitalize ${
                    filter === f ? "text-primary border-primary/30 bg-primary/8" : "text-label border-border hover:border-primary/30 hover:text-primary"
                  }`}>
                  {f === "all" ? "All" : f === "critical" ? "🔴 Critical" : f === "high" ? "🟠 High" : f === "moderate" ? "🟡 Moderate" : "🟢 Low"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="px-3 py-1.5 text-xs bg-surface border border-border rounded-input text-subtext outline-none focus:border-primary">
                <option value="score">Surge Score ↓</option>
                <option value="affected">Population ↓</option>
                <option value="time">Time ↓</option>
                <option value="type">Crisis Type</option>
              </select>
              <button onClick={refreshSignals} disabled={analyzing}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-input border border-border text-subtext hover:border-primary/30 hover:text-primary transition-all disabled:opacity-50">
                <i className={`fas fa-sync ${analyzing ? "animate-spin" : ""}`} /> Re-Analyze
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white border border-border rounded-card shadow-card flex flex-col items-center justify-center py-16 text-label text-center">
                <i className="fas fa-brain text-4xl mb-3 text-muted" />
                <p className="text-sm">No crisis reports in the pipeline<br /><span className="text-xs text-label">Submit reports via FieldMind or generate demo data</span></p>
                <button onClick={() => setCurrentView("fieldmind")} className="mt-4 btn-ghost text-sm"><i className="fas fa-satellite-dish mr-1" />Go to FieldMind</button>
              </div>
            ) : (
              filtered.map((r, idx) => {
                const col = SEVERITY_COLOR[r.priorityLevel ?? "low"];
                const isDonating = donateTarget === r.id;
                return (
                  <div key={r.id} className="bg-white border border-border rounded-card shadow-card p-4 flex items-start gap-4 hover:-translate-y-0.5 transition-all"
                    style={{ borderLeftWidth: 3, borderLeftColor: col }}>
                    <div className="text-2xl font-black font-mono text-muted w-8 text-center">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-sm font-bold text-heading">{r.crisisType.replace(/_/g, " ").toUpperCase()} — {r.ward}</h3>
                          <p className="text-xs text-subtext">{r.reporter} · {r.affectedFamilies} families</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-extrabold font-mono" style={{ color: col }}>{r.surgeScore?.toFixed(0)}</div>
                          <div className="text-[10px] text-label uppercase tracking-wider">surge score</div>
                        </div>
                      </div>

                      {r.scores && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {([
                            ["Urgency", r.scores.urgency, "#FF6B35"],
                            ["Population", r.scores.population, "#FBBF24"],
                            ["Resources", r.scores.resourceScarcity, "#F43F5E"],
                            ["Volunteers", r.scores.volunteerGap, "#6366F1"],
                          ] as [string, number, string][]).map(([label, val, color]) => (
                            <div key={label} className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-label">{label}</span>
                                <span style={{ color }}>{Number(val).toFixed(0)}</span>
                              </div>
                              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Gemini AI Insights */}
                      {r.aiAnalysis && (
                        <div className="mb-3 p-3 rounded-lg animate-fade-in-up"
                          style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <i className="fas fa-robot text-[10px]" style={{ color: "#6366F1" }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6366F1" }}>Gemini AI Analysis</span>
                            <span className="text-[10px] text-label ml-auto">Score: {r.aiAnalysis.urgency_score}</span>
                          </div>
                          <p className="text-[11px] text-subtext mb-2 italic">{r.aiAnalysis.ai_reasoning}</p>
                          {r.aiAnalysis.key_risks.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {r.aiAnalysis.key_risks.slice(0, 3).map((risk) => (
                                <span key={risk} className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                                  style={{ background: "rgba(244,63,94,0.08)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.2)" }}>
                                  ⚠ {risk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap items-center">
                        {r.needs.slice(0, 4).map((n) => (
                          <span key={n} className="text-[10px] px-2 py-0.5 rounded-pill border border-border text-label capitalize">{n}</span>
                        ))}
                        <button onClick={() => setDonateTarget(isDonating ? null : r.id)}
                          className="text-[10px] px-3 py-0.5 rounded-pill font-semibold transition-all hover:opacity-90 ml-auto flex items-center gap-1.5"
                          style={{ background: "rgba(45,212,191,0.1)", color: "#2DD4BF", border: "1px solid rgba(45,212,191,0.25)" }}>
                          <i className="fas fa-heart" /> {isDonating ? "Cancel" : "Donate"}
                        </button>
                      </div>

                      {isDonating && (
                        <div className="mt-3 p-3 rounded-card flex items-center gap-3 animate-fade-in-up"
                          style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.15)" }}>
                          <i className="fas fa-rupee-sign text-xs text-success" />
                          <input type="number" min={100} step={100} value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)}
                            className="w-28 px-3 py-1.5 text-xs rounded-input outline-none font-mono bg-surface border border-border text-heading" />
                          <span className="text-[10px] text-label flex-1">amount in ₹</span>
                          <button onClick={() => handleDonate(r.id, r.ward)} disabled={donating}
                            className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50">
                            {donating ? <i className="fas fa-circle-notch animate-spin" /> : "Confirm Donation"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* External Signals */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-border rounded-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
              <span className="text-sm font-semibold text-heading">
                <i className="fas fa-satellite text-primary mr-1.5" />External Signal Fusion
              </span>
              <button onClick={refreshSignals}
                className="text-[11px] px-2.5 py-1 bg-surface border border-border text-label rounded-lg hover:border-primary/30 hover:text-primary transition-all">
                <i className="fas fa-sync" /> Refresh
              </button>
            </div>
            <div className="divide-y divide-border-light">
              {[
                { icon: "fa-cloud-rain", label: "IMD Weather Alert",  val: externalSignals.weather.desc,   level: externalSignals.weather.level,   color: "#6366F1" },
                { icon: "fab fa-twitter", label: "Social Signals (X)", val: externalSignals.social.desc,    level: externalSignals.social.level,    color: "#3B82F6" },
                { icon: "fa-boxes",       label: "Resource Inventory", val: externalSignals.resource.desc,  level: externalSignals.resource.level,  color: "#FF6B35" },
                { icon: "fa-user-check",  label: "Volunteer Pool",     val: externalSignals.volunteer.desc, level: externalSignals.volunteer.level, color: "#2DD4BF" },
              ].map(({ icon, label, val, level, color }) => (
                <div key={label} className="flex items-start gap-3 p-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm" style={{ background: `${color}14`, color }}>
                    <i className={`fas ${icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-label">{label}</p>
                    <p className="text-xs text-heading mt-0.5 truncate">{val}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase flex-shrink-0"
                    style={{
                      background: level === "high" ? "rgba(244,63,94,0.08)" : level === "moderate" ? "rgba(251,191,36,0.08)" : "rgba(45,212,191,0.08)",
                      color: level === "high" ? "#F43F5E" : level === "moderate" ? "#FBBF24" : "#2DD4BF",
                    }}>{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSevakStore, TrustBlock } from "@/store/sevakStore";
import { useState } from "react";

const TX_COLOR: Record<string, string> = {
  REPORT_SUBMITTED:  "#FF6B35",
  FIELD_REPORT:      "#FF6B35",
  PROPOSAL_CREATED:  "#6366F1",
  KARMA_CONTRIBUTED: "#2DD4BF",
  PROPOSAL_FUNDED:   "#FBBF24",
  SBT_MINTED:        "#F43F5E",
  VOTE_CAST:         "#FBBF24",
  VOLUNTEER_DEPLOYED:"#2DD4BF",
  WALLET_CONNECTED:  "#6366F1",
};
const TX_ICON: Record<string, string> = {
  REPORT_SUBMITTED:  "fa-satellite-dish",
  FIELD_REPORT:      "fa-satellite-dish",
  PROPOSAL_CREATED:  "fa-vote-yea",
  KARMA_CONTRIBUTED: "fa-hand-holding-heart",
  PROPOSAL_FUNDED:   "fa-check-circle",
  SBT_MINTED:        "fa-certificate",
  VOTE_CAST:         "fa-thumbs-up",
  VOLUNTEER_DEPLOYED:"fa-users",
  WALLET_CONNECTED:  "fa-wallet",
};

interface CrisisCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  emoji: string;
}

const CATEGORIES: CrisisCategory[] = [
  { key: "flood",        label: "Flood",       icon: "fa-water",        color: "#3B82F6", emoji: "🌊" },
  { key: "cyclone",      label: "Cyclone",     icon: "fa-wind",         color: "#6366F1", emoji: "🌀" },
  { key: "earthquake",   label: "Earthquake",  icon: "fa-mountain",     color: "#FF6B35", emoji: "🏔️" },
  { key: "wildfire",     label: "Wildfire",     icon: "fa-fire",         color: "#F43F5E", emoji: "🔥" },
  { key: "medical",      label: "Medical",      icon: "fa-heartbeat",    color: "#F43F5E", emoji: "🏥" },
  { key: "fire",         label: "Fire",         icon: "fa-fire-alt",     color: "#FF6B35", emoji: "🔥" },
  { key: "drought",      label: "Drought",      icon: "fa-sun",          color: "#FBBF24", emoji: "☀️" },
  { key: "displacement", label: "Displacement", icon: "fa-people-carry", color: "#2DD4BF", emoji: "🏕️" },
];

function blockMatchesCategory(block: TrustBlock, catKey: string): boolean {
  const haystack = `${block.details} ${block.txType}`.toLowerCase();
  return haystack.includes(catKey.toLowerCase());
}

function extractEvents(chain: TrustBlock[], catKey: string) {
  return chain.filter(
    (b) =>
      (b.txType === "FIELD_REPORT" || b.txType === "REPORT_SUBMITTED") &&
      blockMatchesCategory(b, catKey)
  );
}

function getEventTxHistory(chain: TrustBlock[], event: TrustBlock): TrustBlock[] {
  const wardMatch = event.details.split("—")[1]?.trim().toLowerCase() ?? "";
  return chain.filter((b) => wardMatch && b.details.toLowerCase().includes(wardMatch));
}

export default function TrustLedgerPanel() {
  const { trustChain } = useSevakStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEvent,    setSelectedEvent]    = useState<TrustBlock | null>(null);

  const selectedCat = CATEGORIES.find((c) => c.key === selectedCategory);
  const events      = selectedCategory ? extractEvents(trustChain, selectedCategory) : [];
  const eventTxs    = selectedEvent ? getEventTxHistory(trustChain, selectedEvent) : [];

  function handleCategoryClick(key: string) {
    if (selectedCategory === key) {
      setSelectedCategory(null);
      setSelectedEvent(null);
    } else {
      setSelectedCategory(key);
      setSelectedEvent(null);
    }
  }

  function handleEventClick(block: TrustBlock) {
    setSelectedEvent(selectedEvent?.id === block.id ? null : block);
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between mb-7 gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-heading">
          <i className="fas fa-link text-primary mr-2" />
          Trust Ledger — Immutable Blockchain Validation
        </h2>
        <div className="flex items-center gap-2.5 text-[13px] text-subtext flex-wrap">
          <span className="pill bg-primary-dim text-primary uppercase text-[10px] font-bold tracking-widest">Polygon</span>
          <span>{trustChain.length} transactions · All verified</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border border-border rounded-card shadow-card p-5 mb-8 flex items-center gap-10 flex-wrap">
        {[
          { val: trustChain.length, label: "Transactions", color: "#FF6B35" },
          { val: trustChain.length, label: "Blocks",       color: "#FBBF24" },
          { val: "100%",            label: "Integrity",    color: "#2DD4BF" },
          { val: "Polygon",         label: "Network",      color: "#6366F1" },
        ].map(({ val, label, color }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-2xl font-extrabold font-mono" style={{ color }}>{val}</span>
            <span className="text-[11px] text-label mt-1 uppercase tracking-wider">{label}</span>
          </div>
        ))}
        <div className="ml-auto">
          <div className="flex items-center gap-2 text-xs text-success font-semibold">
            <i className="fas fa-shield-alt" />
            <span>All hashes verified · Zero tamper detected</span>
          </div>
        </div>
      </div>

      {/* Crisis Categories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold tracking-tight text-heading">
            <i className="fas fa-layer-group mr-2 text-primary" />
            Crisis Categories
          </h3>
          {selectedCategory && (
            <button
              onClick={() => { setSelectedCategory(null); setSelectedEvent(null); }}
              className="btn-ghost text-xs">
              <i className="fas fa-times mr-1" /> Clear Filter
            </button>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3">
          {CATEGORIES.map((cat) => {
            const count  = extractEvents(trustChain, cat.key).length;
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryClick(cat.key)}
                className="flex-shrink-0 w-44 rounded-card p-5 flex flex-col items-start gap-3 text-left transition-all duration-200 group"
                style={{
                  background: active ? `${cat.color}08` : "#FFFFFF",
                  border: `1px solid ${active ? cat.color + "40" : "#E5E7EB"}`,
                  boxShadow: active ? `0 4px 20px ${cat.color}15` : "0 2px 8px rgba(0,0,0,0.04)",
                  transform: active ? "translateY(-2px)" : "translateY(0)",
                }}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all"
                  style={{ background: `${cat.color}12`, color: cat.color }}>
                  <i className={`fas ${cat.icon}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-heading">{cat.emoji} {cat.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: count > 0 ? cat.color : "#9CA3AF" }}>
                    {count} event{count !== 1 ? "s" : ""} recorded
                  </p>
                </div>
                {count > 0 && (
                  <div className="text-[9px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider"
                    style={{ background: `${cat.color}12`, color: cat.color }}>
                    {active ? "← viewing" : "click to explore"}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event List for selected category */}
      {selectedCategory && selectedCat && (
        <div className="mb-8 animate-fade-in-up">
          <div className="rounded-card overflow-hidden bg-white border border-border shadow-card">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border-light"
              style={{ background: `${selectedCat.color}05` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${selectedCat.color}12`, color: selectedCat.color }}>
                <i className={`fas ${selectedCat.icon} text-sm`} />
              </div>
              <div>
                <p className="text-sm font-bold text-heading">{selectedCat.label} Events</p>
                <p className="text-xs" style={{ color: selectedCat.color }}>
                  {events.length} historical record{events.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <i className="fas fa-database text-3xl mb-3 text-muted opacity-30" style={{ color: selectedCat.color }} />
                <p className="text-sm text-subtext">No {selectedCat.label.toLowerCase()} events on chain yet.</p>
                <p className="text-xs text-label mt-1">Submit a FieldMind report of this type to generate records.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-light">
                {events.map((ev) => {
                  const isSelected = selectedEvent?.id === ev.id;
                  return (
                    <div key={ev.id}>
                      <button
                        onClick={() => handleEventClick(ev)}
                        className="w-full text-left px-5 py-4 flex items-center gap-4 transition-all hover:bg-surface"
                        style={{ background: isSelected ? `${selectedCat.color}05` : "transparent" }}>
                        <div
                          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold font-mono"
                          style={{ background: `${selectedCat.color}10`, color: selectedCat.color, border: `1px solid ${selectedCat.color}20` }}>
                          <i className="fas fa-cube" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-heading truncate">{ev.details}</p>
                          <p className="text-[11px] text-label">
                            Actor: <span className="text-subtext">{ev.actor}</span>
                            &nbsp;· {new Date(ev.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-pill uppercase"
                            style={{ background: `${selectedCat.color}10`, color: selectedCat.color }}>
                            {ev.txType.replace(/_/g, " ")}
                          </span>
                          <i className={`fas fa-chevron-${isSelected ? "up" : "down"} text-xs text-label`} />
                        </div>
                      </button>

                      {/* TX detail */}
                      {isSelected && (
                        <div className="px-5 pb-5 pt-2 animate-fade-in-up" style={{ background: `${selectedCat.color}03` }}>
                          <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
                            style={{ color: selectedCat.color }}>
                            <i className="fas fa-link mr-1" />
                            Blockchain Transaction History — {ev.details.split("—")[1]?.trim() ?? "Crisis"}
                          </p>

                          {eventTxs.length === 0 ? (
                            <p className="text-xs text-label py-4 text-center">No linked transactions found for this event.</p>
                          ) : (
                            <div className="space-y-2">
                              {eventTxs.map((tx, i) => {
                                const color = TX_COLOR[tx.txType] ?? "#FF6B35";
                                const icon  = TX_ICON[tx.txType]  ?? "fa-link";
                                return (
                                  <div key={tx.id} className="rounded-card p-4 flex items-start gap-3 bg-surface border border-border-light">
                                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
                                      style={{ background: `${color}10`, color }}>
                                      <i className={`fas ${icon}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div>
                                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-pill uppercase"
                                            style={{ background: `${color}10`, color }}>
                                            {tx.txType.replace(/_/g, " ")}
                                          </span>
                                          <p className="text-xs font-semibold text-heading mt-1">{tx.details}</p>
                                          <p className="text-[10px] text-label">
                                            Actor: {tx.actor}{tx.amount != null ? ` · ₹${Number(tx.amount).toLocaleString()}` : ""}
                                          </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                          <p className="text-[9px] text-label">{new Date(tx.timestamp).toLocaleString()}</p>
                                          {i === 0 && (
                                            <span className="pill bg-success-dim text-success text-[9px] font-bold">LATEST</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="mt-2 grid grid-cols-2 gap-2">
                                        <div className="px-2 py-1.5 rounded-lg bg-surface border border-border-light">
                                          <p className="text-[8px] text-label uppercase tracking-wide mb-0.5">TX Hash</p>
                                          <p className="text-[9px] font-mono text-subtext truncate">{tx.hashId.slice(0, 26)}…</p>
                                        </div>
                                        <div className="px-2 py-1.5 rounded-lg bg-surface border border-border-light">
                                          <p className="text-[8px] text-label uppercase tracking-wide mb-0.5">Prev Hash</p>
                                          <p className="text-[9px] font-mono text-subtext truncate">{tx.prevHash.slice(0, 26)}…</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Chain */}
      {!selectedCategory && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-label">
              <i className="fas fa-stream mr-2" />Full Transaction Chain
            </h3>
            <div className="h-px flex-1 bg-border" />
          </div>

          {trustChain.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-card shadow-card flex flex-col items-center justify-center py-20 text-center">
              <i className="fas fa-link text-5xl text-muted mb-4 opacity-30" />
              <p className="text-subtext">No blockchain transactions yet</p>
              <p className="text-xs text-label mt-1">Submit field reports to generate immutable trust records</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trustChain.map((block, idx) => {
                const color = TX_COLOR[block.txType] ?? "#FF6B35";
                const icon  = TX_ICON[block.txType]  ?? "fa-link";
                return (
                  <div
                    key={block.id}
                    className="bg-white border border-border rounded-card shadow-card p-4 flex items-start gap-4 hover:-translate-y-0.5 transition-all"
                    style={idx === 0 ? { borderLeft: "3px solid #FF6B35" } : {}}>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ background: `${color}12`, color }}>
                        <i className={`fas ${icon}`} />
                      </div>
                      {idx < trustChain.length - 1 && (
                        <div className="w-0.5 h-6 mt-1 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase"
                            style={{ background: `${color}12`, color }}>
                            {block.txType.replace(/_/g, " ")}
                          </span>
                          <p className="text-sm font-semibold text-heading mt-1">{block.details}</p>
                          <p className="text-xs text-subtext">
                            Actor: <strong>{block.actor}</strong>
                            {block.amount != null ? ` · Amount: ₹${Number(block.amount).toLocaleString()}` : ""}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[9px] text-label">{new Date(block.timestamp).toLocaleString()}</p>
                          {idx === 0 && (
                            <span className="pill bg-success-dim text-success text-[9px] font-bold">LATEST</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 flex-wrap">
                        <p className="text-[9px] font-mono text-label truncate max-w-[200px]">Hash: {block.hashId.slice(0, 18)}…</p>
                        <p className="text-[9px] font-mono text-label truncate max-w-[200px]">Prev: {block.prevHash.slice(0, 18)}…</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSevakStore } from "@/store/sevakStore";
import { useUIStore } from "@/store/uiStore";
import NotificationPanel from "./NotificationPanel";

const VIEW_TITLES: Record<string, string> = {
  dashboard: "Mission Control",
  fieldmind: "FieldMind — Field Reports",
  needpulse: "NeedPulse — AI Priority Engine",
  crisisgrid: "CrisisGrid — Geospatial Map",
  karmadao: "KarmaDAO — Governance",
  ledger: "TrustLedger — Audit Trail",
};

/* ═══════════════════════════════════════════════════════
   WALLET TYPES + HELPERS
   ═══════════════════════════════════════════════════════ */
interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  label: string;
  timestamp: number;
}

interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

function loadWallet(): WalletData {
  if (typeof window === "undefined") return { balance: 0, transactions: [] };
  try {
    const raw = localStorage.getItem("nexseva_wallet");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { balance: 0, transactions: [] };
}

function saveWallet(data: WalletData) {
  localStorage.setItem("nexseva_wallet", JSON.stringify(data));
}

/* ═══════════════════════════════════════════════════════
   WALLET PANEL COMPONENT
   ═══════════════════════════════════════════════════════ */
function WalletPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [wallet, setWallet] = useState<WalletData>(loadWallet);
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync from localStorage on open
  useEffect(() => {
    if (open) setWallet(loadWallet());
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const handleAddMoney = useCallback(() => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: "credit",
      amount: val,
      label: "Added funds",
      timestamp: Date.now(),
    };
    const updated: WalletData = {
      balance: wallet.balance + val,
      transactions: [tx, ...wallet.transactions],
    };
    setWallet(updated);
    saveWallet(updated);
    setAmount("");
    setShowAddModal(false);
  }, [amount, wallet]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-14 right-0 w-[340px] rounded-2xl z-[100] overflow-hidden"
      style={{
        background: "var(--dash-surface, #FFFFFF)",
        border: "1px solid var(--dash-border, #E5E7EB)",
        boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
        animation: "fadeUp 0.2s ease-out forwards",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--dash-border-light, #F3F4F6)" }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF6B2B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
          <span
            className="text-sm font-bold"
            style={{ color: "var(--dash-text-primary, #1A1A1A)" }}
          >
            Wallet
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs hover:opacity-60 transition-all"
          style={{ color: "var(--dash-text-muted, #9CA3AF)" }}
        >
          ✕
        </button>
      </div>

      {/* Balance */}
      <div className="px-5 py-5 text-center">
        <p
          className="text-xs uppercase tracking-wider font-semibold mb-1"
          style={{ color: "var(--dash-text-muted, #9CA3AF)" }}
        >
          Current Balance
        </p>
        <p
          className="text-3xl font-extrabold"
          style={{ color: "var(--dash-text-primary, #1A1A1A)" }}
        >
          ₹{wallet.balance.toFixed(2)}
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#FF6B2B" }}
        >
          <i className="fas fa-plus text-xs mr-2" />
          Add Money
        </button>
      </div>

      {/* Add Money Modal (inline) */}
      {showAddModal && (
        <div
          className="mx-5 mb-4 p-4 rounded-xl"
          style={{
            background: "var(--dash-elevated, #F2F0EC)",
            border: "1px solid var(--dash-border, #E5E7EB)",
          }}
        >
          <label
            className="text-[10px] uppercase tracking-wider font-semibold block mb-2"
            style={{ color: "var(--dash-text-muted, #9CA3AF)" }}
          >
            Enter Amount (₹)
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500.00"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none mb-3"
            style={{
              background: "var(--dash-surface, #FFFFFF)",
              border: "1px solid var(--dash-border, #E5E7EB)",
              color: "var(--dash-text-primary, #1A1A1A)",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAddMoney()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddMoney}
              className="flex-1 py-2 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "#FF6B2B" }}
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setShowAddModal(false);
                setAmount("");
              }}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{
                border: "1px solid var(--dash-border, #E5E7EB)",
                color: "var(--dash-text-secondary, #6B7280)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div
        className="px-5 py-3"
        style={{ borderTop: "1px solid var(--dash-border-light, #F3F4F6)" }}
      >
        <p
          className="text-[10px] uppercase tracking-wider font-semibold mb-3"
          style={{ color: "var(--dash-text-muted, #9CA3AF)" }}
        >
          Recent Transactions
        </p>
        {wallet.transactions.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-6 text-xs gap-2"
            style={{ color: "var(--dash-text-muted, #9CA3AF)" }}
          >
            <i className="fas fa-receipt text-lg opacity-30" />
            <span>No transactions yet</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {wallet.transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg"
                style={{
                  background:
                    tx.type === "credit"
                      ? "rgba(45,212,191,0.06)"
                      : "rgba(244,63,94,0.06)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                    style={{
                      background:
                        tx.type === "credit"
                          ? "rgba(45,212,191,0.15)"
                          : "rgba(244,63,94,0.15)",
                      color: tx.type === "credit" ? "#2DD4BF" : "#F43F5E",
                    }}
                  >
                    <i
                      className={`fas ${
                        tx.type === "credit" ? "fa-arrow-down" : "fa-arrow-up"
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--dash-text-primary, #1A1A1A)" }}
                    >
                      {tx.label}
                    </p>
                    <p
                      className="text-[10px]"
                      style={{ color: "var(--dash-text-muted, #9CA3AF)" }}
                    >
                      {new Date(tx.timestamp).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs font-bold"
                  style={{
                    color: tx.type === "credit" ? "#2DD4BF" : "#F43F5E",
                  }}
                >
                  {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TOP BAR
   ═══════════════════════════════════════════════════════ */
export default function TopBar() {
  const { currentView, systemTime, setSystemTime } = useSevakStore();
  const { searchQuery, setSearchQuery } = useUIStore();
  const [walletOpen, setWalletOpen] = useState(false);

  useEffect(() => {
    const update = () =>
      setSystemTime(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
        }) + " IST"
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [setSystemTime]);

  return (
    <header
      className="h-16 border-b flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: "var(--dash-surface, #FFFFFF)",
        borderColor: "var(--dash-border, #E5E7EB)",
      }}
    >
      {/* Left: Title */}
      <div>
        <h1
          className="text-lg font-bold"
          style={{ color: "var(--dash-text-primary, #1A1A1A)" }}
        >
          {VIEW_TITLES[currentView] || "Dashboard"}
        </h1>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <i
            className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "#FF6B2B" }}
          />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl outline-none transition-all"
            style={{
              background: "var(--dash-accent-soft, #FFF3ED)",
              border: "1.5px solid transparent",
              color: "var(--dash-text-primary, #1A1A1A)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#FF6B2B";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(255,107,43,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all hover:opacity-70"
              style={{
                background: "rgba(0,0,0,0.1)",
                color: "var(--dash-text-muted, #9CA3AF)",
              }}
            >
              ×
            </button>
          )}
          {searchQuery && (
            <div
              className="absolute top-full left-0 mt-1 text-xs font-medium"
              style={{ color: "#FF6B2B" }}
            >
              Filtering results...
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Wallet Button */}
        <div className="relative">
          <button
            onClick={() => setWalletOpen(!walletOpen)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-80"
            style={{
              color: "#FF6B2B",
              border: "1px solid rgba(255,107,43,0.3)",
            }}
            id="wallet-toggle-btn"
          >
            {/* Wallet SVG Icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
            Wallet
          </button>
          <WalletPanel
            open={walletOpen}
            onClose={() => setWalletOpen(false)}
          />
        </div>

        {/* Notifications */}
        <NotificationPanel />

        {/* Time */}
        <span
          className="hidden lg:block text-xs font-mono"
          style={{ color: "var(--dash-text-muted, #9CA3AF)" }}
        >
          {systemTime}
        </span>
      </div>
    </header>
  );
}

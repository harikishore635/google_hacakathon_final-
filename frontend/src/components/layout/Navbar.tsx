"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useSevakStore, CurrentView } from "@/store/sevakStore";
import { useNGOAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { currentView, setCurrentView, systemTime, setSystemTime } = useSevakStore();
  const { isNGOLoggedIn, ngoEmail, logout } = useNGOAuth();

  useEffect(() => {
    const update = () => setSystemTime(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST");
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [setSystemTime]);

  // New order per spec: Dashboard → CrisisGrid → KarmaDAO → TrustLedger → FieldMinds → NeedPulse
  const navItems: { id: CurrentView; icon: string; label: string; protected?: boolean }[] = [
    { id: "dashboard",  icon: "fa-th-large",        label: "Dashboard"   },
    { id: "crisisgrid", icon: "fa-map-marked-alt",  label: "CrisisGrid"  },
    { id: "karmadao",   icon: "fa-coins",            label: "KarmaDAO"    },
    { id: "ledger",     icon: "fa-link",             label: "TrustLedger" },
    { id: "fieldmind",  icon: "fa-satellite-dish",  label: "FieldMinds", protected: true },
    { id: "needpulse",  icon: "fa-brain",            label: "NeedPulse",  protected: true },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[1000] h-[64px] border-b border-border transition-all duration-400"
      style={{ background: "rgba(13,17,23,0.92)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-[1600px] mx-auto h-full px-6 flex items-center gap-6">

        {/* Logo */}
        <div
          className="flex items-center gap-2.5 min-w-max cursor-pointer"
          onClick={() => setCurrentView("dashboard")}>
          <div
            className="relative w-9 h-9 flex items-center justify-center rounded-full overflow-hidden"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
            <Image src="/images/nexseva-logo.png" alt="NexSeva Logo" width={36} height={36} className="object-contain scale-110" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-text-primary" style={{ fontFamily: "var(--font-montserrat)" }}>
            Nex<span className="text-accent">Seva</span>
          </span>
          <span
            className="text-[9px] font-semibold tracking-wider text-accent border border-border-accent px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,212,255,0.12)" }}>
            NERVOUS SYSTEM v2.0
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs text-text-secondary mr-auto">
          <div className="w-[7px] h-[7px] rounded-full animate-pulse" style={{ background: "#2ed573", boxShadow: "0 0 6px #2ed573" }} />
          <span>All Systems Operational</span>
          <span className="text-text-muted">|</span>
          <span className="font-mono text-[11px] text-accent">{systemTime}</span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const locked = item.protected && !isNGOLoggedIn;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                title={locked ? "NGO login required" : undefined}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all whitespace-nowrap border ${
                  isActive
                    ? "border-border-accent text-accent"
                    : "border-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary hover:border-border"
                }`}
                style={isActive ? { background: "rgba(0,212,255,0.15)" } : { background: "transparent" }}>
                <i className={`fas ${item.icon}`} /> {item.label}
                {locked && (
                  <span
                    className="ml-0.5 text-[9px]"
                    style={{ color: "#ffa502" }}
                    title="NGO login required">
                    <i className="fas fa-lock" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* NGO Session Pill */}
        {isNGOLoggedIn && (
          <div
            className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full text-[11px] font-semibold ml-2"
            style={{ background: "rgba(46,213,115,0.12)", border: "1px solid rgba(46,213,115,0.25)", color: "#2ed573" }}>
            <i className="fas fa-shield-alt" />
            <span className="max-w-[120px] truncate">{ngoEmail}</span>
            <button
              onClick={logout}
              className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all hover:opacity-80"
              style={{ background: "rgba(255,71,87,0.15)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.3)" }}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

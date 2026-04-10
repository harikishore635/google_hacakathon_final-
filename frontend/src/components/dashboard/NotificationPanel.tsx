"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";

const TYPE_ICON: Record<string, string> = {
  incident: "fa-exclamation-triangle",
  volunteer: "fa-user-shield",
  fund: "fa-coins",
  system: "fa-cog",
};
const TYPE_COLOR: Record<string, string> = {
  incident: "#F43F5E",
  volunteer: "#2DD4BF",
  fund: "#FF6B2B",
  system: "#6366F1",
};

export default function NotificationPanel() {
  const {
    notifications, notificationsOpen, setNotificationsOpen,
    markNotificationRead, markAllRead, unreadCount,
  } = useUIStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setNotificationsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setNotificationsOpen]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      setTimeout(() => document.addEventListener("click", onClick), 0);
    }
    return () => document.removeEventListener("click", onClick);
  }, [notificationsOpen, setNotificationsOpen]);

  const count = unreadCount();

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-80 transition-all"
        style={{ color: "var(--dash-text-muted, #9CA3AF)" }}
      >
        <i className="fas fa-bell" />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: "#F43F5E", padding: "0 4px" }}
          >
            {count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <div
        className={`notification-panel ${notificationsOpen ? "open" : ""}`}
        style={{
          background: "var(--dash-surface, #FFFFFF)",
          border: "1px solid var(--dash-border, #E5E7EB)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--dash-border, #E5E7EB)" }}>
          <span className="text-sm font-bold" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>
            Notifications
          </span>
          {count > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-medium transition-all hover:opacity-80"
              style={{ color: "#FF6B2B" }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Items */}
        <div className="divide-y" style={{ borderColor: "var(--dash-border-light, #F3F4F6)" }}>
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:opacity-80"
              style={{
                borderLeft: n.read ? "4px solid transparent" : "4px solid #FF6B2B",
                background: n.read ? "transparent" : "var(--dash-accent-soft, #FFF3ED)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs"
                style={{
                  background: `${TYPE_COLOR[n.type]}14`,
                  color: TYPE_COLOR[n.type],
                }}
              >
                <i className={`fas ${TYPE_ICON[n.type]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>
                  {n.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--dash-text-secondary, #6B7280)" }}>
                  {n.body}
                </p>
                <p className="text-[10px] mt-1" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>
                  {n.time}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/store/uiStore";

export default function SettingsPanel() {
  const { settingsOpen, setSettingsOpen, darkMode, toggleDarkMode } = useUIStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("coordinator@nexseva.app");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [incidentAlerts, setIncidentAlerts] = useState(true);
  const [volunteerUpdates, setVolunteerUpdates] = useState(true);
  const [fundReports, setFundReports] = useState(true);
  const [toast, setToast] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("nexseva_settings");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.email) setEmail(s.email);
        if (s.language) setLanguage(s.language);
        if (s.timezone) setTimezone(s.timezone);
        if (s.incidentAlerts !== undefined) setIncidentAlerts(s.incidentAlerts);
        if (s.volunteerUpdates !== undefined) setVolunteerUpdates(s.volunteerUpdates);
        if (s.fundReports !== undefined) setFundReports(s.fundReports);
      } catch {}
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSettingsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSettingsOpen]);

  const handleSave = () => {
    const settings = { email, language, timezone, incidentAlerts, volunteerUpdates, fundReports };
    localStorage.setItem("nexseva_settings", JSON.stringify(settings));
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-[22px] rounded-full flex items-center px-0.5 transition-colors duration-200 ${
        checked ? "bg-[#FF6B2B]" : "bg-[#D1D5DB]"
      }`}
    >
      <div
        className="w-[18px] h-[18px] rounded-full bg-white shadow-sm"
        style={{
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
    </button>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`settings-overlay ${settingsOpen ? "open" : ""}`}
        onClick={() => setSettingsOpen(false)}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`settings-panel ${settingsOpen ? "open" : ""}`}
        style={{
          background: "var(--dash-surface, #FFFFFF)",
          borderLeft: "1px solid var(--dash-border, #E5E7EB)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.1)",
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>
              Settings
            </h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-all"
              style={{ color: "var(--dash-text-muted, #9CA3AF)" }}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {/* Profile */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>
              Profile
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "#FF6B2B" }}>
                RC
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>
                  Relief Coordinator
                </p>
                <p className="text-xs" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>Administrator</p>
              </div>
            </div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--dash-text-secondary, #6B7280)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[#FF6B2B]/20 focus:border-[#FF6B2B]"
            />
          </div>

          {/* Preferences */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>
              Preferences
            </h3>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>Dark Mode</span>
              <Toggle checked={darkMode} onChange={toggleDarkMode} />
            </div>

            <div className="py-3">
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              >
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div className="py-3">
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              >
                <option value="Asia/Kolkata">IST (India Standard Time)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">EST</option>
              </select>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>
              Notifications
            </h3>
            {[
              { label: "Incident Alerts", checked: incidentAlerts, onChange: setIncidentAlerts },
              { label: "Volunteer Updates", checked: volunteerUpdates, onChange: setVolunteerUpdates },
              { label: "Fund Reports", checked: fundReports, onChange: setFundReports },
            ].map(({ label, checked, onChange }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>{label}</span>
                <Toggle checked={checked} onChange={onChange} />
              </div>
            ))}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#FF6B2B" }}
          >
            Save Changes
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 toast-enter z-[9999]"
            style={{
              background: "#1A1A1A",
              color: "#FFFFFF",
              padding: "12px 24px",
              borderRadius: 12,
              fontSize: "0.875rem",
              fontWeight: 600,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <i className="fas fa-check-circle mr-2" style={{ color: "#2DD4BF" }} />
            Settings saved successfully
          </div>
        )}
      </div>
    </>
  );
}

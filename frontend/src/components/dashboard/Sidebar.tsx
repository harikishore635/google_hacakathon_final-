"use client";

import { useSevakStore, CurrentView } from "@/store/sevakStore";
import { useUIStore } from "@/store/uiStore";
import { useNGOAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { currentView, setCurrentView } = useSevakStore();
  const { sidebarCollapsed, toggleSidebar, darkMode, toggleDarkMode, toggleDarkModeWithRipple, setSettingsOpen, searchQuery } = useUIStore();
  const { isNGOLoggedIn, ngoEmail } = useNGOAuth();

  const navGroups = [
    {
      label: "MAIN MENU",
      items: [
        { id: "dashboard" as CurrentView, icon: "fa-th-large", label: "Dashboard" },
        { id: "crisisgrid" as CurrentView, icon: "fa-map-marked-alt", label: "CrisisGrid" },
        { id: "needpulse" as CurrentView, icon: "fa-brain", label: "NeedPulse" },
      ],
    },
    {
      label: "TOOLS",
      items: [
        { id: "fieldmind" as CurrentView, icon: "fa-satellite-dish", label: "FieldMind" },
        { id: "karmadao" as CurrentView, icon: "fa-coins", label: "KarmaDAO" },
        { id: "ledger" as CurrentView, icon: "fa-link", label: "TrustLedger" },
      ],
    },
  ];

  // Search filtering for nav items
  const isMatch = (label: string) => {
    if (!searchQuery) return true;
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <aside
      className="fixed top-0 left-0 h-full border-r flex flex-col z-50 transition-all duration-[250ms] ease-in-out"
      style={{
        width: sidebarCollapsed ? "80px" : "280px",
        background: "var(--dash-surface, #FFFFFF)",
        borderColor: "var(--dash-border, #E5E7EB)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.04)",
      }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid var(--dash-border-light, #F3F4F6)" }}>
        <div className="w-10 h-10 rounded-xl bg-[#FF6B2B] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-base">N</span>
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <span className="text-lg font-bold whitespace-nowrap" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>
              Nex<span style={{ color: "#FF6B2B" }}>Seva</span>
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={`${sidebarCollapsed ? "mx-auto mt-0" : "ml-auto"} w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70`}
          style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>
          <i className={`fas fa-chevron-${sidebarCollapsed ? "right" : "left"} text-xs`} />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = currentView === item.id;
                const matched = isMatch(item.label);
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full nav-item ${isActive ? "active" : ""} ${sidebarCollapsed ? "justify-center px-0" : ""} ${
                      searchQuery && matched ? "search-match" : ""
                    } ${searchQuery && !matched ? "search-dim" : ""}`}
                    title={sidebarCollapsed ? item.label : undefined}
                    style={{
                      transition: "all 0.2s ease",
                    }}>
                    <i className={`fas ${item.icon} text-base ${isActive ? "" : ""} w-5 text-center flex-shrink-0`}
                      style={{ color: isActive ? "#FF6B2B" : "var(--dash-text-muted, #9CA3AF)" }} />
                    {!sidebarCollapsed && (
                      <span className="whitespace-nowrap" style={{ color: isActive ? "#FF6B2B" : "var(--dash-text-primary, #1A1A1A)" }}>
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Others */}
        <div>
          {!sidebarCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>
              OTHERS
            </p>
          )}
          <div className="space-y-1">
            {/* Dark Mode Toggle */}
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                toggleDarkModeWithRipple(rect);
              }}
              className={`w-full nav-item ${sidebarCollapsed ? "justify-center px-0" : ""}`}
              title={sidebarCollapsed ? "Dark Mode" : undefined}>
              <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"} text-base w-5 text-center flex-shrink-0`}
                style={{ color: "var(--dash-text-muted, #9CA3AF)" }} />
              {!sidebarCollapsed && (
                <span className="whitespace-nowrap" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>Dark Mode</span>
              )}
              {!sidebarCollapsed && (
                <div className={`ml-auto w-9 h-5 rounded-full flex items-center px-0.5 transition-colors duration-200 ${
                  darkMode ? "bg-[#FF6B2B]" : "bg-[#D1D5DB]"
                }`}>
                  <div
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    style={{
                      transform: darkMode ? "translateX(16px)" : "translateX(0)",
                      transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  />
                </div>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className={`w-full nav-item ${sidebarCollapsed ? "justify-center px-0" : ""}`}
              title={sidebarCollapsed ? "Settings" : undefined}>
              <i className="fas fa-cog text-base w-5 text-center flex-shrink-0"
                style={{ color: "var(--dash-text-muted, #9CA3AF)" }} />
              {!sidebarCollapsed && (
                <span className="whitespace-nowrap" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>Settings</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div style={{ borderTop: "1px solid var(--dash-border-light, #F3F4F6)" }} className="px-3 py-4">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,107,43,0.1)" }}>
            <span className="font-bold text-sm" style={{ color: "#FF6B2B" }}>
              {isNGOLoggedIn && ngoEmail ? ngoEmail[0].toUpperCase() : "U"}
            </span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>
                {isNGOLoggedIn ? "NGO Admin" : "Guest User"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>
                {ngoEmail || "guest@nexseva.app"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

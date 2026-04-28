"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import SettingsPanel from "@/components/dashboard/SettingsPanel";

import { useUIStore } from "@/store/uiStore";

function DashboardShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed, setSidebarCollapsed, initTheme } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Handle responsive sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setSidebarCollapsed]);

  const effectiveMargin = isMobile ? "0px" : sidebarCollapsed ? "80px" : "280px";

  return (
    <div className="dash-themed flex h-screen overflow-hidden" style={{ background: "var(--dash-bg, #FAFAF8)" }}>
      {/* Mobile sidebar backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — on mobile it slides in as overlay */}
      <div
        className={`${
          isMobile
            ? `fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out ${
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : ""
        }`}
      >
        <Sidebar />
      </div>

      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-[250ms] ease-in-out"
        style={{ marginLeft: effectiveMargin }}
      >
        <TopBar onMobileMenuToggle={isMobile ? () => setMobileOpen(!mobileOpen) : undefined} />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ background: "var(--dash-bg, #FAFAF8)" }}
        >
          {children}
        </main>
      </div>
      <SettingsPanel />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}


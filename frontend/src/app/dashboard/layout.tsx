"use client";

import { ReactNode, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import { NGOAuthProvider } from "@/context/AuthContext";
import { useUIStore } from "@/store/uiStore";

function DashboardShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed, initTheme } = useUIStore();

  // Initialize theme from localStorage on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="dash-themed flex h-screen overflow-hidden" style={{ background: "var(--dash-bg, #FAFAF8)" }}>
      <Sidebar />
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-[250ms] ease-in-out"
        style={{ marginLeft: sidebarCollapsed ? "80px" : "280px" }}>
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: "var(--dash-bg, #FAFAF8)" }}>
          {children}
        </main>
      </div>
      <SettingsPanel />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <NGOAuthProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
    </NGOAuthProvider>
  );
}

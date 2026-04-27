"use client";

import { useSevakStore } from "@/store/sevakStore";
import { useUIStore } from "@/store/uiStore";
import StatCard from "@/components/dashboard/StatCard";
import DonutGauge from "@/components/dashboard/DonutGauge";
import IsometricScene from "@/components/dashboard/IsometricScene";
import { useRef, useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   CHART.JS SETUP
   ═══════════════════════════════════════════════════════ */
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarController, BarElement,
  LineController, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale,
  BarController, BarElement,
  LineController, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
);

/* ═══════════════════════════════════════════════════════
   HISTORICAL DATA — 12 months
   ═══════════════════════════════════════════════════════ */
const MONTHLY_DATA: Record<string, {
  incidents: number; volunteers: number; funds: number;
  readiness: number; notes: number; material: number;
}> = {
  "2025-01": { incidents: 42, volunteers: 890, funds: 1200000, readiness: 71, notes: 58, material: 42 },
  "2025-02": { incidents: 38, volunteers: 920, funds: 980000, readiness: 73, notes: 62, material: 45 },
  "2025-03": { incidents: 55, volunteers: 1100, funds: 1800000, readiness: 68, notes: 47, material: 38 },
  "2025-04": { incidents: 67, volunteers: 1340, funds: 2400000, readiness: 65, notes: 52, material: 35 },
  "2025-05": { incidents: 89, volunteers: 1580, funds: 3200000, readiness: 60, notes: 44, material: 30 },
  "2025-06": { incidents: 98, volunteers: 1520, funds: 3100000, readiness: 82, notes: 71, material: 52 },
  "2025-07": { incidents: 127, volunteers: 1840, funds: 4200000, readiness: 78, notes: 64, material: 45 },
  "2025-08": { incidents: 112, volunteers: 1720, funds: 3800000, readiness: 80, notes: 68, material: 48 },
  "2025-09": { incidents: 85, volunteers: 1450, funds: 2900000, readiness: 84, notes: 72, material: 55 },
  "2025-10": { incidents: 63, volunteers: 1200, funds: 2100000, readiness: 87, notes: 76, material: 60 },
  "2025-11": { incidents: 45, volunteers: 980, funds: 1500000, readiness: 89, notes: 80, material: 65 },
  "2025-12": { incidents: 34, volunteers: 850, funds: 1100000, readiness: 91, notes: 83, material: 68 },
};

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getQuarterlyData() {
  const quarters = [
    ["2025-01", "2025-02", "2025-03"],
    ["2025-04", "2025-05", "2025-06"],
    ["2025-07", "2025-08", "2025-09"],
    ["2025-10", "2025-11", "2025-12"],
  ];
  return quarters.map(q => ({
    incidents: q.reduce((s, m) => s + (MONTHLY_DATA[m]?.incidents || 0), 0),
    volunteers: Math.round(q.reduce((s, m) => s + (MONTHLY_DATA[m]?.volunteers || 0), 0) / 3),
    funds: q.reduce((s, m) => s + (MONTHLY_DATA[m]?.funds || 0), 0),
  }));
}

/* ═══════════════════════════════════════════════════════
   SEVERITY + FEED COLORS
   ═══════════════════════════════════════════════════════ */
const SEVERITY_COLOR: Record<string, string> = {
  critical: "#F43F5E", high: "#FF6B35", moderate: "#FBBF24", low: "#2DD4BF",
};
const FEED_ICON: Record<string, string> = {
  fieldmind: "fa-satellite-dish", needpulse: "fa-brain", crisisgrid: "fa-map-marked-alt", karmadao: "fa-coins",
};
const FEED_COLOR: Record<string, string> = {
  fieldmind: "#FF6B35", needpulse: "#6366F1", crisisgrid: "#F43F5E", karmadao: "#2DD4BF",
};

/* ═══════════════════════════════════════════════════════
   CALENDAR WIDGET
   ═══════════════════════════════════════════════════════ */
function CalendarWidget({ selectedDate, onSelect }: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    if (open) document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, [open]);

  const today = new Date();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div ref={ref} className="relative" style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-2xl p-5 transition-all"
        style={{
          background: "var(--dash-surface, #FFFFFF)",
          border: "1px solid var(--dash-border-light, #F3F4F6)",
          boxShadow: "var(--dash-card-shadow, 0 4px 24px rgba(0,0,0,0.07))",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <i className="fas fa-calendar-alt" style={{ color: "#FF6B2B" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>Today</span>
        </div>
        <p className="text-2xl font-bold mb-1" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>
          {selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <p className="text-xs" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>
          {selectedDate.toLocaleDateString("en-IN", { weekday: "long" })}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
          <span className="text-xs font-medium" style={{ color: "#2DD4BF" }}>All Systems Operational</span>
        </div>
      </div>

      {/* Calendar Dropdown */}
      <div
        className={`calendar-dropdown ${open ? "open" : ""}`}
        style={{
          background: "var(--dash-surface, #FFFFFF)",
          border: "1px solid var(--dash-border, #E5E7EB)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
          padding: 16,
        }}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70"
            style={{ color: "var(--dash-text-muted)" }}
          >
            <i className="fas fa-chevron-left text-xs" />
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
            {new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70"
            style={{ color: "var(--dash-text-muted)" }}
          >
            <i className="fas fa-chevron-right text-xs" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} className="calendar-header-day text-center">{d}</div>
          ))}
        </div>

        {/* Days — ALL dates selectable, full contrast */}
        <div className="grid grid-cols-7 gap-1">
          {blanks.map(b => <div key={`b${b}`} />)}
          {days.map(day => {
            const date = new Date(viewYear, viewMonth, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isPast = date < today && !isToday;
            const classes = [
              "calendar-day",
              "w-8 h-8 flex items-center justify-center text-xs",
              isToday && !isSelected ? "today" : "",
              isSelected ? "selected" : "",
              isPast ? "past" : "",
            ].filter(Boolean).join(" ");
            return (
              <button
                key={day}
                onClick={() => { onSelect(date); setOpen(false); }}
                className={classes}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ENHANCED CHART COMPONENT
   ═══════════════════════════════════════════════════════ */
function EnhancedChart({ darkMode }: { darkMode: boolean }) {
  const [timeScale, setTimeScale] = useState<"monthly" | "quarterly" | "yearly">("yearly");
  const [showIncidents, setShowIncidents] = useState(true);
  const [showFunds, setShowFunds] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);

  const monthlyValues = Object.values(MONTHLY_DATA);
  const quarterlyValues = getQuarterlyData();

  const labels = timeScale === "yearly" ? MONTH_LABELS : timeScale === "quarterly" ? QUARTER_LABELS : MONTH_LABELS;
  const incidentData = timeScale === "quarterly" ? quarterlyValues.map(q => q.incidents) : monthlyValues.map(m => m.incidents);
  const fundsData = timeScale === "quarterly" ? quarterlyValues.map(q => q.funds / 100000) : monthlyValues.map(m => m.funds / 100000);
  const volunteerData = timeScale === "quarterly" ? quarterlyValues.map(q => q.volunteers) : monthlyValues.map(m => m.volunteers);

  const datasets: any[] = [];
  if (showFunds) {
    datasets.push({
      type: "bar" as const,
      label: "Funds (₹ Lakhs)",
      data: fundsData,
      backgroundColor: "rgba(255,107,43,0.6)",
      borderRadius: 6,
      yAxisID: "y1",
      order: 2,
    });
  }
  if (showIncidents) {
    datasets.push({
      type: "line" as const,
      label: "Incidents",
      data: incidentData,
      borderColor: "#FF6B2B",
      borderWidth: 2,
      fill: true,
      backgroundColor: "rgba(255,107,43,0.1)",
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: "#FF6B2B",
      yAxisID: "y",
      order: 1,
    });
  }
  if (showVolunteers) {
    datasets.push({
      type: "line" as const,
      label: "Volunteers",
      data: volunteerData,
      borderColor: "#00C49A",
      borderDash: [5, 5],
      borderWidth: 2,
      fill: false,
      pointRadius: 3,
      pointBackgroundColor: "#00C49A",
      yAxisID: "y",
      order: 0,
    });
  }

  const gridColor = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const textColor = darkMode ? "#9A9A8A" : "#6B7280";

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex gap-1.5">
          {([
            { key: "incidents", label: "Incidents", active: showIncidents, toggle: () => setShowIncidents(!showIncidents) },
            { key: "funds", label: "Funds Raised", active: showFunds, toggle: () => setShowFunds(!showFunds) },
            { key: "volunteers", label: "Volunteers", active: showVolunteers, toggle: () => setShowVolunteers(!showVolunteers) },
          ] as const).map(btn => (
            <button
              key={btn.key}
              onClick={btn.toggle}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all"
              style={{
                background: btn.active ? "#FF6B2B" : "transparent",
                color: btn.active ? "#FFFFFF" : textColor,
                border: btn.active ? "1px solid #FF6B2B" : `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["monthly", "quarterly", "yearly"] as const).map(scale => (
            <button
              key={scale}
              onClick={() => setTimeScale(scale)}
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
              style={{
                background: timeScale === scale ? (darkMode ? "#242424" : "#F2F0EC") : "transparent",
                color: timeScale === scale ? "#FF6B2B" : textColor,
              }}
            >
              {scale}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 200 }}>
        <Chart
          type="bar"
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600 },
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: darkMode ? "#1A1A1A" : "#FFFFFF",
                titleColor: darkMode ? "#F5F5F0" : "#1A1A1A",
                bodyColor: darkMode ? "#9A9A8A" : "#6B7280",
                borderColor: darkMode ? "rgba(255,107,43,0.2)" : "#E5E7EB",
                borderWidth: 1,
                cornerRadius: 12,
                padding: 12,
              },
            },
            scales: {
              x: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { size: 10 } },
              },
              y: {
                position: "left",
                grid: { color: gridColor },
                ticks: { color: textColor, font: { size: 10 } },
                beginAtZero: true,
                max: 200,
              },
              y1: {
                position: "right",
                grid: { display: false },
                ticks: { color: textColor, font: { size: 10 }, callback: (v: any) => `₹${v}L` },
                beginAtZero: true,
                max: 50,
              },
            },
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD PANEL
   ═══════════════════════════════════════════════════════ */
export default function DashboardPanel() {
  const {
    reports, incidents, proposals, sbtRegistry, treasury,
    totalFunded, totalAffected, activeVolunteers,
    feedItems, generateDemoData, setCurrentView,
  } = useSevakStore();
  const { darkMode } = useUIStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [animatedStats, setAnimatedStats] = useState({ inc: 0, vol: 0, funds: 0 });

  // Get data for selected month (or live data)
  const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;
  const histData = MONTHLY_DATA[monthKey];

  const responseRate = histData ? histData.readiness : (reports.length > 0 ? 96.5 : 0);
  const fundDeployment = histData ? Math.round(histData.material) : (treasury.percentage || (totalFunded > 0 ? 72 : 0));

  // Animate stat changes
  useEffect(() => {
    if (histData) {
      setAnimatedStats({ inc: histData.incidents, vol: histData.volunteers, funds: histData.funds });
    }
  }, [histData]);

  const criticalReports = reports.filter((r) => r.severity === "critical").length;
  const activeProposals = proposals.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-6">
      {/* ─── Top Row: Stats + Illustration + Date ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stats Cards - Left 5 cols */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            icon="fa-chart-line"
            iconColor="#2DD4BF"
            iconBg="rgba(45, 212, 191, 0.12)"
            value={responseRate}
            suffix="%"
            label="Response Rate"
            trend={{ direction: "up", value: "12.5%" }}
            gaugeValue={responseRate}
            gaugeGradientFrom="#6366F1"
            gaugeGradientTo="#A855F7"
            delay={0}
          />
          <StatCard
            icon="fa-users"
            iconColor="#FF6B35"
            iconBg="rgba(255, 107, 53, 0.10)"
            value={histData ? histData.volunteers : (Math.round(totalAffected) || 0)}
            label="People Reached"
            trend={{ direction: "up", value: histData ? `${histData.incidents} incidents` : `${reports.length} reports` }}
            gaugeValue={Math.min(100, histData ? histData.readiness : Math.round(totalAffected / 50))}
            gaugeColor="#FF6B35"
            delay={100}
          />
          <StatCard
            icon="fa-rupee-sign"
            iconColor="#6366F1"
            iconBg="rgba(99, 102, 241, 0.10)"
            value={histData ? `₹${(histData.funds / 100000).toFixed(1)}L` : (totalFunded > 0 ? `₹${totalFunded.toLocaleString()}` : "₹0")}
            label="Funds Deployed"
            trend={histData ? { direction: "up", value: `${histData.notes} notes` } : undefined}
            gaugeValue={fundDeployment}
            gaugeGradientFrom="#FF6B35"
            gaugeGradientTo="#F43F5E"
            delay={200}
          />
          <StatCard
            icon="fa-user-shield"
            iconColor="#FBBF24"
            iconBg="rgba(251, 191, 36, 0.10)"
            value={histData ? histData.volunteers : activeVolunteers}
            label="Active Volunteers"
            trend={sbtRegistry.length > 0 ? { direction: "up", value: `${sbtRegistry.length} SBTs` } : undefined}
            gaugeValue={Math.min(100, (histData ? histData.volunteers : activeVolunteers) / 20)}
            gaugeColor="#2DD4BF"
            delay={300}
          />
        </div>

        {/* Isometric Scene - Center 4 cols */}
        <div className="lg:col-span-4">
          <div
            className="rounded-2xl h-full flex items-center justify-center p-4 overflow-hidden"
            style={{
              background: "var(--dash-surface, #FFFFFF)",
              border: "1px solid var(--dash-border-light, #F3F4F6)",
              boxShadow: "var(--dash-card-shadow, 0 4px 24px rgba(0,0,0,0.07))",
            }}
          >
            <IsometricScene />
          </div>
        </div>

        {/* Date & Quick Actions - Right 3 cols */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <CalendarWidget selectedDate={selectedDate} onSelect={setSelectedDate} />

          {/* Quick Actions */}
          <div
            className="rounded-2xl p-5 flex-1"
            style={{
              background: "var(--dash-surface, #FFFFFF)",
              border: "1px solid var(--dash-border-light, #F3F4F6)",
              boxShadow: "var(--dash-card-shadow, 0 4px 24px rgba(0,0,0,0.07))",
            }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>Quick Actions</p>
            <div className="space-y-2">
              <button
                onClick={generateDemoData}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:opacity-80 transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all" style={{ background: "rgba(255,107,43,0.1)", color: "#FF6B2B" }}>
                  <i className="fas fa-bolt" />
                </div>
                <span style={{ color: "var(--dash-text-secondary, #6B7280)" }}>Generate Demo</span>
              </button>
              <button
                onClick={() => setCurrentView("fieldmind")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:opacity-80 transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs" style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
                  <i className="fas fa-plus" />
                </div>
                <span style={{ color: "var(--dash-text-secondary, #6B7280)" }}>New Report</span>
              </button>
              <button
                onClick={() => setCurrentView("crisisgrid")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:opacity-80 transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs" style={{ background: "rgba(244,63,94,0.1)", color: "#F43F5E" }}>
                  <i className="fas fa-map" />
                </div>
                <span style={{ color: "var(--dash-text-secondary, #6B7280)" }}>Open Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Row: Chart + Donut + Priority Queue ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Enhanced Chart */}
        <div
          className="lg:col-span-5 rounded-2xl p-6"
          style={{
            background: "var(--dash-surface, #FFFFFF)",
            border: "1px solid var(--dash-border-light, #F3F4F6)",
            boxShadow: "var(--dash-card-shadow, 0 4px 24px rgba(0,0,0,0.07))",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>Monthly Overview</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>Crisis reports by month</p>
            </div>
            <span className="pill bg-[rgba(255,107,43,0.1)] text-[#FF6B2B] text-xs px-2.5 py-1 rounded-lg font-semibold">
              <i className="fas fa-chart-bar text-[10px] mr-1" /> 2025
            </span>
          </div>
          <EnhancedChart darkMode={darkMode} />
        </div>

        {/* Donut Gauge */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 flex flex-col items-center justify-center"
          style={{
            background: "var(--dash-surface, #FFFFFF)",
            border: "1px solid var(--dash-border-light, #F3F4F6)",
            boxShadow: "var(--dash-card-shadow, 0 4px 24px rgba(0,0,0,0.07))",
          }}
        >
          <DonutGauge
            value={fundDeployment || 70}
            color="#FF6B35"
            label="Deployed"
          />
          <p className="text-xs mt-3 text-center" style={{ color: "var(--dash-text-muted, #9CA3AF)" }}>Fund Deployment Rate</p>
        </div>

        {/* Priority Queue */}
        <div
          className="lg:col-span-5 rounded-2xl overflow-hidden"
          style={{
            background: "var(--dash-surface, #FFFFFF)",
            border: "1px solid var(--dash-border-light, #F3F4F6)",
            boxShadow: "var(--dash-card-shadow, 0 4px 24px rgba(0,0,0,0.07))",
          }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--dash-border-light, #F3F4F6)" }}>
            <div className="flex items-center gap-2">
              <i className="fas fa-brain text-sm" style={{ color: "#FF6B2B" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>Priority Queue</span>
            </div>
            <button
              onClick={() => setCurrentView("needpulse")}
              className="text-xs px-3 py-1 rounded-lg transition-all font-medium hover:opacity-80"
              style={{ color: "#FF6B2B" }}>
              View All →
            </button>
          </div>
          <div>
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-sm gap-2" style={{ color: "var(--dash-text-muted)" }}>
                <i className="fas fa-inbox text-2xl opacity-30" />
                <p>
                  No active crises.{" "}
                  <button onClick={generateDemoData} className="font-medium hover:underline" style={{ color: "#FF6B2B" }}>
                    Generate demo data
                  </button>
                </p>
              </div>
            ) : (
              incidents.slice(0, 4).map((inc, i) => (
                <div
                  key={inc.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-all cursor-pointer hover:opacity-80"
                  style={{ borderBottom: "1px solid var(--dash-border-light, #F3F4F6)" }}>
                  <span className="text-lg font-bold w-6 text-center" style={{ color: "var(--dash-text-muted)" }}>{i + 1}</span>
                  <div
                    className="w-1.5 h-10 rounded-full flex-shrink-0"
                    style={{ background: SEVERITY_COLOR[inc.severity] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>
                      {inc.title}
                    </p>
                    <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                      {Math.round(inc.affected)} people · {inc.needs.slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xl font-bold" style={{ color: SEVERITY_COLOR[inc.severity] }}>
                      {inc.score.toFixed(0)}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--dash-text-muted)" }}>surge</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Third Row: Pipeline Status + Live Feed ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--dash-surface, #FFFFFF)",
            border: "1px solid var(--dash-border-light, #F3F4F6)",
            boxShadow: "var(--dash-card-shadow, 0 4px 24px rgba(0,0,0,0.07))",
          }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--dash-border-light, #F3F4F6)" }}>
            <div className="flex items-center gap-2">
              <i className="fas fa-project-diagram text-sm" style={{ color: "#FF6B2B" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>Pipeline Status</span>
            </div>
          </div>
          <div>
            {[
              { id: "fieldmind", label: "FieldMind", icon: "fa-satellite-dish", status: "Active", val: `${reports.length} reports`, color: "#FF6B35" },
              { id: "needpulse", label: "NeedPulse", icon: "fa-brain", status: "Scoring", val: `${incidents.filter((i) => i.severity === "critical").length} critical`, color: "#6366F1" },
              { id: "crisisgrid", label: "CrisisGrid", icon: "fa-map-marked-alt", status: "Mapping", val: `${incidents.length} incidents`, color: "#F43F5E" },
              { id: "karmadao", label: "KarmaDAO", icon: "fa-coins", status: "Funding", val: `${activeProposals} proposals`, color: "#2DD4BF" },
            ].map(({ id, label, icon, status, val, color }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id as any)}
                className="w-full flex items-center gap-4 px-5 py-3.5 transition-all text-left hover:opacity-80"
                style={{ borderBottom: "1px solid var(--dash-border-light, #F3F4F6)" }}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm transition-all"
                  style={{ background: `${color}14`, color }}>
                  <i className={`fas ${icon}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>{val}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-lg" style={{ background: "rgba(45,212,191,0.12)", color: "#2DD4BF" }}>{status}</span>
                <i className="fas fa-chevron-right text-xs" style={{ color: "var(--dash-text-muted)" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Live Feed */}
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "var(--dash-surface, #FFFFFF)",
            border: "1px solid var(--dash-border-light, #F3F4F6)",
            boxShadow: "var(--dash-card-shadow, 0 4px 24px rgba(0,0,0,0.07))",
          }}
        >
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--dash-border-light, #F3F4F6)" }}>
            <div className="flex items-center gap-2">
              <i className="fas fa-bolt text-sm" style={{ color: "#FF6B2B" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>Live Event Feed</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-ping" />
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 280 }}>
            {feedItems.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-xs gap-2" style={{ color: "var(--dash-text-muted)" }}>
                <i className="fas fa-rss" />
                No events yet — generate demo data
              </div>
            ) : (
              feedItems.slice(0, 15).map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-5 py-3 transition-all hover:opacity-80" style={{ borderBottom: "1px solid var(--dash-border-light, #F3F4F6)" }}>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs"
                    style={{
                      background: `${FEED_COLOR[item.type] || "#FF6B35"}14`,
                      color: FEED_COLOR[item.type] || "#FF6B35",
                    }}>
                    <i className={`fas ${FEED_ICON[item.type] || "fa-circle"}`} />
                  </div>
                  <p className="text-xs flex-1 leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>{item.message}</p>
                  <span className="text-[10px] whitespace-nowrap flex-shrink-0" style={{ color: "var(--dash-text-muted)" }}>
                    {new Date(item.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

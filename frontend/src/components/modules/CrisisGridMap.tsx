"use client";

import { useSevakStore } from "@/store/sevakStore";
import { useUIStore } from "@/store/uiStore";
import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const SEV_COLOR: Record<string, string> = { critical: '#F43F5E', high: '#FF6B35', moderate: '#FBBF24', low: '#2DD4BF', stable: '#2DD4BF' };

/* ═══════════════════════════════════════════════════════
   CRISIS MARKERS
   ═══════════════════════════════════════════════════════ */
const CRISIS_MARKERS = [
  { lat: 13.08, lng: 80.27, label: "Chennai", type: "Flood", severity: "critical", volunteers: 47, funds: "₹4.2L", affected: 850 },
  { lat: 10.78, lng: 79.13, label: "Thanjavur", type: "Cyclone", severity: "critical", volunteers: 32, funds: "₹3.8L", affected: 470 },
  { lat: 9.92, lng: 78.12, label: "Madurai", type: "Medical", severity: "moderate", volunteers: 18, funds: "₹1.2L", affected: 230 },
  { lat: 11.01, lng: 76.95, label: "Coimbatore", type: "Fire", severity: "high", volunteers: 22, funds: "₹2.1L", affected: 120 },
  { lat: 11.10, lng: 77.34, label: "Tiruppur", type: "Flood", severity: "critical", volunteers: 38, funds: "₹5.1L", affected: 650 },
  { lat: 19.07, lng: 72.87, label: "Mumbai", type: "Flood", severity: "high", volunteers: 89, funds: "₹12.4L", affected: 2400 },
  { lat: 28.61, lng: 77.20, label: "Delhi", type: "Air Quality", severity: "moderate", volunteers: 54, funds: "₹3.6L", affected: 5000 },
  { lat: 22.57, lng: 88.36, label: "Kolkata", type: "Cyclone", severity: "high", volunteers: 67, funds: "₹8.2L", affected: 1800 },
];

/* ═══════════════════════════════════════════════════════
   D3 INDIA MAP COMPONENT
   ═══════════════════════════════════════════════════════ */
function IndiaMapD3({
  darkMode,
  markers,
  onMarkerHover,
  onMarkerLeave,
}: {
  darkMode: boolean;
  markers: typeof CRISIS_MARKERS;
  onMarkerHover: (e: MouseEvent, marker: typeof CRISIS_MARKERS[0]) => void;
  onMarkerLeave: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const geoDataRef = useRef<any>(null);

  // Load TopoJSON data
  useEffect(() => {
    const loadMap = async () => {
      try {
        // Use a verified India TopoJSON source
        const resp = await fetch(
          "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
        );
        const world = await resp.json();

        // Extract India from world atlas (country code 356)
        const countries = topojson.feature(world, world.objects.countries) as any;
        const india = countries.features.find(
          (f: any) => f.id === "356" || f.properties?.name === "India"
        );

        if (india) {
          geoDataRef.current = india;
          setLoaded(true);
        } else {
          // Fallback: try loading a dedicated India TopoJSON
          const indiaResp = await fetch(
            "https://raw.githubusercontent.com/Subhash9325/GeospatialData-India-v2/master/State_Boundary/india_state_geo.json"
          );
          const indiaGeo = await indiaResp.json();
          geoDataRef.current = indiaGeo;
          setLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load India map data:", err);
        // Use inline GeoJSON fallback for India outline
        geoDataRef.current = getInlineFallback();
        setLoaded(true);
      }
    };

    loadMap();
  }, []);

  // Render D3 map
  useEffect(() => {
    if (!loaded || !svgRef.current || !containerRef.current || !geoDataRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const landColor = darkMode ? "#1A1A1A" : "#EEEAE2";
    const borderStroke = darkMode ? "#2A2A2A" : "#D4D0C8";
    const hoverFill = darkMode ? "#2A2A2A" : "#DDD8CE";
    const gridColor = darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";

    // Grid lines
    const gridG = svg.append("g").attr("class", "grid-lines");
    for (let i = 0; i < Math.ceil(width / 40); i++) {
      gridG.append("line")
        .attr("x1", i * 40).attr("y1", 0)
        .attr("x2", i * 40).attr("y2", height)
        .attr("stroke", gridColor).attr("stroke-width", 1);
    }
    for (let i = 0; i < Math.ceil(height / 40); i++) {
      gridG.append("line")
        .attr("x1", 0).attr("y1", i * 40)
        .attr("x2", width).attr("y2", i * 40)
        .attr("stroke", gridColor).attr("stroke-width", 1);
    }

    // Projection centered on India
    const projection = d3.geoMercator()
      .center([82, 22])
      .scale(Math.min(width, height) * 1.5)
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    const mapGroup = svg.append("g").attr("class", "map-group");

    // Check if it's a FeatureCollection (state-level) or single feature
    const geoData = geoDataRef.current;
    const features = geoData.type === "FeatureCollection"
      ? geoData.features
      : [geoData];

    // If we have a FeatureCollection (state-level data), auto-fit
    if (geoData.type === "FeatureCollection") {
      projection.fitSize([width - 40, height - 40], geoData);
      projection.translate([width / 2, height / 2]);
    }

    // Draw states/country
    mapGroup
      .selectAll("path")
      .data(features)
      .join("path")
      .attr("d", pathGenerator as any)
      .attr("fill", landColor)
      .attr("stroke", borderStroke)
      .attr("stroke-width", 0.8)
      .style("cursor", "pointer")
      .style("transition", "fill 200ms ease")
      .on("mouseenter", function () {
        d3.select(this).attr("fill", hoverFill);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", landColor);
      });

    // Crisis markers
    const markerG = svg.append("g").attr("class", "crisis-markers");

    markers.forEach((marker, i) => {
      const [x, y] = projection([marker.lng, marker.lat]) || [0, 0];
      const col = SEV_COLOR[marker.severity];
      const r = marker.severity === 'critical' ? 10 : marker.severity === 'high' ? 8 : 6;

      const g = markerG.append("g")
        .attr("class", "crisis-marker")
        .style("cursor", "pointer");

      // Pulse ring for critical/high
      if (marker.severity === 'critical' || marker.severity === 'high') {
        g.append("circle")
          .attr("cx", x).attr("cy", y)
          .attr("r", r)
          .attr("fill", "none")
          .attr("stroke", col)
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.4);

        // Animated pulse
        g.append("circle")
          .attr("cx", x).attr("cy", y)
          .attr("r", r)
          .attr("fill", "none")
          .attr("stroke", col)
          .attr("stroke-width", 1)
          .attr("opacity", 0.5)
          .append("animate")
          .attr("attributeName", "r")
          .attr("from", r)
          .attr("to", r + 12)
          .attr("dur", "2s")
          .attr("begin", `${i * 0.3}s`)
          .attr("repeatCount", "indefinite");

        g.select("circle:last-of-type")
          .append("animate")
          .attr("attributeName", "opacity")
          .attr("from", 0.5)
          .attr("to", 0)
          .attr("dur", "2s")
          .attr("begin", `${i * 0.3}s`)
          .attr("repeatCount", "indefinite");
      }

      // Main dot
      g.append("circle")
        .attr("cx", x).attr("cy", y)
        .attr("r", r)
        .attr("fill", col)
        .attr("opacity", 0.9);

      // Inner glow
      g.append("circle")
        .attr("cx", x).attr("cy", y)
        .attr("r", r - 2)
        .attr("fill", col)
        .attr("opacity", 0.4);

      // Label
      g.append("text")
        .attr("x", x).attr("y", y + r + 14)
        .attr("text-anchor", "middle")
        .attr("fill", darkMode ? "#9A9A8A" : "#6B7280")
        .attr("font-size", 9)
        .attr("font-weight", 600)
        .text(marker.label);

      // Events
      g.on("mouseenter", function (event: any) {
        onMarkerHover(event, marker);
      });
      g.on("mouseleave", function () {
        onMarkerLeave();
      });
    });
  }, [loaded, darkMode, markers, onMarkerHover, onMarkerLeave]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[480px] relative">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm" style={{ color: darkMode ? "#9A9A8A" : "#6B7280" }}>
            <i className="fas fa-spinner fa-spin" />
            Loading India map...
          </div>
        </div>
      )}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ display: loaded ? "block" : "none" }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   INLINE FALLBACK — Accurate India GeoJSON outline
   ═══════════════════════════════════════════════════════ */
function getInlineFallback() {
  // A simplified but much more accurate India GeoJSON
  return {
    type: "Feature",
    properties: { name: "India" },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [77.837, 35.494],
        [78.912, 34.322],
        [78.811, 33.506],
        [79.209, 32.994],
        [79.176, 32.484],
        [78.458, 32.618],
        [78.738, 31.516],
        [79.721, 30.883],
        [81.111, 30.183],
        [80.476, 29.730],
        [80.089, 28.795],
        [81.057, 28.416],
        [81.999, 27.925],
        [83.304, 27.364],
        [84.675, 27.234],
        [85.252, 26.726],
        [86.024, 26.630],
        [87.227, 26.398],
        [88.060, 26.414],
        [88.175, 26.810],
        [88.043, 27.446],
        [88.120, 27.877],
        [88.730, 28.087],
        [88.814, 27.299],
        [88.836, 27.099],
        [89.744, 26.719],
        [90.373, 26.876],
        [91.217, 26.809],
        [92.033, 26.838],
        [92.104, 27.452],
        [91.697, 27.772],
        [92.503, 27.897],
        [93.413, 28.641],
        [94.566, 29.277],
        [95.405, 29.032],
        [96.118, 29.454],
        [96.587, 28.831],
        [96.249, 28.411],
        [97.328, 28.262],
        [97.403, 27.882],
        [97.052, 27.699],
        [97.134, 27.084],
        [96.420, 27.264],
        [95.125, 26.574],
        [95.155, 26.001],
        [94.603, 25.162],
        [94.553, 24.675],
        [94.107, 23.851],
        [93.325, 24.079],
        [93.286, 23.044],
        [93.060, 22.703],
        [93.166, 22.278],
        [92.673, 22.041],
        [92.146, 23.627],
        [91.870, 23.624],
        [91.706, 22.985],
        [91.159, 23.504],
        [91.467, 24.073],
        [91.915, 24.130],
        [92.376, 24.977],
        [91.799, 25.147],
        [90.872, 25.133],
        [89.921, 25.270],
        [89.832, 25.965],
        [89.355, 26.014],
        [88.563, 26.447],
        [88.210, 25.768],
        [88.932, 25.239],
        [88.306, 24.866],
        [88.084, 24.502],
        [88.700, 24.234],
        [88.528, 23.631],
        [88.876, 22.879],
        [89.032, 22.056],
        [88.889, 21.691],
        [88.208, 21.703],
        [86.976, 21.496],
        [87.033, 20.744],
        [86.499, 20.152],
        [85.060, 19.479],
        [83.941, 18.302],
        [83.189, 17.671],
        [82.193, 17.016],
        [82.191, 16.557],
        [81.693, 16.310],
        [80.792, 15.952],
        [80.325, 15.899],
        [80.026, 15.137],
        [80.234, 13.836],
        [80.286, 13.006],
        [79.862, 12.056],
        [79.858, 10.357],
        [79.340, 10.309],
        [78.886, 9.546],
        [79.190, 9.217],
        [78.278, 8.933],
        [77.941, 8.253],
        [77.540, 7.966],
        [76.593, 8.899],
        [76.130, 10.300],
        [75.746, 11.308],
        [75.396, 11.781],
        [74.865, 12.742],
        [74.617, 13.993],
        [74.444, 14.617],
        [73.534, 15.991],
        [73.120, 17.929],
        [72.821, 19.208],
        [72.824, 20.420],
        [72.631, 21.356],
        [71.175, 20.757],
        [70.470, 20.877],
        [69.164, 22.089],
        [69.645, 22.451],
        [69.350, 22.843],
        [68.177, 23.692],
        [68.843, 24.359],
        [71.043, 24.357],
        [70.844, 25.215],
        [70.283, 25.722],
        [70.169, 26.491],
        [69.514, 26.941],
        [70.616, 27.989],
        [71.778, 27.913],
        [72.824, 28.962],
        [73.451, 29.976],
        [74.421, 30.980],
        [74.406, 31.693],
        [75.259, 32.272],
        [74.451, 32.765],
        [74.104, 33.441],
        [73.750, 34.318],
        [74.240, 34.749],
        [75.757, 34.505],
        [76.871, 34.654],
        [77.837, 35.494],
      ]],
    },
  };
}

/* ═══════════════════════════════════════════════════════
   MAIN CRISISGRID MAP COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function CrisisGridMap() {
  const { incidents, volunteers, alerts, mapLayer, setMapLayer, deployVolunteer, createProposal } = useSevakStore();
  const { darkMode } = useUIStore();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; marker: typeof CRISIS_MARKERS[0] } | null>(null);
  const [deployModal, setDeployModal] = useState(false);
  const [deployForm, setDeployForm] = useState({ name: "", ward: "", skill: "flood_rescue" });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const criticalZones = incidents.filter(i => i.severity === 'critical').length || CRISIS_MARKERS.filter(m => m.severity === 'critical').length;
  const peopleAtRisk = Math.round(incidents.reduce((s, i) => s + i.affected, 0)) || CRISIS_MARKERS.reduce((s, m) => s + m.affected, 0);

  const handleDeploy = () => {
    if (deployForm.name && deployForm.ward) {
      deployVolunteer(deployForm.name, deployForm.ward, deployForm.skill);
      setDeployModal(false);
      setDeployForm({ name: "", ward: "", skill: "flood_rescue" });
    }
  };

  const handleMarkerHover = useCallback((e: MouseEvent, marker: typeof CRISIS_MARKERS[0]) => {
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 100,
        marker,
      });
    }
  }, []);

  const handleMarkerLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const borderColor = darkMode ? "rgba(255,107,43,0.15)" : "#E5E7EB";
  const textColor = darkMode ? "#9A9A8A" : "#6B7280";
  const bgColor = darkMode ? "#0F0F0F" : "#F8F8F8";

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-wrap items-start justify-between mb-7 gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--dash-text-primary, #1A1A1A)" }}>
          <i className="fas fa-map-marked-alt mr-2" style={{ color: "#FF6B2B" }} />CrisisGrid — Live Command View
        </h2>
        <div className="flex items-center gap-2.5 text-[13px] flex-wrap" style={{ color: "var(--dash-text-secondary)" }}>
          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,107,43,0.1)", color: "#FF6B2B" }}>Layer 3</span>
          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-lg animate-pulse" style={{ background: "rgba(45,212,191,0.12)", color: "#2DD4BF" }}>● LIVE</span>
          <span>Real-time ward heatmap · 48-hour forecast · Multi-NGO coordination</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Map */}
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "var(--dash-surface, #FFFFFF)",
            border: `1px solid ${borderColor}`,
            boxShadow: "var(--dash-card-shadow)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <div className="flex gap-2">
              {(["current", "forecast", "volunteers"] as const).map(l => (
                <button key={l} onClick={() => setMapLayer(l)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all capitalize"
                  style={{
                    background: mapLayer === l ? "rgba(255,107,43,0.1)" : "transparent",
                    color: mapLayer === l ? "#FF6B2B" : textColor,
                    border: mapLayer === l ? "1px solid rgba(255,107,43,0.3)" : "1px solid transparent",
                  }}>
                  {l === 'current' ? 'Current' : l === 'forecast' ? '48h Forecast' : 'Volunteers'}
                </button>
              ))}
            </div>
            <div className="flex gap-4 text-[11px] font-semibold items-center" style={{ color: textColor }}>
              {[['critical', 'Critical'], ['high', 'High'], ['moderate', 'Moderate'], ['stable', 'Stable']].map(([s, l]) => (
                <span key={s} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEV_COLOR[s] }} />{l}
                </span>
              ))}
            </div>
          </div>

          <div ref={mapContainerRef} className="flex-1 relative min-h-[480px]" style={{ background: bgColor }}>
            {/* D3 India Map */}
            <IndiaMapD3
              darkMode={darkMode}
              markers={CRISIS_MARKERS}
              onMarkerHover={handleMarkerHover}
              onMarkerLeave={handleMarkerLeave}
            />

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute pointer-events-none z-20 rounded-xl p-3"
                style={{
                  left: tooltip.x - 80,
                  top: tooltip.y,
                  width: 200,
                  background: darkMode ? "#1A1A1A" : "#FFFFFF",
                  border: `1px solid ${borderColor}`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  color: darkMode ? "#F5F5F0" : "#1A1A1A",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEV_COLOR[tooltip.marker.severity] }} />
                  <span className="text-xs font-bold">{tooltip.marker.label}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold uppercase" style={{
                    background: `${SEV_COLOR[tooltip.marker.severity]}20`,
                    color: SEV_COLOR[tooltip.marker.severity],
                  }}>
                    {tooltip.marker.severity}
                  </span>
                </div>
                <p className="text-[11px] font-semibold" style={{ color: textColor }}>{tooltip.marker.type}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
                  <div><span style={{ color: textColor }}>Volunteers:</span> <strong>{tooltip.marker.volunteers}</strong></div>
                  <div><span style={{ color: textColor }}>Funds:</span> <strong>{tooltip.marker.funds}</strong></div>
                  <div><span style={{ color: textColor }}>Affected:</span> <strong>{tooltip.marker.affected.toLocaleString()}</strong></div>
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div
              className="absolute bottom-4 left-4 rounded-xl p-3 z-10"
              style={{
                background: darkMode ? "rgba(26,26,26,0.85)" : "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${borderColor}`,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: textColor }}>Legend</p>
              {[
                { icon: "fa-water", label: "Flood", count: 3, color: "#F43F5E" },
                { icon: "fa-wind", label: "Cyclone", count: 2, color: "#FF6B35" },
                { icon: "fa-medkit", label: "Medical", count: 1, color: "#FBBF24" },
                { icon: "fa-fire", label: "Fire", count: 1, color: "#FF6B35" },
              ].map(({ icon, label, count, color }) => (
                <div key={label} className="flex items-center gap-2 py-1">
                  <i className={`fas ${icon} text-[10px]`} style={{ color, width: 12 }} />
                  <span className="text-[10px]" style={{ color: darkMode ? "#F5F5F0" : "#1A1A1A" }}>{label}</span>
                  <span className="ml-auto text-[10px] font-bold" style={{ color }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex" style={{ borderTop: `1px solid ${borderColor}` }}>
            {[
              { icon: 'fa-exclamation-circle', val: criticalZones, label: 'Critical Zones' },
              { icon: 'fa-users', val: peopleAtRisk.toLocaleString(), label: 'People at Risk' },
              { icon: 'fa-truck', val: volunteers.length || CRISIS_MARKERS.length, label: 'Resources' },
              { icon: 'fa-user-shield', val: volunteers.filter(v => v.status === 'active').length || 47, label: 'Volunteers Active' },
            ].map(({ icon, val, label }) => (
              <div key={label} className="flex-1 flex gap-2 items-center justify-center py-3" style={{ borderRight: `1px solid ${borderColor}` }}>
                <i className={`fas ${icon} text-sm`} style={{ color: textColor }} />
                <span className="font-bold text-sm" style={{ color: "var(--dash-text-primary)" }}>{val}</span>
                <span className="text-[10px] uppercase tracking-wider hidden sm:block" style={{ color: textColor }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl flex flex-col"
            style={{
              maxHeight: 220,
              background: "var(--dash-surface, #FFFFFF)",
              border: `1px solid ${borderColor}`,
              boxShadow: "var(--dash-card-shadow)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
              <span className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                <i className="fas fa-fire mr-1.5" style={{ color: "#F43F5E" }} />Active Incidents
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "var(--dash-elevated, #F2F0EC)", color: textColor }}>
                {incidents.length || CRISIS_MARKERS.length}
              </span>
            </div>
            <div className="overflow-y-auto">
              {(incidents.length === 0 ? CRISIS_MARKERS.map((m, i) => ({
                id: `mk-${i}`, title: `${m.type.toUpperCase()} — ${m.label}`,
                severity: m.severity, affected: m.affected, score: m.severity === 'critical' ? 92 : m.severity === 'high' ? 74 : 45,
                coords: { lat: m.lat, lng: m.lng }, needs: ['shelter', 'food'], ward: m.label, timestamp: Date.now(),
              })) : incidents).map((inc: any) => (
                <button key={inc.id} className="w-full flex items-start gap-3 p-3 text-left transition-all hover:opacity-80"
                  style={{ borderBottom: `1px solid ${borderColor}` }}
                  onClick={() => { if (incidents.length > 0) createProposal(inc); }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: SEV_COLOR[inc.severity] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>{inc.title}</p>
                    <p className="text-[10px]" style={{ color: textColor }}>{Math.round(inc.affected)} people · Score: {typeof inc.score === 'number' ? inc.score.toFixed(0) : inc.score}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl flex flex-col"
            style={{
              maxHeight: 220,
              background: "var(--dash-surface, #FFFFFF)",
              border: `1px solid ${borderColor}`,
              boxShadow: "var(--dash-card-shadow)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
              <span className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                <i className="fas fa-users mr-1.5" style={{ color: "#FF6B2B" }} />Volunteer Deployments
              </span>
              <button onClick={() => setDeployModal(true)} className="text-[10px] px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                style={{ border: `1px solid ${borderColor}`, color: textColor }}>
                + Deploy
              </button>
            </div>
            <div className="overflow-y-auto">
              {volunteers.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs" style={{ color: textColor }}>No deployments</div>
              ) : (
                volunteers.map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35' }}>
                      {v.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold" style={{ color: "var(--dash-text-primary)" }}>{v.name}</p>
                      <p className="text-[10px]" style={{ color: textColor }}>{v.ward} · {v.skill}</p>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-lg" style={{ background: "rgba(45,212,191,0.12)", color: "#2DD4BF" }}>Active</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="rounded-2xl flex flex-col flex-1"
            style={{
              maxHeight: 200,
              background: "var(--dash-surface, #FFFFFF)",
              border: `1px solid ${borderColor}`,
              boxShadow: "var(--dash-card-shadow)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
              <span className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                <i className="fas fa-bell mr-1.5" style={{ color: "#FBBF24" }} />System Alerts
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{
                background: alerts.length > 0 ? "rgba(244,63,94,0.1)" : "var(--dash-elevated, #F2F0EC)",
                color: alerts.length > 0 ? "#F43F5E" : textColor,
              }}>{alerts.length}</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {alerts.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs" style={{ color: textColor }}>
                  <i className="fas fa-shield-alt mr-2" />All clear
                </div>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className="flex items-start gap-2.5 p-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: SEV_COLOR[a.level] }} />
                    <p className="text-[11px]" style={{ color: "var(--dash-text-secondary)" }}>{a.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deploy Modal */}
      {deployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDeployModal(false)}
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl p-6 w-[400px]" onClick={e => e.stopPropagation()}
            style={{
              background: "var(--dash-surface, #FFFFFF)",
              border: `1px solid ${borderColor}`,
              boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
            }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--dash-text-primary)" }}>
              <i className="fas fa-users mr-2" style={{ color: "#FF6B2B" }} />Deploy Volunteer
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Volunteer Name", name: "name", placeholder: "e.g., Ramesh Kumar" },
                { label: "Assign to Ward", name: "ward", placeholder: "e.g., Thanjavur W-1" },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: textColor }}>{label}</label>
                  <input
                    value={(deployForm as any)[name]}
                    onChange={e => setDeployForm(p => ({ ...p, [name]: e.target.value }))}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    placeholder={placeholder}
                    style={{
                      background: "var(--dash-elevated, #F2F0EC)",
                      border: `1px solid ${borderColor}`,
                      color: "var(--dash-text-primary)",
                    }}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: textColor }}>Skill / Role</label>
                <select
                  value={deployForm.skill}
                  onChange={e => setDeployForm(p => ({ ...p, skill: e.target.value }))}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--dash-elevated, #F2F0EC)",
                    border: `1px solid ${borderColor}`,
                    color: "var(--dash-text-primary)",
                  }}
                >
                  <option value="flood_rescue">🌊 Flood Rescue</option>
                  <option value="medical_aid">🏥 Medical Aid</option>
                  <option value="food_distribution">🍱 Food Distribution</option>
                  <option value="shelter_setup">🏕️ Shelter Setup</option>
                  <option value="coordination">📡 Coordination</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={handleDeploy}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: "#FF6B2B" }}>
                  <i className="fas fa-paper-plane mr-2" />Deploy Now
                </button>
                <button onClick={() => setDeployModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                  style={{ border: `1px solid ${borderColor}`, color: "var(--dash-text-secondary)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

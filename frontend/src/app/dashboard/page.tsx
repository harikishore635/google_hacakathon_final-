"use client";

import dynamic from "next/dynamic";
import { useSevakStore } from "@/store/sevakStore";
import { useNGOAuth } from "@/context/AuthContext";

// All panels use browser-only APIs (D3, Three.js, canvas, localStorage).
// ssr:false ensures they only run on the client, never during server render.
const DashboardPanel   = dynamic(() => import("@/components/modules/DashboardPanel"),   { ssr: false });
const FieldMindPanel   = dynamic(() => import("@/components/modules/FieldMindPanel"),   { ssr: false });
const FieldMindLogin   = dynamic(() => import("@/components/modules/FieldMindLogin"),   { ssr: false });
const NeedPulsePanel   = dynamic(() => import("@/components/modules/NeedPulsePanel"),   { ssr: false });
const CrisisGridMap    = dynamic(() => import("@/components/modules/CrisisGridMap"),    { ssr: false });
const KarmaDAOPanel    = dynamic(() => import("@/components/modules/KarmaDAOPanel"),    { ssr: false });
const TrustLedgerPanel = dynamic(() => import("@/components/modules/TrustLedgerPanel"), { ssr: false });

export default function DashboardPage() {
  const { currentView } = useSevakStore();
  const { isNGOLoggedIn } = useNGOAuth();

  const fieldMindContent = isNGOLoggedIn ? <FieldMindPanel /> : <FieldMindLogin />;

  return (
    <div className="animate-fade-in-up max-w-[1400px] mx-auto">
      {currentView === "dashboard"  && <DashboardPanel />}
      {currentView === "fieldmind"  && fieldMindContent}
      {currentView === "needpulse"  && <NeedPulsePanel />}
      {currentView === "crisisgrid" && <CrisisGridMap />}
      {currentView === "karmadao"   && <KarmaDAOPanel />}
      {currentView === "ledger"     && <TrustLedgerPanel />}
    </div>
  );
}

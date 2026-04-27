"use client";

import { useSevakStore, CurrentView } from "@/store/sevakStore";
import { useNGOAuth } from "@/context/AuthContext";

import DashboardPanel   from "@/components/modules/DashboardPanel";
import FieldMindPanel   from "@/components/modules/FieldMindPanel";
import FieldMindLogin   from "@/components/modules/FieldMindLogin";
import NeedPulsePanel   from "@/components/modules/NeedPulsePanel";
import CrisisGridMap    from "@/components/modules/CrisisGridMap";
import KarmaDAOPanel    from "@/components/modules/KarmaDAOPanel";
import TrustLedgerPanel from "@/components/modules/TrustLedgerPanel";

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

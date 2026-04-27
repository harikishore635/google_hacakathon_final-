"use client";

import { NGOAuthProvider } from "@/context/AuthContext";
import { useSevakStore } from "@/store/sevakStore";
import { ReactNode, useEffect } from "react";

function FirestoreHydrator() {
  const hydrateFromFirestore = useSevakStore((s) => s.hydrateFromFirestore);
  useEffect(() => { hydrateFromFirestore(); }, [hydrateFromFirestore]);
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <NGOAuthProvider>
      <FirestoreHydrator />
      {children}
    </NGOAuthProvider>
  );
}

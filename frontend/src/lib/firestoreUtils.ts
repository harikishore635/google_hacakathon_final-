import {
  collection, addDoc, getDocs,
  query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { CrisisReport } from "@/store/sevakStore";

export async function saveReportToFirestore(report: CrisisReport): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, "nexseva_reports"), {
      ...report,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Firestore unavailable — silently continue with local state
  }
}

export async function loadReportsFromFirestore(): Promise<CrisisReport[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "nexseva_reports"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as CrisisReport);
  } catch {
    return [];
  }
}

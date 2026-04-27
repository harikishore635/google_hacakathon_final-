import { create } from 'zustand';
import { saveReportToFirestore, loadReportsFromFirestore } from '@/lib/firestoreUtils';

// ── Types ────────────────────────────────────────
export interface AIAnalysis {
  urgency_score: number;
  priority_level: string;
  key_risks: string[];
  recommended_actions: string[];
  ai_reasoning: string;
}

export interface CrisisReport {
  id: string;
  reporter: string;
  ward: string;
  affectedFamilies: number;
  crisisType: string;
  needs: string[];
  notes: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  location: string;
  timestamp: number;
  surgeScore?: number;
  priorityLevel?: string;
  scores?: { urgency: number; population: number; resourceScarcity: number; volunteerGap: number };
  coords?: { lat: number; lng: number };
  processed?: boolean;
  aiAnalysis?: AIAnalysis;
}

export interface Incident {
  id: string;
  title: string;
  ward: string;
  severity: string;
  score: number;
  affected: number;
  needs: string[];
  coords: { lat: number; lng: number };
  timestamp: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  requestedAmount: number;
  raisedAmount: number;
  votes: { for: number; against: number; total: number };
  status: 'active' | 'funded' | 'rejected';
  createdAt: number;
  ward: string;
  severity: string;
  beneficiary: string;
  contributors: { contributor: string; amount: number; timestamp: number }[];
}

export interface SBT {
  id: string;
  tokenId: string;
  name: string;
  skills: string[];
  karmaPoints: number;
  ipfsHash: string;
  ward: string;
  mintedAt: number;
}

export interface TrustBlock {
  id: string;
  hashId: string;
  prevHash: string;
  txType: string;
  actor: string;
  details: string;
  amount: number | null;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface ExternalSignals {
  weather: { level: string; desc: string; delta: number };
  social: { level: string; desc: string; delta: number };
  resource: { level: string; desc: string; delta: number };
  volunteer: { level: string; desc: string; delta: number };
}

export type CurrentView = 'dashboard' | 'fieldmind' | 'needpulse' | 'crisisgrid' | 'karmadao' | 'ledger';

// ── Helpers ──────────────────────────────────────
function genId() { return `sev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function genHash(len = 16) { return Array.from({ length: len }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''); }
export function genCoords() { return { lat: 8.0 + Math.random() * 5.5, lng: 76.9 + Math.random() * 3.2 }; }
function calcAmount(inc: { affectedFamilies?: number; affected?: number; severity?: string; priorityLevel?: string }) {
  const families = inc.affectedFamilies ?? Math.round((inc.affected ?? 100) / 3.5);
  const mult = ({ critical: 2.5, high: 1.8, moderate: 1.2, low: 1.0 } as Record<string, number>)[inc.severity ?? inc.priorityLevel ?? 'low'] ?? 1;
  return Math.round(families * 800 * mult / 100) * 100;
}

// ── NeedPulse Engine ─────────────────────────────
export const NeedPulseEngine = {
  score(report: CrisisReport, signals: ExternalSignals): CrisisReport {
    const U = this.urgency(report);
    const P = this.population(report);
    const R = this.resource(report, signals);
    const V = this.volunteer(signals);
    const base = U * 0.40 + P * 0.30 + R * 0.20 + V * 0.10;
    const dW = (signals.weather.delta ?? 0) * 100;
    const dS = (signals.social.delta ?? 0) * 100;
    const surgeScore = parseFloat(Math.min(100, base + dW + dS).toFixed(1));
    return {
      ...report,
      scores: { urgency: U, population: P, resourceScarcity: R, volunteerGap: V },
      surgeScore,
      priorityLevel: surgeScore >= 75 ? 'critical' : surgeScore >= 55 ? 'high' : surgeScore >= 35 ? 'moderate' : 'low',
    };
  },
  urgency(r: CrisisReport) {
    const s = ({ critical: 95, high: 75, moderate: 50, low: 25 } as Record<string, number>)[r.severity] ?? 50;
    const m = ({ flood: 1.0, cyclone: 1.1, medical: 1.0, fire: 1.05, displacement: 0.85, drought: 0.7, food_shortage: 0.8, infrastructure: 0.75 } as Record<string, number>)[r.crisisType] ?? 0.9;
    return Math.min(100, s * m);
  },
  population(r: CrisisReport) {
    const ind = (parseInt(String(r.affectedFamilies)) || 10) * 3.5;
    return Math.min(100, (Math.log10(Math.max(ind, 1)) / Math.log10(10000)) * 100);
  },
  resource(r: CrisisReport, s: ExternalSignals) {
    const base = ({ high: 80, moderate: 55, low: 30 } as Record<string, number>)[s.resource.level] ?? 50;
    const crit = ['rescue', 'medical', 'evacuation'].some(n => r.needs.includes(n));
    return Math.min(100, base + (crit ? 20 : 0));
  },
  volunteer(s: ExternalSignals) {
    return ({ high: 80, moderate: 55, low: 30 } as Record<string, number>)[s.volunteer.level] ?? 50;
  },
};

// ── Store Interface ───────────────────────────────
interface SevakStore {
  // UI
  currentView: CurrentView;
  systemTime: string;
  setCurrentView: (v: CurrentView) => void;
  setSystemTime: (t: string) => void;

  // FieldMind
  reports: CrisisReport[];
  addReport: (r: Omit<CrisisReport, 'id' | 'timestamp'>) => CrisisReport;
  hydrateFromFirestore: () => Promise<void>;

  // NeedPulse
  priorityQueue: CrisisReport[];
  externalSignals: ExternalSignals;
  analyzing: boolean;
  refreshSignals: () => void;

  // CrisisGrid
  incidents: Incident[];
  volunteers: { id: string; name: string; ward: string; skill: string; status: string; deployedAt: number }[];
  alerts: { id: string; message: string; level: string; timestamp: number }[];
  mapLayer: 'current' | 'forecast' | 'volunteers';
  setMapLayer: (l: 'current' | 'forecast' | 'volunteers') => void;
  deployVolunteer: (name: string, ward: string, skill: string) => void;

  // KarmaDAO
  proposals: Proposal[];
  sbtRegistry: SBT[];
  treasury: { total: number; deployed: number; percentage: number };
  wallet: { connected: boolean; address: string | null; karmaBalance: number };
  connectWallet: () => void;
  vote: (proposalId: string, voteFor: boolean) => void;
  contribute: (proposalId: string, amount: number) => void;
  mintSBT: (name: string, skills: string[], ward: string) => SBT;
  createProposal: (incident: Incident) => Proposal;

  // Trust Ledger
  trustChain: TrustBlock[];
  logTx: (type: string, actor: string, details: string, amount: number | null, data?: Record<string, unknown>) => void;

  // Dashboard
  totalFunded: number;
  totalAffected: number;
  activeVolunteers: number;
  feedItems: { id: string; message: string; type: string; timestamp: number }[];
  generateDemoData: () => void;
}

// ── Store ─────────────────────────────────────────
export const useSevakStore = create<SevakStore>((set, get) => ({
  // UI
  currentView: 'dashboard',
  systemTime: '--:--:--',
  setCurrentView: (v) => set({ currentView: v }),
  setSystemTime: (t) => set({ systemTime: t }),

  // FieldMind
  reports: [],
  hydrateFromFirestore: async () => {
    const saved = await loadReportsFromFirestore();
    if (saved.length === 0) return;
    const { externalSignals } = get();
    const scored = saved.map(r => NeedPulseEngine.score(r, externalSignals));
    const incidents: Incident[] = scored.map(r => ({
      id: r.id, title: `${r.crisisType.replace(/_/g, ' ').toUpperCase()} — ${r.ward}`,
      ward: r.ward, severity: r.priorityLevel ?? 'low', score: r.surgeScore ?? 0,
      affected: r.affectedFamilies * 3.5, needs: r.needs,
      coords: r.coords ?? genCoords(), timestamp: r.timestamp,
    }));
    set(state => ({
      reports: [...scored, ...state.reports],
      priorityQueue: [...scored, ...state.priorityQueue].sort((a, b) => (b.surgeScore ?? 0) - (a.surgeScore ?? 0)),
      incidents: [...incidents, ...state.incidents].sort((a, b) => b.score - a.score),
      totalAffected: Math.round(incidents.reduce((s, i) => s + i.affected, 0)),
    }));
  },
  addReport: (data) => {
    const report: CrisisReport = { ...data, id: genId(), timestamp: Date.now(), processed: false, coords: data.coords ?? genCoords() };

    // Persist to Firestore (non-blocking)
    saveReportToFirestore(report).catch(() => {});

    // Score + Gemini analysis after 800ms
    setTimeout(async () => {
      const { externalSignals } = get();
      const scored = NeedPulseEngine.score(report, externalSignals);

      // Call Gemini AI for real analysis
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/needpulse/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reporter_name: report.reporter, ward: report.ward,
            families_affected: report.affectedFamilies, crisis_type: report.crisisType,
            needs: report.needs, notes: report.notes,
            severity_estimate: report.severity, location: report.location,
          }),
        });
        if (res.ok) scored.aiAnalysis = await res.json();
      } catch { /* backend unavailable — rule-based score used */ }

      const incident: Incident = {
        id: scored.id,
        title: `${scored.crisisType.replace(/_/g, ' ').toUpperCase()} — ${scored.ward}`,
        ward: scored.ward, severity: scored.priorityLevel ?? 'low',
        score: scored.surgeScore ?? 0, affected: scored.affectedFamilies * 3.5,
        needs: scored.needs, coords: scored.coords ?? genCoords(), timestamp: Date.now(),
      };
      set(state => ({
        priorityQueue: [scored, ...state.priorityQueue].sort((a, b) => (b.surgeScore ?? 0) - (a.surgeScore ?? 0)),
        incidents: [incident, ...state.incidents].sort((a, b) => b.score - a.score),
        totalAffected: Math.round([incident, ...state.incidents].reduce((s, i) => s + i.affected, 0)),
        alerts: scored.surgeScore && scored.surgeScore >= 55
          ? [{ id: genId(), message: `🔴 ${incident.title} — Surge: ${incident.score.toFixed(0)}`, level: incident.severity, timestamp: Date.now() }, ...state.alerts].slice(0, 20)
          : state.alerts,
        feedItems: [{ id: genId(), message: `📡 Field report received: ${scored.ward} (${scored.crisisType})`, type: 'fieldmind', timestamp: Date.now() }, ...state.feedItems].slice(0, 50),
      }));
      if (incident.severity === 'critical') {
        setTimeout(() => get().createProposal(incident), 500);
      }
      get().logTx('REPORT_SUBMITTED', data.reporter, `${data.crisisType} — ${data.ward}`, null, { id: report.id, score: scored.surgeScore });
    }, 800);

    set(state => ({ reports: [report, ...state.reports] }));
    get().logTx('FIELD_REPORT', data.reporter, `New ${data.crisisType} in ${data.ward}`, null);
    return report;
  },

  // NeedPulse
  priorityQueue: [],
  analyzing: false,
  externalSignals: {
    weather: { level: 'moderate', desc: 'Cyclone warning issued — Bay of Bengal', delta: 0.15 },
    social: { level: 'low', desc: '234 flood mentions (TN pincodes)', delta: 0.05 },
    resource: { level: 'high', desc: 'Food kits 40% depleted', delta: 0.20 },
    volunteer: { level: 'moderate', desc: '23 of 67 available', delta: 0.10 },
  },
  refreshSignals: () => {
    set({ analyzing: true });
    setTimeout(() => {
      set({ analyzing: false });
    }, 1200);
  },

  // CrisisGrid
  incidents: [],
  volunteers: [],
  alerts: [],
  mapLayer: 'current',
  setMapLayer: (l) => set({ mapLayer: l }),
  deployVolunteer: (name, ward, skill) => {
    const vol = { id: genId(), name, ward, skill, status: 'active', deployedAt: Date.now() };
    set(state => ({
      volunteers: [vol, ...state.volunteers],
      activeVolunteers: state.volunteers.length + 1,
      feedItems: [{ id: genId(), message: `🚀 ${name} deployed to ${ward} (${skill})`, type: 'crisisgrid', timestamp: Date.now() }, ...state.feedItems].slice(0, 50),
    }));
    get().logTx('VOLUNTEER_DEPLOYED', name, `Deployed to ${ward}`, null, { skill });
  },

  // KarmaDAO
  proposals: [],
  sbtRegistry: [],
  treasury: { total: 0, deployed: 0, percentage: 0 },
  wallet: { connected: false, address: null, karmaBalance: 0 },
  connectWallet: () => {
    const addr = `0x${genHash(40)}`;
    set({ wallet: { connected: true, address: `${addr.slice(0, 6)}...${addr.slice(38)}`, karmaBalance: Math.floor(Math.random() * 5000) + 1000 } });
    get().logTx('WALLET_CONNECTED', 'User', 'Polygon wallet connected via SIWE', null);
  },
  createProposal: (incident) => {
    const proposal: Proposal = {
      id: genId(),
      title: `Relief Fund: ${incident.ward}`,
      description: `AI-generated funding proposal for ${incident.ward}. ${Math.round(incident.affected / 3.5)} families require immediate assistance.`,
      requestedAmount: calcAmount(incident),
      raisedAmount: 0,
      votes: { for: 0, against: 0, total: 0 },
      status: 'active',
      createdAt: Date.now(),
      ward: incident.ward,
      severity: incident.severity,
      beneficiary: `NGO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      contributors: [],
    };
    set(state => ({
      proposals: [proposal, ...state.proposals],
      feedItems: [{ id: genId(), message: `🏛️ DAO Proposal created: ${proposal.title} (₹${proposal.requestedAmount.toLocaleString()})`, type: 'karmadao', timestamp: Date.now() }, ...state.feedItems].slice(0, 50),
    }));
    get().logTx('PROPOSAL_CREATED', 'NeedPulse AI', proposal.title, proposal.requestedAmount, { proposalId: proposal.id });
    return proposal;
  },
  vote: (proposalId, voteFor) => {
    set(state => ({
      proposals: state.proposals.map(p => p.id === proposalId
        ? { ...p, votes: { ...p.votes, for: p.votes.for + (voteFor ? 1 : 0), against: p.votes.against + (voteFor ? 0 : 1), total: p.votes.total + 1 } }
        : p
      ),
    }));
    get().logTx('VOTE_CAST', get().wallet.address ?? 'Anon', `Voted ${voteFor ? 'FOR' : 'AGAINST'} proposal ${proposalId}`, null, { proposalId, vote: voteFor });
  },
  contribute: (proposalId, amount) => {
    set(state => {
      const proposals = state.proposals.map(p => {
        if (p.id !== proposalId) return p;
        const raised = p.raisedAmount + amount;
        const status: 'active' | 'funded' | 'rejected' = raised >= p.requestedAmount ? 'funded' : 'active';
        return { ...p, raisedAmount: raised, status, contributors: [...p.contributors, { contributor: state.wallet.address ?? 'Anon', amount, timestamp: Date.now() }] };
      });
      const newTotal = state.treasury.total + amount;
      const deployed = proposals.filter(p => p.status === 'funded').reduce((s, p) => s + p.raisedAmount, 0);
      return {
        proposals,
        treasury: { total: newTotal, deployed, percentage: Math.round(deployed / Math.max(newTotal, 1) * 100) },
        totalFunded: newTotal,
        wallet: { ...state.wallet, karmaBalance: Math.max(0, state.wallet.karmaBalance - amount) },
        feedItems: [{ id: genId(), message: `💰 Karma contributed: ₹${amount.toLocaleString()} to proposal`, type: 'karmadao', timestamp: Date.now() }, ...state.feedItems].slice(0, 50),
      };
    });
    get().logTx('KARMA_CONTRIBUTED', get().wallet.address ?? 'Anon', `Contributed ₹${amount}`, amount, { proposalId });
  },
  mintSBT: (name, skills, ward) => {
    const sbt: SBT = { id: genId(), tokenId: `SBT-${genHash(8).toUpperCase()}`, name, skills, karmaPoints: Math.floor(Math.random() * 500) + 100, ipfsHash: `Qm${genHash(32)}`, ward, mintedAt: Date.now() };
    set(state => ({
      sbtRegistry: [sbt, ...state.sbtRegistry],
      feedItems: [{ id: genId(), message: `🏅 SBT minted for ${name} — ${skills.join(', ')}`, type: 'karmadao', timestamp: Date.now() }, ...state.feedItems].slice(0, 50),
    }));
    get().logTx('SBT_MINTED', name, `Skills: ${skills.join(', ')}`, null, { tokenId: sbt.tokenId, ipfsHash: sbt.ipfsHash });
    return sbt;
  },

  // Trust Ledger
  trustChain: [],
  logTx: (type, actor, details, amount, data) => {
    const prev = get().trustChain[0];
    const block: TrustBlock = { id: genId(), hashId: `0x${genHash(64)}`, prevHash: prev?.hashId ?? '0x' + '0'.repeat(64), txType: type, actor, details, amount, timestamp: Date.now(), data };
    set(state => ({ trustChain: [block, ...state.trustChain].slice(0, 100) }));
  },

  // Dashboard
  totalFunded: 0,
  totalAffected: 0,
  activeVolunteers: 0,
  feedItems: [],

  generateDemoData: () => {
    const store = get();
    const demoReports: Omit<CrisisReport, 'id' | 'timestamp'>[] = [
      { reporter: 'Lakshmi Devi', ward: 'Thanjavur W-1', affectedFamilies: 47, crisisType: 'cyclone', needs: ['shelter', 'food', 'medical'], notes: 'Cyclone has damaged 47 homes near Panchayat office.', severity: 'critical', location: '10.785, 79.131', coords: { lat: 10.785, lng: 79.131 }, processed: false },
      { reporter: 'Ravi Kumar', ward: 'Chennai W-12', affectedFamilies: 85, crisisType: 'flood', needs: ['rescue', 'water', 'food'], notes: 'Heavy rainfall flooding residential areas.', severity: 'high', location: '13.080, 80.270', coords: { lat: 13.080, lng: 80.270 }, processed: false },
      { reporter: 'Meena Selvam', ward: 'Madurai W-5', affectedFamilies: 23, crisisType: 'medical', needs: ['medical', 'food'], notes: 'Viral outbreak in densely populated area.', severity: 'moderate', location: '9.925, 78.119', coords: { lat: 9.925, lng: 78.119 }, processed: false },
      { reporter: 'Anbu Raj', ward: 'Coimbatore W-3', affectedFamilies: 12, crisisType: 'fire', needs: ['shelter', 'clothing'], notes: 'Industrial fire, 12 families displaced.', severity: 'high', location: '11.016, 76.955', coords: { lat: 11.016, lng: 76.955 }, processed: false },
      { reporter: 'Priya Devi', ward: 'Tiruppur W-7', affectedFamilies: 65, crisisType: 'flood', needs: ['food', 'water', 'evacuation'], notes: 'River breach, 65 families marooned.', severity: 'critical', location: '11.108, 77.340', coords: { lat: 11.108, lng: 77.340 }, processed: false },
    ];
    demoReports.forEach((r, i) => setTimeout(() => store.addReport(r), i * 400));

    setTimeout(() => {
      store.deployVolunteer('Ramesh T.', 'Thanjavur W-1', 'Flood Rescue');
      store.deployVolunteer('Anitha S.', 'Chennai W-12', 'Medical Aid');
      store.connectWallet();
      store.mintSBT('Ramesh T.', ['Flood Rescue', 'Coordination'], 'Thanjavur W-1');
    }, 3000);
  },
}));

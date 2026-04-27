"use client";

import { useSevakStore } from "@/store/sevakStore";
import { useState } from "react";

export default function FieldMindPanel() {
  const { addReport, reports, setCurrentView } = useSevakStore();
  const [mode, setMode] = useState<"text"|"voice"|"image">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonResult, setJsonResult] = useState<Record<string,unknown>>({ status:"awaiting_input", message:"Submit a field report to generate structured JSON" });
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [form, setForm] = useState({ reporter:"", ward:"", families:0, crisis_type:"", notes:"", severity:"moderate", location:"" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleNeed = (n: string) =>
    setSelectedNeeds(prev => prev.includes(n) ? prev.filter(x=>x!==n) : [...prev, n]);

  const submitReport = async () => {
    if (!form.reporter || !form.ward || !form.crisis_type) {
      setJsonResult({ status:"error", message:"Please fill Reporter Name, Ward, and Crisis Type." });
      return;
    }
    setIsSubmitting(true);
    setJsonResult({ status:"processing…", message:"Sending to FieldMind Neural Engine & FastAPI →" });
    const payload = { reporter: form.reporter, ward: form.ward, affectedFamilies: Number(form.families)||0, crisisType: form.crisis_type, needs: selectedNeeds, notes: form.notes, severity: form.severity as any, location: form.location };
    
    try {
      const res = await Promise.race([
        fetch("http://localhost:8000/api/fieldmind/text", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ reporter_name:payload.reporter, ward:payload.ward, families_affected:payload.affectedFamilies, crisis_type:payload.crisisType, needs:payload.needs, notes:payload.notes, severity_estimate:payload.severity, location:payload.location })
        }),
        new Promise<never>((_,r)=>setTimeout(()=>r(new Error("timeout")),3000))
      ]);
      const data = await (res as Response).json();
      const report = addReport(payload);
      setJsonResult({ ...data, report_id: report.id, layer_2_scoring: "pending..." });
    } catch {
      const report = addReport(payload);
      setJsonResult({ status:"success", source:"local_store", report_id: report.id, reporter: payload.reporter, ward: payload.ward, affected_families: payload.affectedFamilies, crisis_type: payload.crisisType, needs: payload.needs, original_notes: payload.notes, severity: payload.severity, message:"Submitted locally. NeedPulse scoring in progress…" });
    }
    setIsSubmitting(false);
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setTranscript("");
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = 'ta-IN';
      recognition.interimResults = false;
      recognition.onresult = (e: any) => { setTranscript(e.results[0][0].transcript); setIsRecording(false); };
      recognition.onerror = () => { setTranscript("(Simulated) Cyclone has damaged 47 homes near Panchayat office. Need shelter and food urgently."); setIsRecording(false); };
      recognition.start();
      setTimeout(()=>recognition.stop(), 10000);
    } else {
      setTimeout(() => { setTranscript("(Simulated) Cyclone has damaged 47 homes near Panchayat office. Need shelter and food urgently."); setIsRecording(false); }, 2500);
    }
  };

  const submitVoiceReport = () => {
    if (!transcript) return;
    const report = addReport({ reporter:"Voice Reporter", ward:"Voice Input Ward", affectedFamilies: 0, crisisType:"unknown", needs:[], notes: transcript, severity:"moderate", location:"n/a" });
    setJsonResult({ status:"success", source:"voice", transcript, report_id: report.id, message:"Voice report submitted. NeedPulse scoring in progress…" });
  };

  const needTags = ["food","water","shelter","medical","clothing","evacuation","rescue","counseling"];
  const SEV_COLOR: Record<string,string> = { critical:"#F43F5E", high:"#FF6B35", moderate:"#FBBF24", low:"#2DD4BF" };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between mb-7 gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-heading">
          <i className="fas fa-satellite-dish text-primary mr-2" />FieldMind — Ground Reality Capture
        </h2>
        <div className="flex items-center gap-2.5 text-[13px] text-subtext flex-wrap">
          <span className="pill bg-primary-dim text-primary uppercase text-[10px] font-bold tracking-widest">Layer 1</span>
          <span>Multi-modal field data ingestion</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Input Panel */}
        <div className="bg-white border border-border rounded-card shadow-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
            <span className="text-sm font-semibold text-heading">
              <i className="fas fa-edit text-primary mr-1.5" />New Crisis Report
            </span>
            <div className="flex bg-surface rounded-xl border border-border-light overflow-hidden">
              {([["text","fa-keyboard","Text"],["voice","fa-microphone","Voice"],["image","fa-camera","Image"]] as const).map(([m,icon,label])=>(
                <button key={m} onClick={()=>setMode(m)}
                  className={`px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    mode===m ? 'text-primary bg-primary/8' : 'text-label hover:text-heading hover:bg-surface-hover'
                  }`}>{icon && <i className={`fas ${icon}`} />}{label}</button>
              ))}
            </div>
          </div>

          <div className="p-6 flex-1">
            {/* TEXT MODE */}
            {mode === 'text' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-label uppercase tracking-wider">Reporter Name *</label>
                  <input name="reporter" value={form.reporter} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary transition-colors"
                    placeholder="e.g., Lakshmi Devi (ASHA Worker)" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-label uppercase tracking-wider">Ward / Location *</label>
                    <input name="ward" value={form.ward} onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary transition-colors"
                      placeholder="e.g., Ward 12, Thanjavur" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-label uppercase tracking-wider">Affected Families</label>
                    <input name="families" type="number" value={form.families} onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary transition-colors"
                      placeholder="e.g., 47" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-label uppercase tracking-wider">Crisis Type *</label>
                  <select name="crisis_type" value={form.crisis_type} onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary transition-colors">
                    <option value="">Select crisis type…</option>
                    <option value="flood">🌊 Flood</option>
                    <option value="cyclone">🌀 Cyclone</option>
                    <option value="drought">☀️ Drought</option>
                    <option value="fire">🔥 Fire</option>
                    <option value="medical">🏥 Medical Emergency</option>
                    <option value="displacement">🏚️ Displacement</option>
                    <option value="food_shortage">🍚 Food Shortage</option>
                    <option value="infrastructure">🏗️ Infrastructure Damage</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-label uppercase tracking-wider">Needs</label>
                  <div className="flex flex-wrap gap-2">
                    {needTags.map(n=>(
                      <button key={n} onClick={()=>toggleNeed(n)}
                        className={`px-3 py-1 text-xs font-semibold rounded-pill border transition-all capitalize ${
                          selectedNeeds.includes(n) ? 'text-primary border-primary/30 bg-primary/8' : 'text-label border-border hover:border-primary/30 hover:text-primary'
                        }`}>{n}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-label uppercase tracking-wider">Field Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleInputChange} rows={3}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Describe the situation in your language…" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-label uppercase tracking-wider">Severity</label>
                    <select name="severity" value={form.severity} onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary transition-colors">
                      <option value="low">🟢 Low</option>
                      <option value="moderate">🟡 Moderate</option>
                      <option value="high">🟠 High</option>
                      <option value="critical">🔴 Critical</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-label uppercase tracking-wider">GPS / Landmark</label>
                    <input name="location" value={form.location} onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary transition-colors"
                      placeholder="10.7850, 79.1319" />
                  </div>
                </div>
                <button onClick={submitReport} disabled={isSubmitting}
                  className={`btn-primary w-full justify-center mt-2 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <i className={`fas ${isSubmitting?'fa-spinner fa-spin':'fa-paper-plane'}`} />
                  {isSubmitting ? 'Submitting…' : 'Submit Crisis Report'}
                </button>
              </div>
            )}

            {/* VOICE MODE */}
            {mode === 'voice' && (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="relative">
                  {isRecording && <>
                    <div className="absolute inset-0 rounded-full animate-ping" style={{background:'rgba(255,107,53,0.15)'}} />
                    <div className="absolute inset-[-8px] rounded-full animate-ping" style={{background:'rgba(255,107,53,0.08)', animationDelay: '300ms'}} />
                  </>}
                  <button onClick={isRecording ? ()=>{} : startVoiceRecording}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl text-white transition-all ${isRecording ? 'scale-110' : 'hover:scale-110'}`}
                    style={{background: isRecording ? '#F43F5E' : '#FF6B35', boxShadow: `0 0 ${isRecording?'40px rgba(244,63,94,0.4)':'24px rgba(255,107,53,0.3)'}`}}>
                    <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`} />
                  </button>
                </div>
                <p className="text-subtext text-sm text-center">
                  {isRecording ? <span className="text-danger animate-pulse font-semibold">Recording… speak now</span> : "Tap to start recording in your language"}
                  <br/><span className="text-xs text-label">Supports: Tamil, Hindi, Telugu, Kannada, Bengali</span>
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {["Tamil","Hindi","Telugu","Kannada","Bengali","Marathi"].map(l=>(
                    <span key={l} className="text-xs px-3 py-1 rounded-pill border border-border text-label hover:border-primary/30 hover:text-primary cursor-pointer transition-all">{l}</span>
                  ))}
                </div>
                {transcript && (
                  <div className="w-full bg-surface border border-border-light rounded-card p-4">
                    <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2"><i className="fas fa-language" /> Transcript (Sarvam AI STT)</div>
                    <p className="text-sm text-heading">{transcript}</p>
                    <div className="flex gap-3 mt-3">
                      <button onClick={submitVoiceReport} className="btn-primary text-sm py-2 px-4"><i className="fas fa-check" /> Submit Report</button>
                      <button onClick={()=>setTranscript("")} className="btn-ghost text-sm py-2 px-4"><i className="fas fa-redo" /> Re-record</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* IMAGE MODE */}
            {mode === 'image' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <label className="w-full border-2 border-dashed border-border hover:border-primary/30 rounded-card p-12 text-center transition-all cursor-pointer group">
                  <input type="file" accept="image/*,application/pdf,.csv" className="hidden" onChange={(e)=>{if(e.target.files?.[0]) setJsonResult({status:"processing…",message:"Claude Vision AI analyzing image…",note:"Simulated — Connect Claude API key to enable real vision extraction."});}} />
                  <i className="fas fa-cloud-upload-alt text-4xl text-muted mb-3 group-hover:text-primary transition-all block" />
                  <p className="text-subtext text-sm">Drop an image or click to upload</p>
                  <small className="text-label text-xs mt-1 block">Claude AI will extract crisis data automatically</small>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: JSON + Recent Reports */}
        <div className="flex flex-col gap-6">
          {/* JSON Panel */}
          <div className="bg-white border border-border rounded-card shadow-card overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
              <span className="text-sm font-semibold text-heading"><i className="fas fa-code text-primary mr-1.5" />Structured JSON</span>
              <div className="flex gap-2">
                <button onClick={()=>{navigator.clipboard.writeText(JSON.stringify(jsonResult,null,2))}}
                  className="text-[11px] px-2.5 py-1 bg-surface border border-border text-label rounded-lg hover:border-primary/30 hover:text-primary transition-all">
                  <i className="fas fa-copy" /> Copy
                </button>
                {jsonResult.status === 'success' && (
                  <button onClick={()=>setCurrentView('needpulse')}
                    className="text-[11px] px-2.5 py-1 border rounded-lg font-semibold transition-all hover:-translate-y-0.5"
                    style={{background:'rgba(45,212,191,0.1)',borderColor:'#2DD4BF',color:'#2DD4BF'}}>
                    <i className="fas fa-forward" /> Push to NeedPulse
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 bg-heading font-mono text-[12px] overflow-auto flex-1 rounded-b-card">
              <pre style={{color:'#FF8F63'}}>{JSON.stringify(jsonResult, null, 2)}</pre>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white border border-border rounded-card shadow-card overflow-hidden flex flex-col flex-1">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
              <span className="text-sm font-semibold text-heading"><i className="fas fa-list text-primary mr-1.5" />Recent Field Reports</span>
              <span className="text-[11px] font-bold text-label bg-surface px-2.5 py-0.5 rounded-lg">{reports.length} reports</span>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-border-light">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-label text-sm text-center">
                  <i className="fas fa-clipboard-list text-3xl mb-2 text-muted" />
                  <p>No reports submitted yet</p>
                </div>
              ) : reports.map(r=>(
                <div key={r.id} className="flex items-start gap-3 p-3.5 hover:bg-surface transition-all">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{background: SEV_COLOR[r.severity] || '#9CA3AF'}} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-semibold text-heading truncate">{r.crisisType.replace(/_/g,' ').toUpperCase()} — {r.ward}</p>
                      <span className="text-[10px] text-label whitespace-nowrap">{new Date(r.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-subtext">{r.reporter} · {r.affectedFamilies} families</p>
                    {r.surgeScore && <span className="text-[10px] text-primary">Surge Score: {r.surgeScore}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSevakStore } from "@/store/sevakStore";
import { useState } from "react";

export default function KarmaDAOPanel() {
  // Light theme severity colors
  const SEV = { critical:'#F43F5E', high:'#FF6B35', moderate:'#FBBF24', low:'#2DD4BF' };
  const { proposals, sbtRegistry, treasury, wallet, connectWallet, vote, contribute, mintSBT } = useSevakStore();
  const [activeTab, setActiveTab] = useState<"proposals"|"registry"|"contribute">("proposals");
  const [amounts] = useState([500, 1000, 2500, 5000]);
  const [sbtForm, setSbtForm] = useState({name:"",ward:"",skills:""});
  const [newProposalModal, setNewProposalModal] = useState(false);
  const [npForm, setNpForm] = useState({title:"",ward:"",amount:10000,desc:""});

  const totalKarma = sbtRegistry.reduce((s,r)=>s+r.karmaPoints,0);

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-wrap items-start justify-between mb-7 gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-heading"><i className="fas fa-coins text-primary mr-2"></i>KarmaDAO — Community Governance &amp; Funding</h2>
        <div className="flex items-center gap-2.5 text-[13px] text-subtext flex-wrap">
          <span className="pill bg-primary-dim text-primary uppercase text-[10px] font-bold tracking-widest">Layer 4</span>
          <span>Smart contract treasury · Gas-free voting · SBT credentials</span>
        </div>
      </div>

      {/* Treasury Overview */}
      <div className="bg-white border border-border rounded-card shadow-card p-6 mb-6 flex items-center gap-10 flex-wrap">
        <div className="flex items-center gap-5 pr-10 border-r border-border">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{background:'rgba(255,107,53,0.1)',color:'#FF6B35'}}>
            <i className="fas fa-university"></i>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-3xl font-extrabold font-mono text-primary">₹{treasury.total.toLocaleString()}</span>
            <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Ward Treasury Total</span>
            <div className="w-48 h-2 rounded bg-surface border border-border-light overflow-hidden">
              <div className="h-full rounded transition-all duration-500" style={{width:`${treasury.percentage}%`,background:'linear-gradient(90deg,#FF6B35,#F43F5E)'}}></div>
            </div>
            <span className="text-[10px] text-label">{treasury.percentage}% deployed</span>
          </div>
        </div>
        <div className="flex flex-1 gap-12 justify-around">
          {[{val:proposals.filter(p=>p.status==='active').length,label:"Active Proposals",color:'#FF6B35'},{val:proposals.filter(p=>p.status==='funded').length,label:"Funded This Month",color:'#2DD4BF'},{val:totalKarma,label:"Total KarmaPoints",color:'#FBBF24'},{val:sbtRegistry.length,label:"SBTs Minted",color:'#6366F1'}].map(({val,label,color})=>(
            <div key={label} className="flex flex-col items-center">
              <span className="text-2xl font-extrabold font-mono" style={{color}}>{val}</span>
              <span className="text-[11px] text-label mt-1 uppercase tracking-wider text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet */}
      <div className="mb-5">
        {wallet.connected ? (
          <div className="bg-white border border-border rounded-card shadow-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{background:'rgba(99,102,241,0.1)',color:'#6366F1'}}>
              <i className="fas fa-wallet"></i>
            </div>
            <div className="flex-1">
              <span className="block font-mono text-sm text-heading">{wallet.address}</span>
              <span className="text-xs text-label">Karma Balance: <strong className="text-primary">{wallet.karmaBalance.toLocaleString()}</strong> KP · Polygon Mainnet</span>
            </div>
            <span className="pill bg-success-dim text-success font-semibold">✔ Connected</span>
          </div>
        ) : (
          <button onClick={connectWallet} className="w-full p-4 bg-white border border-dashed border-border rounded-card shadow-card flex items-center justify-center gap-3 hover:border-primary/30 transition-all group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-all" style={{background:'rgba(99,102,241,0.1)',color:'#6366F1'}}>
              <i className="fas fa-wallet"></i>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-subtext group-hover:text-heading transition-colors">Connect Polygon Wallet (SIWE)</p>
              <p className="text-xs text-label">Sign-In With Ethereum via MetaMask / WalletConnect</p>
            </div>
            <i className="fas fa-chevron-right text-label ml-auto group-hover:text-primary transition-colors"></i>
          </button>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr] gap-6 min-h-[500px]">
        {/* Proposals */}
        <div className="bg-white border border-border rounded-card shadow-card flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <span className="text-sm font-semibold text-heading"><i className="fas fa-vote-yea text-primary mr-1.5"></i>Active Proposals</span>
            <button onClick={()=>setNewProposalModal(true)} className="btn-primary text-xs py-1.5 px-3">
              <i className="fas fa-plus"></i> New Proposal
            </button>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-border-light">
            {proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-label text-center">
                <i className="fas fa-vote-yea text-3xl mb-3 text-muted"></i>
                <p className="text-sm">No proposals yet<br/><span className="text-xs text-label">Select a crisis from NeedPulse to auto-generate</span></p>
              </div>
            ) : proposals.map(p=>{
              const pct = Math.min(100, (p.raisedAmount/p.requestedAmount)*100);
              const totalVotes = p.votes.for + p.votes.against;
              return (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-bold text-heading">{p.title}</p>
                      <p className="text-[10px] text-label">{p.ward} · {p.severity}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase flex-shrink-0" style={{background:p.status==='funded'?'rgba(45,212,191,0.1)':'rgba(255,107,53,0.08)',color:p.status==='funded'?'#2DD4BF':'#FF6B35'}}>{p.status}</span>
                  </div>
                  <p className="text-[11px] text-label mb-2 line-clamp-2">{p.description}</p>
                  {/* Funding Progress */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-label mb-1">
                      <span>₹{p.raisedAmount.toLocaleString()} raised</span>
                      <span>₹{p.requestedAmount.toLocaleString()} goal</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:'linear-gradient(90deg,#FF6B35,#2DD4BF)'}}></div>
                    </div>
                  </div>
                  {/* Vote Buttons */}
                  {p.status === 'active' && wallet.connected && (
                    <div className="flex gap-2">
                      <button onClick={()=>vote(p.id, true)} className="flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all hover:opacity-80" style={{background:'rgba(45,212,191,0.08)',borderColor:'#2DD4BF',color:'#2DD4BF'}}>
                        ✓ For ({p.votes.for})
                      </button>
                      <button onClick={()=>vote(p.id, false)} className="flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all hover:opacity-80" style={{background:'rgba(244,63,94,0.08)',borderColor:'#F43F5E',color:'#F43F5E'}}>
                        ✗ Against ({p.votes.against})
                      </button>
                    </div>
                  )}
                  {/* Contribute */}
                  {p.status === 'active' && wallet.connected && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {[500,1000,2500].map(amt=>(
                        <button key={amt} onClick={()=>contribute(p.id, amt)} className="text-[10px] px-2 py-0.5 rounded-lg border border-border text-label hover:border-primary/30 hover:text-primary transition-all">+₹{amt}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SBT Registry */}
        <div className="bg-white border border-border rounded-card shadow-card flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <span className="text-sm font-semibold text-heading"><i className="fas fa-id-badge text-primary mr-1.5"></i>Volunteer SBT Registry</span>
          </div>
          <div className="p-4 border-b border-border-light flex flex-col gap-2">
            <input placeholder="Volunteer Name" value={sbtForm.name} onChange={e=>setSbtForm(p=>({...p,name:e.target.value}))} className="w-full px-3 py-1.5 bg-surface border border-border rounded-input text-xs text-heading outline-none focus:border-primary" />
            <input placeholder="Ward" value={sbtForm.ward} onChange={e=>setSbtForm(p=>({...p,ward:e.target.value}))} className="w-full px-3 py-1.5 bg-surface border border-border rounded-input text-xs text-heading outline-none focus:border-primary" />
            <input placeholder="Skills (comma-separated)" value={sbtForm.skills} onChange={e=>setSbtForm(p=>({...p,skills:e.target.value}))} className="w-full px-3 py-1.5 bg-surface border border-border rounded-input text-xs text-heading outline-none focus:border-primary" />
            <button onClick={()=>{if(sbtForm.name&&sbtForm.ward){mintSBT(sbtForm.name,sbtForm.skills.split(',').filter(Boolean),sbtForm.ward);setSbtForm({name:"",ward:"",skills:""})}}} className="w-full py-1.5 text-xs font-bold rounded-lg border transition-all hover:opacity-90" style={{background:'rgba(99,102,241,0.1)',borderColor:'rgba(99,102,241,0.3)',color:'#6366F1'}}>
              <i className="fas fa-certificate mr-1"></i>Mint SBT on Polygon
            </button>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-border-light">
            {sbtRegistry.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-label text-center">
                <i className="fas fa-certificate text-2xl mb-2 text-muted"></i>
                <p className="text-xs">No SBTs minted</p>
              </div>
            ) : sbtRegistry.map(sbt=>(
              <div key={sbt.id} className="p-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{background:'rgba(99,102,241,0.1)',color:'#6366F1'}}>{sbt.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-heading">{sbt.name}</p>
                  <p className="text-[10px] text-label truncate">{sbt.tokenId} · {sbt.ward}</p>
                  <p className="text-[10px] text-subtext mt-0.5">{sbt.skills.join(', ')}</p>
                  <p className="text-[10px] font-mono text-label mt-0.5 truncate">IPFS: {sbt.ipfsHash.slice(0,16)}…</p>
                  <span className="text-[10px] text-primary font-semibold">{sbt.karmaPoints} KP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contribute Panel */}
        <div className="bg-white border border-border rounded-card shadow-card flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <span className="text-sm font-semibold text-heading"><i className="fas fa-hand-holding-heart text-success mr-1.5"></i>Contribute Karma</span>
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1">
            {!wallet.connected ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <i className="fas fa-lock text-4xl text-muted"></i>
                <p className="text-sm text-subtext">Connect your wallet to contribute karma points</p>
                <button onClick={connectWallet} className="btn-primary"><i className="fas fa-wallet mr-2"></i>Connect Wallet</button>
              </div>
            ) : (
              <>
                <div className="text-center p-4 rounded-card border border-border-light" style={{background:'rgba(255,107,53,0.03)'}}>
                  <p className="text-xs text-label mb-1 uppercase tracking-wider">Available Balance</p>
                  <p className="text-3xl font-extrabold text-primary font-mono">{wallet.karmaBalance.toLocaleString()}</p>
                  <p className="text-xs text-label">KarmaPoints</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-label mb-2 uppercase tracking-wider">Quick Contribute</p>
                  <div className="grid grid-cols-2 gap-2">
                    {amounts.map(amt=>{
                      const target = proposals.find(p=>p.status==='active');
                      return (
                        <button key={amt} onClick={()=>target && contribute(target.id, amt)} disabled={!target || wallet.karmaBalance < amt} className="py-2.5 text-sm font-bold border rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80" style={{background:'rgba(255,107,53,0.08)',borderColor:'rgba(255,107,53,0.2)',color:'#FF6B35'}}>
                          ₹{amt.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                  {!proposals.some(p=>p.status==='active') && <p className="text-[10px] text-label mt-2 text-center">No active proposals. Create one via NeedPulse.</p>}
                </div>

                {/* Trust Ledger mini */}
                <div className="flex-1 rounded-card border border-border-light overflow-hidden bg-surface">
                  <div className="px-3 py-2 border-b border-border-light text-[11px] font-semibold text-label flex items-center gap-1.5">
                    <i className="fas fa-link text-primary"></i> Trust Ledger (KarmaDAO)
                  </div>
                  <div className="text-[10px] font-mono text-subtext p-2 space-y-1 overflow-y-auto" style={{maxHeight:120}}>
                    {proposals.slice(0,5).map(p=>(
                      <div key={p.id} className="text-label">● {p.title} — ₹{p.requestedAmount.toLocaleString()}</div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Proposal Modal */}
      {newProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={()=>setNewProposalModal(false)}>
          <div className="bg-white border border-border rounded-card shadow-card-hover p-6 w-[420px]" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-bold text-heading mb-4"><i className="fas fa-vote-yea text-primary mr-2"></i>Create DAO Proposal</h3>
            <div className="flex flex-col gap-3">
              <input placeholder="Proposal Title" value={npForm.title} onChange={e=>setNpForm(p=>({...p,title:e.target.value}))} className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary" />
              <input placeholder="Target Ward" value={npForm.ward} onChange={e=>setNpForm(p=>({...p,ward:e.target.value}))} className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary" />
              <input type="number" placeholder="Amount Requested (₹)" value={npForm.amount} onChange={e=>setNpForm(p=>({...p,amount:Number(e.target.value)}))} className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary" />
              <textarea placeholder="Description" value={npForm.desc} onChange={e=>setNpForm(p=>({...p,desc:e.target.value}))} rows={3} className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-input text-sm text-heading outline-none focus:border-primary resize-none" />
              <div className="flex gap-3">
                <button onClick={()=>{
                  if(npForm.title&&npForm.ward){
                    // Use createProposal via incidents stub
                    const {createProposal} = useSevakStore.getState();
                    createProposal({id:`manual-${Date.now()}`,title:npForm.title,ward:npForm.ward,severity:'moderate',score:50,affected:0,needs:[],coords:{lat:0,lng:0},timestamp:Date.now()});
                    setNewProposalModal(false); setNpForm({title:"",ward:"",amount:10000,desc:""});
                  }
                }} className="btn-primary flex-1 justify-center">Submit Proposal</button>
                <button onClick={()=>setNewProposalModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

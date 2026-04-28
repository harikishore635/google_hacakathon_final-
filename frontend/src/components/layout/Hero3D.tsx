"use client";

// FIX: Import React for React.Fragment (bare <> can't accept key prop)
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Image from "next/image";
import { useSevakStore } from "@/store/sevakStore";

export default function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCurrentView, reports, totalFunded, activeVolunteers, generateDemoData, feedItems } = useSevakStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    generateDemoData();
    setTimeout(() => setIsGenerating(false), 3500);
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const mouse = { x: 0, y: 0 };
    const targetRot = { x: 0, y: 0 };
    const rot = { x: 0, y: 0 };
    const nodes: THREE.Mesh[] = [];
    let animFrame: number;
    let active = true;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 18);

    scene.add(new THREE.AmbientLight(0x111122, 2));
    const pl1 = new THREE.PointLight(0x00d4ff, 3, 60); pl1.position.set(8, 8, 8); scene.add(pl1);
    const pl2 = new THREE.PointLight(0xbf00ff, 2, 60); pl2.position.set(-8, -6, 4); scene.add(pl2);

    // Central orb
    const orbMat = new THREE.MeshPhongMaterial({ color: 0x00d4ff, emissive: 0x003344, shininess: 120, transparent: true, opacity: 0.85 });
    const centralOrb = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), orbMat);
    scene.add(centralOrb);
    const wireOrb = new THREE.Mesh(new THREE.SphereGeometry(1.25, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.15 }));
    scene.add(wireOrb);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.04, 8, 64), new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 }));
    ring1.rotation.x = Math.PI / 2; scene.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color: 0xbf00ff, transparent: true, opacity: 0.3 }));
    ring2.rotation.set(Math.PI / 6, 0, Math.PI / 4); scene.add(ring2);

    // Nodes
    [[-5,3,-2,0x00d4ff,0.35],[4,3.5,-1,0xffa502,0.32],[5.5,-2,0,0xff4757,0.38],[-4.5,-3.5,-1,0xbf00ff,0.35],[-2,5,2,0x2ed573,0.22],[3,-5,1,0x2ed573,0.2]].forEach(([x,y,z,c,s]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(s as number, 16, 16), new THREE.MeshPhongMaterial({ color: c as number, emissive: c as number, emissiveIntensity: 0.4, shininess: 80, transparent: true, opacity: 0.9 }));
      m.position.set(x as number, y as number, z as number);
      m.userData = { op: [x, y, z], phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.4 };
      scene.add(m); nodes.push(m);
    });

    // Particles
    const pp = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) { pp[i*3]=(Math.random()-.5)*40; pp[i*3+1]=(Math.random()-.5)*40; pp[i*3+2]=(Math.random()-.5)*40; }
    const partGeo = new THREE.BufferGeometry(); partGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const particles = new THREE.Points(partGeo, new THREE.PointsMaterial({ color: 0x00d4ff, size: 0.08, transparent: true, opacity: 0.4 }));
    scene.add(particles);

    const onMouseMove = (e: MouseEvent) => { mouse.x = (e.clientX/window.innerWidth)*2-1; mouse.y = -(e.clientY/window.innerHeight)*2+1; };
    const onResize = () => { if (!containerRef.current) return; const w=containerRef.current.clientWidth,h=containerRef.current.clientHeight; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    const animate = () => {
      if (!active) return;
      animFrame = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      targetRot.x = mouse.y * 0.4; targetRot.y = mouse.x * 0.6;
      rot.x += (targetRot.x - rot.x) * 0.05; rot.y += (targetRot.y - rot.y) * 0.05;
      scene.rotation.set(rot.x, rot.y + t * 0.05, 0);
      const pulse = 1 + Math.sin(t * 1.5) * 0.06;
      centralOrb.scale.setScalar(pulse); (orbMat as THREE.MeshPhongMaterial).emissiveIntensity = 0.3 + Math.sin(t*2)*0.2;
      wireOrb.scale.setScalar(pulse * 1.02); ring1.rotation.y = t * 0.4; ring2.rotation.z = t * 0.3;
      nodes.forEach((n, i) => {
        const u = n.userData;
        n.position.set(u.op[0]+Math.cos(t*u.speed*.7+u.phase)*.1, u.op[1]+Math.sin(t*u.speed+u.phase)*.15, u.op[2]);
        if (i < 4) (n.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.3 + Math.sin(t*2+i*1.5)*0.2;
      });
      particles.rotation.y = t * 0.02; particles.rotation.x = t * 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => { active = false; cancelAnimationFrame(animFrame); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('resize', onResize); renderer.dispose(); };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16" style={{background:'radial-gradient(ellipse at center top, rgba(0,212,255,0.05) 0%, transparent 60%), #0d1117'}} ref={containerRef}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
      <div className="absolute inset-0 z-10 pointer-events-none" style={{background:'radial-gradient(ellipse at center, transparent 30%, rgba(13,17,23,0.6) 100%)'}} />

      <div className="relative z-20 text-center px-6 max-w-[900px] mx-auto">
        {/* NexSeva Logo */}
        <div className="flex justify-center mb-6">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, rgba(191,0,255,0.06) 100%)',
              border: '1.5px solid rgba(0,212,255,0.25)',
              boxShadow: '0 0 40px rgba(0,212,255,0.18), 0 0 80px rgba(191,0,255,0.10)',
            }}
          >
            <Image src="/images/nexseva-logo.png" alt="NexSeva" width={100} height={100} className="object-contain rounded-full" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest text-accent bg-accent-dim border border-border-accent px-4 py-1.5 rounded-full mb-7 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block"></span>
          LIVE SYSTEM ACTIVE — CortexX Global Hackathon 2026
        </div>

        {/* Main Hero Heading */}
        <h1
          className="text-[clamp(38px,6.5vw,76px)] font-black leading-[1.08] tracking-[-2.5px] mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #7b61ff 50%, #bf00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 28px rgba(0,212,255,0.55)) drop-shadow(0 0 60px rgba(191,0,255,0.30))',
              display: 'inline-block',
            }}
          >
            NexSeva
          </span>
          <span className="text-text-primary">: Intelligence</span>
          <br />
          <span className="text-text-primary">Meets </span>
          <span style={{
            background: 'linear-gradient(135deg, #ff6b9d 0%, #ffa502 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Compassion</span>
          <span className="text-text-primary">.</span>
        </h1>

        {/* Tagline */}
        <p
          className="text-[clamp(15px,1.8vw,19px)] text-text-secondary mb-3 leading-[1.75] italic"
          style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 400 }}
        >
          &ldquo;Where every voice is heard and every hand is helped in seconds.&rdquo;
        </p>

        <p className="text-[clamp(13px,1.4vw,15px)] text-text-muted mb-10 leading-[1.6]">
          NexSeva connects four intelligence layers into one unified platform —<br/>
          from voice reports in Tamil to on-chain funding in milliseconds.
        </p>

        <div className="flex items-center justify-center bg-[rgba(22,27,34,0.8)] border border-border rounded-2xl p-5 mb-8 backdrop-blur-[10px]">
          {/* FIX: Use React.Fragment with key instead of bare <> which can't accept key */}
          {[{val: reports.length, label:"Crisis Reports"},{val:`₹${totalFunded.toLocaleString()}`,label:"Funded"},{val:activeVolunteers,label:"Volunteers"},{val:Array.from(new Set(reports.map(r=>r.ward))).length,label:"Wards Active"}].map(({val,label},i,arr)=>(
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1 px-8">
                <span className="text-2xl font-extrabold text-accent font-mono transition-all">{val}</span>
                <span className="text-[11px] text-text-muted uppercase tracking-wider">{label}</span>
              </div>
              {i < arr.length-1 && <div className="w-px h-10 bg-border"></div>}
            </React.Fragment>
          ))}
        </div>

        <div className="flex gap-3 justify-center mb-12">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-6 py-3 bg-accent text-bg-primary font-bold rounded-lg transition-all ${isGenerating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#33ddff] hover:-translate-y-[1px]'}`}
            style={{boxShadow: isGenerating ? 'none' : '0 0 24px rgba(0,212,255,0.4)'}}>
            <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-bolt'}`}></i>
            {isGenerating ? 'Generating...' : 'Generate Live Demo Data'}
          </button>
          <button onClick={() => setCurrentView('fieldmind')} className="flex items-center gap-2 px-6 py-3 bg-transparent border border-border text-text-primary font-semibold rounded-lg hover:bg-accent-dim hover:border-border-accent hover:text-accent transition-all">
            <i className="fas fa-play"></i> Start Field Report
          </button>
        </div>

        {/* Pipeline Visual */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[{id:'fieldmind',icon:'fa-satellite-dish',label:'FieldMind',status:'Listening'},{id:'needpulse',icon:'fa-brain',label:'NeedPulse',status:'Analyzing'},{id:'crisisgrid',icon:'fa-map-marked-alt',label:'CrisisGrid',status:'Mapping'},{id:'karmadao',icon:'fa-coins',label:'KarmaDAO',status:'Funding'}].map((node,i,arr)=>(
            <div key={node.id} className="flex items-center">
              <button onClick={()=>setCurrentView(node.id as any)} className="flex flex-col items-center gap-1.5 py-3.5 px-5 bg-[rgba(22,27,34,0.8)] border border-border hover:border-border-accent hover:bg-accent-dim hover:text-accent hover:-translate-y-0.5 hover:shadow-accent rounded-lg transition-all min-w-[110px]">
                <i className={`fas ${node.icon} text-xl text-text-secondary`}></i>
                <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary">{node.label}</span>
                <span className="text-[10px] bg-status-stable-dim text-status-stable px-2 py-0.5 rounded-full">{node.status}</span>
              </button>
              {i < arr.length-1 && <span className="text-text-muted mx-2 text-xs"><i className="fas fa-chevron-right"></i></span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useNGOAuth } from "@/context/AuthContext";

export default function FieldMindLogin() {
  const { login, loginError, isLoggingIn } = useNGOAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [shake, setShake]       = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await login(email, password);
    if (!ok) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div
      className="fieldmind-login-wrapper min-h-[80vh] flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--login-bg)" }}
    >
      {/* Decorative orbs — theme-aware */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, var(--login-orb-a) 0%, transparent 70%)` }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, var(--login-orb-b) 0%, transparent 70%)` }} />

      {/* Card */}
      <div
        className={`fieldmind-login-card relative w-full max-w-md mx-4 p-8 transition-all duration-300 ${shake ? "animate-shake" : ""}`}
        style={{
          border: "1px solid var(--login-card-border)",
        }}>

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="fieldmind-login-icon w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ border: "1px solid var(--login-icon-border)" }}
          >
            <i className="fas fa-satellite-dish text-2xl text-primary" />
          </div>
          <h1 className="fieldmind-login-heading text-2xl font-extrabold tracking-tight mb-1">
            FieldMind Portal
          </h1>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary">
            NGO Secure Gateway · NexSeva
          </p>
          <p className="fieldmind-login-subtext text-xs mt-2 text-center">
            Authorized NGO personnel only. All access is logged and monitored.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px mb-7" style={{ background: "var(--login-divider)" }} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="fieldmind-login-label text-xs font-semibold uppercase tracking-wider">
              NGO Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-primary">
                <i className="fas fa-envelope" />
              </span>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ngo@organisation.org"
                required
                className="fieldmind-login-input w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="fieldmind-login-label text-xs font-semibold uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-primary">
                <i className="fas fa-lock" />
              </span>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="fieldmind-login-input w-full pl-10 pr-12 py-3 rounded-xl text-sm outline-none"
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs transition-all"
                style={{ color: showPass ? "#FF6B35" : "var(--login-input-placeholder)" }}>
                <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          {/* Error */}
          {loginError && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in-up"
              style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#F43F5E" }}>
              <i className="fas fa-shield-alt" />
              {loginError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoggingIn || !email || !password}
            className="relative w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 mt-2 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            style={{
              background: isLoggingIn ? "rgba(255,107,53,0.2)" : "#FF6B35",
              color: isLoggingIn ? "#FF6B35" : "#FFFFFF",
              boxShadow: isLoggingIn ? "none" : "0 4px 20px rgba(255,107,53,0.3)",
            }}>
            {isLoggingIn ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-circle-notch animate-spin" />
                Authenticating…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-sign-in-alt" />
                Access FieldMind Portal
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="fieldmind-login-footer mt-6 pt-5 border-t flex items-center gap-2 justify-center">
          <i className="fas fa-shield-alt text-xs text-success" />
          <span className="fieldmind-login-footer-text text-[11px]">
            End-to-end encrypted · Polygon verified session
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-8px); }
          30%      { transform: translateX(8px); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
          75%      { transform: translateX(-4px); }
          90%      { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.55s ease-in-out; }
      `}
      </style>
    </div>
  );
}

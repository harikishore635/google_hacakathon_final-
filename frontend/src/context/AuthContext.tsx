"use client";

import React, {
  createContext, useContext, useState,
  useCallback, useEffect, ReactNode,
} from "react";
import {
  signInWithEmailAndPassword, signOut,
  onAuthStateChanged, type User,
} from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";

interface NGOAuthState {
  isNGOLoggedIn: boolean;
  ngoEmail: string | null;
  loginError: string | null;
  isLoggingIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const NGOAuthContext = createContext<NGOAuthState | null>(null);

function mapFirebaseError(msg: string): string {
  if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found"))
    return "Invalid credentials. Access denied.";
  if (msg.includes("too-many-requests"))
    return "Too many attempts. Try again later.";
  if (msg.includes("invalid-email"))
    return "Invalid email format.";
  return "Authentication failed. Please try again.";
}

export function NGOAuthProvider({ children }: { children: ReactNode }) {
  const [isNGOLoggedIn, setIsNGOLoggedIn] = useState(false);
  const [ngoEmail,      setNgoEmail]      = useState<string | null>(null);
  const [loginError,    setLoginError]    = useState<string | null>(null);
  const [isLoggingIn,   setIsLoggingIn]   = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setIsNGOLoggedIn(!!user);
      setNgoEmail(user?.email ?? null);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoggingIn(true);
    setLoginError(null);

    // Fallback to demo credentials if Firebase not yet configured
    if (!firebaseReady || !auth) {
      await new Promise((r) => setTimeout(r, 900));
      const ok = email.trim().toLowerCase() === "demo@nexseva.org" && password === "nexseva2025";
      if (!ok) setLoginError("Invalid credentials. Access denied.");
      setIsNGOLoggedIn(ok);
      setNgoEmail(ok ? email : null);
      setIsLoggingIn(false);
      return ok;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setIsLoggingIn(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setLoginError(mapFirebaseError(msg));
      setIsLoggingIn(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
    setIsNGOLoggedIn(false);
    setNgoEmail(null);
    setLoginError(null);
  }, []);

  return (
    <NGOAuthContext.Provider value={{ isNGOLoggedIn, ngoEmail, loginError, isLoggingIn, login, logout }}>
      {children}
    </NGOAuthContext.Provider>
  );
}

export function useNGOAuth(): NGOAuthState {
  const ctx = useContext(NGOAuthContext);
  if (!ctx) throw new Error("useNGOAuth must be used inside NGOAuthProvider");
  return ctx;
}

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════
   LIQUID METAL MORPHING PRELOADER
   Chrome sphere → letter morph, 5-phase orchestrated animation
   Total runtime: ~4200ms
   ═══════════════════════════════════════════════════════ */

const LETTERS = ["N", "E", "X", "S", "E", "V", "A"];
const SPHERE_SIZES = [64, 52, 72, 58, 72, 68, 60];

export default function Home() {
  const router = useRouter();
  const preloaderRef = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  const runPreloader = useCallback(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const preloader = preloaderRef.current;
    if (!preloader) return;

    const units = preloader.querySelectorAll<HTMLElement>(".letter-unit");
    const spheres = preloader.querySelectorAll<HTMLElement>(".preloader-sphere");
    const shadows = preloader.querySelectorAll<HTMLElement>(".preloader-sphere-shadow");
    const letters = preloader.querySelectorAll<HTMLElement>(".letter-reveal");

    // Initialize all invisible
    units.forEach((u) => { u.style.opacity = "0"; });
    letters.forEach((l) => { l.style.opacity = "0"; l.style.transform = "scale(0.8)"; });
    spheres.forEach((s) => { s.style.width = "2px"; s.style.height = "2px"; });
    shadows.forEach((s) => { s.style.opacity = "0"; });

    // ─── Phase 1: Pinpoints emerge (400ms → 900ms) ───
    setTimeout(() => {
      units.forEach((u, i) => {
        setTimeout(() => {
          u.style.opacity = "1";
          const sphere = u.querySelector<HTMLElement>(".preloader-sphere");
          if (sphere) {
            sphere.style.boxShadow = "0 0 6px #FF6B35, 0 0 14px rgba(255,107,53,0.6)";
          }
        }, i * 60);
      });
    }, 400);

    // ─── Phase 2: Spheres grow (900ms → 2200ms) ───
    setTimeout(() => {
      spheres.forEach((s, i) => {
        setTimeout(() => {
          s.style.transition = `width 0.7s cubic-bezier(0.34,1.56,0.64,1),
                                 height 0.7s cubic-bezier(0.34,1.56,0.64,1),
                                 box-shadow 0.5s ease`;
          s.style.width = SPHERE_SIZES[i] + "px";
          s.style.height = SPHERE_SIZES[i] + "px";
          s.style.boxShadow =
            "0 8px 20px rgba(255,107,53,0.45), 0 2px 6px rgba(0,0,0,0.5), inset 0 -3px 6px rgba(139,46,15,0.4), inset 0 2px 4px rgba(255,176,136,0.25)";
          shadows[i].style.transition = "opacity 0.5s ease";
          shadows[i].style.opacity = "1";
        }, i * 80);
      });
    }, 900);

    // ─── Phase 3: Spheres breathe (2200ms → 2900ms) ───
    setTimeout(() => {
      spheres.forEach((s) => {
        s.style.transition =
          "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)";
        s.style.transform = "scale(1.06)";
        // Also shift specular highlight slightly
        const highlight = s.querySelector<HTMLElement>(".specular-primary");
        if (highlight) {
          highlight.style.transition = "transform 0.7s ease";
          highlight.style.transform = "rotate(-20deg) translate(2px, -2px)";
        }
        setTimeout(() => {
          s.style.transform = "scale(0.97)";
          if (highlight) highlight.style.transform = "rotate(-20deg) translate(-1px, 1px)";
        }, 233);
        setTimeout(() => {
          s.style.transform = "scale(1)";
          if (highlight) highlight.style.transform = "rotate(-20deg) translate(0, 0)";
        }, 466);
      });
    }, 2200);

    // ─── Phase 4: Sphere → Letter morph (2900ms → 3500ms) ───
    setTimeout(() => {
      spheres.forEach((s, i) => {
        setTimeout(() => {
          s.style.transition =
            "opacity 0.35s ease, transform 0.35s ease, filter 0.35s ease";
          s.style.opacity = "0";
          s.style.transform = "scale(1.4)";
          s.style.filter = "blur(8px)";
          shadows[i].style.transition = "opacity 0.3s ease";
          shadows[i].style.opacity = "0";

          const letter = letters[i];
          letter.style.transition =
            "opacity 0.35s ease 0.1s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.1s";
          letter.style.opacity = "1";
          letter.style.transform = "scale(1)";
        }, i * 60);
      });
    }, 2900);

    // ─── Phase 5: Hold + fade out (3500ms → 4200ms) ───
    setTimeout(() => {
      preloader.style.transition = "opacity 0.3s ease";
      preloader.style.opacity = "0";

      setTimeout(() => {
        preloader.style.display = "none";
        sessionStorage.setItem("nexseva_intro_done", "1");
        router.replace("/dashboard");
      }, 320);
    }, 3900);
  }, [router]);

  useEffect(() => {
    // Skip if already played
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("nexseva_intro_done")
    ) {
      router.replace("/dashboard");
      return;
    }

    // Small delay for hydration
    const t = setTimeout(runPreloader, 50);
    return () => clearTimeout(t);
  }, [router, runPreloader]);

  return (
    <div
      id="preloader"
      ref={preloaderRef}
      suppressHydrationWarning
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#1A1919",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        id="sphere-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(8px, 2vw, 20px)",
          position: "relative",
        }}
      >
        {LETTERS.map((letter, i) => (
          <div
            key={`${letter}-${i}`}
            className="letter-unit"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
            }}
          >
            {/* Chrome Sphere */}
            <div
              className="preloader-sphere"
              style={{
                width: 2,
                height: 2,
                willChange: "transform, opacity, width, height, filter",
              }}
            >
              {/* Primary specular highlight — small bright point */}
              <span
                className="specular-primary"
                style={{
                  content: "''",
                  position: "absolute",
                  width: "28%",
                  height: "22%",
                  top: "14%",
                  left: "20%",
                  background:
                    "radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,200,160,0.5) 30%, transparent 70%)",
                  borderRadius: "50%",
                  transform: "rotate(-20deg)",
                  filter: "blur(1px)",
                  pointerEvents: "none",
                }}
              />
              {/* Secondary specular — larger soft reflection */}
              <span
                style={{
                  content: "''",
                  position: "absolute",
                  width: "45%",
                  height: "35%",
                  bottom: "18%",
                  right: "10%",
                  background:
                    "radial-gradient(ellipse at center, rgba(255,176,136,0.18) 0%, rgba(255,143,99,0.08) 50%, transparent 100%)",
                  borderRadius: "50%",
                  filter: "blur(2px)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Ground shadow / ambient occlusion */}
            <div
              className="preloader-sphere-shadow"
              style={{ opacity: 0 }}
            />

            {/* Letter (starts hidden, replaces sphere in Phase 4) */}
            <span
              className="letter-reveal"
              style={{
                position: "absolute",
                fontFamily: "'Syne', var(--font-syne), sans-serif",
                fontWeight: 800,
                fontSize: "clamp(3rem, 8vw, 5.5rem)",
                letterSpacing: "0.25em",
                color: "#FF6B2B",
                textShadow: "0 0 40px rgba(255,107,43,0.4)",
                opacity: 0,
                transform: "scale(0.8)",
                willChange: "transform, opacity",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {letter}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

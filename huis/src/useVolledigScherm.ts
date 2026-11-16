import { useCallback, useEffect, useRef, useState } from "react";

export interface VolledigScherm {
  readonly aan: boolean;
  readonly zet: (aan: boolean) => void;
}

/** Een invoerveld of open venster heeft de toets nodig: dan schakelt F niet. */
function toetsIsBezet(doel: EventTarget | null): boolean {
  const el = doel as HTMLElement | null;
  if (el?.closest?.("input, textarea, select, [contenteditable='true']")) return true;
  return document.querySelector("[aria-modal='true']") !== null;
}

/**
 * Volledig scherm voor het huis. Gebruikt de Fullscreen-API van de browser; waar die ontbreekt
 * (bijvoorbeeld Safari op de iPhone) blijft alleen de schermvullende weergave over.
 * Toets F schakelt, Escape sluit (bij echt volledig scherm doet de browser dat zelf).
 */
export function useVolledigScherm(): VolledigScherm {
  const [aan, setAan] = useState(false);
  const aanRef = useRef(aan);

  useEffect(() => {
    aanRef.current = aan;
  }, [aan]);

  const zet = useCallback((nieuw: boolean) => {
    setAan(nieuw);
    if (nieuw && document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Browser weigert (bijvoorbeeld zonder klik van de gebruiker): de weergave blijft schermvullend.
      });
    }
    if (!nieuw && document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    // Verlaat de gebruiker het echte volledig scherm (Escape, systeemgebaar), dan ook de weergave.
    const bijWissel = () => {
      if (!document.fullscreenElement) setAan(false);
    };
    document.addEventListener("fullscreenchange", bijWissel);
    return () => document.removeEventListener("fullscreenchange", bijWissel);
  }, []);

  useEffect(() => {
    const toets = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || toetsIsBezet(e.target)) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        zet(!aanRef.current);
      } else if (e.key === "Escape" && aanRef.current && !document.fullscreenElement) {
        zet(false);
      }
    };
    window.addEventListener("keydown", toets);
    return () => window.removeEventListener("keydown", toets);
  }, [zet]);

  return { aan, zet };
}

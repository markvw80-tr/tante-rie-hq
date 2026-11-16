interface VolledigKnopProps {
  readonly aan: boolean;
  readonly onWissel: () => void;
}

/** Knop rechtsboven op het huis: volledig scherm aan of uit (ook met toets F). */
export function VolledigKnop({ aan, onWissel }: VolledigKnopProps) {
  const label = aan ? "Volledig scherm sluiten" : "Volledig scherm";
  return (
    <button type="button" className="volledig-knop" onClick={onWissel} aria-pressed={aan} title={`${label} (F)`}>
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {aan ? (
          <path d="M8 3v5H3M12 3v5h5M8 17v-5H3M12 17v-5h5" />
        ) : (
          <path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5" />
        )}
      </svg>
      <span>{label}</span>
      <kbd>F</kbd>
    </button>
  );
}

import "./quest-loader.css";

export function QuestLoader({ label = "A little adventure is on its way…", overlay = false, compact = false, variant = "dark" }: { label?: string; overlay?: boolean; compact?: boolean; variant?: "dark" | "light" }) {
  return <div className={`quest-loader ${overlay ? "quest-loader-overlay" : ""} ${compact ? "quest-loader-compact" : ""} quest-loader-${variant}`} role="status" aria-live="polite">
    <div className="quest-loader-art" aria-hidden="true"><span className="quest-loader-orbit">✦</span><span className="quest-loader-buddy">🦉</span><span className="quest-loader-book">📖</span></div>
    <strong>{label}</strong><span className="quest-loader-caption">Just a moment, little explorer…</span>
    <span className="quest-loader-dots" aria-hidden="true"><i/><i/><i/></span>
  </div>;
}

export function QuestSpinner() { return <span className="quest-button-spinner" aria-hidden="true"/>; }

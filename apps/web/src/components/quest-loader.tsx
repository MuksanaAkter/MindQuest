import "./quest-loader.css";

export function QuestLoader({ label = "A little adventure is on its way…", overlay = false }: { label?: string; overlay?: boolean }) {
  return <div className={`quest-loader ${overlay ? "quest-loader-overlay" : ""}`} role="status" aria-live="polite">
    <div className="quest-loader-art" aria-hidden="true"><span className="quest-loader-orbit">✦</span><span className="quest-loader-buddy">🦉</span><span className="quest-loader-book">📖</span></div>
    <strong>{label}</strong><span className="quest-loader-caption">Gathering questions and a little magic</span>
    <span className="quest-loader-dots" aria-hidden="true"><i/><i/><i/></span>
  </div>;
}

type ThemeToggleProps = {
  onToggle: () => void;
};

export default function ThemeToggle({ onToggle }: ThemeToggleProps) {
  return (
    <button className="icon-btn theme-toggle" aria-label="Toggle theme" title="Toggle theme" onClick={onToggle}>
      <svg className="sun-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.42-1.42M4.92 19.08l1.42-1.42m11.32 0 1.42 1.42M4.92 4.92l1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/></svg>
      <svg className="moon-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z"/></svg>
    </button>
  );
}

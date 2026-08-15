type BrandProps = {
  desktop?: boolean;
};

export default function Brand({ desktop = false }: BrandProps) {
  return (
    <a className={`brand${desktop ? " desktop-brand" : ""}`} href="#" aria-label="Gupto Network home">
      <span className="brand-mark">N</span>
      <span className="brand-text">GUPTO NETWORK</span>
    </a>
  );
}

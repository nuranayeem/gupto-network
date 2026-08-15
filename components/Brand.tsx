type BrandProps = {
  desktop?: boolean;
  href?: string;
};

export default function Brand({ desktop = false, href = "#" }: BrandProps) {
  return (
    <a
      className={`brand${desktop ? " desktop-brand" : ""}`}
      href={href}
      aria-label="Gupto home"
    >
      <span className="brand-mark" aria-hidden="true">
        <img
          className="brand-logo-image"
          src="/images/brand/gupto-logo.png"
          alt=""
        />
      </span>

      <span className="brand-name">Gupto</span>
    </a>
  );
}

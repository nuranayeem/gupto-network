# Pixel-Preservation Checklist

The following original values are intentionally preserved:

- Fonts: Inter + Manrope
- Primary: `#6f4cff`
- Secondary primary: `#8c70ff`
- Accent: `#13c8a0`
- Danger: `#ff4d73`
- Main desktop grid widths: `244px / 680px / 330px`
- Large radius: `26px`
- Medium radius: `20px`
- Small radius: `14px`
- Responsive breakpoints: `1180px`, `980px`, `720px`, `420px`
- Existing light/dark CSS variables
- Existing glass effects, gradients, shadows and ambient backgrounds

## Before changing UI later

Do not refactor `app/globals.css` into Tailwind or CSS Modules until visual regression screenshots have been approved at desktop, tablet, and mobile widths.

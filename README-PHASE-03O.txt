GUPTO PHASE 03O — CAPTION CONTROL REFINEMENT

Base required: Phase 03N

Fixes and polish
- Repairs the Place control layout by isolating it from legacy toolbar button rules.
- Repairs dropdown option layouts inside the Caption toolbar.
- Makes dropdown panels opaque, higher contrast and easier to read without background content bleed.
- Replaces the text arrow glyph with a clean animated SVG chevron.
- Makes the Size number directly editable while preserving the minus and plus buttons.
- Restores Caption Rotation as one compact inline minus/editable-number/plus control.
- Rotation supports -180° to +180° and changes by 15° with the buttons.
- No extra Size or Rotation editor panel is added.

Install
1. Extract this ZIP into the project root and replace matching files.
2. Run: npm run build
3. Run: npm run dev

Database migration: Not required.


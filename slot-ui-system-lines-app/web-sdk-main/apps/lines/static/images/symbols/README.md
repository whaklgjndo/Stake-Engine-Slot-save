# Slot symbol asset convention

Future raster or vector symbol packs should use this layout:

```text
static/images/symbols/{themeId}/{symbolId}.svg
static/images/symbols/{themeId}/{symbolId}.webp
static/images/symbols/{themeId}/{symbolId}@2x.webp
```

Examples:

- `static/images/symbols/default/high1.svg`
- `static/images/symbols/fantasy/scatter.webp`
- `static/images/symbols/neon/wild@2x.webp`
- `static/images/symbols/classic-fruit/high2.svg`

Recommended IDs are aligned with the inline SVG theme engine:

- `low1`, `low2`, `low3`, `low4`
- `mid1`, `mid2`
- `high1`, `high2`
- `wild`, `scatter`, `mult2`, `mult3`

Keep transparent padding consistent across all symbols so each asset sits cleanly in the same 1:1 symbol frame.

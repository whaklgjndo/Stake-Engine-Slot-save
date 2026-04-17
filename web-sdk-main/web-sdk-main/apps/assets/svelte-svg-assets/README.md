# Svelte SVG Asset Kit

This starter wraps the supplied PNG sprites as SVG-based Svelte components for Vite.

## What was cleaned

- Fully transparent pixels were normalized to `rgba(0, 0, 0, 0)` to reduce dark edge bleed during transforms.
- Empty alpha borders were trimmed from sprites that contained transparency.
- Components expose animation hooks through a shared `RasterSvg.svelte` wrapper.

## Components

- `SplitBackdrop`
- `BonusBadge`
- `StatusGem`
- `ControlBar`
- `SpinIcon`
- `BoltGold`
- `BoltSilver`
- `OrnateFrame`
- `MenuToggle`
- `StageScene`
- `RefreshBadge`

## Usage

```svelte
<script>
  import { SpinIcon, OrnateFrame } from './src/lib';
</script>

<SpinIcon width={72} height={64} animation="pulse" duration={1.9} />
<OrnateFrame width={320} animation="float" duration={4} />
```

## Supported animation values

- `none`
- `spin`
- `pulse`
- `float`
- `wiggle`
- `bob`

## Run

```bash
npm install
npm run dev
```

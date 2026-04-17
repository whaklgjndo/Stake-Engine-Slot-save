<script>
  import {
    BonusBadge,
    BoltGold,
    BoltSilver,
    ControlBar,
    MenuToggle,
    OrnateFrame,
    RefreshBadge,
    SpinIcon,
    SplitBackdrop,
    StageScene,
    StatusGem
  } from './lib/index.js';

  import { assetManifest } from './lib/asset-manifest.js';
</script>

<svelte:head>
  <title>Raster-to-SVG Svelte Asset Kit</title>
  <meta
    name="description"
    content="Cleaned PNG assets wrapped as SVG-ready Svelte components for Vite animation workflows."
  />
</svelte:head>

<div class="app-shell">
  <section class="hero-card">
    <div class="hero-copy">
      <p class="eyebrow">Raster-backed SVG components</p>
      <h1>Cleaned assets, animation hooks, and a Vite-ready Svelte starter.</h1>
      <p class="lede">
        Each sprite was normalized by zeroing fully transparent pixels, trimming empty alpha borders,
        and wrapping the result in a reusable SVG component so you can animate with CSS or Svelte motion.
      </p>
    </div>

    <div class="stage-preview">
      <div class="stage-canvas">
        <SplitBackdrop className="layer backdrop" width={260} height={326} />
        <StageScene className="layer scene" width={320} height={175} />
        <OrnateFrame className="layer frame" width={265} height={345} animation="float" duration={4.2} />
        <ControlBar className="layer control-bar" width={235} height={39} />
        <SpinIcon className="layer spin-button" width={62} height={55} animation="pulse" duration={2.1} />
        <RefreshBadge className="layer refresh" width={36} height={33} animation="spin" duration={3.4} />
        <BonusBadge className="layer badge" width={42} height={34} animation="bob" duration={2.2} />
        <BoltGold className="layer bolt bolt-gold" width={23} height={34} animation="float" duration={1.9} />
        <BoltSilver className="layer bolt bolt-silver" width={21} height={33} animation="float" duration={2.3} delay={0.25} />
        <MenuToggle className="layer menu-toggle" width={18} height={18} animation="wiggle" duration={2.8} />
        <StatusGem className="layer status-gem" width={12} height={24} animation="bob" duration={1.7} />
      </div>
    </div>
  </section>

  <section class="manifest-card">
    <div>
      <p class="eyebrow">Asset manifest</p>
      <h2>Trimmed bounds and component names</h2>
    </div>

    <div class="manifest-grid">
      {#each assetManifest as asset}
        <article class="manifest-item">
          <div>
            <h3>{asset.name}</h3>
            <p>{asset.width} × {asset.height}</p>
          </div>
          <code>{asset.file}</code>
        </article>
      {/each}
    </div>
  </section>
</div>

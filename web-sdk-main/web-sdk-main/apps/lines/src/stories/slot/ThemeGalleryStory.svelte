<script lang="ts">
	import { buildThemeStyle, themes } from '$lib/themes';
	import Symbol from '$lib/components/slot/Symbol.svelte';
</script>

<div class="gallery-shell">
	{#each themes as theme}
		<section class="theme-card" style={buildThemeStyle(theme)}>
			<header>
				<div>
					<p>{theme.name}</p>
					<h2>{theme.description}</h2>
				</div>
				<div class="thumb" style={`background:${theme.thumbnail};`}></div>
			</header>
			<div class="swatch-row">
				<span style={`background:${theme.uiColors.accent};`}></span>
				<span style={`background:${theme.uiColors.accentAlt};`}></span>
				<span style={`background:${theme.gridGlow};`}></span>
			</div>
			<div class="symbol-row">
				<Symbol symbolId="high1" {theme} size={82} showLabel={true} />
				<Symbol symbolId="wild" {theme} size={82} showLabel={true} isWinning={true} />
				<Symbol symbolId="scatter" {theme} size={82} showLabel={true} isScatterBurst={true} />
				<Symbol symbolId="mult3" {theme} size={82} showLabel={true} />
			</div>
		</section>
	{/each}
</div>

<style>
	.gallery-shell {
		display: grid;
		gap: 18px;
		padding: 20px;
		background: linear-gradient(180deg, #05080d, #0a1018);
	}

	.theme-card {
		display: grid;
		gap: 16px;
		padding: 18px;
		border-radius: 26px;
		background:
			radial-gradient(circle at top left, color-mix(in srgb, var(--slot-accent) 16%, transparent), transparent 30%),
			var(--slot-background);
		border: 1px solid var(--slot-panel-border);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.03),
			0 18px 34px rgba(0, 0, 0, 0.28);
		color: var(--slot-text);
	}

	header {
		display: flex;
		justify-content: space-between;
		gap: 18px;
		align-items: start;
	}

	p {
		margin: 0 0 8px;
		font-size: 0.7rem;
		font-weight: 900;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--slot-text-soft);
	}

	h2 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 800;
		max-width: 44ch;
	}

	.thumb {
		inline-size: 88px;
		block-size: 88px;
		border-radius: 22px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 12px 26px rgba(0, 0, 0, 0.24);
	}

	.swatch-row,
	.symbol-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.swatch-row span {
		display: block;
		inline-size: 56px;
		block-size: 24px;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}
</style>

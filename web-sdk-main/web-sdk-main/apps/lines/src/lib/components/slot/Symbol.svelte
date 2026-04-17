<script lang="ts">
	import { getTheme } from '$lib/themes';
	import type { SlotTheme, SymbolId, SymbolKind } from './types';

	type Props = {
		symbolId: SymbolId;
		theme?: SlotTheme;
		size?: number;
		state?: SymbolKind;
		isWinning?: boolean;
		isLanding?: boolean;
		isScatterBurst?: boolean;
		isWildTransform?: boolean;
		isDimmed?: boolean;
		showLabel?: boolean;
	};

	let {
		symbolId,
		theme = getTheme('default'),
		size = 96,
		state,
		isWinning = false,
		isLanding = false,
		isScatterBurst = false,
		isWildTransform = false,
		isDimmed = false,
		showLabel = false,
	}: Props = $props();

	const symbol = $derived(theme.symbolMap[symbolId]);
	const kind = $derived(state ?? symbol.kind);
	const style = $derived(
		[
			`--symbol-size:${size}px`,
			`--symbol-color:${symbol.color}`,
			`--symbol-glow:${symbol.glowColor ?? symbol.color}`,
			`--symbol-text:${symbol.textColor ?? '#ffffff'}`,
		].join(';'),
	);
</script>

<div
	class="slot-symbol"
	class:is-winning={isWinning}
	class:is-landing={isLanding}
	class:is-scatter-burst={isScatterBurst || kind === 'scatter'}
	class:is-wild-transform={isWildTransform || kind === 'wild'}
	class:is-dimmed={isDimmed}
	data-kind={kind}
	style={style}
>
	<div class="symbol-core">
		<div class="symbol-svg" aria-hidden="true">
			{@html symbol.svg}
		</div>
		{#if showLabel}
			<span class="symbol-label">{symbol.label}</span>
		{/if}
	</div>

	{#if kind === 'multiplier'}
		<div class="symbol-pill">Multiplier</div>
	{:else if kind === 'wild'}
		<div class="symbol-pill">Wild</div>
	{:else if kind === 'scatter'}
		<div class="symbol-pill">Scatter</div>
	{/if}
</div>

<style>
	.slot-symbol {
		--symbol-size: 96px;
		position: relative;
		display: grid;
		place-items: center;
		inline-size: var(--symbol-size);
		block-size: var(--symbol-size);
		border-radius: calc(var(--symbol-size) * 0.26);
		background:
			radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.18), transparent 34%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.02),
			0 14px 18px rgba(0, 0, 0, 0.26);
		will-change: transform, filter, box-shadow;
		transform: translateZ(0);
		overflow: hidden;
	}

	.slot-symbol::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background:
			radial-gradient(circle at center, color-mix(in srgb, var(--symbol-glow) 16%, transparent), transparent 64%);
		opacity: 0.65;
		pointer-events: none;
	}

	.symbol-core {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		inline-size: 86%;
		block-size: 86%;
	}

	.symbol-svg {
		display: grid;
		place-items: center;
		inline-size: 100%;
		block-size: 100%;
		filter:
			drop-shadow(0 8px 16px rgba(0, 0, 0, 0.28))
			drop-shadow(0 0 18px color-mix(in srgb, var(--symbol-glow) 22%, transparent));
	}

	.symbol-svg :global(svg) {
		inline-size: 100%;
		block-size: 100%;
	}

	.symbol-label {
		position: absolute;
		inset-inline: 8px;
		bottom: 4px;
		text-align: center;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--symbol-text);
		text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);
	}

	.symbol-pill {
		position: absolute;
		top: 6px;
		right: 6px;
		padding: 4px 6px;
		border-radius: 999px;
		background: rgba(4, 11, 18, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 0.5rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.82);
		backdrop-filter: blur(6px);
	}

	.is-dimmed {
		opacity: 0.44;
		filter: saturate(0.72);
	}

	.is-landing {
		animation: landBounce 460ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.is-winning {
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.12),
			0 0 20px color-mix(in srgb, var(--symbol-glow) 50%, transparent),
			0 14px 22px rgba(0, 0, 0, 0.3);
		animation: winGlow 1.14s ease-in-out infinite;
	}

	.is-scatter-burst {
		animation: scatterBurst 900ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.is-wild-transform {
		animation: wildTransform 680ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes landBounce {
		0% {
			transform: translateY(-14px) scale(0.96);
		}

		60% {
			transform: translateY(4px) scale(1.03);
		}

		100% {
			transform: translateY(0) scale(1);
		}
	}

	@keyframes winGlow {
		0%,
		100% {
			transform: scale(1);
			filter: brightness(1);
		}

		50% {
			transform: scale(1.04);
			filter: brightness(1.12);
		}
	}

	@keyframes scatterBurst {
		0% {
			transform: scale(0.94);
			box-shadow: 0 0 0 rgba(0, 0, 0, 0);
		}

		36% {
			transform: scale(1.1);
			box-shadow: 0 0 32px color-mix(in srgb, var(--symbol-glow) 54%, transparent);
		}

		100% {
			transform: scale(1);
		}
	}

	@keyframes wildTransform {
		0% {
			transform: rotate(-6deg) scale(0.92);
			filter: saturate(1.3);
		}

		55% {
			transform: rotate(4deg) scale(1.08);
			filter: saturate(1.42);
		}

		100% {
			transform: rotate(0deg) scale(1);
			filter: saturate(1);
		}
	}
</style>

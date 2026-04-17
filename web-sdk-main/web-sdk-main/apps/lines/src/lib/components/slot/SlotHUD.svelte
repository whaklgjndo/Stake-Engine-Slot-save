<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getTheme } from '$lib/themes';
	import SpinButton from './SpinButton.svelte';
	import type { SlotPerformanceHints, SlotTheme } from './types';

	type Props = {
		theme?: SlotTheme;
		balance: number;
		totalBet: number;
		betPerLine: number;
		lines: number;
		lastWin: number;
		autoSpins: number;
		canAdjustBet?: boolean;
		canSpin?: boolean;
		isSpinning?: boolean;
		stopMode?: boolean;
		maxBet?: number;
		performanceHints?: SlotPerformanceHints;
	};

	const dispatch = createEventDispatcher<{
		spin: void;
		betdelta: { delta: number };
		maxbet: void;
		autospin: void;
	}>();

	let {
		theme = getTheme('default'),
		balance,
		totalBet,
		betPerLine,
		lines,
		lastWin,
		autoSpins,
		canAdjustBet = true,
		canSpin = true,
		isSpinning = false,
		stopMode = false,
		maxBet = 25,
		performanceHints = {
			virtualized: true,
			willChangeEnabled: true,
			requestAnimationFrameDriven: true,
		},
	}: Props = $props();

	const panelStyle = $derived(
		[
			`--hud-bg:${theme.uiColors.panel}`,
			`--hud-border:${theme.uiColors.panelBorder}`,
			`--hud-text:${theme.uiColors.text}`,
			`--hud-soft:${theme.uiColors.textSoft}`,
			`--hud-accent:${theme.uiColors.accent}`,
			`--hud-accent-alt:${theme.uiColors.accentAlt}`,
			`--hud-button:${theme.uiColors.button}`,
			`--hud-button-text:${theme.uiColors.buttonText}`,
		].join(';'),
	);

	const hintText = $derived(
		[
			performanceHints.virtualized ? 'virtual scrolling' : null,
			performanceHints.willChangeEnabled ? 'will-change layers' : null,
			performanceHints.requestAnimationFrameDriven ? 'RAF-driven motion' : null,
		]
			.filter(Boolean)
			.join(' · '),
	);

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 2,
		}).format(value);
	}
</script>

<div class="slot-hud" style={panelStyle}>
	<div class="hud-row hud-row-top">
		<div class="hud-stat">
			<span>Balance</span>
			<strong>{formatCurrency(balance)}</strong>
		</div>
		<div class="hud-stat">
			<span>Total Bet</span>
			<strong>{formatCurrency(totalBet)}</strong>
		</div>
		<div class="hud-stat">
			<span>Last Win</span>
			<strong>{formatCurrency(lastWin)}</strong>
		</div>
		<div class="hud-stat">
			<span>Lines</span>
			<strong>{lines}</strong>
		</div>
	</div>

	<div class="hud-row hud-row-bottom">
		<div class="bet-controls">
			<div class="bet-panel">
				<span>Bet / Line</span>
				<strong>{formatCurrency(betPerLine)}</strong>
				<div class="bet-actions">
					<button type="button" on:click={() => dispatch('betdelta', { delta: -1 })} disabled={!canAdjustBet}>−</button>
					<button type="button" on:click={() => dispatch('betdelta', { delta: 1 })} disabled={!canAdjustBet}>+</button>
					<button type="button" class="max-bet" on:click={() => dispatch('maxbet')} disabled={!canAdjustBet}>
						Max {formatCurrency(maxBet)}
					</button>
				</div>
			</div>

			<div class="bet-panel subtle">
				<span>Auto Spin</span>
				<strong>{autoSpins > 0 ? `${autoSpins} queued` : 'Off'}</strong>
				<button type="button" on:click={() => dispatch('autospin')}>Toggle Queue</button>
			</div>
		</div>

		<SpinButton
			canSpin={canSpin}
			isSpinning={isSpinning}
			stopMode={stopMode}
			on:press={() => dispatch('spin')}
		/>
	</div>

	<div class="hud-footer">
		<div>
			<span>Theme</span>
			<strong>{theme.name}</strong>
		</div>
		<div>
			<span>Render Path</span>
			<strong>{hintText}</strong>
		</div>
		<div>
			<span>Frame Image</span>
			<strong>{theme.frameImage ?? 'theme-driven CSS frame'}</strong>
		</div>
	</div>
</div>

<style>
	.slot-hud {
		display: grid;
		gap: 16px;
		padding: 18px;
		border-radius: 24px;
		background:
			radial-gradient(circle at top, color-mix(in srgb, var(--hud-accent) 14%, transparent), transparent 30%),
			var(--hud-bg);
		border: 1px solid var(--hud-border);
		color: var(--hud-text);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 18px 34px rgba(0, 0, 0, 0.24);
	}

	.hud-row {
		display: flex;
		gap: 12px;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.hud-row-top {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.hud-stat,
	.bet-panel,
	.hud-footer > div {
		padding: 12px 14px;
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.hud-stat span,
	.bet-panel span,
	.hud-footer span {
		display: block;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--hud-soft);
	}

	.hud-stat strong,
	.bet-panel strong,
	.hud-footer strong {
		display: block;
		margin-top: 6px;
		font-size: 1rem;
		font-weight: 900;
		letter-spacing: -0.02em;
	}

	.bet-controls {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		flex: 1;
	}

	.bet-panel {
		display: grid;
		gap: 10px;
	}

	.bet-panel.subtle {
		background: rgba(255, 255, 255, 0.02);
	}

	.bet-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	button {
		padding: 10px 14px;
		border-radius: 14px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.04);
		color: var(--hud-text);
		font: inherit;
		font-weight: 800;
		cursor: pointer;
		transition:
			transform 140ms ease,
			background 140ms ease,
			border-color 140ms ease;
	}

	button:hover:enabled {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.08);
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.max-bet {
		background: color-mix(in srgb, var(--hud-accent) 16%, rgba(255, 255, 255, 0.02));
		border-color: color-mix(in srgb, var(--hud-accent) 28%, rgba(255, 255, 255, 0.08));
	}

	.hud-footer {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}

	@media (max-width: 900px) {
		.hud-row-top,
		.bet-controls,
		.hud-footer {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (max-width: 640px) {
		.hud-row-top,
		.bet-controls,
		.hud-footer {
			grid-template-columns: 1fr;
		}
	}
</style>

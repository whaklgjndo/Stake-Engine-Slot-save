<script lang="ts">
	import { onDestroy } from 'svelte';
	import { buildThemeStyle, getTheme, themes } from '$lib/themes';
	import {
		ReelGrid,
		ReelSpinController,
		SkinSwitcher,
		SlotHUD,
		WinLineOverlay,
		type ControllerSnapshot,
		type ThemeId,
	} from '$lib/components/slot';
	import type { SlotOutcomeTone } from '$lib/components/slot';

	type Props = {
		themeId?: ThemeId;
		staggerDelay?: number;
		betStep?: number;
		startingBalance?: number;
		forcedTone?: SlotOutcomeTone | 'random';
	};

	let {
		themeId = 'default',
		staggerDelay = 96,
		betStep = 0.2,
		startingBalance = 1250,
		forcedTone = 'random',
	}: Props = $props();

	const STORAGE_KEY = 'slot-storybook-theme';
	const controller = new ReelSpinController(themeId);
	let snapshot = $state<ControllerSnapshot>(controller.snapshot);
	let activeThemeId = $state<ThemeId>(themeId);
	let betPerLine = $state(0.2);
	let balance = $state(startingBalance);
	let autoSpins = $state(0);
	let totalBet = $derived(Number((betPerLine * 25).toFixed(2)));
	let theme = $derived(getTheme(activeThemeId));
	let isSpinning = $derived(snapshot.isSpinning.some(Boolean));
	let stopMode = $derived(isSpinning);

	const unsubscribe = controller.subscribe((value) => {
		snapshot = value;

		if (!value.isSpinning.some(Boolean) && value.lastWin > 0) {
			balance = Number((balance + value.lastWin).toFixed(2));
		}

		if (!value.isSpinning.some(Boolean) && autoSpins > 0) {
			autoSpins -= 1;
			queueMicrotask(() => handleSpin());
		}
	});

	$effect(() => {
		controller.setTheme(activeThemeId);
	});

	$effect(() => {
		const persisted = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
		if (persisted && themes.some((item) => item.id === persisted)) {
			activeThemeId = persisted as ThemeId;
		}
	});

	function handleThemeSelect(event: CustomEvent<{ themeId: ThemeId }>): void {
		activeThemeId = event.detail.themeId;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, activeThemeId);
		}
	}

	function handleSpin(): void {
		if (isSpinning) {
			controller.stopNow();
			return;
		}

		if (balance < totalBet) return;
		balance = Number((balance - totalBet).toFixed(2));
		controller.spin({ staggerDelay, forcedTone });
	}

	function handleBetDelta(event: CustomEvent<{ delta: number }>): void {
		betPerLine = Math.max(0.2, Number((betPerLine + event.detail.delta * betStep).toFixed(2)));
	}

	function handleMaxBet(): void {
		betPerLine = 1;
	}

	function handleAutoSpin(): void {
		autoSpins = autoSpins > 0 ? 0 : 5;
	}

	onDestroy(() => {
		unsubscribe();
		controller.destroy();
	});
</script>

<div class="demo-shell" style={buildThemeStyle(theme)}>
	<div class="demo-backdrop"></div>
	<header class="demo-header">
		<div>
			<p class="eyebrow">Casino-grade 5×5 slot demo</p>
			<h1>{theme.name}</h1>
			<p>{theme.description}</p>
		</div>
		<div class="demo-message">{snapshot.message}</div>
	</header>

	<SkinSwitcher currentThemeId={activeThemeId} themes={themes} on:select={handleThemeSelect} />

	<div class="board-frame">
		<ReelGrid
			theme={theme}
			symbolsMatrix={snapshot.symbolsMatrix}
			isSpinning={snapshot.isSpinning}
			stopPositions={snapshot.stopPositions}
			staggerDelay={staggerDelay}
			activeWinLines={snapshot.activeWinLines}
		/>
		<WinLineOverlay winLines={snapshot.activeWinLines} reelCount={5} visibleRows={5} />
	</div>

	<SlotHUD
		theme={theme}
		balance={balance}
		totalBet={totalBet}
		betPerLine={betPerLine}
		lines={25}
		lastWin={snapshot.lastWin}
		autoSpins={autoSpins}
		canAdjustBet={!isSpinning}
		canSpin={balance >= totalBet || isSpinning}
		isSpinning={isSpinning}
		stopMode={stopMode}
		maxBet={1}
		on:spin={handleSpin}
		on:betdelta={handleBetDelta}
		on:maxbet={handleMaxBet}
		on:autospin={handleAutoSpin}
	/>
</div>

<style>
	.demo-shell {
		position: relative;
		display: grid;
		gap: 18px;
		padding: 24px;
		min-height: 100vh;
		background:
			radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--slot-accent) 16%, transparent), transparent 24%),
			var(--slot-background);
		color: var(--slot-text);
	}

	.demo-backdrop {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--slot-accent-alt) 10%, transparent), transparent 20%),
			radial-gradient(circle at 80% 12%, color-mix(in srgb, var(--slot-accent) 10%, transparent), transparent 18%),
			radial-gradient(circle at 50% 80%, color-mix(in srgb, var(--slot-accent) 10%, transparent), transparent 30%);
		filter: blur(26px);
		pointer-events: none;
	}

	.demo-shell > * {
		position: relative;
		z-index: 1;
	}

	.demo-header {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: end;
		flex-wrap: wrap;
	}

	.eyebrow {
		margin: 0 0 6px;
		font-size: 0.72rem;
		font-weight: 900;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--slot-text-soft);
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 4vw, 3rem);
		letter-spacing: -0.05em;
	}

	p {
		margin: 8px 0 0;
		max-width: 60ch;
		line-height: 1.5;
		color: var(--slot-text-soft);
	}

	.demo-message {
		padding: 12px 16px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		font-weight: 800;
		color: var(--slot-text);
	}

	.board-frame {
		position: relative;
		max-width: 760px;
		margin-inline: auto;
	}

	@media (max-width: 700px) {
		.demo-shell {
			padding: 16px;
		}
	}
</style>

<script lang="ts">
	import ThroneRoomBackdrop from './art/ThroneRoomBackdrop.svelte';
	import OrnateBoardFrame from './art/OrnateBoardFrame.svelte';
	import SlotHudBar from './art/SlotHudBar.svelte';

	const backgroundArt = new URL('../stories/assets/bg-throne-room.png', import.meta.url).href;
	const boardFrameArt = new URL('../stories/assets/board-frame.png', import.meta.url).href;
	const cellGridOverlayArt = new URL('../stories/assets/cell-grid-overlay.png', import.meta.url).href;
	const hudControlsArt = new URL('../stories/assets/hud-controls-bar.png', import.meta.url).href;

	let balance = 12345.67;
	let betSize = 10;
	let win = 0;
	let quickSpin = false;
	let autoSpin = false;
	let isSpinning = false;

	const betOptions = [0.2, 0.4, 1, 2, 5, 10, 20, 50] as const;

	function formatNumber(value: number): string {
		return value.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	}

	function updateBet(direction: -1 | 1): void {
		if (isSpinning) return;
		const currentIndex = Math.max(0, betOptions.findIndex((value) => value === betSize));
		const nextIndex = Math.min(Math.max(currentIndex + direction, 0), betOptions.length - 1);
		betSize = betOptions[nextIndex];
	}

	function toggleQuickSpin(): void {
		if (isSpinning) return;
		quickSpin = !quickSpin;
	}

	function toggleAutoSpin(): void {
		if (isSpinning) return;
		autoSpin = !autoSpin;
	}

	async function spin(): Promise<void> {
		if (isSpinning) return;
		isSpinning = true;
		const result = Number((Math.random() * betSize * 8).toFixed(2));
		win = result;
		balance = Number(Math.max(0, balance - betSize + result).toFixed(2));
		await new Promise((resolve) => setTimeout(resolve, quickSpin ? 240 : 700));
		isSpinning = false;
	}
</script>

<div class="art-slot-shell">
	<ThroneRoomBackdrop src={backgroundArt} />

	<OrnateBoardFrame frameSrc={boardFrameArt} gridSrc={cellGridOverlayArt} {isSpinning} />

	<SlotHudBar
		artSrc={hudControlsArt}
		balanceText={formatNumber(balance)}
		betText={formatNumber(betSize)}
		winText={formatNumber(win)}
		quickSpin={quickSpin}
		autoSpin={autoSpin}
		spinDisabled={isSpinning}
		on:spin={spin}
		on:betDown={() => updateBet(-1)}
		on:betUp={() => updateBet(1)}
		on:toggleQuick={toggleQuickSpin}
		on:toggleAuto={toggleAutoSpin}
	/>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #040608;
	}

	.art-slot-shell {
		position: relative;
		width: min(100vw, calc(100vh * 1.7655));
		aspect-ratio: 2048 / 1160;
		margin: 0 auto;
		overflow: hidden;
		background: #040608;
		user-select: none;
	}
</style>

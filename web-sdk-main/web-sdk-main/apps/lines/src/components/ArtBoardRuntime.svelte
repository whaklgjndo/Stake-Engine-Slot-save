<script lang="ts">
	import ThroneRoomBackdrop from './art/ThroneRoomBackdrop.svelte';
	import OrnateBoardFrame from './art/OrnateBoardFrame.svelte';
	import SlotHudBar from './art/SlotHudBar.svelte';

	const backgroundArt = new URL('../stories/assets/bg-throne-room.png', import.meta.url).href;
	const boardFrameArt = new URL('../stories/assets/board-frame.png', import.meta.url).href;
	const cellGridOverlayArt = new URL('../stories/assets/cell-grid-overlay.png', import.meta.url).href;
	const hudControlsArt = new URL('../stories/assets/hud-controls-bar.png', import.meta.url).href;

	type SymbolKey = 'crown' | 'gem' | 'sun' | 'moon' | 'star' | 'wild' | 'scatter';
	type Cell = { id: string; symbol: SymbolKey; glow: string; accent: string };
	type WinLine = { id: string; positions: Array<{ row: number; col: number }>; color: string };

	const symbolPalette: Array<{ symbol: SymbolKey; glow: string; accent: string }> = [
		{ symbol: 'crown', glow: '#ffcb7a', accent: '#fff0ba' },
		{ symbol: 'gem', glow: '#6ed9ff', accent: '#e8fbff' },
		{ symbol: 'sun', glow: '#ff9968', accent: '#ffe3c6' },
		{ symbol: 'moon', glow: '#89a7ff', accent: '#edf1ff' },
		{ symbol: 'star', glow: '#d996ff', accent: '#f6ddff' },
		{ symbol: 'wild', glow: '#7cf1d4', accent: '#e3fff7' },
		{ symbol: 'scatter', glow: '#ffd66f', accent: '#fff7d2' },
	];

	const lineTemplates = [
		[0, 0, 0, 0, 0],
		[1, 1, 1, 1, 1],
		[2, 2, 2, 2, 2],
		[3, 3, 3, 3, 3],
		[4, 4, 4, 4, 4],
		[0, 1, 2, 1, 0],
		[4, 3, 2, 3, 4],
		[1, 2, 3, 2, 1],
		[3, 2, 1, 2, 3],
	];

	let balance = 12345.67;
	let betSize = 10;
	let win = 0;
	let quickSpin = false;
	let autoSpin = false;
	let isSpinning = false;
	let matrix = createMatrix();
	let highlightedKeys = new Set<string>();
	let activeLines: WinLine[] = [];
	let spinSeed = 0;

	const betOptions = [0.2, 0.4, 1, 2, 5, 10, 20, 50] as const;

	function formatNumber(value: number): string {
		return value.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	}

	function createCell(row: number, col: number): Cell {
		const pick = symbolPalette[Math.floor(Math.random() * symbolPalette.length)] ?? symbolPalette[0];
		return {
			id: `${row}-${col}-${pick.symbol}-${Math.random().toString(36).slice(2, 7)}`,
			symbol: pick.symbol,
			glow: pick.glow,
			accent: pick.accent,
		};
	}

	function createMatrix(): Cell[][] {
		return Array.from({ length: 5 }, (_, row) =>
			Array.from({ length: 5 }, (_, col) => createCell(row, col)),
		);
	}

	function createWinLines(): WinLine[] {
		const count = Math.random() > 0.72 ? 2 : 1;
		const chosen = [...lineTemplates].sort(() => Math.random() - 0.5).slice(0, count);
		const colors = ['#7ee6ff', '#ffcd72', '#d8a6ff'];
		return chosen.map((line, index) => ({
			id: `line-${index}-${spinSeed}`,
			positions: line.map((row, col) => ({ row, col })),
			color: colors[index % colors.length],
		}));
	}

	function keyFor(row: number, col: number): string {
		return `${row}-${col}`;
	}

	function pointsFor(line: WinLine): string {
		return line.positions
			.map((position) => `${position.col * 20 + 10},${position.row * 20 + 10}`)
			.join(' ');
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
		spinSeed += 1;
		activeLines = [];
		highlightedKeys = new Set();
		matrix = createMatrix();
		const result = Number((Math.random() * betSize * 8).toFixed(2));
		await new Promise((resolve) => setTimeout(resolve, quickSpin ? 180 : 460));
		matrix = createMatrix();
		win = result;
		balance = Number(Math.max(0, balance - betSize + result).toFixed(2));

		if (result > 0) {
			activeLines = createWinLines();
			highlightedKeys = new Set(
				activeLines.flatMap((line) => line.positions.map((position) => keyFor(position.row, position.col))),
			);
		}

		await new Promise((resolve) => setTimeout(resolve, quickSpin ? 180 : 620));
		isSpinning = false;
	}

	function symbolLabel(symbol: SymbolKey): string {
		return symbol === 'wild' || symbol === 'scatter' ? symbol.toUpperCase() : '';
	}
</script>

<div class="art-slot-shell">
	<ThroneRoomBackdrop src={backgroundArt} />

	<OrnateBoardFrame frameSrc={boardFrameArt} gridSrc={cellGridOverlayArt} {isSpinning}>
		<div class="grid-stage">
			<div class="grid-inner-glow"></div>
			<div class="grid-columns">
				{#each matrix as row, rowIndex}
					{#each row as cell, colIndex (cell.id)}
						<div
							class="symbol-cell"
							class:is-spinning={isSpinning}
							class:is-winning={highlightedKeys.has(keyFor(rowIndex, colIndex))}
							style={`--cell-glow:${cell.glow}; --cell-accent:${cell.accent}; animation-delay:${(rowIndex * 40 + colIndex * 24) * -1}ms;`}
						>
							<div class="symbol-tile">
								<div class="symbol-art" data-symbol={cell.symbol}>
									{#if cell.symbol === 'crown'}👑{:else if cell.symbol === 'gem'}💎{:else if cell.symbol === 'sun'}☀{:else if cell.symbol === 'moon'}☾{:else if cell.symbol === 'star'}✦{:else if cell.symbol === 'wild'}W{:else}S{/if}
								</div>
								{#if symbolLabel(cell.symbol)}
									<div class="symbol-label">{symbolLabel(cell.symbol)}</div>
								{/if}
							</div>
						</div>
					{/each}
				{/each}
			</div>

			{#if activeLines.length > 0}
				<svg class="win-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
					{#each activeLines as line}
						<polyline points={pointsFor(line)} style={`--line:${line.color};`} />
					{/each}
				</svg>
			{/if}
		</div>
	</OrnateBoardFrame>

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

	.grid-stage {
		position: absolute;
		inset: 0;
		padding: 2.2% 2.3% 2.4%;
	}

	.grid-inner-glow {
		position: absolute;
		inset: 3.2%;
		border-radius: 18px;
		background:
			radial-gradient(circle at 50% 6%, rgba(255, 228, 171, 0.18), transparent 28%),
			radial-gradient(circle at 50% 94%, rgba(126, 230, 255, 0.16), transparent 28%);
		filter: blur(10px);
		pointer-events: none;
	}

	.grid-columns {
		position: absolute;
		inset: 3.8% 3.4% 4.2%;
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		grid-template-rows: repeat(5, minmax(0, 1fr));
		gap: 2.3%;
	}

	.symbol-cell {
		position: relative;
		display: grid;
		place-items: center;
		min-width: 0;
		min-height: 0;
	}

	.symbol-tile {
		position: relative;
		inline-size: 100%;
		block-size: 100%;
		border-radius: 18%;
		background:
			radial-gradient(circle at 50% 22%, rgba(255, 255, 255, 0.18), transparent 32%),
			linear-gradient(180deg, rgba(255, 246, 226, 0.12), rgba(255, 255, 255, 0.02));
		border: 1px solid rgba(255, 239, 205, 0.16);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.03),
			0 18px 24px rgba(0, 0, 0, 0.24),
			0 0 16px color-mix(in srgb, var(--cell-glow) 12%, transparent);
		display: grid;
		place-items: center;
		overflow: hidden;
	}

	.symbol-tile::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(255,255,255,0.16), transparent 34%, transparent 68%, rgba(255,255,255,0.06));
		mix-blend-mode: screen;
		pointer-events: none;
	}

	.symbol-art {
		position: relative;
		z-index: 1;
		font-size: clamp(18px, 2vw, 42px);
		font-weight: 900;
		line-height: 1;
		color: var(--cell-accent);
		text-shadow:
			0 3px 8px rgba(0, 0, 0, 0.35),
			0 0 18px color-mix(in srgb, var(--cell-glow) 32%, transparent);
		transform: translateY(-3%);
	}

	.symbol-art[data-symbol='wild'],
	.symbol-art[data-symbol='scatter'] {
		font-size: clamp(14px, 1.36vw, 28px);
		letter-spacing: 0.08em;
	}

	.symbol-label {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 7%;
		text-align: center;
		font: 900 clamp(7px, 0.55vw, 11px) / 1 'Trebuchet MS', 'Segoe UI', sans-serif;
		letter-spacing: 0.12em;
		color: rgba(255, 248, 231, 0.92);
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
	}

	.symbol-cell.is-spinning .symbol-tile {
		animation: reelFlash 440ms ease-in-out infinite;
	}

	.symbol-cell.is-winning .symbol-tile {
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.08),
			0 0 22px color-mix(in srgb, var(--cell-glow) 44%, transparent),
			0 18px 26px rgba(0, 0, 0, 0.24);
		animation: winnerPulse 980ms ease-in-out infinite;
	}

	.win-lines {
		position: absolute;
		inset: 3.8% 3.4% 4.2%;
		width: auto;
		height: auto;
		pointer-events: none;
		overflow: visible;
	}

	.win-lines polyline {
		fill: none;
		stroke: var(--line);
		stroke-width: 2.2;
		stroke-linecap: round;
		stroke-linejoin: round;
		filter: drop-shadow(0 0 6px color-mix(in srgb, var(--line) 50%, transparent));
		stroke-dasharray: 120;
		stroke-dashoffset: 120;
		animation: lineSweep 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes reelFlash {
		0%, 100% { transform: translateY(0) scale(1); filter: brightness(1); }
		50% { transform: translateY(1.2%) scale(0.985); filter: brightness(1.12); }
	}

	@keyframes winnerPulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.035); }
	}

	@keyframes lineSweep {
		to { stroke-dashoffset: 0; }
	}
</style>

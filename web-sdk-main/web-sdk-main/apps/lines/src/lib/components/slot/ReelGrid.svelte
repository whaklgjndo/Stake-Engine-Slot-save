<script lang="ts">
	import { onDestroy } from 'svelte';
	import { getTheme } from '$lib/themes';
	import { stopReel } from '$lib/utils/slotAnimations';
	import Symbol from './Symbol.svelte';
	import type { SlotTheme, SymbolId, WinLine } from './types';

	type ReelRuntime = {
		items: SymbolId[];
		offset: number;
		blur: number;
		phase: 'idle' | 'spinning' | 'stopping' | 'landing';
		leadCount: number;
		landingToken: number;
		raf: number | null;
		startedAt: number;
	};

	type Props = {
		symbolsMatrix: SymbolId[][];
		isSpinning: boolean[];
		stopPositions: number[];
		staggerDelay?: number;
		visibleRows?: number;
		reelCount?: number;
		theme?: SlotTheme;
		activeWinLines?: WinLine[];
	};

	let {
		symbolsMatrix,
		isSpinning,
		stopPositions,
		staggerDelay = 96,
		visibleRows = 5,
		reelCount = 5,
		theme = getTheme('default'),
		activeWinLines = [],
	}: Props = $props();

	const rowSize = 96;
	const spinningPool = $derived(Object.keys(theme.symbolMap) as SymbolId[]);
	const columns = $derived(
		Array.from({ length: reelCount }, (_, columnIndex) =>
			Array.from({ length: visibleRows }, (_, rowIndex) => symbolsMatrix[rowIndex]?.[columnIndex] ?? 'low1'),
		),
	);

	let previousSpinning = $state<boolean[]>([]);
	let reelTracks = $state<ReelRuntime[]>(
		Array.from({ length: reelCount }, (_, index) => createIdleRuntime(columns[index] ?? [])),
	);

	const winningKeySet = $derived(
		new Set(
			activeWinLines.flatMap((line) =>
				line.positions.map((position) => `${position.row}-${position.column}`),
			),
		),
	);

	function randomSymbol(exclude?: SymbolId): SymbolId {
		const options = exclude
			? spinningPool.filter((symbol) => symbol !== exclude)
			: spinningPool;

		return options[Math.floor(Math.random() * options.length)] ?? 'low1';
	}

	function createLoopTrack(seed: SymbolId[] = []): SymbolId[] {
		const items: SymbolId[] = [];

		for (let index = 0; index < visibleRows * 5; index += 1) {
			const previous = items[index - 1] ?? seed[index % seed.length] ?? 'low1';
			items.push(randomSymbol(previous));
		}

		return items;
	}

	function createIdleRuntime(target: SymbolId[]): ReelRuntime {
		const leadCount = 6;
		return {
			items: [
				...Array.from({ length: leadCount }, (_, index) => randomSymbol(target[index % target.length])),
				...target,
				...Array.from({ length: 4 }, (_, index) => randomSymbol(target[index % target.length])),
			],
			offset: -(leadCount * rowSize),
			blur: 0,
			phase: 'idle',
			leadCount,
			landingToken: 0,
			raf: null,
			startedAt: 0,
		};
	}

	function createLandingRuntime(target: SymbolId[], stopPosition = 0): ReelRuntime {
		const leadCount = 7 + ((stopPosition % 3) + 3) % 3;
		return {
			items: [
				...Array.from({ length: leadCount }, (_, index) => randomSymbol(target[index % target.length])),
				...target,
				...Array.from({ length: 4 }, (_, index) => randomSymbol(target[index % target.length])),
			],
			offset: -((leadCount + 1.18) * rowSize),
			blur: 6,
			phase: 'stopping',
			leadCount,
			landingToken: Date.now() + Math.floor(Math.random() * 1000),
			raf: null,
			startedAt: 0,
		};
	}

	function replaceTrack(index: number, track: ReelRuntime): void {
		reelTracks[index] = track;
		reelTracks = [...reelTracks];
	}

	function stopLoop(index: number): void {
		const runtime = reelTracks[index];
		if (!runtime?.raf) return;
		cancelAnimationFrame(runtime.raf);
		runtime.raf = null;
	}

	function startLoop(index: number): void {
		stopLoop(index);
		const runtime = reelTracks[index];
		runtime.items = createLoopTrack(columns[index]);
		runtime.phase = 'spinning';
		runtime.blur = 6;
		runtime.startedAt =
			typeof performance !== 'undefined' && typeof performance.now === 'function'
				? performance.now()
				: Date.now();

		const tick = (): void => {
			const current = reelTracks[index];
			if (!current || current.phase !== 'spinning') return;

			const elapsed =
				(typeof performance !== 'undefined' && typeof performance.now === 'function'
					? performance.now()
					: Date.now()) - current.startedAt;
			const baseSpeed = 0.9 + index * 0.08;
			const distance = (elapsed * baseSpeed) % (rowSize * visibleRows);

			current.offset = -distance;
			current.blur = 5.4 + Math.sin(elapsed / 120) * 0.8;
			current.raf = requestAnimationFrame(tick);
			reelTracks = [...reelTracks];
		};

		runtime.raf = requestAnimationFrame(tick);
		reelTracks = [...reelTracks];
	}

	async function landReel(index: number, target: SymbolId[]): Promise<void> {
		stopLoop(index);
		const runtime = createLandingRuntime(target, stopPositions[index] ?? 0);
		replaceTrack(index, runtime);

		const startOffset = runtime.offset;
		const endOffset = -(runtime.leadCount * rowSize);

		await stopReel(Math.abs(endOffset - startOffset), 620 + index * 90, (frame) => {
			const current = reelTracks[index];
			if (!current) return;
			current.offset = startOffset + frame.offsetPx;
			current.blur = frame.blurPx;
			reelTracks = [...reelTracks];
		});

		const landed = reelTracks[index];
		if (!landed) return;
		landed.offset = endOffset;
		landed.blur = 0;
		landed.phase = 'landing';
		landed.landingToken = Date.now() + index;
		reelTracks = [...reelTracks];

		setTimeout(() => {
			const current = reelTracks[index];
			if (!current) return;
			current.phase = 'idle';
			current.offset = -(current.leadCount * rowSize);
			current.blur = 0;
			reelTracks = [...reelTracks];
		}, 380 + index * 40);
	}

	function cellKey(row: number, column: number): string {
		return `${row}-${column}`;
	}

	$effect(() => {
		if (reelTracks.length !== reelCount) {
			reelTracks = Array.from({ length: reelCount }, (_, index) => createIdleRuntime(columns[index] ?? []));
		}

		if (!previousSpinning.length) {
			previousSpinning = [...isSpinning];
			reelTracks = Array.from({ length: reelCount }, (_, index) => createIdleRuntime(columns[index] ?? []));
			return;
		}

		for (let index = 0; index < reelCount; index += 1) {
			const current = Boolean(isSpinning[index]);
			const previous = Boolean(previousSpinning[index]);

			if (current && !previous) {
				setTimeout(() => startLoop(index), index * staggerDelay);
			}

			if (!current && previous) {
				setTimeout(() => {
					void landReel(index, columns[index] ?? []);
				}, index * (staggerDelay / 2));
			}

			if (!current && !previous && reelTracks[index]?.phase === 'idle') {
				reelTracks[index] = createIdleRuntime(columns[index] ?? []);
			}
		}

		previousSpinning = [...isSpinning];
	});

	onDestroy(() => {
		for (const track of reelTracks) {
			if (track.raf) cancelAnimationFrame(track.raf);
		}
	});
</script>

<div class="slot-grid" style={`--reel-count:${reelCount}; --visible-rows:${visibleRows};`}>
	{#each reelTracks as reel, columnIndex (columnIndex)}
		<div class="reel-window" data-phase={reel.phase}>
			<div class="reel-glow"></div>
			<div
				class="reel-track"
				style={`transform: translateY(${reel.offset}px); filter: blur(${reel.blur}px);`}
			>
				{#each reel.items as symbolId, itemIndex (`${columnIndex}-${itemIndex}-${symbolId}`)}
					{@const visibleIndex = itemIndex - reel.leadCount}
					{@const isVisibleCell = visibleIndex >= 0 && visibleIndex < visibleRows}
					{@const winKey = cellKey(visibleIndex, columnIndex)}
					<div class="reel-cell">
						<Symbol
							{symbolId}
							{theme}
							size={84}
							isLanding={isVisibleCell && reel.phase === 'landing'}
							isWinning={isVisibleCell && winningKeySet.has(winKey)}
							isScatterBurst={isVisibleCell && symbolId === 'scatter' && winningKeySet.has(winKey)}
							isWildTransform={isVisibleCell && symbolId === 'wild' && winningKeySet.has(winKey)}
							isDimmed={isVisibleCell ? false : reel.phase !== 'spinning'}
						/>
					</div>
				{/each}
			</div>
			<div class="reel-glass"></div>
		</div>
	{/each}
</div>

<style>
	.slot-grid {
		position: relative;
		display: grid;
		grid-template-columns: repeat(var(--reel-count), minmax(0, 1fr));
		gap: 10px;
		padding: 18px;
		border-radius: 28px;
		background:
			radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--slot-grid-glow, #6bd6ff) 18%, transparent), transparent 38%),
			var(--slot-reel-bg, linear-gradient(180deg, rgba(8, 16, 26, 0.98), rgba(6, 12, 18, 0.96)));
		border: 1px solid var(--slot-reel-border, rgba(255, 255, 255, 0.08));
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 22px 40px rgba(0, 0, 0, 0.32);
	}

	.reel-window {
		position: relative;
		block-size: calc(96px * var(--visible-rows));
		overflow: hidden;
		border-radius: 22px;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)),
			var(--slot-reel-bg, linear-gradient(180deg, rgba(8, 16, 26, 0.98), rgba(6, 12, 18, 0.96)));
		border: 1px solid var(--slot-reel-border, rgba(255, 255, 255, 0.08));
		box-shadow: inset 0 0 28px rgba(0, 0, 0, 0.34);
	}

	.reel-window[data-phase='spinning'] {
		box-shadow:
			inset 0 0 28px rgba(0, 0, 0, 0.34),
			0 0 24px color-mix(in srgb, var(--slot-grid-glow, #6bd6ff) 20%, transparent);
	}

	.reel-glow,
	.reel-glass {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.reel-glow {
		background:
			radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--slot-grid-glow, #6bd6ff) 16%, transparent), transparent 30%),
			radial-gradient(circle at 50% 88%, color-mix(in srgb, var(--slot-grid-glow, #6bd6ff) 12%, transparent), transparent 30%);
		opacity: 0.9;
	}

	.reel-glass {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 24%, transparent 76%, rgba(255, 255, 255, 0.05)),
			var(--slot-reel-glass, linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02)));
		mix-blend-mode: screen;
		opacity: 0.7;
	}

	.reel-track {
		position: absolute;
		inset-inline: 0;
		top: 0;
		will-change: transform, filter;
	}

	.reel-cell {
		display: grid;
		place-items: center;
		block-size: 96px;
		padding: 6px;
	}
</style>

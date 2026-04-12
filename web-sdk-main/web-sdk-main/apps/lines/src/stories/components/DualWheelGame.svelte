<script lang="ts">
	import { onDestroy } from 'svelte';
	import DualWheelBoard from './DualWheelBoard.svelte';
	import {
		autoplayPresets,
		BONUS_ROUND_CONFIG,
		BLUE_WHEEL_SEGMENTS,
		DESIGN_RTP_TARGET,
		GAP,
		LIVE_BASE_GAME_WHEEL_PROFILE,
		paylines,
		paytable,
		PREVIEW_BONUS_BUY_MULTIPLIERS,
		RED_INNER_SEGMENTS,
		RED_OUTER_SEGMENTS,
		reelStatesDefault,
		reelStrips,
		REELS,
		regularSymbols,
		ROWS,
		SIZE,
		symbolArtAssets,
		symbolMeta,
		wheelSymbolAssets,
		WHEEL_SEGMENT_ANGLE,
		PRODUCT_MAX_WIN_TARGET,
	} from './dualWheelWorkshopConfig';
	import {
		buildLiveSpinMath,
		buildWheelQueue as buildWheelQueueFromEngine,
		buildWheelResults as buildWheelResultsFromEngine,
		cellKey as cellKeyFromEngine,
		deriveSpinMood as deriveSpinMoodFromEngine,
		evaluateBoard as evaluateBoardFromEngine,
		isWild as isWildFromEngine,
		randomLiveBaseGameBoard as randomLiveBaseGameBoardFromEngine,
		simulateBonusRoundSession,
		type LiveSpinMathResult,
		wheelPositionKey as wheelPositionKeyFromEngine,
	} from './dualWheelEngine';
	import type {
		ActiveWheelState,
		AudioCueDetail,
		AudioCueImportance,
		BonusMode,
		LineTone,
		LineResult,
		Point,
		Position,
		ReelAnticipation,
		RegularSymbolId,
		ResolvedWheelState,
		RoundState,
		SpinMood,
		SymbolId,
		TimingConfig,
		WheelAward,
		WheelResultBurst,
	} from './dualWheelWorkshopTypes';

	/* ── Types ────────────────────────────────────────────── */

	type StageTone = 'idle' | 'medium' | 'big';
	type BonusPreviewState = {
		mode: BonusMode;
		totalSpins: number;
		cost: number;
		totalPaid: number;
		currentSpin: number;
		accumulatedWin: number;
		stickyWheels: boolean;
	};

	let showInfoPanel = false;

	/* ── Constants ─────────────────────────────────────────── */

	const LIVE_BALANCE_START = 1000;
	const liveBetOptions = [0.2, 0.4, 1, 2, 5, 10] as const;

	/* ── State ─────────────────────────────────────────────── */

	let displayBoard = randomLiveBaseGameBoard();
	let betSize = 1;
	let liveBalance = LIVE_BALANCE_START;
	let liveBetIndex = liveBetOptions.findIndex((value) => value === 1);
	let roundState: RoundState = 'idle';
	let reelStates = [...reelStatesDefault];
	let lineResults: LineResult[] = [];
	let totalWin = 0;
	let activeLineIndex = -1;
	let animatedTotalWin = 0;
	let showTotalWin = false;
	let spinCounter = 0;
	let showPayoutChip = false;
	let activeWheelState: ActiveWheelState | null = null;
	let resolvedWheelStates: Record<string, ResolvedWheelState> = {};
	let wheelResultBursts: WheelResultBurst[] = [];
	let wheelResultBurstId = 0;
	let quickSpinEnabled = false;
	let autoplayEnabled = false;
	let autoplayPreset = autoplayPresets[0];
	let autoplaySpinsRemaining = 0;
	let autoplayTimeoutHandle = 0;

	const animationFrames: number[] = [];
	const timeouts: number[] = [];
	const reelIndices = Array.from({ length: REELS }, (_, index) => index);
	let countupFrame = 0;

	let currentSpinMood: SpinMood = 'base';
	let reelAnticipation: ReelAnticipation[] = Array(REELS).fill('none');
	let timingConfig: TimingConfig = getTimingConfig(false, currentSpinMood);
	let activeLine: LineResult | null = null;
	let activeLinePoints: Point[] = [];
	let activeLinePath = '';
	let activePayoutPoint: Point | null = null;
	let totalMultiplier = 0;
	let canSpin = true;
	let canStop = false;
	let canSkip = false;
	let statusLabel = 'Ready';
	let activeWheelMessageState = { title: '', detail: '' };
	let activeStageTone: StageTone = 'idle';
	let activeLineTone: LineTone | null = null;
	let blueWheelOverlayStyle = '';
	let redWheelOverlayStyle = '';
	let lastPaidWin = 0;
	let sessionNet = 0;
	let stopRequested = false;
	let stopRequestedAt = 0;
	let resolveSkipRequested = false;
	const skipResolvers: Array<() => void> = [];
	let bonusPreviewState: BonusPreviewState | null = null;
	let regularBuyCost = betSize * PREVIEW_BONUS_BUY_MULTIPLIERS.regular;
	let superBuyCost = betSize * PREVIEW_BONUS_BUY_MULTIPLIERS.super;
	let canBuyRegular = false;
	let canBuySuper = false;
	let totalWinKicker = '50x Threshold Reached';
	let totalWinTitle = 'Total Win';
	let totalWinSubline = '0x of bet';
	let featureSpinsRemaining = 0;
	let featureBannerTitle = '';
	let featureBannerNote = '';
	let autoplayQueueLabel = `${autoplayPreset} ready`;

	/* ── Reactive declarations ─────────────────────────────── */

	$: sessionNet = liveBalance - LIVE_BALANCE_START;
	$: regularBuyCost = liveBetOptions[liveBetIndex] * PREVIEW_BONUS_BUY_MULTIPLIERS.regular;
	$: superBuyCost = liveBetOptions[liveBetIndex] * PREVIEW_BONUS_BUY_MULTIPLIERS.super;
	$: canBuyRegular =
		roundState === 'idle' && !autoplayEnabled && liveBalance >= regularBuyCost;
	$: canBuySuper =
		roundState === 'idle' && !autoplayEnabled && liveBalance >= superBuyCost;
	$: timingConfig = getTimingConfig(quickSpinEnabled, currentSpinMood);
	$: activeLine = activeLineIndex >= 0 ? lineResults[activeLineIndex] : null;
	$: activeLinePoints = activeLine ? activeLine.positions.map(toPoint) : [];
	$: activeLinePath = activeLinePoints
		.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
		.join(' ');
	$: activePayoutPoint =
		showPayoutChip && activeLinePoints.length
			? activeLinePoints[activeLinePoints.length - 1]
			: null;
	$: totalMultiplier = betSize > 0 ? totalWin / betSize : 0;
	$: canSpin = roundState === 'idle' && liveBalance >= liveBetOptions[liveBetIndex];
	$: canStop =
		roundState === 'spinning' &&
		reelStates.some((state) => state === 'spinning' || state === 'braking');
	$: canSkip = roundState === 'showingLines' || roundState === 'countingWin';
	$: autoplayQueueLabel = autoplayEnabled
		? autoplaySpinsRemaining > 0
			? `${autoplaySpinsRemaining} left`
			: 'Final spin'
		: `${autoplayPreset} ready`;
	$: statusLabel =
		roundState === 'spinning'
			? stopRequested
				? 'Stopping reels'
				: reelStates[REELS - 1] === 'braking'
					? 'Final reel holding'
					: 'Reels spinning'
			: roundState === 'showingLines'
				? resolveSkipRequested
					? 'Skipping reveal'
					: activeWheelState
						? `Resolving ${activeWheelState.type === 'blue' ? 'blue' : 'red'} wheel`
						: activeLine
							? `Line ${activeLineIndex + 1} of ${lineResults.length}`
							: 'Showing winning lines'
				: roundState === 'countingWin'
					? resolveSkipRequested
						? 'Skipping count-up'
						: 'Counting total win'
					: liveBalance < liveBetOptions[liveBetIndex]
						? 'Insufficient balance'
						: autoplayEnabled
							? `Autoplay ${autoplaySpinsRemaining > 0 ? `${autoplaySpinsRemaining} left` : 'final spin'}`
							: 'Ready';
	$: activeWheelMessageState = activeWheelMessage(activeWheelState);
	$: activeLineTone = activeLine ? resultTone(activeLine) : null;
	$: activeStageTone = showTotalWin
		? 'big'
		: activeWheelState?.type === 'red'
			? 'big'
			: activeWheelState
				? 'medium'
				: activeLine && resultTone(activeLine) === 'big'
					? 'big'
					: activeLine && resultTone(activeLine) === 'medium'
						? 'medium'
						: 'idle';
	$: blueWheelOverlayStyle = blueWheelStyle(activeWheelState);
	$: redWheelOverlayStyle = redWheelStyle(activeWheelState);
	$: featureSpinsRemaining = bonusPreviewState
		? Math.max(bonusPreviewState.totalSpins - bonusPreviewState.currentSpin, 0)
		: 0;
	$: featureBannerTitle = !bonusPreviewState
		? ''
		: bonusPreviewState.currentSpin === 0
			? `Launching ${bonusPreviewState.totalSpins} free spins`
			: `${featureSpinsRemaining} free spins remaining`;
	$: featureBannerNote = !bonusPreviewState
		? ''
		: bonusPreviewState.currentSpin === 0
			? bonusPreviewState.stickyWheels
				? 'Sticky wheel values stay locked for the full feature.'
				: 'Wheel frequency is boosted for the full feature.'
			: `Spin ${bonusPreviewState.currentSpin}/${bonusPreviewState.totalSpins} · GC ${formatValue(
					bonusPreviewState.accumulatedWin,
				)} collected`;
	$: totalWinKicker = bonusPreviewState
		? `${bonusModeLabel(bonusPreviewState.mode)} bonus complete`
		: '50x Threshold Reached';
	$: totalWinTitle = bonusPreviewState ? 'Feature Win' : 'Total Win';
	$: totalWinSubline = bonusPreviewState
		? `${formatMultiplier(totalMultiplier)} of stake`
		: `${formatMultiplier(totalMultiplier)} of bet`;

	/* ── Lifecycle ─────────────────────────────────────────── */

	onDestroy(() => {
		clearWork();
	});

	/* ── Timing ────────────────────────────────────────────── */

	function getTimingConfig(quickSpin: boolean, spinMood: SpinMood): TimingConfig {
		if (quickSpin) {
			switch (spinMood) {
				case 'dead':
					return { reelInterval: 36, reelStopBase: 220, reelStopStep: 38, landing: 100, resolveDelay: 40, lineIntro: 80, lineHold: 400, lineGap: 70, blueResolve: 900, blueLocked: 220, redOuterResolve: 900, redOuterLocked: 180, redInnerResolve: 700, redLocked: 220, totalWinCount: 1100, totalWinHold: 420, autoplayPause: 120 };
				case 'feature':
					return { reelInterval: 44, reelStopBase: 430, reelStopStep: 70, landing: 150, resolveDelay: 120, lineIntro: 120, lineHold: 620, lineGap: 110, blueResolve: 1300, blueLocked: 280, redOuterResolve: 1300, redOuterLocked: 260, redInnerResolve: 980, redLocked: 280, totalWinCount: 1500, totalWinHold: 560, autoplayPause: 220 };
				case 'big':
					return { reelInterval: 46, reelStopBase: 520, reelStopStep: 80, landing: 170, resolveDelay: 160, lineIntro: 140, lineHold: 700, lineGap: 120, blueResolve: 1400, blueLocked: 300, redOuterResolve: 1450, redOuterLocked: 300, redInnerResolve: 1100, redLocked: 320, totalWinCount: 1700, totalWinHold: 700, autoplayPause: 260 };
				default:
					return { reelInterval: 44, reelStopBase: 360, reelStopStep: 60, landing: 140, resolveDelay: 100, lineIntro: 100, lineHold: 560, lineGap: 90, blueResolve: 1100, blueLocked: 260, redOuterResolve: 1050, redOuterLocked: 220, redInnerResolve: 820, redLocked: 260, totalWinCount: 1300, totalWinHold: 520, autoplayPause: 160 };
			}
		}
		switch (spinMood) {
			case 'dead':
				return { reelInterval: 70, reelStopBase: 480, reelStopStep: 56, landing: 180, resolveDelay: 80, lineIntro: 120, lineHold: 620, lineGap: 100, blueResolve: 1700, blueLocked: 360, redOuterResolve: 1600, redOuterLocked: 300, redInnerResolve: 1200, redLocked: 360, totalWinCount: 1600, totalWinHold: 700, autoplayPause: 260 };
			case 'feature':
				return { reelInterval: 84, reelStopBase: 900, reelStopStep: 96, landing: 280, resolveDelay: 240, lineIntro: 260, lineHold: 1040, lineGap: 220, blueResolve: 3200, blueLocked: 560, redOuterResolve: 3000, redOuterLocked: 520, redInnerResolve: 2200, redLocked: 640, totalWinCount: 2400, totalWinHold: 1300, autoplayPause: 640 };
			case 'big':
				return { reelInterval: 86, reelStopBase: 1020, reelStopStep: 112, landing: 320, resolveDelay: 320, lineIntro: 320, lineHold: 1160, lineGap: 240, blueResolve: 3400, blueLocked: 620, redOuterResolve: 3300, redOuterLocked: 620, redInnerResolve: 2450, redLocked: 720, totalWinCount: 2800, totalWinHold: 1500, autoplayPause: 720 };
			default:
				return { reelInterval: 82, reelStopBase: 760, reelStopStep: 80, landing: 260, resolveDelay: 180, lineIntro: 220, lineHold: 920, lineGap: 180, blueResolve: 2800, blueLocked: 520, redOuterResolve: 2600, redOuterLocked: 420, redInnerResolve: 1900, redLocked: 580, totalWinCount: 2200, totalWinHold: 1200, autoplayPause: 560 };
		}
	}

	/* ── Formatting helpers ────────────────────────────────── */

	function formatValue(value: number): string { return value.toFixed(2); }
	function formatMultiplier(value: number): string { return Number.isInteger(value) ? `${value}x` : `${value.toFixed(1)}x`; }
	function formatSignedValue(value: number): string {
		const absolute = Math.abs(value).toFixed(2);
		if (value > 0) return `+${absolute}`;
		if (value < 0) return `-${absolute}`;
		return absolute;
	}
	function formatPercent(value: number): string { return `${(value * 100).toFixed(0)}%`; }
	function bonusModeLabel(mode: BonusMode): string { return mode === 'regular' ? 'Regular' : 'Super'; }

	/* ── Engine wrappers ──────────────────────────────────── */

	function randomLiveBaseGameBoard(): SymbolId[][] { return randomLiveBaseGameBoardFromEngine(); }
	function cellKey(row: number, column: number): string { return cellKeyFromEngine(row, column); }
	function wheelPositionKey(position: Position): string { return wheelPositionKeyFromEngine(position); }
	function isWild(symbol: SymbolId): boolean { return isWildFromEngine(symbol); }
	function evaluateBoard(sourceBoard: SymbolId[][], wheelResults: Record<string, WheelAward>, bet: number): LineResult[] { return evaluateBoardFromEngine(sourceBoard, wheelResults, bet); }
	function deriveSpinMood(results: LineResult[], bet: number): SpinMood { return deriveSpinMoodFromEngine(results, bet); }
	function buildWheelQueue(results: LineResult[]): LineResult['wheels'] { return buildWheelQueueFromEngine(results); }

	/* ── Board / reel helpers ─────────────────────────────── */

	function cloneBoard(source: SymbolId[][]): SymbolId[][] { return source.map((row) => [...row]); }

	function randomColumnWindow(column: number): SymbolId[] {
		const strip = reelStrips[column];
		const start = Math.floor(Math.random() * strip.length);
		return Array.from({ length: ROWS }, (_, offset) => strip[(start + offset) % strip.length]);
	}

	function rotateColumnWindow(values: SymbolId[], offset: number): SymbolId[] {
		const length = values.length;
		if (!length) return values;
		const normalized = ((offset % length) + length) % length;
		if (normalized === 0) return [...values];
		return Array.from({ length }, (_, index) => values[(index + normalized) % length]);
	}

	function stripWindowAt(column: number, start: number): SymbolId[] {
		const strip = reelStrips[column];
		return Array.from({ length: ROWS }, (_, offset) => strip[(start + offset) % strip.length]);
	}

	function findTargetWindowStart(column: number, targetColumn: SymbolId[]): number {
		const strip = reelStrips[column];
		for (let start = 0; start < strip.length; start += 1) {
			if (targetColumn.every((symbol, offset) => strip[(start + offset) % strip.length] === symbol)) return start;
		}
		return -1;
	}

	function replaceColumn(source: SymbolId[][], column: number, values: SymbolId[]): SymbolId[][] {
		return source.map((row, rowIndex) => {
			const next = [...row];
			next[column] = values[rowIndex];
			return next;
		});
	}

	function columnValues(source: SymbolId[][], column: number): SymbolId[] {
		return source.map((row) => row[column]);
	}

	/* ── Anticipation ─────────────────────────────────────── */

	function strongerReelAnticipation(left: ReelAnticipation, right: ReelAnticipation): ReelAnticipation {
		if (left === 'wheel' || right === 'wheel') return 'wheel';
		if (left === 'premium' || right === 'premium') return 'premium';
		return 'none';
	}

	function deriveReelAnticipation(sourceBoard: SymbolId[][], results: LineResult[]): ReelAnticipation[] {
		const signals: ReelAnticipation[] = Array(REELS).fill('none');
		for (const result of results) {
			if (symbolMeta[result.symbol].tier === 'gold') {
				for (const position of result.positions) {
					if (position.column >= 2) signals[position.column] = strongerReelAnticipation(signals[position.column], 'premium');
				}
			}
			for (const wheel of result.wheels) {
				if (wheel.column > 2) signals[wheel.column - 1] = strongerReelAnticipation(signals[wheel.column - 1], 'premium');
				signals[wheel.column] = strongerReelAnticipation(signals[wheel.column], 'wheel');
			}
		}
		for (let column = 2; column < REELS; column += 1) {
			if (signals[column] !== 'none') continue;
			if (sourceBoard.some((row) => row[column] === 'blueWheel' || row[column] === 'redWheel')) signals[column] = 'premium';
		}
		return signals;
	}

	function anticipationDelayBonus(index: number, signal: ReelAnticipation): number {
		if (index < 2) return 0;
		if (signal === 'wheel') return quickSpinEnabled ? 70 : 150;
		if (signal === 'premium') return quickSpinEnabled ? 36 : 84;
		return 0;
	}

	function finalReelBrakeLead(signal: ReelAnticipation): number {
		if (signal === 'wheel') return quickSpinEnabled ? 120 : 240;
		if (signal === 'premium') return quickSpinEnabled ? 70 : 140;
		return 0;
	}

	function approachOffsets(signal: ReelAnticipation): number[] {
		if (signal === 'wheel') return [6, 5, 4, 3, 2, 2, 1, 1, 0];
		if (signal === 'premium') return [3, 2, 2, 1, 0];
		return [0];
	}

	function interpolate(start: number, end: number, progress: number): number {
		return start + (end - start) * progress;
	}

	function brakingPreviewProgress(signal: ReelAnticipation, progress: number): number {
		const clamped = Math.max(0, Math.min(1, progress));
		if (signal === 'wheel') return Math.pow(clamped, quickSpinEnabled ? 1.16 : 1.32);
		if (signal === 'premium') return Math.pow(clamped, quickSpinEnabled ? 1.04 : 1.1);
		return clamped;
	}

	function brakingSwapIntervalMultiplier(signal: ReelAnticipation, progress: number): number {
		const clamped = Math.max(0, Math.min(1, progress));
		if (signal === 'wheel') return interpolate(quickSpinEnabled ? 2.15 : 2.45, quickSpinEnabled ? 3.25 : 3.8, clamped);
		if (signal === 'premium') return interpolate(quickSpinEnabled ? 1.7 : 1.9, quickSpinEnabled ? 2.15 : 2.45, clamped);
		return 1;
	}

	function brakingPreviewColumn(column: number, targetColumn: SymbolId[], signal: ReelAnticipation, progress: number): SymbolId[] {
		const offsets = approachOffsets(signal);
		const easedProgress = brakingPreviewProgress(signal, progress);
		const previewIndex = Math.min(offsets.length - 1, Math.floor(easedProgress * (offsets.length - 1)));
		const offset = offsets[previewIndex] ?? 0;
		if (offset === 0) return [...targetColumn];
		const stripStart = findTargetWindowStart(column, targetColumn);
		if (stripStart >= 0) {
			const targetStart = (stripStart - offset + reelStrips[column].length) % reelStrips[column].length;
			return stripWindowAt(column, targetStart);
		}
		return rotateColumnWindow(targetColumn, offset);
	}

	/* ── Segment helpers ──────────────────────────────────── */

	function segmentRotation(index: number): number { return -index * WHEEL_SEGMENT_ANGLE; }

	function pickSegmentIndex(segments: readonly number[], value: number, seed: number): number {
		const matches = segments.map((segment, index) => ({ segment, index })).filter(({ segment }) => segment === value).map(({ index }) => index);
		if (!matches.length) return 0;
		return matches[Math.abs(seed) % matches.length];
	}

	/* ── Audio cues ───────────────────────────────────────── */

	function cueImportance(cue: string): AudioCueImportance {
		if (cue.startsWith('wheel.red') || cue === 'win.big' || cue.startsWith('win.countup')) return 'big';
		if (cue.startsWith('wheel.blue') || cue.startsWith('line.') || cue === 'win.medium' || cue === 'reels.settled') return 'feature';
		if (cue.startsWith('spin.') || cue.startsWith('reel.')) return 'ambient';
		return 'light';
	}

	function emitAudioCue(cue: string, payload: AudioCueDetail['payload'] = {}): void {
		const detail: AudioCueDetail = {
			cue,
			timestamp: typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now(),
			spin: spinCounter,
			roundState,
			mood: currentSpinMood,
			importance: cueImportance(cue),
			payload,
		};
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('dual-wheel-audio-cue', { detail }));
		}
	}

	/* ── Async helpers ────────────────────────────────────── */

	function trackedTimeout(callback: () => void, delay: number): number {
		const handle = window.setTimeout(callback, delay);
		timeouts.push(handle);
		return handle;
	}

	function trackedAnimationFrame(callback: FrameRequestCallback): number {
		let handle = 0;
		handle = requestAnimationFrame((timestamp) => {
			const index = animationFrames.indexOf(handle);
			if (index >= 0) animationFrames.splice(index, 1);
			callback(timestamp);
		});
		animationFrames.push(handle);
		return handle;
	}

	function wait(duration: number): Promise<void> {
		return new Promise((resolve) => { trackedTimeout(resolve, duration); });
	}

	function waitMaybeSkip(duration: number): Promise<void> {
		if (!resolveSkipRequested) {
			return new Promise((resolve) => {
				const timeoutHandle = trackedTimeout(() => {
					const index = skipResolvers.indexOf(resolveWithSkip);
					if (index >= 0) skipResolvers.splice(index, 1);
					resolve();
				}, duration);
				function resolveWithSkip(): void {
					window.clearTimeout(timeoutHandle);
					resolve();
				}
				skipResolvers.push(resolveWithSkip);
			});
		}
		return Promise.resolve();
	}

	/* ── State management ────────────────────────────────── */

	function stopAutoplayQueue(): void {
		if (autoplayTimeoutHandle) { window.clearTimeout(autoplayTimeoutHandle); autoplayTimeoutHandle = 0; }
	}

	function clearStopRequest(): void { stopRequested = false; stopRequestedAt = 0; }

	function releaseSkipResolvers(): void { while (skipResolvers.length) skipResolvers.pop()?.(); }

	function clearResolveSkip(): void { resolveSkipRequested = false; releaseSkipResolvers(); }

	function clearWork(): void {
		stopAutoplayQueue();
		while (animationFrames.length) { const handle = animationFrames.pop(); if (handle) cancelAnimationFrame(handle); }
		while (timeouts.length) { const handle = timeouts.pop(); if (handle) window.clearTimeout(handle); }
		if (countupFrame) { cancelAnimationFrame(countupFrame); countupFrame = 0; }
	}

	function clearRoundVisuals(options: { preserveBonusPreview?: boolean; preserveResolvedWheels?: boolean } = {}): void {
		lineResults = [];
		totalWin = 0;
		activeLineIndex = -1;
		showPayoutChip = false;
		activeWheelState = null;
		if (!options.preserveResolvedWheels) resolvedWheelStates = {};
		wheelResultBursts = [];
		reelAnticipation = Array(REELS).fill('none');
		showTotalWin = false;
		animatedTotalWin = 0;
		if (!options.preserveBonusPreview) bonusPreviewState = null;
		clearStopRequest();
		clearResolveSkip();
	}

	function settleLiveBalance(payout: number): void {
		if (payout <= 0) return;
		liveBalance += payout;
		lastPaidWin = payout;
	}

	/* ── Wheel state helpers ──────────────────────────────── */

	function resolvedStatesFromWheelResults(wheelResults: Record<string, WheelAward>): Record<string, ResolvedWheelState> {
		return Object.fromEntries(
			Object.entries(wheelResults).map(([key, award]) => {
				const [row, column] = key.split('-').map(Number);
				return [key, award.type === 'blue'
					? { row, column, type: 'blue', total: award.value }
					: { row, column, type: 'red', total: award.outer * award.inner, outer: award.outer, inner: award.inner }];
			}),
		);
	}

	function storeResolvedWheelState(wheel: LineResult['wheels'][number]): void {
		const key = wheelPositionKey(wheel);
		resolvedWheelStates = {
			...resolvedWheelStates,
			[key]: wheel.type === 'blue'
				? { row: wheel.row, column: wheel.column, type: 'blue', total: wheel.total }
				: { row: wheel.row, column: wheel.column, type: 'red', total: wheel.total, outer: wheel.outer, inner: wheel.inner },
		};
	}

	function showWheelResultBurst(wheel: LineResult['wheels'][number]): void {
		wheelResultBurstId += 1;
		const burst = { id: wheelResultBurstId, row: wheel.row, column: wheel.column, type: wheel.type, total: wheel.total, outer: wheel.outer, inner: wheel.inner };
		wheelResultBursts = [...wheelResultBursts.filter((e) => e.row !== burst.row || e.column !== burst.column), burst];
	}

	/* ── Display helpers ──────────────────────────────────── */

	function blueWheelStyle(wheel: ActiveWheelState | null): string {
		if (!wheel || wheel.type !== 'blue') return '';
		const target = (quickSpinEnabled ? 1800 : 2880) + segmentRotation(wheel.blueIndex ?? 0);
		return `--wheel-target:${target}deg; --wheel-duration:${timingConfig.blueResolve}ms;`;
	}

	function redWheelStyle(wheel: ActiveWheelState | null): string {
		if (!wheel || wheel.type !== 'red') return '';
		const outerTarget = (quickSpinEnabled ? 2160 : 3240) + segmentRotation(wheel.outerIndex ?? 0);
		const innerTarget = -((quickSpinEnabled ? 1440 : 2160) + (wheel.innerIndex ?? 0) * WHEEL_SEGMENT_ANGLE);
		return `--outer-target:${outerTarget}deg; --outer-duration:${timingConfig.redOuterResolve}ms; --inner-target:${innerTarget}deg; --inner-duration:${timingConfig.redInnerResolve}ms;`;
	}

	function activeWheelMessage(wheel: ActiveWheelState | null): { title: string; detail: string } {
		if (!wheel) return { title: '', detail: '' };
		if (wheel.type === 'blue') {
			return wheel.phase === 'blue-spinning'
				? { title: 'Blue wheel spinning...', detail: `target ${formatMultiplier(wheel.total)}` }
				: { title: `+${formatMultiplier(wheel.total)}`, detail: 'reused on every winning line' };
		}
		if (wheel.phase === 'red-outer-spinning') return { title: 'Outer wheel spinning...', detail: `seeking ${formatMultiplier(wheel.outer ?? 0)}` };
		if (wheel.phase === 'red-outer-locked') return { title: `Outer landed ${formatMultiplier(wheel.outer ?? 0)}`, detail: 'inner wheel loading' };
		if (wheel.phase === 'red-inner-spinning') return { title: 'Inner wheel spinning...', detail: `outer ${formatMultiplier(wheel.outer ?? 0)}` };
		return { title: `+${formatMultiplier(wheel.total)}`, detail: `${formatMultiplier(wheel.outer ?? 0)} x ${formatMultiplier(wheel.inner ?? 0)}` };
	}

	function toPoint(position: Position): Point {
		return { x: position.column * (SIZE + GAP) + SIZE / 2, y: position.row * (SIZE + GAP) + SIZE / 2 };
	}

	function resultTone(result: LineResult): LineTone {
		if (result.wheels.some((wheel) => wheel.type === 'red')) return 'big';
		if (result.wheels.length || result.totalMultiplier >= 12) return 'medium';
		return 'small';
	}

	function showcaseTimingFor(result: LineResult): { intro: number; hold: number; gap: number } {
		switch (resultTone(result)) {
			case 'small': return { intro: Math.max(40, Math.round(timingConfig.lineIntro * 0.56)), hold: Math.max(180, Math.round(timingConfig.lineHold * 0.48)), gap: Math.max(40, Math.round(timingConfig.lineGap * 0.5)) };
			case 'big': return { intro: Math.round(timingConfig.lineIntro * 1.12), hold: Math.round(timingConfig.lineHold * 1.16), gap: Math.round(timingConfig.lineGap * 1.08) };
			default: return { intro: timingConfig.lineIntro, hold: timingConfig.lineHold, gap: timingConfig.lineGap };
		}
	}

	function resultCue(result: LineResult): string {
		if (result.wheels.some((wheel) => wheel.type === 'red')) return 'win.big';
		if (result.wheels.length || result.totalMultiplier >= 12) return 'win.medium';
		return 'win.small';
	}

	function wheelSummary(result: LineResult): string {
		if (!result.wheels.length) return 'No wheel bonus';
		return result.wheels.map((wheel) => wheel.type === 'blue'
			? `Blue +${formatMultiplier(wheel.total)}`
			: `Red ${formatMultiplier(wheel.outer ?? 0)} x ${formatMultiplier(wheel.inner ?? 0)}`
		).join(' | ');
	}

	/* ── Core animation pipeline ──────────────────────────── */

	async function animateReelsTo(targetBoard: SymbolId[][], anticipation: ReelAnticipation[]): Promise<void> {
		reelStates = Array(REELS).fill('spinning');
		displayBoard = randomLiveBaseGameBoard();
		const targetColumns = Array.from({ length: REELS }, (_, column) => columnValues(targetBoard, column));
		const spinStart = performance.now();
		const manualStopStep = quickSpinEnabled ? 34 : 56;
		const manualBrakeLead = quickSpinEnabled ? 42 : 72;

		await Promise.all(
			Array.from({ length: REELS }, (_, column) => {
				return new Promise<void>((resolve) => {
					const swapInterval = timingConfig.reelInterval + column * (quickSpinEnabled ? 2 : 5);
					const naturalBrakeLead = column === REELS - 1 ? finalReelBrakeLead(anticipation[column]) : 0;
					const naturalStopAt = spinStart + timingConfig.reelStopBase + column * timingConfig.reelStopStep + anticipationDelayBonus(column, anticipation[column]);
					let lastSwap = spinStart - swapInterval;
					let braking = false;
					let settled = false;

					const step = (now: number): void => {
						if (settled) return;
						const manualStopAt = stopRequested ? stopRequestedAt + column * manualStopStep : Number.POSITIVE_INFINITY;
						const manualStopActive = manualStopAt <= naturalStopAt;
						const effectiveStopAt = manualStopActive ? manualStopAt : naturalStopAt;
						const effectiveBrakeLead = manualStopActive ? Math.max(manualBrakeLead, Math.min(naturalBrakeLead, manualBrakeLead)) : naturalBrakeLead;
						const brakeStartAt = effectiveStopAt - effectiveBrakeLead;

						if (!braking && effectiveBrakeLead > 0 && now >= brakeStartAt) {
							braking = true;
							lastSwap = now;
							reelStates = reelStates.map((state, index) => (index === column ? 'braking' : state));
							emitAudioCue('reel.brake', { reel: column + 1, anticipation: anticipation[column], manualStop: manualStopActive, remainingMs: Math.max(0, Math.round(effectiveStopAt - now)) });
						}

						const brakeProgress = braking && effectiveBrakeLead > 0 ? Math.max(0, Math.min(1, (now - brakeStartAt) / Math.max(effectiveBrakeLead, 1))) : 0;
						const effectiveSwapInterval = braking
							? manualStopActive
								? Math.max(16, Math.round(swapInterval * interpolate(quickSpinEnabled ? 0.55 : 0.68, quickSpinEnabled ? 0.95 : 1.22, brakeProgress)))
								: Math.round(swapInterval * brakingSwapIntervalMultiplier(anticipation[column], brakeProgress))
							: swapInterval;

						if (now - lastSwap >= effectiveSwapInterval) {
							const nextColumn = braking && !manualStopActive && anticipation[column] !== 'none'
								? brakingPreviewColumn(column, targetColumns[column], anticipation[column], brakeProgress)
								: randomColumnWindow(column);
							displayBoard = replaceColumn(displayBoard, column, nextColumn);
							lastSwap = now;
						}

						if (now >= effectiveStopAt) {
							settled = true;
							reelStates = reelStates.map((state, index) => (index === column ? 'landing' : state));
							displayBoard = replaceColumn(displayBoard, column, targetColumns[column]);
							emitAudioCue('reel.stop', { reel: column + 1, final: column === REELS - 1, quickSpin: quickSpinEnabled, anticipation: anticipation[column], manualStop: manualStopActive, elapsedMs: Math.round(now - spinStart) });
							trackedTimeout(() => {
								reelStates = reelStates.map((state, index) => (index === column ? 'idle' : state));
								resolve();
							}, timingConfig.landing);
							return;
						}
						trackedAnimationFrame(step);
					};
					trackedAnimationFrame(step);
				});
			}),
		);
		clearStopRequest();
	}

	async function resolveWheelQueue(queue: LineResult['wheels']): Promise<void> {
		for (const [index, wheel] of queue.entries()) {
			const seed = wheel.row * REELS + wheel.column + index;
			if (wheel.type === 'blue') {
				activeWheelState = { ...wheel, phase: 'blue-spinning', blueIndex: pickSegmentIndex(BLUE_WHEEL_SEGMENTS, wheel.total, seed) };
				emitAudioCue('wheel.blue.spin', { row: wheel.row, column: wheel.column, total: wheel.total });
				await waitMaybeSkip(timingConfig.blueResolve);
				activeWheelState = { ...activeWheelState, phase: 'blue-locked' } as ActiveWheelState;
				storeResolvedWheelState(wheel);
				showWheelResultBurst(wheel);
				emitAudioCue('wheel.blue.lock', { row: wheel.row, column: wheel.column, total: wheel.total });
				await waitMaybeSkip(timingConfig.blueLocked);
				activeWheelState = null;
				continue;
			}
			activeWheelState = { ...wheel, phase: 'red-outer-spinning', outerIndex: pickSegmentIndex(RED_OUTER_SEGMENTS, wheel.outer ?? 0, seed), innerIndex: pickSegmentIndex(RED_INNER_SEGMENTS, wheel.inner ?? 0, seed + 1) };
			emitAudioCue('wheel.red.outer.spin', { row: wheel.row, column: wheel.column, outer: wheel.outer ?? 0, inner: wheel.inner ?? 0 });
			await waitMaybeSkip(timingConfig.redOuterResolve);
			activeWheelState = { ...activeWheelState, phase: 'red-outer-locked' } as ActiveWheelState;
			emitAudioCue('wheel.red.outer.lock', { row: wheel.row, column: wheel.column, outer: wheel.outer ?? 0 });
			await waitMaybeSkip(timingConfig.redOuterLocked);
			activeWheelState = { ...activeWheelState, phase: 'red-inner-spinning' } as ActiveWheelState;
			emitAudioCue('wheel.red.inner.spin', { row: wheel.row, column: wheel.column, outer: wheel.outer ?? 0, inner: wheel.inner ?? 0 });
			await waitMaybeSkip(timingConfig.redInnerResolve);
			activeWheelState = { ...activeWheelState, phase: 'red-locked' } as ActiveWheelState;
			storeResolvedWheelState(wheel);
			showWheelResultBurst(wheel);
			emitAudioCue('wheel.red.final', { row: wheel.row, column: wheel.column, outer: wheel.outer ?? 0, inner: wheel.inner ?? 0, total: wheel.total });
			await waitMaybeSkip(timingConfig.redLocked);
			activeWheelState = null;
		}
	}

	async function playLineShowcase(results: LineResult[]): Promise<void> {
		if (resolveSkipRequested) { activeLineIndex = -1; showPayoutChip = false; return; }
		for (const [index, result] of results.entries()) {
			const showcaseTiming = showcaseTimingFor(result);
			const tone = resultTone(result);
			activeLineIndex = index;
			showPayoutChip = false;
			emitAudioCue(resultCue(result), { line: result.lineNumber, tone, payout: result.payout, totalMultiplier: result.totalMultiplier, wheels: result.wheels.length });
			emitAudioCue('line.focus', { line: result.lineNumber, tone, payout: result.payout, totalMultiplier: result.totalMultiplier });
			await waitMaybeSkip(showcaseTiming.intro);
			if (resolveSkipRequested) break;
			showPayoutChip = true;
			emitAudioCue('line.payout', { line: result.lineNumber, tone, payout: result.payout, totalMultiplier: result.totalMultiplier });
			await waitMaybeSkip(showcaseTiming.hold);
			if (resolveSkipRequested) break;
			showPayoutChip = false;
			await waitMaybeSkip(showcaseTiming.gap);
			if (resolveSkipRequested) break;
		}
		activeLineIndex = -1;
		showPayoutChip = false;
	}

	async function playTotalWinCountUp(): Promise<void> {
		showTotalWin = true;
		animatedTotalWin = resolveSkipRequested ? totalWin : 0;
		roundState = 'countingWin';
		emitAudioCue('win.countup', { totalWin, totalMultiplier, lines: lineResults.length });
		if (!resolveSkipRequested) {
			await new Promise<void>((resolve) => {
				const start = performance.now();
				const step = (now: number): void => {
					if (resolveSkipRequested) { animatedTotalWin = totalWin; countupFrame = 0; resolve(); return; }
					const progress = Math.min((now - start) / timingConfig.totalWinCount, 1);
					animatedTotalWin = totalWin * (1 - Math.pow(1 - progress, 3));
					if (progress < 1) { countupFrame = requestAnimationFrame(step); return; }
					animatedTotalWin = totalWin;
					countupFrame = 0;
					resolve();
				};
				countupFrame = requestAnimationFrame(step);
			});
		} else { animatedTotalWin = totalWin; }
		emitAudioCue('win.countup.complete', { totalWin, totalMultiplier });
		if (resolveSkipRequested) {
			await new Promise<void>((resolve) => { trackedTimeout(resolve, quickSpinEnabled ? 180 : 320); });
		} else { await waitMaybeSkip(timingConfig.totalWinHold); }
		showTotalWin = false;
	}

	/* ── User actions ─────────────────────────────────────── */

	function requestStopSpin(): void {
		if (roundState !== 'spinning' || stopRequested) return;
		stopRequested = true;
		stopRequestedAt = performance.now();
		emitAudioCue('spin.stop.request', { quickSpin: quickSpinEnabled, reelsActive: reelStates.filter((state) => state === 'spinning' || state === 'braking').length });
	}

	function requestResolveSkip(): void {
		if ((roundState !== 'showingLines' && roundState !== 'countingWin') || resolveSkipRequested) return;
		resolveSkipRequested = true;
		emitAudioCue('spin.skip.request', { roundState, activeWheel: activeWheelState?.type ?? null, activeLine: activeLine?.lineNumber ?? null });
		releaseSkipResolvers();
	}

	function handleSpinAction(): void {
		if (canStop) { requestStopSpin(); return; }
		if (canSkip) { requestResolveSkip(); return; }
		void spinPrototype();
	}

	function handleTotalWinOverlayClick(): void {
		if (roundState !== 'countingWin' || resolveSkipRequested) return;
		requestResolveSkip();
	}

	function handleTotalWinOverlayKeydown(event: KeyboardEvent): void {
		if (roundState !== 'countingWin' || resolveSkipRequested) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		requestResolveSkip();
	}

	function updateLiveBet(direction: -1 | 1): void {
		if (roundState !== 'idle') return;
		liveBetIndex = Math.max(0, Math.min(liveBetOptions.length - 1, liveBetIndex + direction));
		betSize = liveBetOptions[liveBetIndex];
	}

	function toggleQuickSpin(): void {
		if (roundState !== 'idle' || autoplayEnabled) return;
		quickSpinEnabled = !quickSpinEnabled;
	}

	function toggleAutoplay(): void {
		if (autoplayEnabled) {
			autoplayEnabled = false;
			autoplaySpinsRemaining = 0;
			stopAutoplayQueue();
			emitAudioCue('autoplay.stop', { remaining: 0 });
			return;
		}
		if (!canSpin) return;
		autoplayEnabled = true;
		autoplaySpinsRemaining = autoplayPreset;
		emitAudioCue('autoplay.start', { count: autoplayPreset, bet: liveBetOptions[liveBetIndex] });
		void spinPrototype();
	}

	function bonusBuyCost(mode: BonusMode): number {
		return liveBetOptions[liveBetIndex] * PREVIEW_BONUS_BUY_MULTIPLIERS[mode];
	}

	async function handleBonusBuy(mode: BonusMode): Promise<void> {
		if (roundState !== 'idle' || autoplayEnabled) return;
		const cost = bonusBuyCost(mode);
		if (liveBalance < cost) return;

		stopAutoplayQueue();
		clearWork();
		clearRoundVisuals();

		const currentBet = liveBetOptions[liveBetIndex];
		const session = simulateBonusRoundSession(mode, currentBet);
		const stickyWheels = BONUS_ROUND_CONFIG[mode].stickyWheels;
		let stickyResolvedWheels: Record<string, ResolvedWheelState> = {};
		let accumulatedWin = 0;

		betSize = currentBet;
		lastPaidWin = 0;
		liveBalance = Math.max(0, liveBalance - cost);
		bonusPreviewState = { mode, totalSpins: session.spins.length, cost, totalPaid: session.totalPaid, currentSpin: 0, accumulatedWin: 0, stickyWheels };
		emitAudioCue('bonus.buy.start', { mode, cost, spins: session.spins.length, bet: currentBet, stickyWheels });

		for (const [index, bonusSpin] of session.spins.entries()) {
			clearRoundVisuals({ preserveBonusPreview: true, preserveResolvedWheels: stickyWheels && index > 0 });
			spinCounter += 1;
			roundState = 'spinning';
			currentSpinMood = bonusSpin.totalWin >= currentBet * 50 ? 'big' : bonusSpin.spinMood === 'dead' ? (stickyWheels ? 'feature' : 'base') : bonusSpin.spinMood;
			reelAnticipation = deriveReelAnticipation(bonusSpin.board, bonusSpin.lineResults);
			timingConfig = getTimingConfig(quickSpinEnabled, currentSpinMood);
			bonusPreviewState = { mode, totalSpins: session.spins.length, cost, totalPaid: session.totalPaid, currentSpin: index + 1, accumulatedWin, stickyWheels };

			if (stickyWheels && index > 0) resolvedWheelStates = { ...stickyResolvedWheels };

			emitAudioCue('bonus.spin.start', { mode, spin: index + 1, totalSpins: session.spins.length, stickyWheels });
			await animateReelsTo(cloneBoard(bonusSpin.board), reelAnticipation);
			displayBoard = cloneBoard(bonusSpin.board);
			lineResults = bonusSpin.lineResults;
			totalWin = bonusSpin.totalWin;

			const wheelQueue = stickyWheels && stickyResolvedWheels
				? bonusSpin.wheelQueue.filter((wheel) => !stickyResolvedWheels[wheelPositionKey(wheel)])
				: bonusSpin.wheelQueue;

			emitAudioCue('reels.settled', { lines: bonusSpin.lineResults.length, wheels: wheelQueue.length, totalWin: bonusSpin.totalWin, mode, spin: index + 1 });
			roundState = 'showingLines';
			await wait(timingConfig.resolveDelay);
			if (wheelQueue.length) await resolveWheelQueue(wheelQueue);

			const fullResolvedState = resolvedStatesFromWheelResults(bonusSpin.wheelResults);
			resolvedWheelStates = fullResolvedState;
			if (stickyWheels) stickyResolvedWheels = fullResolvedState;
			if (bonusSpin.lineResults.length) await playLineShowcase(bonusSpin.lineResults);

			accumulatedWin += bonusSpin.totalWin;
			bonusPreviewState = { mode, totalSpins: session.spins.length, cost, totalPaid: session.totalPaid, currentSpin: index + 1, accumulatedWin, stickyWheels };
			emitAudioCue('bonus.spin.complete', { mode, spin: index + 1, spinWin: bonusSpin.totalWin, accumulatedWin });
		}

		totalWin = session.totalPaid;
		if (session.totalPaid > 0) await playTotalWinCountUp();
		settleLiveBalance(session.totalPaid);
		emitAudioCue('bonus.buy.complete', { mode, totalWin: session.totalPaid, stickyWheels, spins: session.spins.length });
		finishRound();
	}

	/* ── Core spin flow ───────────────────────────────────── */

	function finishRound(): void {
		roundState = 'idle';
		reelAnticipation = Array(REELS).fill('none');
		clearResolveSkip();
		if (autoplayEnabled && autoplaySpinsRemaining > 0 && liveBalance >= liveBetOptions[liveBetIndex]) {
			scheduleNextAutoplaySpin();
			return;
		}
		autoplayEnabled = false;
		autoplaySpinsRemaining = 0;
		emitAudioCue('spin.complete', { totalWin, lines: lineResults.length, wheels: buildWheelQueue(lineResults).length });
	}

	function scheduleNextAutoplaySpin(): void {
		stopAutoplayQueue();
		if (liveBalance < liveBetOptions[liveBetIndex]) { autoplayEnabled = false; autoplaySpinsRemaining = 0; return; }
		if (!autoplayEnabled || autoplaySpinsRemaining <= 0) return;
		autoplayTimeoutHandle = trackedTimeout(() => { autoplayTimeoutHandle = 0; void spinPrototype(); }, timingConfig.autoplayPause);
	}

	async function spinPrototype(): Promise<void> {
		if (!canSpin) return;
		stopAutoplayQueue();
		clearRoundVisuals();

		const currentBet = liveBetOptions[liveBetIndex];
		if (liveBalance < currentBet) return;

		const math = buildLiveSpinMath(currentBet);
		betSize = currentBet;
		lastPaidWin = 0;
		liveBalance = Math.max(0, liveBalance - currentBet);
		spinCounter += 1;
		roundState = 'spinning';

		if (autoplayEnabled && autoplaySpinsRemaining > 0) autoplaySpinsRemaining -= 1;

		emitAudioCue(quickSpinEnabled ? 'spin.quick.start' : 'spin.start', { source: 'live', bet: currentBet, quickSpin: quickSpinEnabled, autoplay: autoplayEnabled });

		const finalBoard = cloneBoard(math.board);
		reelAnticipation = deriveReelAnticipation(finalBoard, math.lineResults);
		currentSpinMood = math.spinMood;
		timingConfig = getTimingConfig(quickSpinEnabled, currentSpinMood);
		await animateReelsTo(finalBoard, reelAnticipation);
		displayBoard = finalBoard;
		lineResults = math.lineResults;
		totalWin = math.totalWin;

		emitAudioCue('reels.settled', { lines: math.lineResults.length, wheels: math.wheelQueue.length, totalWin });

		if (!math.lineResults.length) {
			emitAudioCue('spin.dead', { lines: 0, wheels: 0, totalWin: 0 });
			finishRound();
			return;
		}

		roundState = 'showingLines';
		await wait(timingConfig.resolveDelay);
		if (math.wheelQueue.length) await resolveWheelQueue(math.wheelQueue);
		await playLineShowcase(math.lineResults);
		if (totalWin >= betSize * 50) await playTotalWinCountUp();
		settleLiveBalance(totalWin);
		finishRound();
	}
</script>

<div class="game-shell">
	<div class="theme-backdrop" aria-hidden="true">
		<!-- Base stone walls -->
		<div class="env-walls"></div>

		<!-- Gothic arches -->
		<div class="env-arch-center"></div>
		<div class="env-arch-left"></div>
		<div class="env-arch-right"></div>

		<!-- Dual lighting: warm left, cool right -->
		<div class="env-light-warm"></div>
		<div class="env-light-cool"></div>
		<div class="env-light-center"></div>

		<!-- Stone pillars -->
		<div class="env-pillar env-pillar-left"></div>
		<div class="env-pillar env-pillar-right"></div>

		<!-- Torches / candle glow -->
		<div class="env-torch env-torch-left"></div>
		<div class="env-torch env-torch-right"></div>

		<!-- Banners -->
		<div class="env-banner env-banner-left"></div>
		<div class="env-banner env-banner-right"></div>

		<!-- Stone floor -->
		<div class="env-floor"></div>
		<div class="env-floor-light"></div>

		<!-- Atmospheric dust / haze -->
		<div class="env-haze"></div>
		<div class="env-dust env-dust-back"></div>
		<div class="env-dust env-dust-front"></div>

		<!-- Rune carvings on walls -->
		<div class="env-runes"></div>

		<!-- Vignette -->
		<div class="env-vignette"></div>
	</div>

	<!-- Top Bar -->
	<header class="top-bar">
		<div class="top-bar-brand">
			<h1>Dual Wheel Reels</h1>
		</div>
		<div class="top-bar-stats">
			<div class="stat-pill">
				<span>Balance</span>
				<strong>GC {formatValue(liveBalance)}</strong>
			</div>
			<div class="stat-pill">
				<span>Bet</span>
				<strong>GC {formatValue(liveBetOptions[liveBetIndex])}</strong>
			</div>
			<div class="stat-pill">
				<span>Win</span>
				<strong class:metric-positive={lastPaidWin > 0}>GC {formatValue(lastPaidWin)}</strong>
			</div>
		</div>
	</header>

	<!-- Game Stage -->
	<main
		class:game-stage={true}
		class:stage-tone-medium={activeStageTone === 'medium'}
		class:stage-tone-big={activeStageTone === 'big'}
		class:stage-feature-mode={Boolean(bonusPreviewState)}
		class:stage-feature-super={bonusPreviewState?.mode === 'super'}
	>
		{#if bonusPreviewState}
			<div
				class:feature-banner={true}
				class:feature-banner-super={bonusPreviewState.mode === 'super'}
				aria-live="polite"
			>
				<div class="feature-banner-copy">
					<span class="feature-banner-kicker">{bonusModeLabel(bonusPreviewState.mode)} Bonus</span>
					<strong>{featureBannerTitle}</strong>
					<em>{featureBannerNote}</em>
				</div>
				<div class="feature-banner-metrics">
					<div class="feature-banner-stat">
						<span>Remaining</span>
						<strong>{featureSpinsRemaining}</strong>
					</div>
					<div class="feature-banner-stat">
						<span>Collected</span>
						<strong>GC {formatValue(bonusPreviewState.accumulatedWin)}</strong>
					</div>
				</div>
				{#if bonusPreviewState.stickyWheels}
					<div class="feature-sticky-pill">
						<span>Sticky Wheels</span>
						<strong>Any landed wheel keeps its resolved value for all 10 spins.</strong>
					</div>
				{/if}
			</div>
		{/if}

		<DualWheelBoard
			{displayBoard}
			{reelStates}
			{roundState}
			spinMood={currentSpinMood}
			stickyResolvedWheelMode={Boolean(bonusPreviewState?.stickyWheels)}
			{reelAnticipation}
			{activeLine}
			{activeLineTone}
			{activeLinePath}
			{activeLinePoints}
			{activePayoutPoint}
			{activeWheelState}
			{resolvedWheelStates}
			{wheelResultBursts}
			{blueWheelOverlayStyle}
			{redWheelOverlayStyle}
			wheelMessage={activeWheelMessageState}
		/>

		{#if showTotalWin}
			<div
				class:total-win-overlay={true}
				class:total-win-overlay-skippable={roundState === 'countingWin' && !resolveSkipRequested}
				class:total-win-overlay-settled={resolveSkipRequested}
				role="button"
				tabindex="0"
				aria-label="Skip total win count-up"
				on:click={handleTotalWinOverlayClick}
				on:keydown={handleTotalWinOverlayKeydown}
			>
				<p class="total-win-kicker">{totalWinKicker}</p>
				<h3>{totalWinTitle}</h3>
				<strong>{formatValue(animatedTotalWin)}</strong>
				<span>{totalWinSubline}</span>
				{#if bonusPreviewState}
					<small class="total-win-bonus-meta">
						{bonusPreviewState.totalSpins} spins · {bonusPreviewState.stickyWheels ? 'sticky wheels' : 'respin wheels'} · cost {formatMultiplier(bonusPreviewState.cost / liveBetOptions[liveBetIndex])}
					</small>
				{/if}
				{#if !resolveSkipRequested}
					<em class="total-win-hint">Click to reveal final win</em>
				{/if}
			</div>
		{/if}
	</main>

	<!-- Controls -->
	<footer class="game-controls">
		<div class="controls-left">
			<div class="bet-stepper">
				<button class="ctrl-button" on:click={() => updateLiveBet(-1)} disabled={roundState !== 'idle' || liveBetIndex === 0}>-</button>
				<div class="bet-display">
					<span>Bet</span>
					<strong>GC {formatValue(liveBetOptions[liveBetIndex])}</strong>
				</div>
				<button class="ctrl-button" on:click={() => updateLiveBet(1)} disabled={roundState !== 'idle' || liveBetIndex === liveBetOptions.length - 1}>+</button>
			</div>
			<div class="bonus-buy-row">
				<button class="bonus-buy-button bonus-buy-button-regular" on:click={() => void handleBonusBuy('regular')} disabled={!canBuyRegular}>
					<span>Regular</span>
					<strong>{formatMultiplier(PREVIEW_BONUS_BUY_MULTIPLIERS.regular)}</strong>
				</button>
				<button class="bonus-buy-button bonus-buy-button-super" on:click={() => void handleBonusBuy('super')} disabled={!canBuySuper}>
					<span>Super</span>
					<strong>{formatMultiplier(PREVIEW_BONUS_BUY_MULTIPLIERS.super)}</strong>
				</button>
			</div>
		</div>

		<div class="controls-center">
			<button
				class:spin-button={true}
				class:spin-button-stop={canStop}
				class:spin-button-skip={canSkip}
				on:click={handleSpinAction}
				disabled={(!canSpin && !canStop && !canSkip) || (canSkip && resolveSkipRequested)}
			>
				{#if canStop}
					{stopRequested ? 'STOP' : 'STOP'}
				{:else if canSkip}
					{resolveSkipRequested ? '...' : 'SKIP'}
				{:else}
					SPIN
				{/if}
			</button>
			<p class="status-text">{statusLabel}</p>
		</div>

		<div class="controls-right">
			<div class="toggle-row">
				<button class:toggle-button={true} class:is-active={quickSpinEnabled} on:click={toggleQuickSpin} disabled={roundState !== 'idle' || autoplayEnabled}>
					Quick
				</button>
				<button class:toggle-button={true} class:is-active={autoplayEnabled} on:click={toggleAutoplay} disabled={!canSpin && !autoplayEnabled}>
					{autoplayEnabled ? 'Stop' : 'Auto'}
				</button>
			</div>
			{#if !autoplayEnabled}
				<select class="autoplay-select" bind:value={autoplayPreset} disabled={autoplayEnabled || !canSpin}>
					{#each autoplayPresets as preset}
						<option value={preset}>{preset} spins</option>
					{/each}
				</select>
			{:else}
				<p class="autoplay-label">{autoplayQueueLabel}</p>
			{/if}
			<button class="info-button" on:click={() => showInfoPanel = !showInfoPanel} aria-label="Game info">
				i
			</button>
		</div>
	</footer>

	<!-- Info / Paytable overlay -->
	{#if showInfoPanel}
		<div class="info-overlay" role="dialog" aria-label="Game information">
			<div class="info-panel">
				<div class="info-header">
					<h2>Game Information</h2>
					<button class="info-close" on:click={() => showInfoPanel = false} aria-label="Close">&times;</button>
				</div>

				<div class="info-content">
					<section class="info-section">
						<h3>Paytable</h3>
						<p class="info-note">All values shown as multipliers of your bet.</p>
						<div class="paytable-grid">
							{#each regularSymbols as symbol}
								<div class="paytable-row">
									<div class="paytable-symbol">
										<img src={symbolArtAssets[symbol]} alt={symbolMeta[symbol].label} />
										<span>{symbolMeta[symbol].label}</span>
									</div>
									<div class="paytable-values">
										<div><span>3x</span><strong>{formatMultiplier(paytable[symbol][3] ?? 0)}</strong></div>
										<div><span>4x</span><strong>{formatMultiplier(paytable[symbol][4] ?? 0)}</strong></div>
										<div><span>5x</span><strong>{formatMultiplier(paytable[symbol][5] ?? 0)}</strong></div>
									</div>
								</div>
							{/each}
						</div>
					</section>

					<section class="info-section">
						<h3>Wheel Bonuses</h3>
						<div class="info-rule">
							<img src={wheelSymbolAssets.blueWheel} alt="Blue wheel" class="info-wheel-icon" />
							<div>
								<strong>Blue Wild Wheel</strong>
								<p>Lands on the board as a wild symbol. Spins once to reveal a bonus multiplier that is added to every completed payline using this position.</p>
							</div>
						</div>
						<div class="info-rule">
							<img src={wheelSymbolAssets.redWheel} alt="Red wheel" class="info-wheel-icon" />
							<div>
								<strong>Red Dual Wheel</strong>
								<p>Two nested wheels spin in sequence. The outer wheel lands first, then the inner wheel spins. The final bonus is outer multiplied by inner.</p>
							</div>
						</div>
					</section>

					<section class="info-section">
						<h3>Bonus Rounds</h3>
						<div class="info-rule-compact">
							<strong>Regular Bonus</strong>
							<p>{BONUS_ROUND_CONFIG.regular.freeSpins} free spins with boosted wheel frequency. Buy for {formatMultiplier(PREVIEW_BONUS_BUY_MULTIPLIERS.regular)} of your bet.</p>
						</div>
						<div class="info-rule-compact">
							<strong>Super Bonus</strong>
							<p>{BONUS_ROUND_CONFIG.super.freeSpins} free spins with sticky wheels — any wheel that lands keeps its value for the entire feature. Buy for {formatMultiplier(PREVIEW_BONUS_BUY_MULTIPLIERS.super)} of your bet.</p>
						</div>
					</section>

					<section class="info-section">
						<h3>Paylines</h3>
						<p class="info-note">{paylines.length} lines evaluated left to right. 3 or more matching symbols on a line to win.</p>
						<div class="payline-list">
							{#each paylines as line, index}
								<div class="payline-row">
									<span>Line {index + 1}</span><code>{line.join(' / ')}</code>
								</div>
							{/each}
						</div>
					</section>

					<section class="info-section info-section-legal">
						<h3>Game Rules</h3>
						<ul>
							<li>RTP: {formatPercent(DESIGN_RTP_TARGET)}</li>
							<li>Max Win: {formatMultiplier(PRODUCT_MAX_WIN_TARGET)}</li>
							<li>Board: {REELS} reels x {ROWS} rows</li>
							<li>Paylines: {paylines.length}</li>
							<li>Wins are evaluated left to right only</li>
							<li>Wheel symbols act as wilds on all paylines</li>
							<li>Only the highest win per payline is awarded</li>
							<li>Malfunction voids all pays and plays</li>
						</ul>
					</section>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		background: #08111a;
	}

	.game-shell {
		position: relative;
		overflow: hidden;
		display: grid;
		grid-template-rows: auto 1fr auto;
		min-height: 100vh;
		color: #eff7ff;
		background: transparent;
	}

	/* ── Environment — Medieval Castle Throne Room ──────── */

	.theme-backdrop {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.theme-backdrop > div { position: absolute; }

	/* Stone walls — dark base with subtle texture */
	.env-walls {
		inset: 0;
		background:
			/* stone block pattern */
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'%3E%3Crect width='120' height='80' fill='%23141218'/%3E%3Cpath d='M0 0h60v40H0zM60 0h60v40H60zM30 40h60v40H30zM90 40h30v40H90zM0 40h30v40H0z' fill='none' stroke='rgba(80,70,65,0.12)' stroke-width='1'/%3E%3C/svg%3E"),
			linear-gradient(180deg,
				#0e0c14 0%,
				#121018 8%,
				#16131c 20%,
				#181520 40%,
				#16131c 60%,
				#141118 75%,
				#100e14 90%,
				#0c0a10 100%
			);
		background-size: 120px 80px, 100% 100%;
	}

	/* Center gothic arch — behind the board */
	.env-arch-center {
		top: 0; left: 50%; width: min(850px, 76vw); height: 85%;
		transform: translateX(-50%);
		border-radius: 45% 45% 0 0 / 22% 22% 0 0;
		background:
			radial-gradient(circle at 50% 15%, rgba(100, 80, 50, 0.08) 0%, transparent 30%),
			linear-gradient(180deg,
				rgba(35, 28, 40, 0.6) 0%,
				rgba(25, 20, 30, 0.4) 15%,
				rgba(18, 15, 22, 0.2) 35%,
				transparent 60%
			);
		box-shadow:
			inset 0 0 0 3px rgba(90, 75, 55, 0.1),
			inset 0 3px 0 rgba(130, 110, 80, 0.06),
			inset 0 -60px 100px rgba(8, 6, 12, 0.4);
	}

	/* Side arches — smaller pointed arches on left and right */
	.env-arch-left {
		top: 5%; left: 2%; width: 22%; height: 60%;
		border-radius: 45% 45% 0 0 / 30% 30% 0 0;
		background: linear-gradient(180deg,
			rgba(30, 22, 18, 0.5) 0%,
			rgba(22, 16, 14, 0.3) 30%,
			transparent 65%
		);
		box-shadow: inset 0 0 0 2px rgba(80, 60, 45, 0.08);
	}

	.env-arch-right {
		top: 5%; right: 2%; width: 22%; height: 60%;
		border-radius: 45% 45% 0 0 / 30% 30% 0 0;
		background: linear-gradient(180deg,
			rgba(18, 22, 35, 0.5) 0%,
			rgba(14, 16, 28, 0.3) 30%,
			transparent 65%
		);
		box-shadow: inset 0 0 0 2px rgba(55, 65, 90, 0.08);
	}

	/* WARM LIGHT — orange/amber torchlight on left half */
	.env-light-warm {
		top: 0; left: 0; width: 55%; bottom: 0;
		background:
			/* main torch glow */
			radial-gradient(ellipse 70% 50% at 15% 30%, rgba(255, 140, 40, 0.22) 0%, transparent 60%),
			/* secondary warm fill */
			radial-gradient(ellipse 80% 60% at 25% 45%, rgba(200, 100, 20, 0.12) 0%, transparent 55%),
			/* warm ambient */
			radial-gradient(ellipse 60% 40% at 10% 60%, rgba(180, 80, 15, 0.08) 0%, transparent 50%),
			/* upper warm wash */
			linear-gradient(135deg, rgba(180, 90, 20, 0.1) 0%, transparent 40%);
	}

	/* COOL LIGHT — blue mystical light on right half */
	.env-light-cool {
		top: 0; right: 0; width: 55%; bottom: 0;
		background:
			/* main blue glow */
			radial-gradient(ellipse 70% 50% at 85% 30%, rgba(50, 100, 220, 0.2) 0%, transparent 60%),
			/* secondary cool fill */
			radial-gradient(ellipse 80% 60% at 75% 45%, rgba(30, 70, 180, 0.1) 0%, transparent 55%),
			/* cool ambient */
			radial-gradient(ellipse 60% 40% at 90% 60%, rgba(25, 60, 160, 0.07) 0%, transparent 50%),
			/* upper cool wash */
			linear-gradient(225deg, rgba(30, 70, 180, 0.08) 0%, transparent 40%);
	}

	/* Center convergence — where warm and cool meet */
	.env-light-center {
		inset: 0;
		background:
			/* warm/cool blend behind the board */
			radial-gradient(ellipse 40% 50% at 50% 42%,
				rgba(120, 80, 50, 0.08) 0%,
				transparent 60%
			),
			/* subtle top light from above */
			radial-gradient(ellipse 50% 20% at 50% 5%, rgba(80, 70, 55, 0.06) 0%, transparent 50%);
	}

	/* Stone pillars — dark vertical columns */
	.env-pillar {
		top: 0; bottom: 0; width: 5%;
		background: linear-gradient(180deg,
			rgba(35, 28, 24, 0.8) 0%,
			rgba(30, 24, 20, 0.7) 30%,
			rgba(25, 20, 18, 0.65) 60%,
			rgba(20, 16, 14, 0.6) 100%
		);
	}

	.env-pillar-left {
		left: 16%;
		box-shadow:
			4px 0 20px rgba(200, 120, 40, 0.08),
			-2px 0 15px rgba(0, 0, 0, 0.3);
	}

	.env-pillar-right {
		right: 16%;
		box-shadow:
			-4px 0 20px rgba(40, 70, 160, 0.08),
			2px 0 15px rgba(0, 0, 0, 0.3);
	}

	/* Torches — bright flame glow */
	.env-torch {
		width: 60px; height: 120px;
		border-radius: 50%;
		filter: blur(12px);
	}

	.env-torch-left {
		top: 22%; left: 12%;
		background: radial-gradient(ellipse 100% 70% at 50% 40%,
			rgba(255, 200, 60, 0.6) 0%,
			rgba(255, 150, 30, 0.35) 25%,
			rgba(255, 100, 10, 0.15) 50%,
			transparent 75%
		);
		animation: torchFlicker 2s ease-in-out infinite;
	}

	.env-torch-right {
		top: 22%; right: 12%;
		background: radial-gradient(ellipse 100% 70% at 50% 40%,
			rgba(100, 160, 255, 0.4) 0%,
			rgba(60, 120, 240, 0.22) 25%,
			rgba(30, 80, 200, 0.08) 50%,
			transparent 75%
		);
		animation: torchFlicker 2s ease-in-out infinite 1s;
	}

	/* Banners — red/warm left, blue right */
	.env-banner {
		width: 28px; height: 180px;
	}

	.env-banner-left {
		top: 8%; left: 10%;
		background: linear-gradient(180deg,
			rgba(160, 30, 20, 0.5) 0%,
			rgba(140, 25, 18, 0.4) 20%,
			rgba(120, 20, 15, 0.35) 60%,
			rgba(100, 18, 12, 0.2) 85%,
			transparent 100%
		);
		border-radius: 2px 2px 4px 4px;
		transform: rotate(2deg);
	}

	.env-banner-right {
		top: 8%; right: 10%;
		background: linear-gradient(180deg,
			rgba(30, 50, 140, 0.45) 0%,
			rgba(25, 40, 120, 0.35) 20%,
			rgba(20, 35, 100, 0.3) 60%,
			rgba(15, 28, 80, 0.18) 85%,
			transparent 100%
		);
		border-radius: 2px 2px 4px 4px;
		transform: rotate(-2deg);
	}

	/* Stone floor — perspective ground with warm/cool reflection */
	.env-floor {
		left: 0; right: 0; bottom: 0; height: 30%;
		background:
			/* stone tile pattern */
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230e0c10'/%3E%3Cpath d='M0 0h50v50H0zM50 50h50v50H50z' fill='none' stroke='rgba(70,60,55,0.1)' stroke-width='1'/%3E%3C/svg%3E"),
			linear-gradient(180deg,
				rgba(20, 16, 14, 0.5) 0%,
				rgba(14, 12, 10, 0.85) 30%,
				rgba(10, 8, 8, 0.95) 60%,
				#080708 100%
			);
		background-size: 100px 100px, 100% 100%;
		transform: perspective(800px) rotateX(25deg);
		transform-origin: top center;
	}

	/* Floor light reflections — warm left, cool right */
	.env-floor-light {
		left: 0; right: 0; bottom: 0; height: 25%;
		background:
			radial-gradient(ellipse 40% 50% at 25% 30%, rgba(200, 120, 40, 0.1) 0%, transparent 55%),
			radial-gradient(ellipse 40% 50% at 75% 30%, rgba(40, 80, 180, 0.08) 0%, transparent 55%);
	}

	/* Atmospheric dust / haze */
	.env-haze {
		inset: 0;
		background:
			radial-gradient(ellipse 70% 20% at 50% 40%, rgba(40, 30, 35, 0.1) 0%, transparent 55%),
			radial-gradient(ellipse 40% 15% at 20% 35%, rgba(80, 50, 25, 0.06) 0%, transparent 50%),
			radial-gradient(ellipse 40% 15% at 80% 35%, rgba(25, 40, 80, 0.05) 0%, transparent 48%);
		animation: hazeDrift 18s ease-in-out infinite;
	}

	/* Floating dust particles */
	.env-dust-back {
		inset: 0;
		background: transparent;
		box-shadow:
			/* warm side particles */
			10vw 30vh 0 1.2px rgba(255, 180, 80, 0.4),
			18vw 55vh 0 0.8px rgba(255, 160, 60, 0.35),
			25vw 42vh 0 1px rgba(255, 200, 100, 0.3),
			12vw 70vh 0 1.4px rgba(255, 170, 70, 0.38),
			35vw 25vh 0 0.9px rgba(255, 190, 90, 0.32),
			/* cool side particles */
			80vw 35vh 0 1px rgba(120, 160, 255, 0.35),
			88vw 58vh 0 0.8px rgba(100, 140, 240, 0.3),
			72vw 45vh 0 1.2px rgba(130, 170, 255, 0.33),
			90vw 68vh 0 1px rgba(110, 150, 250, 0.28),
			65vw 28vh 0 0.9px rgba(120, 165, 255, 0.3),
			/* neutral center */
			48vw 52vh 0 0.8px rgba(180, 170, 160, 0.25),
			55vw 38vh 0 1px rgba(170, 160, 150, 0.22);
		animation: dustDriftBack 25s linear infinite;
	}

	.env-dust-front {
		inset: 0;
		background: transparent;
		box-shadow:
			15vw 45vh 0 2px rgba(255, 190, 80, 0.5),
			22vw 65vh 0 1.5px rgba(255, 170, 60, 0.45),
			82vw 40vh 0 1.8px rgba(110, 155, 255, 0.45),
			75vw 62vh 0 1.5px rgba(100, 145, 250, 0.4),
			50vw 48vh 0 1.2px rgba(200, 180, 160, 0.3);
		animation: dustDriftFront 20s linear infinite;
		filter: blur(0.5px);
	}

	/* Rune carvings on walls */
	.env-runes {
		inset: 0;
		background:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'%3E%3Cg fill='none' stroke-width='1.5' stroke-linecap='round'%3E%3Cg stroke='rgba(200,150,80,0.08)'%3E%3Cpath d='M30 60 L50 35 L70 60 L50 85Z'/%3E%3Cpath d='M25 160 L55 160 L40 190 L70 190'/%3E%3Cpath d='M30 260 L60 230 L60 270'/%3E%3C/g%3E%3Cg stroke='rgba(80,120,200,0.07)'%3E%3Cpath d='M250 60 L270 35 L290 60 L270 85Z'/%3E%3Cpath d='M250 160 L280 160 L265 190 L295 190'/%3E%3Cpath d='M260 260 L290 230 L290 270'/%3E%3C/g%3E%3Cg stroke='rgba(140,130,120,0.06)'%3E%3Cpath d='M140 80 L160 55 L180 80 L160 105Z'/%3E%3Cpath d='M145 240 L175 210 L175 250'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
		background-size: 320px 320px;
		mix-blend-mode: screen;
		opacity: 0.2;
	}

	/* Heavy vignette */
	.env-vignette {
		inset: 0;
		background: radial-gradient(ellipse 56% 50% at 50% 40%, transparent 28%, rgba(4, 3, 6, 0.94) 100%);
		pointer-events: none;
	}

	/* ── Top Bar ──────────────────────────────────────────── */

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 24px;
		background: linear-gradient(180deg, rgba(10, 20, 30, 0.92), rgba(8, 16, 24, 0.88));
		border-bottom: 1px solid rgba(145, 181, 214, 0.12);
		backdrop-filter: blur(10px);
		z-index: 2;
	}

	.top-bar-brand h1 {
		margin: 0;
		font-size: clamp(1.2rem, 2.2vw, 1.8rem);
		letter-spacing: -0.04em;
		line-height: 1;
	}

	.top-bar-stats {
		display: flex;
		gap: 10px;
	}

	.stat-pill {
		padding: 8px 14px;
		border-radius: 14px;
		background: rgba(6, 14, 22, 0.84);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.stat-pill span {
		display: block;
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(175, 208, 238, 0.68);
	}

	.stat-pill strong {
		display: block;
		margin-top: 2px;
		font-size: 0.95rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.metric-positive { color: #86f2c5; }

	/* ── Game Stage ───────────────────────────────────────── */

	.game-stage {
		position: relative;
		display: grid;
		place-content: center;
		padding: 24px;
		z-index: 1;
	}

	.stage-tone-medium { box-shadow: inset 0 0 80px rgba(93, 185, 255, 0.06); }
	.stage-tone-big { box-shadow: inset 0 0 80px rgba(255, 108, 82, 0.08); }

	.stage-feature-mode::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at top, rgba(87, 164, 255, 0.14), transparent 34%), radial-gradient(circle at bottom left, rgba(38, 94, 170, 0.1), transparent 28%);
		opacity: 0.9;
		pointer-events: none;
		z-index: 0;
		animation: featureStageBreathe 3.8s ease-in-out infinite;
	}

	.stage-feature-super::after {
		background: radial-gradient(circle at top, rgba(255, 110, 74, 0.16), transparent 34%), radial-gradient(circle at bottom left, rgba(87, 164, 255, 0.12), transparent 30%);
		animation-duration: 3.3s;
	}

	/* ── Feature Banner ───────────────────────────────────── */

	.feature-banner {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 14px 16px;
		align-items: center;
		margin-bottom: 16px;
		padding: 14px 18px;
		border-radius: 18px;
		background: linear-gradient(180deg, rgba(9, 22, 36, 0.96), rgba(8, 18, 28, 0.92)), radial-gradient(circle at left, rgba(78, 164, 255, 0.16), transparent 34%);
		border: 1px solid rgba(121, 183, 237, 0.2);
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 18px 34px rgba(2, 8, 14, 0.22);
		animation: featureBannerEnter 360ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.feature-banner-super {
		background: linear-gradient(180deg, rgba(23, 16, 19, 0.96), rgba(14, 12, 16, 0.92)), radial-gradient(circle at right, rgba(255, 118, 78, 0.18), transparent 38%), radial-gradient(circle at left, rgba(84, 164, 255, 0.1), transparent 34%);
		border-color: rgba(255, 147, 104, 0.24);
	}

	.feature-banner-copy { display: grid; gap: 3px; min-width: 0; }
	.feature-banner-kicker, .feature-banner-stat span, .feature-sticky-pill span { display: block; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(175, 214, 244, 0.7); }
	.feature-banner-copy strong { display: block; font-size: 1.1rem; font-weight: 900; letter-spacing: -0.03em; }
	.feature-banner-copy em, .feature-sticky-pill strong { margin: 0; font-size: 0.82rem; font-style: normal; line-height: 1.45; color: rgba(203, 226, 247, 0.72); }
	.feature-banner-metrics { display: flex; gap: 10px; flex-wrap: wrap; justify-content: end; }
	.feature-banner-stat { min-width: 100px; padding: 10px 12px; border-radius: 14px; background: rgba(7, 18, 29, 0.72); border: 1px solid rgba(127, 176, 220, 0.16); }
	.feature-banner-stat strong { display: block; margin-top: 4px; font-size: 1rem; font-weight: 900; letter-spacing: -0.03em; }
	.feature-sticky-pill { grid-column: 1 / -1; display: grid; gap: 4px; padding: 12px 14px; border-radius: 16px; background: linear-gradient(180deg, rgba(35, 15, 12, 0.96), rgba(21, 12, 13, 0.94)), radial-gradient(circle at right, rgba(255, 120, 82, 0.12), transparent 40%); border: 1px solid rgba(255, 150, 108, 0.18); }

	/* ── Total Win Overlay ────────────────────────────────── */

	.total-win-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 8px;
		background: radial-gradient(circle, rgba(32, 76, 119, 0.78), rgba(5, 11, 18, 0.92)), linear-gradient(180deg, rgba(6, 16, 25, 0.84), rgba(6, 12, 18, 0.92));
		backdrop-filter: blur(12px);
		z-index: 6;
		border-radius: 12px;
		outline: none;
	}

	.total-win-overlay-skippable { cursor: pointer; }
	.total-win-overlay-skippable strong { animation: totalWinPromptPulse 1.2s ease-in-out infinite; }
	.total-win-overlay-settled { cursor: default; }

	.total-win-kicker { margin: 0; padding: 7px 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); color: #cce8ff; text-transform: uppercase; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.16em; }
	.total-win-overlay h3, .total-win-overlay strong, .total-win-overlay span { margin: 0; }
	.total-win-overlay h3 { font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.18em; color: rgba(226, 239, 255, 0.8); }
	.total-win-overlay strong { font-size: clamp(3rem, 6vw, 4.8rem); font-weight: 900; text-shadow: 0 0 26px rgba(117, 199, 255, 0.42); }
	.total-win-overlay span { font-size: 1rem; font-weight: 700; color: rgba(205, 229, 255, 0.82); }
	.total-win-bonus-meta { margin: 2px 0 0; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(245, 214, 170, 0.8); }
	.total-win-hint { margin: 2px 0 0; padding: 6px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); color: rgba(225, 239, 255, 0.78); font-style: normal; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }

	/* ── Controls Footer ──────────────────────────────────── */

	.game-controls {
		display: grid;
		grid-template-columns: minmax(200px, 0.9fr) auto minmax(200px, 0.9fr);
		gap: 16px;
		align-items: center;
		padding: 16px 24px;
		background: linear-gradient(180deg, rgba(8, 16, 24, 0.94), rgba(6, 12, 18, 0.98));
		border-top: 1px solid rgba(145, 181, 214, 0.12);
		backdrop-filter: blur(10px);
		z-index: 2;
	}

	.controls-center {
		display: grid;
		justify-items: center;
		gap: 8px;
	}

	.spin-button {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		background: linear-gradient(180deg, #7acfff, #3699f6 54%, #1a73d8 100%);
		color: #04121d;
		font-weight: 900;
		font-size: 1.1rem;
		letter-spacing: 0.08em;
		border: 2px solid rgba(255, 255, 255, 0.2);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.36), 0 8px 24px rgba(15, 84, 151, 0.4), 0 0 0 4px rgba(54, 153, 246, 0.15);
		cursor: pointer;
		transition: transform 160ms ease, box-shadow 160ms ease;
	}

	.spin-button:hover:enabled { transform: scale(1.05); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.36), 0 12px 32px rgba(15, 84, 151, 0.5), 0 0 0 6px rgba(54, 153, 246, 0.2); }
	.spin-button:active:enabled { transform: scale(0.95); }
	.spin-button:disabled { opacity: 0.45; cursor: not-allowed; }

	.spin-button-stop {
		background: linear-gradient(180deg, #ffc484, #f98f54 56%, #e55a2f 100%);
		color: #1b0903;
		border-color: rgba(255, 190, 148, 0.4);
		box-shadow: inset 0 1px 0 rgba(255, 231, 213, 0.42), 0 8px 24px rgba(155, 73, 27, 0.4), 0 0 0 4px rgba(249, 143, 84, 0.15);
	}

	.spin-button-skip {
		background: linear-gradient(180deg, #c2e8ff, #6fc4ff 56%, #37a2f5 100%);
		color: #04121d;
		border-color: rgba(192, 231, 255, 0.44);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.44), 0 8px 24px rgba(47, 122, 184, 0.3), 0 0 0 4px rgba(111, 196, 255, 0.15);
	}

	.status-text {
		margin: 0;
		font-size: 0.76rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(175, 208, 238, 0.68);
	}

	/* ── Left / Right Controls ────────────────────────────── */

	.controls-left, .controls-right {
		display: grid;
		gap: 10px;
	}

	.bet-stepper {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) 44px;
		gap: 8px;
		align-items: center;
	}

	.bet-display {
		padding: 8px 12px;
		border-radius: 12px;
		background: rgba(6, 14, 22, 0.84);
		border: 1px solid rgba(255, 255, 255, 0.08);
		text-align: center;
	}

	.bet-display span { display: block; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(171, 205, 236, 0.68); }
	.bet-display strong { display: block; margin-top: 2px; font-size: 0.95rem; font-weight: 800; }

	.ctrl-button {
		padding: 10px;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(16, 28, 41, 0.92);
		color: #edf7ff;
		font-weight: 800;
		font-size: 1.1rem;
		cursor: pointer;
		transition: transform 160ms ease;
	}

	.ctrl-button:hover:enabled { transform: translateY(-1px); }
	.ctrl-button:active:enabled { transform: translateY(1px); }
	.ctrl-button:disabled { opacity: 0.45; cursor: not-allowed; }

	.bonus-buy-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.bonus-buy-button {
		padding: 8px 10px;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		cursor: pointer;
		text-align: left;
		transition: transform 160ms ease;
	}

	.bonus-buy-button:hover:enabled { transform: translateY(-1px); }
	.bonus-buy-button:disabled { opacity: 0.45; cursor: not-allowed; }

	.bonus-buy-button span { display: block; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(214, 234, 251, 0.68); }
	.bonus-buy-button strong { display: block; font-size: 0.9rem; font-weight: 900; letter-spacing: -0.02em; }

	.bonus-buy-button-regular { background: linear-gradient(180deg, rgba(12, 31, 53, 0.96), rgba(8, 21, 36, 0.94)), radial-gradient(circle at top left, rgba(88, 176, 255, 0.16), transparent 44%); border-color: rgba(98, 179, 245, 0.24); }
	.bonus-buy-button-regular strong { color: #aee4ff; }
	.bonus-buy-button-super { background: linear-gradient(180deg, rgba(37, 17, 14, 0.98), rgba(20, 11, 13, 0.94)), radial-gradient(circle at top left, rgba(255, 130, 92, 0.16), transparent 42%); border-color: rgba(255, 151, 105, 0.24); }
	.bonus-buy-button-super strong { color: #ffca8b; }

	.toggle-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.toggle-button {
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(16, 28, 41, 0.92);
		color: #edf7ff;
		font-weight: 700;
		font-size: 0.82rem;
		cursor: pointer;
		transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
	}

	.toggle-button:hover:enabled { transform: translateY(-1px); }
	.toggle-button:disabled { opacity: 0.45; cursor: not-allowed; }
	.toggle-button.is-active { border-color: rgba(102, 198, 255, 0.44); background: rgba(26, 70, 116, 0.72); }

	.autoplay-select {
		width: 100%;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid rgba(150, 188, 222, 0.18);
		background: rgba(5, 13, 21, 0.92);
		color: #eef6ff;
		font: inherit;
		font-size: 0.82rem;
	}

	.autoplay-label {
		margin: 0;
		padding: 8px 10px;
		text-align: center;
		font-size: 0.8rem;
		font-weight: 700;
		color: rgba(172, 230, 255, 0.9);
	}

	.info-button {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid rgba(145, 181, 214, 0.24);
		background: rgba(16, 28, 41, 0.92);
		color: rgba(205, 229, 255, 0.82);
		font-weight: 900;
		font-size: 0.9rem;
		font-style: italic;
		cursor: pointer;
		transition: transform 160ms ease;
		justify-self: end;
	}

	.info-button:hover { transform: scale(1.1); border-color: rgba(145, 181, 214, 0.4); }

	/* ── Info Overlay ─────────────────────────────────────── */

	.info-overlay {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: grid;
		place-content: center;
		background: rgba(4, 8, 14, 0.86);
		backdrop-filter: blur(8px);
		padding: 24px;
	}

	.info-panel {
		width: min(680px, 90vw);
		max-height: 85vh;
		overflow-y: auto;
		border-radius: 24px;
		background: linear-gradient(180deg, rgba(11, 21, 31, 0.96), rgba(7, 15, 23, 0.98));
		border: 1px solid rgba(145, 181, 214, 0.16);
		box-shadow: 0 32px 64px rgba(1, 7, 13, 0.4);
	}

	.info-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 22px;
		border-bottom: 1px solid rgba(145, 181, 214, 0.1);
	}

	.info-header h2 { margin: 0; font-size: 1.3rem; letter-spacing: -0.03em; }

	.info-close {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(16, 28, 41, 0.92);
		color: #eff7ff;
		font-size: 1.4rem;
		cursor: pointer;
		display: grid;
		place-content: center;
		transition: transform 160ms ease;
	}

	.info-close:hover { transform: scale(1.1); }

	.info-content { padding: 22px; }

	.info-section { margin-bottom: 28px; }
	.info-section:last-child { margin-bottom: 0; }
	.info-section h3 { margin: 0 0 12px; font-size: 1.05rem; letter-spacing: -0.02em; color: rgba(226, 239, 255, 0.92); }
	.info-note { margin: 0 0 14px; font-size: 0.84rem; color: rgba(202, 223, 243, 0.68); line-height: 1.5; }

	.paytable-grid { display: grid; gap: 8px; }

	.paytable-row {
		display: grid;
		grid-template-columns: minmax(140px, 0.7fr) minmax(0, 1fr);
		gap: 12px;
		align-items: center;
		padding: 10px 14px;
		border-radius: 14px;
		background: rgba(6, 14, 22, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.04);
	}

	.paytable-symbol { display: flex; align-items: center; gap: 10px; }
	.paytable-symbol img { width: 36px; height: 36px; object-fit: contain; border-radius: 8px; }
	.paytable-symbol span { font-weight: 700; font-size: 0.88rem; }
	.paytable-values { display: flex; gap: 16px; }
	.paytable-values > div { display: grid; gap: 2px; }
	.paytable-values span { font-size: 0.62rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(175, 208, 238, 0.58); }
	.paytable-values strong { font-size: 0.92rem; font-weight: 800; color: rgba(235, 245, 255, 0.9); }

	.info-rule {
		display: grid;
		grid-template-columns: 48px 1fr;
		gap: 14px;
		align-items: start;
		padding: 14px;
		margin-bottom: 10px;
		border-radius: 16px;
		background: rgba(6, 14, 22, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.04);
	}

	.info-wheel-icon { width: 48px; height: 48px; object-fit: contain; }
	.info-rule strong { display: block; margin-bottom: 4px; font-size: 0.95rem; }
	.info-rule p { margin: 0; font-size: 0.84rem; line-height: 1.5; color: rgba(202, 223, 243, 0.76); }

	.info-rule-compact {
		padding: 14px;
		margin-bottom: 10px;
		border-radius: 16px;
		background: rgba(6, 14, 22, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.04);
	}

	.info-rule-compact strong { display: block; margin-bottom: 4px; font-size: 0.95rem; }
	.info-rule-compact p { margin: 0; font-size: 0.84rem; line-height: 1.5; color: rgba(202, 223, 243, 0.76); }

	.payline-list { display: grid; gap: 6px; }

	.payline-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 12px;
		border-radius: 10px;
		background: rgba(6, 14, 22, 0.72);
		border: 1px solid transparent;
		color: rgba(215, 232, 248, 0.84);
		font-size: 0.84rem;
	}

	.payline-row code { color: rgba(143, 197, 239, 0.82); }

	.info-section-legal ul {
		margin: 0;
		padding: 0 0 0 18px;
		font-size: 0.84rem;
		line-height: 1.8;
		color: rgba(202, 223, 243, 0.76);
	}

	/* ── Environment Animations ──────────────────────────── */

	@keyframes torchFlicker {
		0%, 100% { opacity: 0.75; transform: scale(1) translateY(0); }
		15% { opacity: 1; transform: scale(1.1) translateY(-2px); }
		30% { opacity: 0.82; transform: scale(0.95) translateY(1px); }
		50% { opacity: 0.95; transform: scale(1.05) translateY(-1px); }
		70% { opacity: 0.78; transform: scale(0.97) translateY(0); }
		85% { opacity: 0.93; transform: scale(1.03) translateY(-1px); }
	}

	@keyframes hazeDrift {
		0% { transform: translateX(-1.5%); opacity: 0.85; }
		50% { transform: translateX(1.5%); opacity: 1; }
		100% { transform: translateX(-1.5%); opacity: 0.85; }
	}

	@keyframes dustDriftBack {
		0% { transform: translate(0, 0); }
		33% { transform: translate(5px, -8px); }
		66% { transform: translate(-3px, -16px); }
		100% { transform: translate(0, -24px); }
	}

	@keyframes dustDriftFront {
		0% { transform: translate(0, 0); }
		33% { transform: translate(-6px, -10px); }
		66% { transform: translate(4px, -20px); }
		100% { transform: translate(0, -30px); }
	}

	/* ── UI Animations ───────────────────────────────────── */

	@keyframes featureBannerEnter {
		from { opacity: 0; transform: translateY(-10px) scale(0.985); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	@keyframes featureStageBreathe {
		0%, 100% { opacity: 0.72; }
		50% { opacity: 1; }
	}

	@keyframes totalWinPromptPulse {
		0%, 100% { transform: scale(1); text-shadow: 0 0 26px rgba(117, 199, 255, 0.42); }
		50% { transform: scale(1.03); text-shadow: 0 0 34px rgba(117, 199, 255, 0.58), 0 0 56px rgba(117, 199, 255, 0.2); }
	}

	/* ── Responsive ───────────────────────────────────────── */

	@media (max-width: 960px) {
		.game-controls {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.controls-center { order: -1; }

		.top-bar {
			flex-direction: column;
			gap: 10px;
			text-align: center;
		}

		.top-bar-stats { justify-content: center; }

		.feature-banner { grid-template-columns: 1fr; }
		.feature-banner-metrics { justify-content: start; }

		.bonus-buy-row { grid-template-columns: 1fr; }
	}
</style>

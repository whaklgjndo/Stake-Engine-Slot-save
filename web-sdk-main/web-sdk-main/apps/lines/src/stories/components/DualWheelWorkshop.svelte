<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import DualWheelBoard from './DualWheelBoard.svelte';
	import {
		autoplayPresets,
		BONUS_ROUND_CONFIG,
		BLUE_WHEEL_RANGE,
		BLUE_WHEEL_SEGMENTS,
		BLUE_WHEEL_SEGMENT_WEIGHTS,
		DESIGN_RTP_TARGET,
		GAP,
		LIVE_BASE_GAME_WHEEL_PROFILE,
		paylines,
		paytable,
		PREVIEW_BONUS_BUY_MULTIPLIERS,
		RED_FINAL_WHEEL_RANGE,
		RED_INNER_WHEEL_RANGE,
		RED_INNER_SEGMENTS,
		RED_INNER_SEGMENT_WEIGHTS,
		RED_OUTER_WHEEL_RANGE,
		RED_OUTER_SEGMENTS,
		RED_OUTER_SEGMENT_WEIGHTS,
		reelStatesDefault,
		reelStrips,
		REELS,
		regularSymbols,
		ROWS,
		scenarios,
		SIZE,
		STAKE_APPROVAL_RTP_BAND,
		symbolMeta,
		symbolArtAssets,
		wheelSymbolAssets,
		BASE_GAME_THEORETICAL_MAX_ROUND_MULTIPLIER,
		PRODUCT_MAX_WIN_TARGET,
		WHEEL_SEGMENT_ANGLE,
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
		resolveBonusTriggerFromBoard,
		simulateBonusRoundSession,
		type LiveSpinMathResult,
		wheelPositionKey as wheelPositionKeyFromEngine,
	} from './dualWheelEngine';
	import type {
		ActiveWheelState,
		AudioCueDetail,
		AudioCueImportance,
		BonusTrigger,
		BonusMode,
		LockedCellState,
		LineTone,
		LineResult,
		Point,
		Position,
		ReelAnticipation,
		RegularSymbolId,
		ResolvedWheelState,
		RoundState,
		Scenario,
		SpinMood,
		SymbolId,
		TimingConfig,
		WheelAward,
		WheelResultBurst,
	} from './dualWheelWorkshopTypes';

	type StageTone = 'idle' | 'medium' | 'big';
	type SpinHistoryEntry = {
		spin: number;
		source: string;
		sourceType: 'live' | 'forced' | 'bonus';
		bet: number;
		balanceAfter: number;
		mood: SpinMood;
		totalWin: number;
		lineCount: number;
		wheelCount: number;
		summary: string;
	};
	type BonusPreviewState = {
		mode: BonusMode;
		totalSpins: number;
		cost: number;
		totalPaid: number;
		currentSpin: number;
		accumulatedWin: number;
		stickyWheels: boolean;
	};
	type BonusTriggerRevealState = BonusTrigger & {
		totalSpins: number;
		stickyWheels: boolean;
	};
	type FeatureTransitionState = {
		phase: 'intro' | 'outro';
		mode: BonusMode;
		totalSpins: number;
		triggerCount: number;
		stickyWheels: boolean;
		totalWin?: number;
	};
	type LoopSignals = {
		liveSpins: number;
		hitSpins: number;
		deadSpins: number;
		wheelRounds: number;
		blueWheels: number;
		redWheels: number;
		lineOnlyRounds: number;
		blueWheelRounds: number;
		redWheelRounds: number;
		comboWheelRounds: number;
		fiftyPlusRounds: number;
		hundredPlusRounds: number;
		totalBet: number;
		totalPaid: number;
		totalWinningLines: number;
		biggestWin: number;
		biggestWinMultiplier: number;
	};
	type SpinSource = {
		board: SymbolId[][];
		wheelResults: Record<string, WheelAward>;
		label: string;
		note: string;
		bet: number;
		sourceType: 'live' | 'forced' | 'bonus';
		bonusMode?: BonusMode;
		bonusSpins?: number;
		bonusTrigger?: BonusTrigger | null;
		math?: LiveSpinMathResult;
	};

	const LIVE_SPIN_KEY = 'live-strip-spin';
	const LIVE_SPIN_LABEL = 'Base Game';
	const LIVE_SPIN_NOTE =
		'Weighted base reels with rare blue and red wheel drops, visible scatter triggers, and paid features.';
	const LIVE_SPIN_BET = 1;
	const LIVE_BALANCE_START = 118.13;
	const liveBetOptions = [0.2, 0.4, 1, 2, 5, 10] as const;
	const createLoopSignals = (): LoopSignals => ({
		liveSpins: 0,
		hitSpins: 0,
		deadSpins: 0,
		wheelRounds: 0,
		blueWheels: 0,
		redWheels: 0,
		lineOnlyRounds: 0,
		blueWheelRounds: 0,
		redWheelRounds: 0,
		comboWheelRounds: 0,
		fiftyPlusRounds: 0,
		hundredPlusRounds: 0,
		totalBet: 0,
		totalPaid: 0,
		totalWinningLines: 0,
		biggestWin: 0,
		biggestWinMultiplier: 0,
	});
	const createUnlockedCellState = (): LockedCellState => ({
		locked: false,
		multiplierValue: null,
		symbol: null,
		type: null,
		outer: null,
		inner: null,
	});
	const createLockedCellGrid = (): LockedCellState[][] =>
		Array.from({ length: ROWS }, () =>
			Array.from({ length: REELS }, () => createUnlockedCellState()),
		);
	const cloneLockedCellGrid = (grid: LockedCellState[][]): LockedCellState[][] =>
		grid.map((row) => row.map((cell) => ({ ...cell })));
	const reelRegularPools: RegularSymbolId[][] = reelStrips.map((strip) =>
		strip.filter(
			(symbol): symbol is RegularSymbolId => symbol !== 'blueWheel' && symbol !== 'redWheel',
		),
	);

	let selectedScenarioKey = LIVE_SPIN_KEY;
	let displayBoard = randomLiveBaseGameBoard();
	let betSize = LIVE_SPIN_BET;
	let liveBalance = LIVE_BALANCE_START;
	let liveBetIndex = liveBetOptions.findIndex((value) => value === LIVE_SPIN_BET);
	let roundState: RoundState = 'idle';
	let reelStates = [...reelStatesDefault];
	let lineResults: LineResult[] = [];
	let totalWin = 0;
	let activeLineIndex = -1;
	let animatedTotalWin = 0;
	let showTotalWin = false;
	let lockedCells = createLockedCellGrid();
	let spinCounter = 0;
	let showPayoutChip = false;
	let activeWheelState: ActiveWheelState | null = null;
	let resolvedWheelStates: Record<string, ResolvedWheelState> = {};
	let wheelResultBursts: WheelResultBurst[] = [];
	let wheelResultBurstId = 0;
	let activeBonusTrigger: BonusTrigger | null = null;
	let activeSpinBonusTrigger: BonusTrigger | null = null;
	let latestAudioCue = 'system.ready';
	let latestAudioCueDetail: AudioCueDetail | null = null;
	let quickSpinEnabled = false;
	let autoplayEnabled = false;
	let autoplayPreset = autoplayPresets[0];
	let autoplaySpinsRemaining = 0;
	let autoplayTimeoutHandle = 0;

	const animationFrames: number[] = [];
	const timeouts: number[] = [];
	const reelIndices = Array.from({ length: REELS }, (_, index) => index);
	let countupFrame = 0;

	let currentScenario: Scenario = scenarios[0];
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
	let autoplayQueueLabel = `${autoplayPreset} ready`;
	let statusLabel = 'Ready';
	let activeWheelMessageState = { title: '', detail: '' };
	let activeStageTone: StageTone = 'idle';
	let activeLineTone: LineTone | null = null;
	let blueWheelOverlayStyle = '';
	let redWheelOverlayStyle = '';
	let selectedSourceLabel = LIVE_SPIN_LABEL;
	let selectedSourceNote = LIVE_SPIN_NOTE;
	let selectedSourceBet = LIVE_SPIN_BET;
	let isLiveSource = true;
	let hasLiveFunds = true;
	let sessionNet = 0;
	let lastPaidWin = 0;
	let stopRequested = false;
	let stopRequestedAt = 0;
	let resolveSkipRequested = false;
	const skipResolvers: Array<() => void> = [];
	let livePreviewBoard = randomLiveBaseGameBoard();
	let spinHistory: SpinHistoryEntry[] = [];
	let liveLoopSignals = createLoopSignals();
	let bonusPreviewState: BonusPreviewState | null = null;
	let featureTransitionState: FeatureTransitionState | null = null;
	let regularBuyCost = LIVE_SPIN_BET * PREVIEW_BONUS_BUY_MULTIPLIERS.regular;
	let superBuyCost = LIVE_SPIN_BET * PREVIEW_BONUS_BUY_MULTIPLIERS.super;
	let canBuyRegular = false;
	let canBuySuper = false;
	let totalWinKicker = '50x Threshold Reached';
	let totalWinTitle = 'Total Win';
	let totalWinSubline = '0x of bet';
	let featureSpinsRemaining = 0;
	let featureBannerTitle = '';
	let featureBannerNote = '';
	let bonusTriggerRevealState: BonusTriggerRevealState | null = null;
	let featureProgressRatio = 0;
	let featureCollectedMultiplier = 0;
	let stickyLockCount = 0;
	let activeBonusSpinMode: BonusMode | null = null;
	let activeBonusDangerLevel = 0;
	let soundEnabled = true;
	let autoplayConfirmOpen = false;

	$: currentScenario =
		scenarios.find((scenario) => scenario.key === selectedScenarioKey) ?? scenarios[0];
	$: isLiveSource = selectedScenarioKey === LIVE_SPIN_KEY;
	$: selectedSourceLabel =
		selectedScenarioKey === LIVE_SPIN_KEY ? LIVE_SPIN_LABEL : currentScenario.label;
	$: selectedSourceNote =
		selectedScenarioKey === LIVE_SPIN_KEY ? LIVE_SPIN_NOTE : currentScenario.note;
	$: selectedSourceBet = isLiveSource ? liveBetOptions[liveBetIndex] : currentScenario.bet;
	$: hasLiveFunds = liveBalance >= selectedSourceBet;
	$: sessionNet = liveBalance - LIVE_BALANCE_START;
	$: regularBuyCost = selectedSourceBet * PREVIEW_BONUS_BUY_MULTIPLIERS.regular;
	$: superBuyCost = selectedSourceBet * PREVIEW_BONUS_BUY_MULTIPLIERS.super;
	$: canBuyRegular =
		isLiveSource && roundState === 'idle' && !autoplayEnabled && liveBalance >= regularBuyCost;
	$: canBuySuper =
		isLiveSource && roundState === 'idle' && !autoplayEnabled && liveBalance >= superBuyCost;
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
	$: canSpin = roundState === 'idle' && (!isLiveSource || hasLiveFunds);
	$: canStop =
		roundState === 'spinning' &&
		reelStates.some((state) => state === 'spinning' || state === 'braking');
	$: canSkip = roundState === 'showingLines' || roundState === 'countingWin';
	$: autoplayQueueLabel = autoplayEnabled
		? autoplaySpinsRemaining > 0
			? `${autoplaySpinsRemaining} left`
			: 'Final spin'
		: `${autoplayPreset} ready`;
	$: statusLabel = featureTransitionState
		? featureTransitionState.phase === 'intro'
			? `${bonusFeatureLabel(featureTransitionState.mode)} starting`
			: `${bonusFeatureLabel(featureTransitionState.mode)} settling`
		: bonusTriggerRevealState
			? `${bonusFeatureLabel(bonusTriggerRevealState.mode)} unlocked`
			: roundState === 'spinning'
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
								? `Showing line ${activeLineIndex + 1} of ${lineResults.length}`
								: currentSpinMood === 'big'
									? 'Holding feature tension'
									: currentSpinMood === 'feature'
										? 'Feature settle'
										: 'Showing winning lines'
					: roundState === 'countingWin'
						? resolveSkipRequested
							? 'Skipping count-up'
							: 'Counting total win'
						: isLiveSource && !hasLiveFunds
							? 'Insufficient balance'
							: autoplayEnabled
								? `Autoplay ${autoplaySpinsRemaining > 0 ? `${autoplaySpinsRemaining} left` : 'final spin'}`
								: 'Ready';
	$: activeWheelMessageState = activeWheelMessage(activeWheelState);
	$: activeLineTone = activeLine ? resultTone(activeLine) : null;
	$: activeStageTone = showTotalWin
		? 'big'
		: featureTransitionState?.mode === 'super'
			? 'big'
			: featureTransitionState
				? 'medium'
				: bonusTriggerRevealState?.mode === 'super'
					? 'big'
					: bonusTriggerRevealState
						? 'medium'
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
	$: liveHitRate = liveLoopSignals.liveSpins
		? liveLoopSignals.hitSpins / liveLoopSignals.liveSpins
		: 0;
	$: liveDeadRate = liveLoopSignals.liveSpins
		? liveLoopSignals.deadSpins / liveLoopSignals.liveSpins
		: 0;
	$: liveWheelRate = liveLoopSignals.liveSpins
		? liveLoopSignals.wheelRounds / liveLoopSignals.liveSpins
		: 0;
	$: liveLineOnlyRate = liveLoopSignals.liveSpins
		? liveLoopSignals.lineOnlyRounds / liveLoopSignals.liveSpins
		: 0;
	$: liveBlueRoundRate = liveLoopSignals.liveSpins
		? liveLoopSignals.blueWheelRounds / liveLoopSignals.liveSpins
		: 0;
	$: liveRedLedRate = liveLoopSignals.liveSpins
		? (liveLoopSignals.redWheelRounds + liveLoopSignals.comboWheelRounds) /
			liveLoopSignals.liveSpins
		: 0;
	$: liveFiftyPlusRate = liveLoopSignals.liveSpins
		? liveLoopSignals.fiftyPlusRounds / liveLoopSignals.liveSpins
		: 0;
	$: liveReturnRatio =
		liveLoopSignals.totalBet > 0 ? liveLoopSignals.totalPaid / liveLoopSignals.totalBet : 0;
	$: liveAverageHit =
		liveLoopSignals.hitSpins > 0 ? liveLoopSignals.totalPaid / liveLoopSignals.hitSpins : 0;
	$: liveModelRead = loopModelRead(liveLoopSignals);
	$: featureSpinsRemaining = bonusPreviewState
		? Math.max(bonusPreviewState.totalSpins - bonusPreviewState.currentSpin, 0)
		: 0;
	$: featureProgressRatio = bonusPreviewState
		? Math.min(
				Math.max(
					bonusPreviewState.totalSpins > 0
						? bonusPreviewState.currentSpin / bonusPreviewState.totalSpins
						: 0,
					0,
				),
				1,
			)
		: 0;
	$: featureCollectedMultiplier =
		bonusPreviewState && selectedSourceBet > 0
			? bonusPreviewState.accumulatedWin / selectedSourceBet
			: 0;
	$: stickyLockCount = lockedCells.reduce(
		(count, row) =>
			count + row.filter((cell) => cell.locked && cell.multiplierValue !== null).length,
		0,
	);
	$: featureBannerTitle = !bonusPreviewState
		? ''
		: bonusPreviewState.currentSpin === 0
			? `${bonusTriggerCount(bonusPreviewState.mode)} scatters unlock ${bonusPreviewState.totalSpins} free spins`
			: `${bonusFeatureLabel(bonusPreviewState.mode)} | ${featureSpinsRemaining} remaining`;
	$: featureBannerNote = !bonusPreviewState
		? ''
		: bonusPreviewState.currentSpin === 0
			? bonusBuyDescription(bonusPreviewState.mode)
			: `Spin ${bonusPreviewState.currentSpin}/${bonusPreviewState.totalSpins} | ${formatCurrency(
					bonusPreviewState.accumulatedWin,
				)} collected`;
	$: totalWinKicker = bonusPreviewState
		? `${bonusModeLabel(bonusPreviewState.mode)} bonus complete`
		: '50x Threshold Reached';
	$: totalWinTitle = bonusPreviewState ? 'Feature Win' : 'Total Win';
	$: totalWinSubline = bonusPreviewState
		? `${formatMultiplier(totalMultiplier)} of stake`
		: `${formatMultiplier(totalMultiplier)} of bet`;

	function getTimingConfig(quickSpin: boolean, spinMood: SpinMood): TimingConfig {
		if (quickSpin) {
			switch (spinMood) {
				case 'dead':
					return {
						reelInterval: 36,
						reelStopBase: 220,
						reelStopStep: 38,
						landing: 100,
						resolveDelay: 40,
						lineIntro: 80,
						lineHold: 400,
						lineGap: 70,
						blueResolve: 900,
						blueLocked: 220,
						redOuterResolve: 900,
						redOuterLocked: 180,
						redInnerResolve: 700,
						redLocked: 220,
						totalWinCount: 1100,
						totalWinHold: 420,
						autoplayPause: 120,
					};
				case 'feature':
					return {
						reelInterval: 44,
						reelStopBase: 430,
						reelStopStep: 70,
						landing: 150,
						resolveDelay: 120,
						lineIntro: 120,
						lineHold: 620,
						lineGap: 110,
						blueResolve: 1300,
						blueLocked: 280,
						redOuterResolve: 1300,
						redOuterLocked: 260,
						redInnerResolve: 980,
						redLocked: 280,
						totalWinCount: 1500,
						totalWinHold: 560,
						autoplayPause: 220,
					};
				case 'big':
					return {
						reelInterval: 46,
						reelStopBase: 520,
						reelStopStep: 80,
						landing: 170,
						resolveDelay: 160,
						lineIntro: 140,
						lineHold: 700,
						lineGap: 120,
						blueResolve: 1400,
						blueLocked: 300,
						redOuterResolve: 1450,
						redOuterLocked: 300,
						redInnerResolve: 1100,
						redLocked: 320,
						totalWinCount: 1700,
						totalWinHold: 700,
						autoplayPause: 260,
					};
				default:
					return {
						reelInterval: 44,
						reelStopBase: 360,
						reelStopStep: 60,
						landing: 140,
						resolveDelay: 100,
						lineIntro: 100,
						lineHold: 560,
						lineGap: 90,
						blueResolve: 1100,
						blueLocked: 260,
						redOuterResolve: 1050,
						redOuterLocked: 220,
						redInnerResolve: 820,
						redLocked: 260,
						totalWinCount: 1300,
						totalWinHold: 520,
						autoplayPause: 160,
					};
			}
		}

		switch (spinMood) {
			case 'dead':
				return {
					reelInterval: 70,
					reelStopBase: 480,
					reelStopStep: 56,
					landing: 180,
					resolveDelay: 80,
					lineIntro: 120,
					lineHold: 620,
					lineGap: 100,
					blueResolve: 1700,
					blueLocked: 360,
					redOuterResolve: 1600,
					redOuterLocked: 300,
					redInnerResolve: 1200,
					redLocked: 360,
					totalWinCount: 1600,
					totalWinHold: 700,
					autoplayPause: 260,
				};
			case 'feature':
				return {
					reelInterval: 84,
					reelStopBase: 900,
					reelStopStep: 96,
					landing: 280,
					resolveDelay: 240,
					lineIntro: 260,
					lineHold: 1040,
					lineGap: 220,
					blueResolve: 3200,
					blueLocked: 560,
					redOuterResolve: 3000,
					redOuterLocked: 520,
					redInnerResolve: 2200,
					redLocked: 640,
					totalWinCount: 2400,
					totalWinHold: 1300,
					autoplayPause: 640,
				};
			case 'big':
				return {
					reelInterval: 86,
					reelStopBase: 1020,
					reelStopStep: 112,
					landing: 320,
					resolveDelay: 320,
					lineIntro: 320,
					lineHold: 1160,
					lineGap: 240,
					blueResolve: 3400,
					blueLocked: 620,
					redOuterResolve: 3300,
					redOuterLocked: 620,
					redInnerResolve: 2450,
					redLocked: 720,
					totalWinCount: 2800,
					totalWinHold: 1500,
					autoplayPause: 720,
				};
			default:
				return {
					reelInterval: 82,
					reelStopBase: 760,
					reelStopStep: 80,
					landing: 260,
					resolveDelay: 180,
					lineIntro: 220,
					lineHold: 920,
					lineGap: 180,
					blueResolve: 2800,
					blueLocked: 520,
					redOuterResolve: 2600,
					redOuterLocked: 420,
					redInnerResolve: 1900,
					redLocked: 580,
					totalWinCount: 2200,
					totalWinHold: 1200,
					autoplayPause: 560,
				};
		}
	}

	function cloneBoard(source: SymbolId[][]): SymbolId[][] {
		return source.map((row) => [...row]);
	}

	function formatValue(value: number): string {
		return value.toFixed(2);
	}

	function formatCurrency(value: number): string {
		return `$${formatValue(value)}`;
	}

	function formatMultiplier(value: number): string {
		return Number.isInteger(value) ? `${value}x` : `${value.toFixed(1)}x`;
	}

	function formatSignedValue(value: number): string {
		const absolute = formatCurrency(Math.abs(value));
		if (value > 0) return `+${absolute}`;
		if (value < 0) return `-${absolute}`;
		return absolute;
	}

	function formatPercent(value: number): string {
		return `${(value * 100).toFixed(0)}%`;
	}

	function formatPercentBand(min: number, max: number): string {
		return `${formatPercent(min)}-${formatPercent(max)}`;
	}

	function formatMultiplierBand(min: number, max: number): string {
		return `${formatMultiplier(min)}-${formatMultiplier(max)}`;
	}

	function paytableValue(symbol: RegularSymbolId, count: 3 | 4 | 5): string {
		const value = paytable[symbol][count] ?? 0;
		return value > 0 ? formatMultiplier(value) : '—';
	}

	function bonusModeLabel(mode: BonusMode): string {
		return mode === 'regular' ? 'Regular' : 'Super';
	}

	function bonusFeatureLabel(mode: BonusMode): string {
		return mode === 'regular' ? 'Regular Free Spins' : 'Super Free Spins';
	}

	function bonusTriggerCount(mode: BonusMode): number {
		return BONUS_ROUND_CONFIG[mode].triggerCount;
	}

	function bonusTransitionSlots(mode: BonusMode): number[] {
		return Array.from({ length: bonusTriggerCount(mode) }, (_, index) => index);
	}

	function bonusTriggerSlots(count: number): number[] {
		return Array.from({ length: count }, (_, index) => index);
	}

	function bonusBuyTitle(mode: BonusMode): string {
		return mode === 'regular' ? 'Regular Feature' : 'Super Feature';
	}

	function bonusBuyDescription(mode: BonusMode): string {
		return mode === 'regular'
			? 'Boosted blue and red wheel rate across all 10 free spins.'
			: 'Sticky wheels lock their values and stay fixed for the full 10-spin feature.';
	}

	function bonusTransitionHeadline(state: FeatureTransitionState): string {
		if (state.phase === 'intro') {
			return `${state.triggerCount} scatters unlock ${state.totalSpins} free spins`;
		}

		return `${bonusFeatureLabel(state.mode)} complete`;
	}

	function bonusTransitionNote(state: FeatureTransitionState): string {
		if (state.phase === 'intro') {
			return state.stickyWheels
				? 'Every landed wheel locks into place and keeps its multiplier until the feature ends.'
				: 'Wheel landing rates are boosted across the full feature to keep the reels hot.';
		}

		return state.stickyWheels
			? 'Sticky wheel cells held their values through all free spins.'
			: 'The full 10-spin feature has finished resolving.';
	}

	function bonusTriggerRevealHeadline(state: BonusTriggerRevealState): string {
		return `${state.count} scatters unlock ${state.totalSpins} free spins`;
	}

	function bonusTriggerRevealNote(state: BonusTriggerRevealState): string {
		return state.stickyWheels
			? 'Super bonus: landed wheels lock their values and stay fixed for the full feature.'
			: 'Regular bonus: wheel landing rates are boosted across the full 10 free spins.';
	}

	function bonusBuyCost(mode: BonusMode): number {
		return selectedSourceBet * PREVIEW_BONUS_BUY_MULTIPLIERS[mode];
	}

	function spinMoodLabel(mood: SpinMood): string {
		switch (mood) {
			case 'dead':
				return 'Dead spin';
			case 'feature':
				return 'Feature tension';
			case 'big':
				return 'Big event';
			default:
				return 'Base rhythm';
		}
	}

	function spinMoodNote(mood: SpinMood): string {
		switch (mood) {
			case 'dead':
				return 'Resolve fast and get back to the next spin.';
			case 'feature':
				return 'Hold the reels a beat longer because value is on the board.';
			case 'big':
				return 'Slow the room down and let the feature carry the round.';
			default:
				return 'Standard cadence with enough stagger to build anticipation.';
		}
	}

	function stageEventLabel(tone: StageTone): string {
		switch (tone) {
			case 'medium':
				return 'Feature in focus';
			case 'big':
				return 'High-voltage resolve';
			default:
				return 'Board idle';
		}
	}

	function strongerReelAnticipation(
		left: ReelAnticipation,
		right: ReelAnticipation,
	): ReelAnticipation {
		if (left === 'wheel' || right === 'wheel') return 'wheel';
		if (left === 'premium' || right === 'premium') return 'premium';
		return 'none';
	}

	function deriveReelAnticipation(
		sourceBoard: SymbolId[][],
		results: LineResult[],
	): ReelAnticipation[] {
		const signals: ReelAnticipation[] = Array(REELS).fill('none');

		for (const result of results) {
			if (symbolMeta[result.symbol].tier === 'gold') {
				for (const position of result.positions) {
					if (position.column >= 2) {
						signals[position.column] = strongerReelAnticipation(
							signals[position.column],
							'premium',
						);
					}
				}
			}

			for (const wheel of result.wheels) {
				if (wheel.column > 2) {
					signals[wheel.column - 1] = strongerReelAnticipation(
						signals[wheel.column - 1],
						'premium',
					);
				}
				signals[wheel.column] = strongerReelAnticipation(signals[wheel.column], 'wheel');
			}
		}

		for (let column = 2; column < REELS; column += 1) {
			if (signals[column] !== 'none') continue;

			const hasLateWheel = sourceBoard.some((row) => {
				const symbol = row[column];
				return symbol === 'blueWheel' || symbol === 'redWheel';
			});

			if (hasLateWheel) {
				signals[column] = 'premium';
			}
		}

		return signals;
	}

	function countLockedMultiplierCells(grid: LockedCellState[][]): number {
		return grid.reduce(
			(count, row) =>
				count + row.filter((cell) => cell.locked && cell.multiplierValue !== null).length,
			0,
		);
	}

	function enhanceBonusReelAnticipation(
		mode: BonusMode,
		sourceBoard: SymbolId[][],
		results: LineResult[],
		stickyCount: number,
	): ReelAnticipation[] {
		const signals = deriveReelAnticipation(sourceBoard, results);

		if (mode === 'regular') {
			for (let column = 1; column < REELS; column += 1) {
				if (signals[column] !== 'none') continue;
				const hasValueSymbol = sourceBoard.some((row) => {
					const symbol = row[column];
					return (
						symbolMeta[symbol].tier === 'gold' || symbol === 'blueWheel' || symbol === 'redWheel'
					);
				});
				if (hasValueSymbol && column >= 2) {
					signals[column] = 'premium';
				}
			}
			return signals;
		}

		const pressure = Math.min(stickyCount, 4);
		for (let column = 1; column < REELS; column += 1) {
			if (signals[column] === 'wheel') continue;
			if (pressure >= 3 && column >= 2) {
				signals[column] = 'wheel';
				continue;
			}
			if (pressure >= 1) {
				signals[column] = strongerReelAnticipation(signals[column], 'premium');
			}
		}

		if (pressure >= 2) {
			signals[REELS - 1] = 'wheel';
		}

		return signals;
	}

	function deriveBonusSpinMood(
		mode: BonusMode,
		bonusSpin: ReturnType<typeof simulateBonusRoundSession>['spins'][number],
		stickyCount: number,
	): SpinMood {
		if (bonusSpin.totalWin >= selectedSourceBet * 50) return 'big';
		if (mode === 'regular') {
			return bonusSpin.lineResults.length || bonusSpin.wheelQueue.length ? 'feature' : 'base';
		}
		if (stickyCount >= 3) {
			return bonusSpin.lineResults.length || bonusSpin.wheelQueue.length ? 'big' : 'feature';
		}
		return 'feature';
	}

	function scatterTriggerColumnCount(
		index: number,
		trigger: BonusTrigger | null = activeSpinBonusTrigger,
	): number {
		if (!trigger) return 0;
		return trigger.positions.filter((position) => position.column === index).length;
	}

	function lastScatterTriggerColumn(trigger: BonusTrigger | null = activeSpinBonusTrigger): number {
		if (!trigger?.positions.length) return -1;
		return Math.max(...trigger.positions.map((position) => position.column));
	}

	function scatterTriggerDelayBonus(
		index: number,
		trigger: BonusTrigger | null = activeSpinBonusTrigger,
	): number {
		const triggerCount = scatterTriggerColumnCount(index, trigger);
		if (!triggerCount) return 0;

		return (
			triggerCount * (quickSpinEnabled ? 12 : 30) +
			(index >= 3 ? (quickSpinEnabled ? 8 : 18) : index >= 2 ? (quickSpinEnabled ? 4 : 10) : 0)
		);
	}

	function scatterTriggerBrakeLead(
		index: number,
		trigger: BonusTrigger | null = activeSpinBonusTrigger,
	): number {
		if (!trigger || index !== lastScatterTriggerColumn(trigger)) return 0;

		return (
			(quickSpinEnabled ? 24 : 54) +
			(scatterTriggerColumnCount(index, trigger) - 1) * (quickSpinEnabled ? 8 : 18)
		);
	}

	function anticipationDelayBonus(index: number, signal: ReelAnticipation): number {
		if (index < 2) return 0;
		const base =
			signal === 'wheel'
				? quickSpinEnabled
					? 70
					: 150
				: signal === 'premium'
					? quickSpinEnabled
						? 36
						: 84
					: 0;
		if (!activeBonusSpinMode) return base;
		if (activeBonusSpinMode === 'regular') {
			return (
				base +
				(signal === 'wheel'
					? quickSpinEnabled
						? 22
						: 54
					: signal === 'premium'
						? quickSpinEnabled
							? 10
							: 24
						: 0)
			);
		}
		return (
			base +
			(signal === 'wheel'
				? (quickSpinEnabled ? 28 : 66) + activeBonusDangerLevel * (quickSpinEnabled ? 18 : 42)
				: signal === 'premium'
					? (quickSpinEnabled ? 12 : 28) + activeBonusDangerLevel * (quickSpinEnabled ? 10 : 24)
					: 0)
		);
	}

	function finalReelBrakeLead(signal: ReelAnticipation): number {
		const base =
			signal === 'wheel'
				? quickSpinEnabled
					? 120
					: 240
				: signal === 'premium'
					? quickSpinEnabled
						? 70
						: 140
					: 0;
		if (!activeBonusSpinMode) return base;
		if (activeBonusSpinMode === 'regular') {
			return base + (signal === 'none' ? 0 : quickSpinEnabled ? 24 : 52);
		}
		return (
			base +
			(signal === 'none'
				? 0
				: (quickSpinEnabled ? 30 : 70) + activeBonusDangerLevel * (quickSpinEnabled ? 18 : 44))
		);
	}

	function reelDelayLabel(index: number): string {
		const totalDelay =
			timingConfig.reelStopStep * index +
			anticipationDelayBonus(index, reelAnticipation[index]) +
			scatterTriggerDelayBonus(index);
		return totalDelay === 0 ? '0ms' : `+${totalDelay}ms`;
	}

	function reelAnticipationLabel(index: number): string {
		const signal = reelAnticipation[index];
		if (signal === 'wheel') return 'wheel';
		if (signal === 'premium') return 'watch';
		return 'steady';
	}

	function spinHistorySummary(results: LineResult[]): string {
		if (!results.length) return 'No line hit';
		if (results.some((result) => result.wheels.some((wheel) => wheel.type === 'red'))) {
			return 'Red wheel feature';
		}
		if (results.some((result) => result.wheels.some((wheel) => wheel.type === 'blue'))) {
			return 'Blue wheel boost';
		}

		const topLine = results[0];
		return `${symbolMeta[topLine.symbol].label} ${formatMultiplier(topLine.totalMultiplier)}`;
	}

	function bonusHistorySummary(mode: BonusMode, spins: number, total: number, bet: number): string {
		const totalMultiplier = bet > 0 ? total / bet : 0;
		return `${bonusModeLabel(mode)} buy | ${spins} spins | ${formatMultiplier(totalMultiplier)}`;
	}

	async function playFeatureTransition(
		phase: FeatureTransitionState['phase'],
		mode: BonusMode,
		totalSpins: number,
		stickyWheels: boolean,
		totalWin = 0,
	): Promise<void> {
		featureTransitionState = {
			phase,
			mode,
			totalSpins,
			triggerCount: bonusTriggerCount(mode),
			stickyWheels,
			totalWin,
		};
		await wait(stickyWheels ? (phase === 'intro' ? 1420 : 1200) : phase === 'intro' ? 720 : 620);
		featureTransitionState = null;
	}

	async function playBonusTriggerReveal(trigger: BonusTrigger): Promise<void> {
		const stickyWheels = BONUS_ROUND_CONFIG[trigger.mode].stickyWheels;
		const totalSpins = BONUS_ROUND_CONFIG[trigger.mode].freeSpins;
		bonusTriggerRevealState = {
			...trigger,
			totalSpins,
			stickyWheels,
		};
		emitAudioCue('bonus.trigger.reveal', {
			mode: trigger.mode,
			count: trigger.count,
			totalSpins,
			stickyWheels,
		});
		await wait(trigger.mode === 'super' ? 1280 : 980);
		bonusTriggerRevealState = null;
	}

	function loopModelRead(signals: LoopSignals): { title: string; detail: string } {
		if (!signals.liveSpins) {
			return {
				title: 'Waiting on live spins',
				detail: 'Run base-game spins to read dead space, wheel frequency, and payout rhythm.',
			};
		}

		if (signals.liveSpins < 5) {
			return {
				title: 'Sample still thin',
				detail: 'The first few spins are not enough to judge volatility or replayability yet.',
			};
		}

		const hitRate = signals.hitSpins / signals.liveSpins;
		const deadRate = signals.deadSpins / signals.liveSpins;
		const wheelRate = signals.wheelRounds / signals.liveSpins;
		const redLedRate = (signals.redWheelRounds + signals.comboWheelRounds) / signals.liveSpins;
		const returnRatio = signals.totalBet > 0 ? signals.totalPaid / signals.totalBet : 0;

		if (redLedRate >= 0.02 || signals.hundredPlusRounds > 0) {
			return {
				title: 'Red-led sample',
				detail:
					'Rare-event pressure is showing up already. Make sure the red wheel keeps feeling exceptional.',
			};
		}

		if (wheelRate >= 0.28 || signals.redWheels >= 2) {
			return {
				title: 'Feature-forward sample',
				detail:
					'Wheel events are arriving often enough to drive anticipation. Make sure small wins stay compressed.',
			};
		}

		if (deadRate >= 0.62 && wheelRate <= 0.14) {
			return {
				title: 'Cold loop',
				detail:
					'Long dead space is dominating the session. When a wheel lands, the reveal needs to justify the wait.',
			};
		}

		if (hitRate >= 0.48 && returnRatio < 0.82) {
			return {
				title: 'Busy but light',
				detail:
					'The board is paying often, but the average lift is still modest. Good clarity, weaker punch.',
			};
		}

		return {
			title: 'Balanced base loop',
			detail:
				'The session has enough dead space to create tension and enough hits to keep the reel cadence readable.',
		};
	}

	function cellKey(row: number, column: number): string {
		return cellKeyFromEngine(row, column);
	}

	function wheelPositionKey(position: Position): string {
		return wheelPositionKeyFromEngine(position);
	}

	function isWild(symbol: SymbolId): boolean {
		return isWildFromEngine(symbol);
	}

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
		const lastStart = strip.length - 1;

		for (let start = 0; start <= lastStart; start += 1) {
			const matches = targetColumn.every(
				(symbol, offset) => strip[(start + offset) % strip.length] === symbol,
			);
			if (matches) return start;
		}

		return -1;
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
		if (signal === 'wheel') {
			return interpolate(quickSpinEnabled ? 2.15 : 2.45, quickSpinEnabled ? 3.25 : 3.8, clamped);
		}
		if (signal === 'premium') {
			return interpolate(quickSpinEnabled ? 1.7 : 1.9, quickSpinEnabled ? 2.15 : 2.45, clamped);
		}
		return 1;
	}

	function brakingPreviewColumn(
		column: number,
		targetColumn: SymbolId[],
		signal: ReelAnticipation,
		progress: number,
	): SymbolId[] {
		const offsets = approachOffsets(signal);
		const easedProgress = brakingPreviewProgress(signal, progress);
		const previewIndex = Math.min(
			offsets.length - 1,
			Math.floor(easedProgress * (offsets.length - 1)),
		);
		const offset = offsets[previewIndex] ?? 0;
		if (offset === 0) return [...targetColumn];

		const stripStart = findTargetWindowStart(column, targetColumn);
		if (stripStart >= 0) {
			const targetStart =
				(stripStart - offset + reelStrips[column].length) % reelStrips[column].length;
			return stripWindowAt(column, targetStart);
		}

		return rotateColumnWindow(targetColumn, offset);
	}

	function randomBoard(): SymbolId[][] {
		const columns = Array.from({ length: REELS }, (_, column) => randomColumnWindow(column));
		return Array.from({ length: ROWS }, (_, rowIndex) =>
			Array.from({ length: REELS }, (_, columnIndex) => columns[columnIndex][rowIndex]),
		);
	}

	function randomRegularFromColumn(column: number): RegularSymbolId {
		const pool = reelRegularPools[column];
		return pool[Math.floor(Math.random() * pool.length)] ?? regularSymbols[0];
	}

	function shufflePositions<T>(items: T[]): T[] {
		const next = [...items];
		for (let index = next.length - 1; index > 0; index -= 1) {
			const swapIndex = Math.floor(Math.random() * (index + 1));
			[next[index], next[swapIndex]] = [next[swapIndex], next[index]];
		}
		return next;
	}

	function applyLiveBaseGameWheelProfile(board: SymbolId[][]): SymbolId[][] {
		const next = cloneBoard(board);
		const bluePositions: Position[] = [];
		const redPositions: Position[] = [];

		for (const [rowIndex, row] of next.entries()) {
			for (const [columnIndex, symbol] of row.entries()) {
				if (symbol === 'blueWheel') bluePositions.push({ row: rowIndex, column: columnIndex });
				if (symbol === 'redWheel') redPositions.push({ row: rowIndex, column: columnIndex });
			}
		}

		let keptBlue = 0;
		for (const position of shufflePositions(bluePositions)) {
			const keep =
				keptBlue < LIVE_BASE_GAME_WHEEL_PROFILE.maxBluePerBoard &&
				Math.random() < LIVE_BASE_GAME_WHEEL_PROFILE.blueKeepChance;
			if (keep) {
				keptBlue += 1;
				continue;
			}
			next[position.row][position.column] = randomRegularFromColumn(position.column);
		}

		let keptRed = 0;
		for (const position of shufflePositions(redPositions)) {
			const keep =
				keptRed < LIVE_BASE_GAME_WHEEL_PROFILE.maxRedPerBoard &&
				Math.random() < LIVE_BASE_GAME_WHEEL_PROFILE.redKeepChance;
			if (keep) {
				keptRed += 1;
				continue;
			}
			next[position.row][position.column] = randomRegularFromColumn(position.column);
		}

		return next;
	}

	function randomLiveBaseGameBoard(): SymbolId[][] {
		return randomLiveBaseGameBoardFromEngine();
	}

	function pickWeightedSegmentValue(
		segments: readonly number[],
		weights: readonly number[],
	): number {
		const totalWeight = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
		if (totalWeight <= 0) {
			return segments[Math.floor(Math.random() * segments.length)] ?? segments[0] ?? 0;
		}

		let threshold = Math.random() * totalWeight;
		for (const [index, segment] of segments.entries()) {
			threshold -= Math.max(0, weights[index] ?? 0);
			if (threshold <= 0) return segment;
		}

		return segments[segments.length - 1] ?? segments[0] ?? 0;
	}

	function buildWheelResults(board: SymbolId[][]): Record<string, WheelAward> {
		return buildWheelResultsFromEngine(board);
	}

	function buildLiveSpinSource(): SpinSource {
		const math = buildLiveSpinMath(selectedSourceBet);
		return {
			board: math.board,
			wheelResults: math.wheelResults,
			label: LIVE_SPIN_LABEL,
			note: LIVE_SPIN_NOTE,
			bet: selectedSourceBet,
			sourceType: 'live',
			bonusTrigger: math.bonusTrigger,
			math,
		};
	}

	function activeSpinSource(): SpinSource {
		return selectedScenarioKey === LIVE_SPIN_KEY
			? buildLiveSpinSource()
			: {
					board: cloneBoard(currentScenario.board),
					wheelResults: currentScenario.wheelResults,
					label: currentScenario.label,
					note: currentScenario.note,
					bet: currentScenario.bet,
					sourceType: 'forced',
					bonusTrigger: resolveBonusTriggerFromBoard(currentScenario.board),
				};
	}

	function recordSpinHistory(
		source: SpinSource,
		results: LineResult[],
		total: number,
		mood: SpinMood,
		spin: number,
		bet: number,
		balanceAfter: number,
	): void {
		const wheelCount = results.reduce((sum, result) => sum + result.wheels.length, 0);
		const entry: SpinHistoryEntry = {
			spin,
			source: source.label,
			sourceType: source.sourceType,
			bet,
			balanceAfter,
			mood,
			totalWin: total,
			lineCount: results.length,
			wheelCount,
			summary:
				source.sourceType === 'bonus' && source.bonusMode
					? bonusHistorySummary(source.bonusMode, source.bonusSpins ?? 0, total, bet)
					: spinHistorySummary(results),
		};

		spinHistory = [entry, ...spinHistory].slice(0, 8);
	}

	function recordBonusHistory(
		mode: BonusMode,
		session: ReturnType<typeof simulateBonusRoundSession>,
		spin: number,
		bet: number,
		balanceAfter: number,
		source: 'buy' | 'trigger' = 'buy',
	): void {
		const lineCount = session.spins.reduce((sum, item) => sum + item.lineResults.length, 0);
		const wheelCount = session.blueWheels + session.redWheels;
		const highestMood =
			session.totalPaid >= bet * 50
				? 'big'
				: session.spins.some((item) => item.spinMood === 'big')
					? 'big'
					: session.spins.some((item) => item.spinMood === 'feature')
						? 'feature'
						: 'base';

		spinHistory = [
			{
				spin,
				source: source === 'buy' ? `${bonusBuyTitle(mode)}` : `${bonusFeatureLabel(mode)}`,
				sourceType: 'bonus',
				bet,
				balanceAfter,
				mood: highestMood,
				totalWin: session.totalPaid,
				lineCount,
				wheelCount,
				summary:
					source === 'buy'
						? `${bonusModeLabel(mode)} buy | ${session.spins.length} spins | ${formatMultiplier(
								bet > 0 ? session.totalPaid / bet : 0,
							)}`
						: `${bonusModeLabel(mode)} trigger | ${session.spins.length} spins | ${formatMultiplier(
								bet > 0 ? session.totalPaid / bet : 0,
							)}`,
			},
			...spinHistory,
		].slice(0, 8);
	}

	function recordLiveLoopSignals(
		results: LineResult[],
		wheelQueue: LineResult['wheels'][number][],
		total: number,
		bet: number,
	): void {
		const blueWheels = wheelQueue.filter((wheel) => wheel.type === 'blue').length;
		const redWheels = wheelQueue.filter((wheel) => wheel.type === 'red').length;
		const hasBlue = blueWheels > 0;
		const hasRed = redWheels > 0;
		const totalMultiplier = bet > 0 ? total / bet : 0;
		const liveSpins = liveLoopSignals.liveSpins + 1;
		const hitSpins = liveLoopSignals.hitSpins + (total > 0 ? 1 : 0);
		const deadSpins = liveLoopSignals.deadSpins + (total > 0 ? 0 : 1);

		liveLoopSignals = {
			liveSpins,
			hitSpins,
			deadSpins,
			wheelRounds: liveLoopSignals.wheelRounds + (wheelQueue.length ? 1 : 0),
			blueWheels: liveLoopSignals.blueWheels + blueWheels,
			redWheels: liveLoopSignals.redWheels + redWheels,
			lineOnlyRounds: liveLoopSignals.lineOnlyRounds + (total > 0 && !hasBlue && !hasRed ? 1 : 0),
			blueWheelRounds: liveLoopSignals.blueWheelRounds + (total > 0 && hasBlue && !hasRed ? 1 : 0),
			redWheelRounds: liveLoopSignals.redWheelRounds + (total > 0 && hasRed && !hasBlue ? 1 : 0),
			comboWheelRounds: liveLoopSignals.comboWheelRounds + (total > 0 && hasBlue && hasRed ? 1 : 0),
			fiftyPlusRounds: liveLoopSignals.fiftyPlusRounds + (totalMultiplier >= 50 ? 1 : 0),
			hundredPlusRounds: liveLoopSignals.hundredPlusRounds + (totalMultiplier >= 100 ? 1 : 0),
			totalBet: liveLoopSignals.totalBet + bet,
			totalPaid: liveLoopSignals.totalPaid + total,
			totalWinningLines: liveLoopSignals.totalWinningLines + results.length,
			biggestWin: Math.max(liveLoopSignals.biggestWin, total),
			biggestWinMultiplier: Math.max(
				liveLoopSignals.biggestWinMultiplier,
				bet > 0 ? total / bet : 0,
			),
		};
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

	function applyResolvedWheelsToBoard(
		source: SymbolId[][],
		resolvedWheels: Record<string, ResolvedWheelState> = {},
	): SymbolId[][] {
		if (!Object.keys(resolvedWheels).length) return source;

		const next = cloneBoard(source);
		for (const wheel of Object.values(resolvedWheels)) {
			next[wheel.row][wheel.column] = wheel.type === 'blue' ? 'blueWheel' : 'redWheel';
		}

		return next;
	}

	function applyLockedCellsToBoard(
		source: SymbolId[][],
		lockedGrid: LockedCellState[][] = lockedCells,
	): SymbolId[][] {
		const next = cloneBoard(source);
		for (const [rowIndex, row] of lockedGrid.entries()) {
			for (const [columnIndex, cell] of row.entries()) {
				if (!cell.locked || !cell.symbol) continue;
				next[rowIndex][columnIndex] = cell.symbol;
			}
		}
		return next;
	}

	function lockResolvedCellsInColumn(
		values: SymbolId[],
		column: number,
		resolvedWheels: Record<string, ResolvedWheelState> = {},
	): SymbolId[] {
		return values.map((value, row) => {
			const wheel = resolvedWheels[cellKey(row, column)];
			if (!wheel) return value;
			return wheel.type === 'blue' ? 'blueWheel' : 'redWheel';
		});
	}

	function lockCellsInColumn(
		values: SymbolId[],
		column: number,
		lockedGrid: LockedCellState[][] = lockedCells,
	): SymbolId[] {
		return values.map((value, row) => {
			const cell = lockedGrid[row]?.[column];
			return cell?.locked && cell.symbol ? cell.symbol : value;
		});
	}

	function lockWheelCell(
		grid: LockedCellState[][],
		wheel: LineResult['wheels'][number],
		symbol: SymbolId,
	): LockedCellState[][] {
		const next = cloneLockedCellGrid(grid);
		next[wheel.row][wheel.column] = {
			locked: true,
			multiplierValue: wheel.total,
			symbol,
			type: wheel.type,
			outer: wheel.outer ?? null,
			inner: wheel.inner ?? null,
		};
		return next;
	}

	function segmentRotation(index: number): number {
		return -index * WHEEL_SEGMENT_ANGLE;
	}

	function pickSegmentIndex(segments: readonly number[], value: number, seed: number): number {
		const matches = segments
			.map((segment, index) => ({ segment, index }))
			.filter(({ segment }) => segment === value)
			.map(({ index }) => index);

		if (!matches.length) return 0;
		return matches[Math.abs(seed) % matches.length];
	}

	function cueImportance(cue: string): AudioCueImportance {
		if (cue.startsWith('wheel.red') || cue === 'win.big' || cue.startsWith('win.countup')) {
			return 'big';
		}

		if (
			cue.startsWith('wheel.blue') ||
			cue.startsWith('line.') ||
			cue === 'win.medium' ||
			cue === 'reels.settled'
		) {
			return 'feature';
		}

		if (cue.startsWith('spin.') || cue.startsWith('reel.')) {
			return 'ambient';
		}

		return 'light';
	}

	function emitAudioCue(cue: string, payload: AudioCueDetail['payload'] = {}): void {
		const detail: AudioCueDetail = {
			cue,
			timestamp:
				typeof performance !== 'undefined' && typeof performance.now === 'function'
					? performance.now()
					: Date.now(),
			spin: spinCounter,
			roundState,
			mood: currentSpinMood,
			importance: cueImportance(cue),
			payload,
		};
		latestAudioCue = cue;
		latestAudioCueDetail = detail;
		if (soundEnabled && typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('dual-wheel-audio-cue', { detail }));
		}
	}

	function trackedTimeout(callback: () => void, delay: number): number {
		const handle = window.setTimeout(callback, delay);
		timeouts.push(handle);
		return handle;
	}

	function trackedAnimationFrame(callback: FrameRequestCallback): number {
		let handle = 0;
		handle = requestAnimationFrame((timestamp) => {
			const index = animationFrames.indexOf(handle);
			if (index >= 0) {
				animationFrames.splice(index, 1);
			}
			callback(timestamp);
		});
		animationFrames.push(handle);
		return handle;
	}

	function wait(duration: number): Promise<void> {
		return new Promise((resolve) => {
			trackedTimeout(resolve, duration);
		});
	}

	function waitMaybeSkip(duration: number): Promise<void> {
		if (!resolveSkipRequested) {
			return new Promise((resolve) => {
				const timeoutHandle = trackedTimeout(() => {
					const index = skipResolvers.indexOf(resolveWithSkip);
					if (index >= 0) {
						skipResolvers.splice(index, 1);
					}
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

	function stopAutoplayQueue(): void {
		if (autoplayTimeoutHandle) {
			window.clearTimeout(autoplayTimeoutHandle);
			autoplayTimeoutHandle = 0;
		}
	}

	function clearStopRequest(): void {
		stopRequested = false;
		stopRequestedAt = 0;
	}

	function releaseSkipResolvers(): void {
		while (skipResolvers.length) {
			skipResolvers.pop()?.();
		}
	}

	function clearResolveSkip(): void {
		resolveSkipRequested = false;
		releaseSkipResolvers();
	}

	function requestStopSpin(): void {
		if (roundState !== 'spinning' || stopRequested) return;
		stopRequested = true;
		stopRequestedAt = performance.now();
		emitAudioCue('spin.stop.request', {
			quickSpin: quickSpinEnabled,
			reelsActive: reelStates.filter((state) => state === 'spinning' || state === 'braking').length,
		});
	}

	function requestResolveSkip(): void {
		if ((roundState !== 'showingLines' && roundState !== 'countingWin') || resolveSkipRequested)
			return;
		resolveSkipRequested = true;
		emitAudioCue('spin.skip.request', {
			roundState,
			activeWheel: activeWheelState?.type ?? null,
			activeLine: activeLine?.lineNumber ?? null,
		});
		releaseSkipResolvers();
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

	function handleSpinAction(): void {
		if (canStop) {
			requestStopSpin();
			return;
		}

		if (canSkip) {
			requestResolveSkip();
			return;
		}

		void spinPrototype();
	}

	async function runBonusSession(
		mode: BonusMode,
		session: ReturnType<typeof simulateBonusRoundSession>,
		options: {
			cost?: number;
			source?: 'buy' | 'trigger';
			settleBalance?: boolean;
		} = {},
	): Promise<void> {
		const cost = options.cost ?? 0;
		const source = options.source ?? 'buy';
		const shouldSettleBalance = options.settleBalance ?? isLiveSource;
		const stickyWheels = mode === 'super' && BONUS_ROUND_CONFIG[mode].stickyWheels;
		let stickyResolvedWheels: Record<string, ResolvedWheelState> = {};
		let stickyLockedCells = createLockedCellGrid();
		let accumulatedWin = 0;

		lastPaidWin = 0;
		if (shouldSettleBalance && cost > 0) {
			liveBalance = Math.max(0, liveBalance - cost);
		}
		bonusPreviewState = {
			mode,
			totalSpins: session.spins.length,
			cost,
			totalPaid: session.totalPaid,
			currentSpin: 0,
			accumulatedWin: 0,
			stickyWheels,
		};

		emitAudioCue(source === 'buy' ? 'bonus.buy.start' : 'bonus.trigger.start', {
			mode,
			cost,
			spins: session.spins.length,
			bet: selectedSourceBet,
			stickyWheels,
		});
		await playFeatureTransition('intro', mode, session.spins.length, stickyWheels);

		for (const [index, bonusSpin] of session.spins.entries()) {
			clearRoundVisuals({
				preserveBonusPreview: true,
				preserveResolvedWheels: stickyWheels && index > 0,
			});
			spinCounter += 1;
			roundState = 'spinning';
			const stickyCountBeforeSpin = stickyWheels
				? countLockedMultiplierCells(stickyLockedCells)
				: 0;
			activeBonusSpinMode = mode;
			activeBonusDangerLevel =
				mode === 'super'
					? Math.min(Math.max(stickyCountBeforeSpin + (index > 0 ? 1 : 0), 1), 4)
					: 1;
			currentSpinMood = deriveBonusSpinMood(mode, bonusSpin, stickyCountBeforeSpin);
			reelAnticipation = enhanceBonusReelAnticipation(
				mode,
				bonusSpin.board,
				bonusSpin.lineResults,
				stickyCountBeforeSpin,
			);
			timingConfig = getTimingConfig(quickSpinEnabled, currentSpinMood);
			bonusPreviewState = {
				mode,
				totalSpins: session.spins.length,
				cost,
				totalPaid: session.totalPaid,
				currentSpin: index + 1,
				accumulatedWin,
				stickyWheels,
			};

			if (stickyWheels && index > 0) {
				resolvedWheelStates = { ...stickyResolvedWheels };
				lockedCells = cloneLockedCellGrid(stickyLockedCells);
			}

			emitAudioCue('bonus.spin.start', {
				mode,
				spin: index + 1,
				totalSpins: session.spins.length,
				stickyWheels,
				source,
			});

			await animateReelsTo(
				cloneBoard(bonusSpin.board),
				reelAnticipation,
				stickyWheels ? stickyLockedCells : createLockedCellGrid(),
			);
			displayBoard = applyLockedCellsToBoard(
				cloneBoard(bonusSpin.board),
				stickyWheels ? stickyLockedCells : createLockedCellGrid(),
			);
			lineResults = bonusSpin.lineResults;
			totalWin = bonusSpin.totalWin;

			const wheelQueue =
				stickyWheels && stickyResolvedWheels
					? bonusSpin.wheelQueue.filter((wheel) => !stickyResolvedWheels[wheelPositionKey(wheel)])
					: bonusSpin.wheelQueue;

			emitAudioCue('reels.settled', {
				lines: bonusSpin.lineResults.length,
				wheels: wheelQueue.length,
				totalWin: bonusSpin.totalWin,
				mode,
				spin: index + 1,
			});

			roundState = 'showingLines';
			await wait(timingConfig.resolveDelay);

			if (wheelQueue.length) {
				await resolveWheelQueue(wheelQueue);
			}

			const fullResolvedState = resolvedStatesFromWheelResults(bonusSpin.wheelResults);
			if (stickyWheels) {
				stickyResolvedWheels = { ...resolvedWheelStates };
				stickyLockedCells = cloneLockedCellGrid(lockedCells);
			} else {
				resolvedWheelStates = fullResolvedState;
			}
			displayBoard = applyLockedCellsToBoard(
				cloneBoard(bonusSpin.board),
				stickyWheels ? stickyLockedCells : createLockedCellGrid(),
			);

			if (bonusSpin.lineResults.length) {
				await playLineShowcase(bonusSpin.lineResults);
			}

			accumulatedWin += bonusSpin.totalWin;
			bonusPreviewState = {
				mode,
				totalSpins: session.spins.length,
				cost,
				totalPaid: session.totalPaid,
				currentSpin: index + 1,
				accumulatedWin,
				stickyWheels,
			};

			emitAudioCue('bonus.spin.complete', {
				mode,
				spin: index + 1,
				spinWin: bonusSpin.totalWin,
				accumulatedWin,
				source,
			});
		}

		activeBonusSpinMode = null;
		activeBonusDangerLevel = 0;

		await playFeatureTransition(
			'outro',
			mode,
			session.spins.length,
			stickyWheels,
			session.totalPaid,
		);
		totalWin = session.totalPaid;
		if (session.totalPaid > 0) {
			await playTotalWinCountUp();
		}

		recordBonusHistory(
			mode,
			session,
			spinCounter,
			selectedSourceBet,
			shouldSettleBalance ? liveBalance + session.totalPaid : liveBalance,
			source,
		);
		if (shouldSettleBalance) {
			settleLiveBalance(session.totalPaid);
		}
		emitAudioCue(source === 'buy' ? 'bonus.buy.complete' : 'bonus.trigger.complete', {
			mode,
			totalWin: session.totalPaid,
			stickyWheels,
			spins: session.spins.length,
		});
		finishRound();
	}

	async function handleBonusBuy(mode: BonusMode): Promise<void> {
		if (!isLiveSource || roundState !== 'idle' || autoplayEnabled) return;

		const cost = bonusBuyCost(mode);
		if (liveBalance < cost) {
			emitAudioCue('bonus.buy.blocked', {
				mode,
				cost,
				balance: liveBalance,
			});
			return;
		}

		stopAutoplayQueue();
		clearWork();
		clearRoundVisuals();

		const session = simulateBonusRoundSession(mode, selectedSourceBet);
		betSize = selectedSourceBet;
		await runBonusSession(mode, session, {
			cost,
			source: 'buy',
			settleBalance: true,
		});
	}

	function updateLiveBet(direction: -1 | 1): void {
		if (!isLiveSource || roundState !== 'idle') return;
		liveBetIndex = Math.max(0, Math.min(liveBetOptions.length - 1, liveBetIndex + direction));
		betSize = liveBetOptions[liveBetIndex];
	}

	function resetBankroll(): void {
		if (roundState !== 'idle') return;
		liveBalance = LIVE_BALANCE_START;
		lastPaidWin = 0;
		liveLoopSignals = createLoopSignals();
		bonusPreviewState = null;
		featureTransitionState = null;
		resolvedWheelStates = {};
		lockedCells = createLockedCellGrid();
		bonusTriggerRevealState = null;
		if (isLiveSource) {
			betSize = selectedSourceBet;
		}
		emitAudioCue('bankroll.reset', {
			balance: liveBalance,
			bet: selectedSourceBet,
		});
	}

	function toggleSound(): void {
		soundEnabled = !soundEnabled;
		latestAudioCue = soundEnabled ? 'sound.enabled' : 'sound.disabled';
		latestAudioCueDetail = null;
	}

	function cancelAutoplayConfirm(): void {
		autoplayConfirmOpen = false;
	}

	function confirmAutoplay(): void {
		if (!canSpin) {
			autoplayConfirmOpen = false;
			return;
		}
		autoplayConfirmOpen = false;
		autoplayEnabled = true;
		autoplaySpinsRemaining = autoplayPreset;
		emitAudioCue('autoplay.start', { count: autoplayPreset, bet: selectedSourceBet });
		void spinPrototype();
	}

	function clearWork(): void {
		stopAutoplayQueue();
		while (animationFrames.length) {
			const handle = animationFrames.pop();
			if (handle) cancelAnimationFrame(handle);
		}
		while (timeouts.length) {
			const handle = timeouts.pop();
			if (handle) window.clearTimeout(handle);
		}
		if (countupFrame) {
			cancelAnimationFrame(countupFrame);
			countupFrame = 0;
		}
	}

	function clearRoundVisuals(
		options: {
			preserveBonusPreview?: boolean;
			preserveResolvedWheels?: boolean;
		} = {},
	): void {
		lineResults = [];
		totalWin = 0;
		activeLineIndex = -1;
		showPayoutChip = false;
		activeWheelState = null;
		activeBonusTrigger = null;
		activeSpinBonusTrigger = null;
		bonusTriggerRevealState = null;
		activeBonusSpinMode = null;
		activeBonusDangerLevel = 0;
		if (!options.preserveResolvedWheels) {
			resolvedWheelStates = {};
			lockedCells = createLockedCellGrid();
		}
		wheelResultBursts = [];
		reelAnticipation = Array(REELS).fill('none');
		showTotalWin = false;
		animatedTotalWin = 0;
		if (!options.preserveBonusPreview) {
			bonusPreviewState = null;
		}
		featureTransitionState = null;
		clearStopRequest();
		clearResolveSkip();
		autoplayConfirmOpen = false;
	}

	function settleLiveBalance(payout: number): void {
		if (!isLiveSource || payout <= 0) return;
		liveBalance += payout;
		lastPaidWin = payout;
	}

	function resolvedStatesFromWheelResults(
		wheelResults: Record<string, WheelAward>,
	): Record<string, ResolvedWheelState> {
		return Object.fromEntries(
			Object.entries(wheelResults).map(([key, award]) => {
				const [row, column] = key.split('-').map(Number);
				return [
					key,
					award.type === 'blue'
						? { row, column, type: 'blue', total: award.value }
						: {
								row,
								column,
								type: 'red',
								total: award.outer * award.inner,
								outer: award.outer,
								inner: award.inner,
							},
				];
			}),
		);
	}

	function storeResolvedWheelState(wheel: LineResult['wheels'][number]): boolean {
		const key = wheelPositionKey(wheel);
		const stickyLockNew =
			Boolean(bonusPreviewState?.mode === 'super' && bonusPreviewState.stickyWheels) &&
			!lockedCells[wheel.row]?.[wheel.column]?.locked;
		resolvedWheelStates = {
			...resolvedWheelStates,
			[key]:
				wheel.type === 'blue'
					? {
							row: wheel.row,
							column: wheel.column,
							type: 'blue',
							total: wheel.total,
						}
					: {
							row: wheel.row,
							column: wheel.column,
							type: 'red',
							total: wheel.total,
							outer: wheel.outer,
							inner: wheel.inner,
						},
		};

		if (bonusPreviewState?.mode === 'super' && bonusPreviewState.stickyWheels) {
			const lockedSymbol = wheel.type === 'blue' ? 'blueWheel' : 'redWheel';
			lockedCells = lockWheelCell(lockedCells, wheel, lockedSymbol);
		}

		return stickyLockNew;
	}

	function showWheelResultBurst(wheel: LineResult['wheels'][number], sticky = false): void {
		wheelResultBurstId += 1;
		const burst = {
			id: wheelResultBurstId,
			row: wheel.row,
			column: wheel.column,
			type: wheel.type,
			total: wheel.total,
			outer: wheel.outer,
			inner: wheel.inner,
			sticky,
		};
		wheelResultBursts = [
			...wheelResultBursts.filter(
				(existing) => existing.row !== burst.row || existing.column !== burst.column,
			),
			burst,
		];
	}

	function bestSymbolFromWilds(): RegularSymbolId {
		return regularSymbols.reduce((best, symbol) =>
			(paytable[symbol][5] ?? 0) > (paytable[best][5] ?? 0) ? symbol : best,
		);
	}

	function resolveLineSymbol(
		cells: Array<Position & { symbol: SymbolId }>,
	): RegularSymbolId | null {
		for (const cell of cells) {
			if (!isWild(cell.symbol)) return cell.symbol as RegularSymbolId;
		}
		return cells.some((cell) => isWild(cell.symbol)) ? bestSymbolFromWilds() : null;
	}

	function evaluateLine(
		rows: number[],
		sourceBoard: SymbolId[][],
		wheelResults: Record<string, WheelAward>,
		bet: number,
		lineNumber: number,
	): LineResult | null {
		const cells = rows.map((row, column) => ({ row, column, symbol: sourceBoard[row][column] }));
		const symbol = resolveLineSymbol(cells);
		if (!symbol) return null;

		const positions: Position[] = [];
		const wheels: LineResult['wheels'] = [];

		for (const cell of cells) {
			if (cell.symbol === symbol || isWild(cell.symbol)) {
				positions.push({ row: cell.row, column: cell.column });

				if (cell.symbol === 'blueWheel' || cell.symbol === 'redWheel') {
					const award = wheelResults[cellKey(cell.row, cell.column)];
					if (!award) continue;

					wheels.push(
						award.type === 'blue'
							? {
									row: cell.row,
									column: cell.column,
									type: 'blue',
									total: award.value,
								}
							: {
									row: cell.row,
									column: cell.column,
									type: 'red',
									total: award.outer * award.inner,
									outer: award.outer,
									inner: award.inner,
								},
					);
				}
				continue;
			}

			break;
		}

		const matchCount = positions.length;
		const baseMultiplier = paytable[symbol][matchCount];
		if (!baseMultiplier || matchCount < 3) return null;

		const bonusMultiplier = wheels.reduce((sum, wheel) => sum + wheel.total, 0);
		const totalMultiplier = baseMultiplier + bonusMultiplier;

		return {
			lineNumber,
			rows,
			symbol,
			matchCount,
			baseMultiplier,
			bonusMultiplier,
			totalMultiplier,
			payout: totalMultiplier * bet,
			positions,
			wheels,
		};
	}

	function evaluateBoard(
		sourceBoard: SymbolId[][],
		wheelResults: Record<string, WheelAward>,
		bet: number,
	): LineResult[] {
		return evaluateBoardFromEngine(sourceBoard, wheelResults, bet);
	}

	function deriveSpinMood(results: LineResult[], bet: number): SpinMood {
		return deriveSpinMoodFromEngine(results, bet);
	}

	function buildWheelQueue(results: LineResult[]): LineResult['wheels'] {
		return buildWheelQueueFromEngine(results);
	}

	function blueWheelStyle(wheel: ActiveWheelState | null): string {
		if (!wheel || wheel.type !== 'blue') return '';
		const target = (quickSpinEnabled ? 1800 : 2880) + segmentRotation(wheel.blueIndex ?? 0);
		return `--wheel-target:${target}deg; --wheel-duration:${timingConfig.blueResolve}ms;`;
	}

	function redWheelStyle(wheel: ActiveWheelState | null): string {
		if (!wheel || wheel.type !== 'red') return '';
		const outerTarget = (quickSpinEnabled ? 2160 : 3240) + segmentRotation(wheel.outerIndex ?? 0);
		const innerTarget = -(
			(quickSpinEnabled ? 1440 : 2160) +
			(wheel.innerIndex ?? 0) * WHEEL_SEGMENT_ANGLE
		);
		return `--outer-target:${outerTarget}deg; --outer-duration:${timingConfig.redOuterResolve}ms; --inner-target:${innerTarget}deg; --inner-duration:${timingConfig.redInnerResolve}ms;`;
	}

	function activeWheelMessage(wheel: ActiveWheelState | null): { title: string; detail: string } {
		if (!wheel) return { title: '', detail: '' };

		if (wheel.type === 'blue') {
			return wheel.phase === 'blue-spinning'
				? { title: 'Blue wheel spinning...', detail: `target ${formatMultiplier(wheel.total)}` }
				: { title: `+${formatMultiplier(wheel.total)}`, detail: 'reused on every winning line' };
		}

		if (wheel.phase === 'red-outer-spinning') {
			return {
				title: 'Outer wheel spinning...',
				detail: `seeking ${formatMultiplier(wheel.outer ?? 0)}`,
			};
		}

		if (wheel.phase === 'red-outer-locked') {
			return {
				title: `Outer landed ${formatMultiplier(wheel.outer ?? 0)}`,
				detail: 'inner wheel loading',
			};
		}

		if (wheel.phase === 'red-inner-spinning') {
			return {
				title: 'Inner wheel spinning...',
				detail: `outer ${formatMultiplier(wheel.outer ?? 0)}`,
			};
		}

		return {
			title: `+${formatMultiplier(wheel.total)}`,
			detail: `${formatMultiplier(wheel.outer ?? 0)} x ${formatMultiplier(wheel.inner ?? 0)}`,
		};
	}

	function toPoint(position: Position): Point {
		return {
			x: position.column * (SIZE + GAP) + SIZE / 2,
			y: position.row * (SIZE + GAP) + SIZE / 2,
		};
	}

	async function animateReelsTo(
		targetBoard: SymbolId[][],
		anticipation: ReelAnticipation[],
		lockedGrid: LockedCellState[][] = createLockedCellGrid(),
		bonusTrigger: BonusTrigger | null = null,
	): Promise<void> {
		reelStates = Array(REELS).fill('spinning');
		displayBoard = applyLockedCellsToBoard(randomLiveBaseGameBoard(), lockedGrid);

		const resolvedTargetBoard = applyLockedCellsToBoard(targetBoard, lockedGrid);
		const targetColumns = Array.from({ length: REELS }, (_, column) =>
			lockCellsInColumn(columnValues(resolvedTargetBoard, column), column, lockedGrid),
		);
		const spinStart = performance.now();
		const manualStopStep = quickSpinEnabled ? 34 : 56;
		const manualBrakeLead = quickSpinEnabled ? 42 : 72;

		await Promise.all(
			Array.from({ length: REELS }, (_, column) => {
				return new Promise<void>((resolve) => {
					const swapInterval = timingConfig.reelInterval + column * (quickSpinEnabled ? 2 : 5);
					const scatterDelay = scatterTriggerDelayBonus(column, bonusTrigger);
					const naturalBrakeLead = Math.max(
						column === REELS - 1 ? finalReelBrakeLead(anticipation[column]) : 0,
						scatterTriggerBrakeLead(column, bonusTrigger),
					);
					const naturalStopAt =
						spinStart +
						timingConfig.reelStopBase +
						column * timingConfig.reelStopStep +
						anticipationDelayBonus(column, anticipation[column]) +
						scatterDelay;
					let lastSwap = spinStart - swapInterval;
					let braking = false;
					let settled = false;

					const step = (now: number): void => {
						if (settled) return;

						const manualStopAt = stopRequested
							? stopRequestedAt + column * manualStopStep
							: Number.POSITIVE_INFINITY;
						const manualStopActive = manualStopAt <= naturalStopAt;
						const effectiveStopAt = manualStopActive ? manualStopAt : naturalStopAt;
						const effectiveBrakeLead = manualStopActive
							? Math.max(manualBrakeLead, Math.min(naturalBrakeLead, manualBrakeLead))
							: naturalBrakeLead;
						const brakeStartAt = effectiveStopAt - effectiveBrakeLead;

						if (!braking && effectiveBrakeLead > 0 && now >= brakeStartAt) {
							braking = true;
							lastSwap = now;
							reelStates = reelStates.map((state, index) => (index === column ? 'braking' : state));
							emitAudioCue('reel.brake', {
								reel: column + 1,
								anticipation: anticipation[column],
								manualStop: manualStopActive,
								remainingMs: Math.max(0, Math.round(effectiveStopAt - now)),
							});
						}

						const brakeProgress =
							braking && effectiveBrakeLead > 0
								? Math.max(0, Math.min(1, (now - brakeStartAt) / Math.max(effectiveBrakeLead, 1)))
								: 0;
						const effectiveSwapInterval = braking
							? manualStopActive
								? Math.max(
										16,
										Math.round(
											swapInterval *
												interpolate(
													quickSpinEnabled ? 0.55 : 0.68,
													quickSpinEnabled ? 0.95 : 1.22,
													brakeProgress,
												),
										),
									)
								: Math.round(
										swapInterval *
											brakingSwapIntervalMultiplier(anticipation[column], brakeProgress),
									)
							: swapInterval;

						if (now - lastSwap >= effectiveSwapInterval) {
							const nextColumn =
								braking && !manualStopActive && anticipation[column] !== 'none'
									? brakingPreviewColumn(
											column,
											targetColumns[column],
											anticipation[column],
											brakeProgress,
										)
									: randomColumnWindow(column);
							displayBoard = applyResolvedWheelsToBoard(
								replaceColumn(
									displayBoard,
									column,
									lockCellsInColumn(nextColumn, column, lockedGrid),
								),
								{},
							);
							displayBoard = applyLockedCellsToBoard(displayBoard, lockedGrid);
							lastSwap = now;
						}

						if (now >= effectiveStopAt) {
							settled = true;
							reelStates = reelStates.map((state, index) => (index === column ? 'landing' : state));
							displayBoard = applyResolvedWheelsToBoard(
								replaceColumn(displayBoard, column, targetColumns[column]),
								{},
							);
							displayBoard = applyLockedCellsToBoard(displayBoard, lockedGrid);
							emitAudioCue('reel.stop', {
								reel: column + 1,
								final: column === REELS - 1,
								quickSpin: quickSpinEnabled,
								anticipation: anticipation[column],
								manualStop: manualStopActive,
								elapsedMs: Math.round(now - spinStart),
							});

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
				activeWheelState = {
					...wheel,
					phase: 'blue-spinning',
					blueIndex: pickSegmentIndex(BLUE_WHEEL_SEGMENTS, wheel.total, seed),
				};
				emitAudioCue('wheel.blue.spin', {
					row: wheel.row,
					column: wheel.column,
					total: wheel.total,
				});
				await waitMaybeSkip(timingConfig.blueResolve);
				activeWheelState = { ...activeWheelState, phase: 'blue-locked' } as ActiveWheelState;
				const stickyLock = storeResolvedWheelState(wheel);
				showWheelResultBurst(wheel, stickyLock);
				emitAudioCue('wheel.blue.lock', {
					row: wheel.row,
					column: wheel.column,
					total: wheel.total,
				});
				if (stickyLock) {
					emitAudioCue('bonus.sticky.lock', {
						row: wheel.row,
						column: wheel.column,
						type: wheel.type,
						total: wheel.total,
						locked: countLockedMultiplierCells(lockedCells),
					});
				}
				await waitMaybeSkip(timingConfig.blueLocked);
				activeWheelState = null;
				continue;
			}

			activeWheelState = {
				...wheel,
				phase: 'red-outer-spinning',
				outerIndex: pickSegmentIndex(RED_OUTER_SEGMENTS, wheel.outer ?? 0, seed),
				innerIndex: pickSegmentIndex(RED_INNER_SEGMENTS, wheel.inner ?? 0, seed + 1),
			};
			emitAudioCue('wheel.red.outer.spin', {
				row: wheel.row,
				column: wheel.column,
				outer: wheel.outer ?? 0,
				inner: wheel.inner ?? 0,
			});
			await waitMaybeSkip(timingConfig.redOuterResolve);
			activeWheelState = { ...activeWheelState, phase: 'red-outer-locked' } as ActiveWheelState;
			emitAudioCue('wheel.red.outer.lock', {
				row: wheel.row,
				column: wheel.column,
				outer: wheel.outer ?? 0,
			});
			await waitMaybeSkip(timingConfig.redOuterLocked);
			activeWheelState = { ...activeWheelState, phase: 'red-inner-spinning' } as ActiveWheelState;
			emitAudioCue('wheel.red.inner.spin', {
				row: wheel.row,
				column: wheel.column,
				outer: wheel.outer ?? 0,
				inner: wheel.inner ?? 0,
			});
			await waitMaybeSkip(timingConfig.redInnerResolve);
			activeWheelState = { ...activeWheelState, phase: 'red-locked' } as ActiveWheelState;
			const stickyLock = storeResolvedWheelState(wheel);
			showWheelResultBurst(wheel, stickyLock);
			emitAudioCue('wheel.red.final', {
				row: wheel.row,
				column: wheel.column,
				outer: wheel.outer ?? 0,
				inner: wheel.inner ?? 0,
				total: wheel.total,
			});
			if (stickyLock) {
				emitAudioCue('bonus.sticky.lock', {
					row: wheel.row,
					column: wheel.column,
					type: wheel.type,
					total: wheel.total,
					outer: wheel.outer ?? 0,
					inner: wheel.inner ?? 0,
					locked: countLockedMultiplierCells(lockedCells),
				});
			}
			await waitMaybeSkip(timingConfig.redLocked);
			activeWheelState = null;
		}
	}

	function resultCue(result: LineResult): string {
		if (result.wheels.some((wheel) => wheel.type === 'red')) return 'win.big';
		if (result.wheels.length || result.totalMultiplier >= 12) return 'win.medium';
		return 'win.small';
	}

	async function playLineShowcase(results: LineResult[]): Promise<void> {
		if (resolveSkipRequested) {
			activeLineIndex = -1;
			showPayoutChip = false;
			return;
		}

		for (const [index, result] of results.entries()) {
			const showcaseTiming = showcaseTimingFor(result);
			const tone = resultTone(result);
			activeLineIndex = index;
			showPayoutChip = false;
			emitAudioCue(resultCue(result), {
				line: result.lineNumber,
				tone,
				payout: result.payout,
				totalMultiplier: result.totalMultiplier,
				wheels: result.wheels.length,
			});
			emitAudioCue('line.focus', {
				line: result.lineNumber,
				tone,
				payout: result.payout,
				totalMultiplier: result.totalMultiplier,
			});
			await waitMaybeSkip(showcaseTiming.intro);
			if (resolveSkipRequested) break;
			showPayoutChip = true;
			emitAudioCue('line.payout', {
				line: result.lineNumber,
				tone,
				payout: result.payout,
				totalMultiplier: result.totalMultiplier,
			});
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
		emitAudioCue('win.countup', {
			totalWin,
			totalMultiplier,
			lines: lineResults.length,
		});

		if (!resolveSkipRequested) {
			await new Promise<void>((resolve) => {
				const start = performance.now();
				const step = (now: number): void => {
					if (resolveSkipRequested) {
						animatedTotalWin = totalWin;
						countupFrame = 0;
						resolve();
						return;
					}

					const progress = Math.min((now - start) / timingConfig.totalWinCount, 1);
					const eased = 1 - Math.pow(1 - progress, 3);
					animatedTotalWin = totalWin * eased;

					if (progress < 1) {
						countupFrame = requestAnimationFrame(step);
						return;
					}

					animatedTotalWin = totalWin;
					countupFrame = 0;
					resolve();
				};

				countupFrame = requestAnimationFrame(step);
			});
		} else {
			animatedTotalWin = totalWin;
		}

		emitAudioCue('win.countup.complete', {
			totalWin,
			totalMultiplier,
		});
		if (resolveSkipRequested) {
			await new Promise<void>((resolve) => {
				trackedTimeout(resolve, quickSpinEnabled ? 180 : 320);
			});
		} else {
			await waitMaybeSkip(timingConfig.totalWinHold);
		}
		showTotalWin = false;
	}

	function scheduleNextAutoplaySpin(): void {
		stopAutoplayQueue();
		if (isLiveSource && liveBalance < selectedSourceBet) {
			autoplayEnabled = false;
			autoplaySpinsRemaining = 0;
			return;
		}
		if (!autoplayEnabled || autoplaySpinsRemaining <= 0) return;

		autoplayTimeoutHandle = trackedTimeout(() => {
			autoplayTimeoutHandle = 0;
			void spinPrototype();
		}, timingConfig.autoplayPause);
	}

	function finishRound(): void {
		roundState = 'idle';
		reelAnticipation = Array(REELS).fill('none');
		clearResolveSkip();

		if (
			autoplayEnabled &&
			autoplaySpinsRemaining > 0 &&
			(!isLiveSource || liveBalance >= selectedSourceBet)
		) {
			scheduleNextAutoplaySpin();
			return;
		}

		autoplayEnabled = false;
		autoplaySpinsRemaining = 0;
		emitAudioCue('spin.complete', {
			totalWin,
			lines: lineResults.length,
			wheels: buildWheelQueue(lineResults).length,
		});
	}

	async function spinPrototype(): Promise<void> {
		if (!canSpin) return;

		stopAutoplayQueue();
		clearRoundVisuals();
		const source = activeSpinSource();
		const liveSpin = selectedScenarioKey === LIVE_SPIN_KEY;
		if (liveSpin && liveBalance < source.bet) {
			emitAudioCue('spin.blocked', {
				reason: 'balance',
				balance: liveBalance,
				bet: source.bet,
			});
			return;
		}

		betSize = source.bet;
		lastPaidWin = 0;
		if (liveSpin) {
			liveBalance = Math.max(0, liveBalance - source.bet);
		}
		spinCounter += 1;
		roundState = 'spinning';

		if (autoplayEnabled && autoplaySpinsRemaining > 0) {
			autoplaySpinsRemaining -= 1;
		}

		emitAudioCue(quickSpinEnabled ? 'spin.quick.start' : 'spin.start', {
			source: selectedScenarioKey === LIVE_SPIN_KEY ? 'live' : 'forced',
			bet: source.bet,
			quickSpin: quickSpinEnabled,
			autoplay: autoplayEnabled,
		});

		const finalBoard = cloneBoard(source.board);
		const results =
			source.math?.lineResults ?? evaluateBoard(finalBoard, source.wheelResults, betSize);
		const wheelQueue = source.math?.wheelQueue ?? buildWheelQueue(results);
		const bonusTrigger = source.math?.bonusTrigger ?? source.bonusTrigger ?? null;
		reelAnticipation = deriveReelAnticipation(finalBoard, results);
		currentSpinMood =
			source.math?.spinMood ??
			(bonusTrigger?.mode === 'super'
				? 'big'
				: bonusTrigger
					? 'feature'
					: deriveSpinMood(results, betSize));
		timingConfig = getTimingConfig(quickSpinEnabled, currentSpinMood);
		activeSpinBonusTrigger = bonusTrigger;
		try {
			await animateReelsTo(finalBoard, reelAnticipation, createLockedCellGrid(), bonusTrigger);
		} finally {
			activeSpinBonusTrigger = null;
		}
		displayBoard = finalBoard;
		lineResults = results;
		totalWin = source.math?.totalWin ?? results.reduce((sum, result) => sum + result.payout, 0);
		activeBonusTrigger = bonusTrigger;
		recordSpinHistory(
			source,
			results,
			totalWin,
			currentSpinMood,
			spinCounter,
			source.bet,
			liveSpin ? liveBalance + totalWin : liveBalance,
		);
		if (liveSpin) {
			recordLiveLoopSignals(results, wheelQueue, totalWin, source.bet);
		}
		emitAudioCue('reels.settled', {
			lines: results.length,
			wheels: wheelQueue.length,
			totalWin,
			bonusMode: bonusTrigger?.mode ?? null,
			bonusCount: bonusTrigger?.count ?? 0,
		});

		if (!results.length && !bonusTrigger) {
			emitAudioCue('spin.dead', {
				lines: 0,
				wheels: 0,
				totalWin: 0,
			});
			finishRound();
			return;
		}

		roundState = 'showingLines';
		await wait(timingConfig.resolveDelay);

		if (wheelQueue.length) {
			await resolveWheelQueue(wheelQueue);
		}

		await playLineShowcase(results);

		if (totalWin >= betSize * 50) {
			await playTotalWinCountUp();
		}

		if (liveSpin) {
			settleLiveBalance(totalWin);
		}

		if (bonusTrigger) {
			await playBonusTriggerReveal(bonusTrigger);
			const session = simulateBonusRoundSession(bonusTrigger.mode, source.bet);
			await runBonusSession(bonusTrigger.mode, session, {
				cost: 0,
				source: 'trigger',
				settleBalance: liveSpin,
			});
			return;
		}

		finishRound();
	}
	function resetView(): void {
		autoplayEnabled = false;
		autoplaySpinsRemaining = 0;
		clearWork();
		clearRoundVisuals();
		roundState = 'idle';
		currentSpinMood = 'base';
		timingConfig = getTimingConfig(quickSpinEnabled, currentSpinMood);
		reelStates = [...reelStatesDefault];
		lastPaidWin = 0;
		if (selectedScenarioKey === LIVE_SPIN_KEY) {
			livePreviewBoard = randomLiveBaseGameBoard();
			betSize = selectedSourceBet;
			displayBoard = cloneBoard(livePreviewBoard);
		} else {
			betSize = currentScenario.bet;
			displayBoard = cloneBoard(currentScenario.board);
		}
		latestAudioCue = 'system.ready';
	}

	function handleScenarioChange(): void {
		if (roundState !== 'idle') return;
		if (selectedScenarioKey === LIVE_SPIN_KEY) {
			livePreviewBoard = randomLiveBaseGameBoard();
		}
		resetView();
	}

	function handleGlobalKeydown(event: KeyboardEvent): void {
		if (event.code !== 'Space') return;
		const target = event.target as HTMLElement | null;
		if (
			target &&
			(target.closest('button, input, select, textarea, [contenteditable="true"]') ||
				target.isContentEditable)
		) {
			return;
		}
		if (!canSpin || autoplayConfirmOpen) return;
		event.preventDefault();
		handleSpinAction();
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
			autoplayConfirmOpen = false;
			emitAudioCue('autoplay.stop', { remaining: 0 });
			return;
		}

		if (!canSpin) return;
		autoplayConfirmOpen = true;
		emitAudioCue('autoplay.prompt', { count: autoplayPreset, bet: selectedSourceBet });
	}

	function wheelSummary(result: LineResult): string {
		if (!result.wheels.length) return 'No wheel bonus';
		return result.wheels
			.map((wheel) =>
				wheel.type === 'blue'
					? `Blue +${formatMultiplier(wheel.total)}`
					: `Red ${formatMultiplier(wheel.outer ?? 0)} x ${formatMultiplier(wheel.inner ?? 0)}`,
			)
			.join(' | ');
	}

	function audioCueSummary(detail: AudioCueDetail | null): string {
		if (!detail) return 'awaiting round';

		const { payload } = detail;
		if (detail.cue === 'reel.brake' && typeof payload.reel === 'number') {
			return `reel ${payload.reel} ${payload.anticipation ?? 'hold'}`;
		}

		if (detail.cue === 'reel.stop' && typeof payload.reel === 'number') {
			return `reel ${payload.reel}${payload.final ? ' final' : ''}`;
		}

		if (
			(detail.cue === 'line.focus' || detail.cue === 'line.payout') &&
			typeof payload.line === 'number'
		) {
			return `line ${payload.line}${typeof payload.tone === 'string' ? ` ${payload.tone}` : ''}`;
		}

		if (
			detail.cue.startsWith('wheel.') &&
			typeof payload.row === 'number' &&
			typeof payload.column === 'number'
		) {
			return `r${payload.row + 1} c${payload.column + 1}`;
		}

		if (detail.cue === 'win.countup' && typeof payload.totalMultiplier === 'number') {
			return `${formatMultiplier(payload.totalMultiplier)} total`;
		}

		if (detail.cue === 'reels.settled' && typeof payload.lines === 'number') {
			return `${payload.lines} lines / ${payload.wheels ?? 0} wheels`;
		}

		return typeof payload.source === 'string' ? payload.source : 'event ready';
	}

	function resultTone(result: LineResult): LineTone {
		if (result.wheels.some((wheel) => wheel.type === 'red')) return 'big';
		if (result.wheels.length || result.totalMultiplier >= 12) return 'medium';
		return 'small';
	}

	function showcaseTimingFor(result: LineResult): { intro: number; hold: number; gap: number } {
		switch (resultTone(result)) {
			case 'small':
				return {
					intro: Math.max(40, Math.round(timingConfig.lineIntro * 0.56)),
					hold: Math.max(180, Math.round(timingConfig.lineHold * 0.48)),
					gap: Math.max(40, Math.round(timingConfig.lineGap * 0.5)),
				};
			case 'big':
				return {
					intro: Math.round(timingConfig.lineIntro * 1.12),
					hold: Math.round(timingConfig.lineHold * 1.16),
					gap: Math.round(timingConfig.lineGap * 1.08),
				};
			default:
				return {
					intro: timingConfig.lineIntro,
					hold: timingConfig.lineHold,
					gap: timingConfig.lineGap,
				};
		}
	}

	onMount(() => {
		if (typeof window === 'undefined') return;
		window.addEventListener('keydown', handleGlobalKeydown);
		return () => {
			window.removeEventListener('keydown', handleGlobalKeydown);
		};
	});

	onDestroy(() => {
		clearWork();
	});
</script>

<div class="workshop-shell">
	<div class="theme-backdrop" aria-hidden="true">
		<div class="theme-halo theme-halo-blue"></div>
		<div class="theme-halo theme-halo-red"></div>
		<div class="theme-totem theme-totem-wolf">
			<img src={symbolArtAssets.wolf} alt="" />
		</div>
		<div class="theme-totem theme-totem-crown">
			<img src={symbolArtAssets.crown} alt="" />
		</div>
		<div class="theme-totem theme-totem-wheel theme-totem-wheel-blue">
			<img src={wheelSymbolAssets.blueWheel} alt="" />
		</div>
		<div class="theme-totem theme-totem-wheel theme-totem-wheel-red">
			<img src={wheelSymbolAssets.redWheel} alt="" />
		</div>
		<div class="theme-arch"></div>
		<div class="theme-floor"></div>
		<div class="theme-runes"></div>
	</div>
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">Live Slot Surface</p>
			<h1>Dual Wild Wheels</h1>
			<p class="hero-note">
				A 5x5 base game built around rare blue boosts, rarer red dual wheels, and two paid free-spin
				features.
			</p>
		</div>
		<div class="hero-status">
			<div class="hero-status-block">
				<span>Status</span>
				<strong>{statusLabel}</strong>
			</div>
			<div class="hero-status-block">
				<span>Balance</span>
				<strong>{formatCurrency(liveBalance)}</strong>
			</div>
			<div class="hero-status-block">
				<span>Bet</span>
				<strong>{formatCurrency(selectedSourceBet)}</strong>
			</div>
			<div class="hero-status-block">
				<span>Mode</span>
				<strong
					>{bonusPreviewState
						? bonusFeatureLabel(bonusPreviewState.mode)
						: selectedSourceLabel}</strong
				>
			</div>
			<div class="hero-status-block">
				<span>Pace</span>
				<strong>{quickSpinEnabled ? 'Quick' : 'Standard'}</strong>
			</div>
		</div>
	</section>

	<div class="layout-grid">
		<div class="stage-column">
			<section
				class:stage={true}
				class:stage-tone-medium={activeStageTone === 'medium'}
				class:stage-tone-big={activeStageTone === 'big'}
				class:stage-feature-mode={Boolean(bonusPreviewState)}
				class:stage-feature-super={bonusPreviewState?.mode === 'super'}
				class:stage-transition-active={Boolean(featureTransitionState)}
				class:stage-transition-super={featureTransitionState?.mode === 'super'}
				class:stage-bonus-trigger={Boolean(bonusTriggerRevealState)}
				class:stage-bonus-trigger-super={bonusTriggerRevealState?.mode === 'super'}
			>
				<div class="stage-topline">
					<div>
						<p class="panel-label">Reels</p>
						<h2>Main Grid</h2>
					</div>
					<div class="stage-meta">
						<div><span>Round</span><strong>{spinCounter}</strong></div>
						<div>
							<span>Mode</span>
							<strong
								>{bonusPreviewState
									? bonusFeatureLabel(bonusPreviewState.mode)
									: bonusTriggerRevealState
										? bonusFeatureLabel(bonusTriggerRevealState.mode)
										: selectedSourceLabel}</strong
							>
						</div>
						<div>
							<span>{bonusPreviewState ? 'Free Spins' : 'Autoplay'}</span>
							<strong
								>{bonusPreviewState
									? `${bonusPreviewState.currentSpin}/${bonusPreviewState.totalSpins}`
									: bonusTriggerRevealState
										? `${bonusTriggerRevealState.count} scatters`
										: autoplayQueueLabel}</strong
							>
						</div>
						<div>
							<span>Win Focus</span><strong
								>{lineResults.length
									? `${activeLineIndex >= 0 ? activeLineIndex + 1 : lineResults.length}/${lineResults.length}`
									: '0/0'}</strong
							>
						</div>
					</div>
				</div>

				{#if bonusPreviewState}
					<div
						class:feature-banner={true}
						class:feature-banner-super={bonusPreviewState.mode === 'super'}
						aria-live="polite"
					>
						<div class="feature-banner-copy">
							<span class="feature-banner-kicker">{bonusFeatureLabel(bonusPreviewState.mode)}</span>
							<strong
								>{bonusPreviewState.currentSpin === 0
									? `${bonusTriggerCount(bonusPreviewState.mode)} scatters unlock ${bonusPreviewState.totalSpins} free spins`
									: `${bonusFeatureLabel(bonusPreviewState.mode)} | ${featureSpinsRemaining} remaining`}</strong
							>
							<em
								>{bonusPreviewState.currentSpin === 0
									? bonusBuyDescription(bonusPreviewState.mode)
									: `Spin ${bonusPreviewState.currentSpin}/${bonusPreviewState.totalSpins} | ${formatCurrency(
											bonusPreviewState.accumulatedWin,
										)} collected${bonusPreviewState.stickyWheels ? ' | sticky values active' : ''}`}</em
							>
						</div>
						<div class="feature-banner-metrics">
							<div class="feature-banner-stat">
								<span>Remaining</span>
								<strong>{featureSpinsRemaining}</strong>
							</div>
							<div class="feature-banner-stat">
								<span>Collected</span>
								<strong>{formatCurrency(bonusPreviewState.accumulatedWin)}</strong>
							</div>
							{#if bonusPreviewState.stickyWheels}
								<div class="feature-banner-stat feature-banner-stat-hot">
									<span>Locked</span>
									<strong>{stickyLockCount}</strong>
								</div>
							{/if}
						</div>
						{#if bonusPreviewState.stickyWheels}
							<div class="feature-sticky-pill">
								<span>Sticky Wheels</span>
								<strong
									>Any landed wheel keeps its resolved value and locked cell for all 10 spins.</strong
								>
							</div>
						{/if}
						<div class="feature-progress-band">
							<div class="feature-progress-copy">
								<span>{bonusPreviewState.stickyWheels ? 'Sticky Build' : 'Feature Pace'}</span>
								<strong
									>{bonusPreviewState.currentSpin === 0
										? 'Bonus entry loaded'
										: bonusPreviewState.stickyWheels
											? `${stickyLockCount} cells locked | ${formatMultiplier(featureCollectedMultiplier)} collected`
											: `${formatMultiplier(featureCollectedMultiplier)} collected across ${bonusPreviewState.currentSpin} spins`}</strong
								>
							</div>
							<div class="feature-progress-rail" aria-hidden="true">
								<div
									class:feature-progress-fill={true}
									class:feature-progress-fill-super={bonusPreviewState.mode === 'super'}
									style={`width:${Math.max(featureProgressRatio * 100, bonusPreviewState.currentSpin > 0 ? 8 : 0)}%`}
								></div>
							</div>
						</div>
					</div>
				{/if}

				{#if featureTransitionState}
					<div
						class:feature-transition-card={true}
						class:feature-transition-card-intro={featureTransitionState.phase === 'intro'}
						class:feature-transition-card-super={featureTransitionState.mode === 'super'}
						class:feature-transition-card-outro={featureTransitionState.phase === 'outro'}
						aria-live="polite"
					>
						<div class="feature-transition-copy">
							<span class="feature-transition-kicker"
								>{featureTransitionState.phase === 'intro'
									? `${bonusFeatureLabel(featureTransitionState.mode)} unlocked`
									: `${bonusFeatureLabel(featureTransitionState.mode)} closed`}</span
							>
							<strong>{bonusTransitionHeadline(featureTransitionState)}</strong>
							<em>{bonusTransitionNote(featureTransitionState)}</em>
						</div>
						<div class="feature-transition-seals" aria-hidden="true">
							{#each bonusTransitionSlots(featureTransitionState.mode) as slot}
								<div
									class:feature-trigger-seal={true}
									class:feature-trigger-seal-super={featureTransitionState.mode === 'super'}
								>
									<span>{featureTransitionState.mode === 'super' ? 'Super' : 'Bonus'}</span>
									<strong>{slot + 1}</strong>
								</div>
							{/each}
						</div>
						{#if featureTransitionState.phase === 'outro'}
							<div class="feature-transition-total">
								<span>Feature Win</span>
								<strong>{formatCurrency(featureTransitionState.totalWin ?? 0)}</strong>
							</div>
						{/if}
					</div>
				{/if}

				{#if bonusTriggerRevealState && !featureTransitionState && !bonusPreviewState}
					<div
						class:feature-transition-card={true}
						class:bonus-trigger-card={true}
						class:bonus-trigger-card-super={bonusTriggerRevealState.mode === 'super'}
						aria-live="polite"
					>
						<div class="feature-transition-copy">
							<span class="feature-transition-kicker"
								>{bonusTriggerRevealState.count} scatters landed</span
							>
							<strong>{bonusTriggerRevealHeadline(bonusTriggerRevealState)}</strong>
							<em>{bonusTriggerRevealNote(bonusTriggerRevealState)}</em>
						</div>
						<div class="feature-transition-seals" aria-hidden="true">
							{#each bonusTriggerSlots(bonusTriggerRevealState.count) as slot}
								<div
									class:feature-trigger-seal={true}
									class:feature-trigger-seal-super={bonusTriggerRevealState.mode === 'super'}
								>
									<span>Scatter</span>
									<strong>{slot + 1}</strong>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="stage-rhythm">
					<div class="stage-rhythm-summary">
						<span class="stage-rhythm-kicker">Round Flow</span>
						<strong>{spinMoodLabel(currentSpinMood)}</strong>
						<em>{spinMoodNote(currentSpinMood)}</em>
					</div>
					<div class="stage-rhythm-focus">
						<span>Focus</span>
						<strong>{stageEventLabel(activeStageTone)}</strong>
						<em>{statusLabel}</em>
					</div>
					<div class="reel-rhythm-track">
						{#each reelIndices as reelIndex}
							<div
								class:reel-rhythm-step={true}
								class:reel-rhythm-step-live={roundState === 'spinning' &&
									reelStates[reelIndex] !== 'idle'}
								class:reel-rhythm-step-brake={reelStates[reelIndex] === 'braking'}
								class:reel-rhythm-step-hot={currentSpinMood === 'feature' ||
									currentSpinMood === 'big'}
								class:reel-rhythm-step-premium={reelAnticipation[reelIndex] === 'premium'}
								class:reel-rhythm-step-wheel={reelAnticipation[reelIndex] === 'wheel'}
							>
								<span>R{reelIndex + 1}</span>
								<strong>{reelDelayLabel(reelIndex)}</strong>
								<em>{reelAnticipationLabel(reelIndex)}</em>
							</div>
						{/each}
					</div>
				</div>

				<DualWheelBoard
					{displayBoard}
					{reelStates}
					{roundState}
					spinMood={currentSpinMood}
					{activeBonusTrigger}
					bonusTriggerRevealActive={Boolean(bonusTriggerRevealState)}
					stickyResolvedWheelMode={Boolean(
						bonusPreviewState?.mode === 'super' && bonusPreviewState?.stickyWheels,
					)}
					{reelAnticipation}
					{activeLine}
					{activeLineTone}
					{activeLinePath}
					{activeLinePoints}
					{activePayoutPoint}
					{activeWheelState}
					{resolvedWheelStates}
					{lockedCells}
					{wheelResultBursts}
					{blueWheelOverlayStyle}
					{redWheelOverlayStyle}
					wheelMessage={activeWheelMessageState}
				/>

				<div class="stage-console">
					<div class="console-cluster console-cluster-bank">
						<span class="console-kicker">Bankroll</span>
						<div class="console-bank-grid">
							<div class="console-stat-tile">
								<span>Balance</span>
								<strong>{formatCurrency(liveBalance)}</strong>
							</div>
							<div class="console-stat-tile">
								<span>Last Paid</span>
								<strong>{formatCurrency(lastPaidWin)}</strong>
							</div>
							<div class="console-stat-tile">
								<span>Net</span>
								<strong
									class:metric-positive={sessionNet > 0}
									class:metric-negative={sessionNet < 0}>{formatSignedValue(sessionNet)}</strong
								>
							</div>
						</div>
					</div>

					<div class="console-cluster console-cluster-actions">
						<div class="console-action-row">
							<button
								class:primary-button={true}
								class:primary-button-stop={canStop}
								class:primary-button-skip={canSkip}
								on:click={handleSpinAction}
								disabled={(!canSpin && !canStop && !canSkip) || (canSkip && resolveSkipRequested)}
							>
								{#if canStop}
									{stopRequested ? 'Stopping...' : 'Stop Reels'}
								{:else if canSkip}
									{resolveSkipRequested ? 'Skipping...' : 'Skip Reveal'}
								{:else}
									Spin Slot
								{/if}
							</button>
							<div class="console-toggle-stack">
								<button
									class:toggle-button={true}
									class:is-active={quickSpinEnabled}
									on:click={toggleQuickSpin}
									disabled={roundState !== 'idle' || autoplayEnabled}
								>
									Quick Spin
								</button>
								<button
									class:toggle-button={true}
									class:is-active={autoplayEnabled}
									class:is-pending={autoplayConfirmOpen}
									on:click={toggleAutoplay}
									disabled={!canSpin && !autoplayEnabled}
								>
									{autoplayEnabled
										? 'Stop Autoplay'
										: autoplayConfirmOpen
											? 'Confirm Autoplay'
											: 'Autoplay'}
								</button>
								<button
									class:toggle-button={true}
									class:is-active={!soundEnabled}
									on:click={toggleSound}
									disabled={roundState !== 'idle' && !soundEnabled}
								>
									{soundEnabled ? 'Sound On' : 'Sound Off'}
								</button>
							</div>
						</div>
						{#if autoplayConfirmOpen}
							<div class="autoplay-confirm">
								<div class="autoplay-confirm-copy">
									<span>Autoplay confirmation</span>
									<strong>Start {autoplayPreset} consecutive spins?</strong>
									<em>Stake review requires autoplay to be confirmed before the first bet.</em>
								</div>
								<div class="autoplay-confirm-actions">
									<button class="secondary-button" on:click={cancelAutoplayConfirm}>Cancel</button>
									<button
										class="secondary-button autoplay-confirm-start"
										on:click={confirmAutoplay}
									>
										Start Autoplay
									</button>
								</div>
							</div>
						{/if}
						<div class="console-action-note">
							<span>Action</span>
							<strong
								>{bonusPreviewState
									? `${bonusFeatureLabel(bonusPreviewState.mode)} live`
									: statusLabel}</strong
							>
							<em
								>{bonusPreviewState
									? `${bonusPreviewState.currentSpin}/${bonusPreviewState.totalSpins} free spins | ${formatCurrency(
											bonusPreviewState.accumulatedWin,
										)} collected${bonusPreviewState.stickyWheels ? ' | sticky wheels locked' : ''}.`
									: isLiveSource
										? 'Base game reels settle bankroll, line wins, and shared wheel values by position.'
										: selectedSourceNote}</em
							>
						</div>
					</div>

					<div class="console-cluster console-cluster-bet">
						<span class="console-kicker">Stake</span>
						<div class="bet-stepper" class:bet-stepper-disabled={!isLiveSource}>
							<button
								class="secondary-button"
								on:click={() => updateLiveBet(-1)}
								disabled={!isLiveSource || roundState !== 'idle' || liveBetIndex === 0}
							>
								-
							</button>
							<div class="bet-stepper-readout">
								<span>Bet Size</span>
								<strong>{formatCurrency(selectedSourceBet)}</strong>
								<em
									>{isLiveSource
										? 'adjust between base-game rounds'
										: 'showcase rounds keep a fixed stake'}</em
								>
							</div>
							<button
								class="secondary-button"
								on:click={() => updateLiveBet(1)}
								disabled={!isLiveSource ||
									roundState !== 'idle' ||
									liveBetIndex === liveBetOptions.length - 1}
							>
								+
							</button>
						</div>
						<div class="bonus-buy-row">
							<button
								class="secondary-button bonus-buy-button bonus-buy-button-regular"
								on:click={() => void handleBonusBuy('regular')}
								disabled={!canBuyRegular}
							>
								<span>{bonusBuyTitle('regular')}</span>
								<strong>{formatCurrency(regularBuyCost)}</strong>
								<em
									>{formatMultiplier(PREVIEW_BONUS_BUY_MULTIPLIERS.regular)} stake | {BONUS_ROUND_CONFIG
										.regular.freeSpins}
									free spins</em
								>
							</button>
							<button
								class="secondary-button bonus-buy-button bonus-buy-button-super"
								on:click={() => void handleBonusBuy('super')}
								disabled={!canBuySuper}
							>
								<span>{bonusBuyTitle('super')}</span>
								<strong>{formatCurrency(superBuyCost)}</strong>
								<em
									>{formatMultiplier(PREVIEW_BONUS_BUY_MULTIPLIERS.super)} stake | sticky wheels for
									{BONUS_ROUND_CONFIG.super.freeSpins} spins</em
								>
							</button>
						</div>
						<p class="bonus-buy-note">
							Regular buys run a hotter 10-spin feature. Super buys run a sticky-wheel 10-spin
							feature and price from the live bet.
						</p>
					</div>
				</div>

				{#if showTotalWin}
					<div
						class:total-win-overlay={true}
						class:total-win-overlay-skippable={roundState === 'countingWin' &&
							!resolveSkipRequested}
						class:total-win-overlay-settled={resolveSkipRequested}
						role="button"
						tabindex="0"
						aria-label="Skip total win count-up"
						on:click={handleTotalWinOverlayClick}
						on:keydown={handleTotalWinOverlayKeydown}
					>
						<p class="total-win-kicker">
							{bonusPreviewState
								? `${bonusFeatureLabel(bonusPreviewState.mode)} complete`
								: 'Big Win'}
						</p>
						<h3>{bonusPreviewState ? 'Feature Win' : 'Round Win'}</h3>
						<strong>{formatCurrency(animatedTotalWin)}</strong>
						<span
							>{bonusPreviewState
								? `${formatMultiplier(totalMultiplier)} of stake`
								: `${formatMultiplier(totalMultiplier)} of bet`}</span
						>
						{#if bonusPreviewState}
							<small class="total-win-bonus-meta"
								>{bonusPreviewState.totalSpins} spins | {bonusPreviewState.stickyWheels
									? 'sticky wheels'
									: 'hot wheel rate'} | cost {formatMultiplier(
									bonusPreviewState.cost / selectedSourceBet,
								)}</small
							>
						{/if}
						{#if !resolveSkipRequested}
							<em class="total-win-hint">Click to reveal final win</em>
						{/if}
					</div>
				{/if}
			</section>

			<section class="tools-strip">
				<article class="tool-card">
					<p class="panel-label">Play Mode</p>
					<select
						bind:value={selectedScenarioKey}
						on:change={handleScenarioChange}
						disabled={roundState !== 'idle'}
					>
						<option value={LIVE_SPIN_KEY}>{LIVE_SPIN_LABEL}</option>
						<optgroup label="Showcase Spins">
							{#each scenarios as scenario}
								<option value={scenario.key}>{scenario.label}</option>
							{/each}
						</optgroup>
					</select>
					<p class="panel-note">{selectedSourceNote}</p>
				</article>

				<article class="tool-card">
					<p class="panel-label">Game Rules</p>
					<div class="stat-grid">
						<div class="mini-stat">
							<span>RTP Target</span>
							<strong>{formatPercent(DESIGN_RTP_TARGET)}</strong>
						</div>
						<div class="mini-stat">
							<span>Stake Band</span>
							<strong
								>{formatPercentBand(
									STAKE_APPROVAL_RTP_BAND.min,
									STAKE_APPROVAL_RTP_BAND.max,
								)}</strong
							>
						</div>
						<div class="mini-stat">
							<span>Blue Wheel</span>
							<strong>{formatMultiplierBand(BLUE_WHEEL_RANGE.min, BLUE_WHEEL_RANGE.max)}</strong>
						</div>
						<div class="mini-stat">
							<span>Red Outer</span>
							<strong
								>{formatMultiplierBand(
									RED_OUTER_WHEEL_RANGE.min,
									RED_OUTER_WHEEL_RANGE.max,
								)}</strong
							>
						</div>
						<div class="mini-stat">
							<span>Red Final</span>
							<strong
								>{formatMultiplierBand(
									RED_FINAL_WHEEL_RANGE.min,
									RED_FINAL_WHEEL_RANGE.max,
								)}</strong
							>
						</div>
						<div class="mini-stat">
							<span>Live Base Cap</span>
							<strong>{formatMultiplier(BASE_GAME_THEORETICAL_MAX_ROUND_MULTIPLIER)}</strong>
						</div>
						<div class="mini-stat">
							<span>Product Target</span>
							<strong>{formatMultiplier(PRODUCT_MAX_WIN_TARGET)}</strong>
						</div>
					</div>
					<p class="panel-note">
						Live strips hold blue wheels at {formatPercent(
							LIVE_BASE_GAME_WHEEL_PROFILE.blueKeepChance,
						)}
						and red wheels at {formatPercent(LIVE_BASE_GAME_WHEEL_PROFILE.redKeepChance)}. Red inner
						stays in the {formatMultiplierBand(
							RED_INNER_WHEEL_RANGE.min,
							RED_INNER_WHEEL_RANGE.max,
						)}
						band. The current live base loop tops out well below the 10,000x product target.
					</p>
					<div class="rule-mode-grid">
						<div class="rule-mode-card">
							<span>Base Game</span>
							<strong>1x stake</strong>
							<em>Line wins, wheel wins, and visible scatter triggers.</em>
						</div>
						<div class="rule-mode-card">
							<span>Regular Free Spins</span>
							<strong>{formatMultiplier(PREVIEW_BONUS_BUY_MULTIPLIERS.regular)} buy cost</strong>
							<em
								>{BONUS_ROUND_CONFIG.regular.freeSpins} spins, hotter wheel rate, no sticky locks.</em
							>
						</div>
						<div class="rule-mode-card">
							<span>Super Free Spins</span>
							<strong>{formatMultiplier(PREVIEW_BONUS_BUY_MULTIPLIERS.super)} buy cost</strong>
							<em
								>{BONUS_ROUND_CONFIG.super.freeSpins} spins, sticky wheels, persistent locked values.</em
							>
						</div>
					</div>
					<div class="paytable-card">
						<div class="paytable-header">
							<span>Symbol Paytable</span>
							<strong>3 / 4 / 5 of a kind</strong>
						</div>
						<div class="paytable-grid">
							{#each regularSymbols as symbol}
								<div class="paytable-row">
									<span>{symbolMeta[symbol].label}</span>
									<strong>{paytableValue(symbol, 3)}</strong>
									<strong>{paytableValue(symbol, 4)}</strong>
									<strong>{paytableValue(symbol, 5)}</strong>
								</div>
							{/each}
						</div>
					</div>
					<label class="select-label">
						<span>Autoplay Count</span>
						<select bind:value={autoplayPreset} disabled={autoplayEnabled || !canSpin}>
							{#each autoplayPresets as preset}
								<option value={preset}>{preset} spins</option>
							{/each}
						</select>
					</label>
					<div class="tool-action-row">
						<button
							class="secondary-button"
							on:click={resetView}
							disabled={roundState === 'countingWin'}
						>
							Reset Round
						</button>
						<button
							class="secondary-button"
							on:click={resetBankroll}
							disabled={roundState !== 'idle'}
						>
							Refill Balance
						</button>
					</div>
				</article>

				<article class="tool-card">
					<p class="panel-label">Wild Wheel Rules</p>
					<div class="rule-list">
						<article>
							<h2>Blue Wild Wheel</h2>
							<p>
								Spins once, lands once, then adds that bonus to every completed payline using it.
							</p>
						</article>
						<article>
							<h2>Red Wild Wheel</h2>
							<p>Outer spins first, inner spins second, and the final result is outer x inner.</p>
						</article>
						<article>
							<h2>Scatter Trigger</h2>
							<p>
								3 scatters unlock Regular Free Spins. 4 scatters unlock Super Free Spins with sticky
								wheel cells.
							</p>
						</article>
					</div>
				</article>

				<article class="tool-card tool-card-paylines">
					<p class="panel-label">Payline Map</p>
					<div class="payline-list">
						{#each paylines as line, index}
							<div
								class:payline-row={true}
								class:active-payline={activeLine?.lineNumber === index + 1}
							>
								<span>Line {index + 1}</span><code>{line.join(' / ')}</code>
							</div>
						{/each}
					</div>
				</article>
			</section>

			<section class="loop-strip">
				<div class="results-header loop-strip-header">
					<div>
						<p class="panel-label">Session Read</p>
						<h2>Session Profile</h2>
						<p class="panel-note">
							Read the base game by dead space, wheel frequency, and return. Showcase spins do not
							count toward this sample.
						</p>
					</div>
					<div class="results-summary">
						<span>live spins</span><strong>{liveLoopSignals.liveSpins}</strong>
					</div>
				</div>

				{#if !liveLoopSignals.liveSpins}
					<div class="empty-state">
						Run base-game spins to build a real session sample before judging the loop.
					</div>
				{:else}
					<div class="loop-summary">
						<div class="loop-summary-copy">
							<span>Model Read</span>
							<strong>{liveModelRead.title}</strong>
							<em>{liveModelRead.detail}</em>
						</div>
						<div class="loop-summary-meta">
							<div>
								<span>Wheel Mix</span>
								<strong>{liveLoopSignals.blueWheels} blue / {liveLoopSignals.redWheels} red</strong>
							</div>
							<div>
								<span>Volatility Split</span>
								<strong
									>{liveLoopSignals.lineOnlyRounds} line / {liveLoopSignals.blueWheelRounds} blue /
									{liveLoopSignals.redWheelRounds + liveLoopSignals.comboWheelRounds} red-led</strong
								>
							</div>
							<div>
								<span>Peak Hit</span>
								<strong>{formatMultiplier(liveLoopSignals.biggestWinMultiplier)}</strong>
								<em>{formatCurrency(liveLoopSignals.biggestWin)}</em>
							</div>
							<div>
								<span>Pressure Rounds</span>
								<strong
									>{liveLoopSignals.fiftyPlusRounds} at 50x+ / {liveLoopSignals.hundredPlusRounds} at
									100x+</strong
								>
							</div>
						</div>
					</div>

					<div class="loop-metrics-grid">
						<div class="loop-metric">
							<span>Hit Rate</span>
							<strong>{formatPercent(liveHitRate)}</strong>
							<em>{liveLoopSignals.hitSpins} paid spins</em>
						</div>
						<div class="loop-metric">
							<span>Dead Space</span>
							<strong>{formatPercent(liveDeadRate)}</strong>
							<em>{liveLoopSignals.deadSpins} blank spins</em>
						</div>
						<div class="loop-metric">
							<span>Wheel Rounds</span>
							<strong>{formatPercent(liveWheelRate)}</strong>
							<em>{liveLoopSignals.wheelRounds} rounds with wheels</em>
						</div>
						<div class="loop-metric">
							<span>Paid Return</span>
							<strong>{formatPercent(liveReturnRatio)}</strong>
							<em>
								{formatCurrency(liveLoopSignals.totalPaid)} back from {formatCurrency(
									liveLoopSignals.totalBet,
								)}
							</em>
						</div>
						<div class="loop-metric">
							<span>Avg Paid Hit</span>
							<strong>{formatCurrency(liveAverageHit)}</strong>
							<em>{liveLoopSignals.totalWinningLines} line hits logged</em>
						</div>
						<div class="loop-metric">
							<span>Line-only Wins</span>
							<strong>{formatPercent(liveLineOnlyRate)}</strong>
							<em>
								{liveLoopSignals.lineOnlyRounds} rounds closed without wheel bonuses
							</em>
						</div>
						<div class="loop-metric">
							<span>Blue-led Wins</span>
							<strong>{formatPercent(liveBlueRoundRate)}</strong>
							<em>{liveLoopSignals.blueWheelRounds} rounds carried by blue wheels</em>
						</div>
						<div class="loop-metric">
							<span>Red-led Wins</span>
							<strong>{formatPercent(liveRedLedRate)}</strong>
							<em>
								{liveLoopSignals.redWheelRounds} red-only / {liveLoopSignals.comboWheelRounds} combo
							</em>
						</div>
						<div class="loop-metric">
							<span>50x Pressure</span>
							<strong>{formatPercent(liveFiftyPlusRate)}</strong>
							<em>{liveLoopSignals.fiftyPlusRounds} rounds crossed the celebration gate</em>
						</div>
					</div>
				{/if}
			</section>

			<section class="results-strip">
				<div class="results-header">
					<div>
						<p class="panel-label">Round Result</p>
						<h2>Line Wins</h2>
					</div>
					<div class="results-summary">
						<span>{lineResults.length} lines</span><strong>{formatCurrency(totalWin)}</strong>
					</div>
				</div>

				{#if !lineResults.length}
					<div class="empty-state">
						Spin the reels to reveal line paths, wheel boosts, and the big-win finish.
					</div>
				{:else}
					<div class="result-list">
						{#each lineResults as result, index}
							<div
								class:result-row={true}
								class:result-row-active={activeLineIndex === index}
								class:result-row-small={resultTone(result) === 'small'}
								class:result-row-medium={resultTone(result) === 'medium'}
								class:result-row-big={resultTone(result) === 'big'}
							>
								<div class="result-meta">
									<span>Line {result.lineNumber}</span>
									<strong>{symbolMeta[result.symbol].label}</strong>
									<em>{result.matchCount} of a kind | {wheelSummary(result)}</em>
								</div>
								<div class="result-numbers">
									<span>base {formatMultiplier(result.baseMultiplier)}</span>
									<strong>{formatMultiplier(result.totalMultiplier)}</strong>
									<em>{formatCurrency(result.payout)}</em>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<section class="history-strip">
				<div class="results-header">
					<div>
						<p class="panel-label">Recent Spins</p>
						<h2>Recent Rounds</h2>
					</div>
					<div class="results-summary">
						<span>stored</span><strong>{spinHistory.length}</strong>
					</div>
				</div>

				{#if !spinHistory.length}
					<div class="empty-state">Play a few rounds to start building session history.</div>
				{:else}
					<div class="history-list">
						{#each spinHistory as entry}
							<div class="history-row">
								<div class="history-main">
									<div class="history-title-row">
										<strong>Spin {entry.spin}</strong>
										<span
											class:history-source-chip={true}
											class:history-source-chip-live={entry.sourceType === 'live'}
											class:history-source-chip-bonus={entry.sourceType === 'bonus'}
										>
											{entry.source}
										</span>
									</div>
									<em>{entry.summary}</em>
								</div>
								<div class="history-meta">
									<div><span>mood</span><strong>{entry.mood}</strong></div>
									<div><span>bet</span><strong>{formatCurrency(entry.bet)}</strong></div>
									<div><span>lines</span><strong>{entry.lineCount}</strong></div>
									<div><span>wheels</span><strong>{entry.wheelCount}</strong></div>
									<div><span>win</span><strong>{formatCurrency(entry.totalWin)}</strong></div>
									<div><span>bank</span><strong>{formatCurrency(entry.balanceAfter)}</strong></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #08111a;
	}

	.workshop-shell {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		min-height: 100vh;
		padding: 28px;
		color: #eff7ff;
		background:
			radial-gradient(circle at 18% 12%, rgba(85, 145, 230, 0.18), transparent 20%),
			radial-gradient(circle at 82% 14%, rgba(181, 84, 48, 0.16), transparent 18%),
			linear-gradient(180deg, #0d1722 0%, #08111a 56%, #060d15 100%);
	}

	.theme-backdrop {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: -1;
	}

	.theme-halo,
	.theme-totem,
	.theme-arch,
	.theme-floor,
	.theme-runes {
		position: absolute;
	}

	.theme-halo {
		filter: blur(18px);
		opacity: 0.9;
	}

	.theme-halo-blue {
		top: -72px;
		left: -48px;
		width: 420px;
		height: 420px;
		background: radial-gradient(
			circle,
			rgba(128, 192, 255, 0.16) 0%,
			rgba(35, 87, 166, 0.18) 28%,
			transparent 72%
		);
	}

	.theme-halo-red {
		top: 84px;
		right: -28px;
		width: 360px;
		height: 360px;
		background: radial-gradient(
			circle,
			rgba(255, 177, 118, 0.12) 0%,
			rgba(154, 65, 36, 0.16) 34%,
			transparent 74%
		);
	}

	.theme-arch {
		top: 136px;
		left: 50%;
		width: min(980px, 88vw);
		height: 880px;
		transform: translateX(-50%);
		border-radius: 48% 48% 12% 12% / 18% 18% 8% 8%;
		background:
			radial-gradient(circle at 50% 12%, rgba(137, 189, 242, 0.08), transparent 24%),
			linear-gradient(180deg, rgba(53, 68, 86, 0.34), rgba(14, 24, 35, 0.06) 22%, transparent 76%);
		box-shadow:
			inset 0 0 0 1px rgba(154, 185, 214, 0.06),
			inset 0 -80px 120px rgba(7, 13, 21, 0.3);
		mask:
			radial-gradient(circle at 50% -16%, transparent 34%, #000 34.8%) top/100% 56% no-repeat,
			linear-gradient(#000, #000) bottom/100% 78% no-repeat;
		opacity: 0.62;
	}

	.theme-floor {
		left: -8%;
		right: -8%;
		bottom: -120px;
		height: 320px;
		background:
			radial-gradient(circle at 50% 0%, rgba(255, 187, 111, 0.12), transparent 28%),
			linear-gradient(
				180deg,
				rgba(28, 20, 18, 0) 0%,
				rgba(24, 17, 15, 0.32) 46%,
				rgba(11, 8, 10, 0.76) 100%
			);
		transform: perspective(1200px) rotateX(72deg);
		transform-origin: top center;
		opacity: 0.74;
	}

	.theme-runes {
		inset: 0;
		background:
			radial-gradient(circle at 50% 50%, rgba(113, 171, 234, 0.06), transparent 44%),
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'%3E%3Cg fill='none' stroke='rgba(151,188,219,0.16)' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M46 64 L64 40 L82 64 L64 88 Z'/%3E%3Cpath d='M180 56 L206 56 L194 86 L222 86'/%3E%3Cpath d='M104 184 L126 160 L148 184 L126 208 Z'/%3E%3Cpath d='M210 194 L226 168 L242 194 L226 220 Z'/%3E%3Cpath d='M56 214 L84 184 L84 224'/%3E%3C/g%3E%3C/svg%3E");
		background-size:
			auto,
			280px 280px;
		background-position: center, center;
		mix-blend-mode: screen;
		opacity: 0.15;
	}

	.theme-totem {
		filter: drop-shadow(0 28px 40px rgba(2, 6, 11, 0.48));
		opacity: 0.22;
		mix-blend-mode: screen;
	}

	.theme-totem img {
		display: block;
		width: 100%;
		height: auto;
	}

	.theme-totem-wolf {
		left: 2%;
		top: 108px;
		width: clamp(210px, 24vw, 360px);
		transform: rotate(-7deg);
		filter: drop-shadow(0 30px 46px rgba(4, 10, 18, 0.58))
			drop-shadow(0 0 36px rgba(117, 181, 246, 0.16));
		opacity: 0.16;
	}

	.theme-totem-crown {
		right: 4%;
		top: 128px;
		width: clamp(180px, 18vw, 290px);
		transform: rotate(8deg);
		filter: drop-shadow(0 26px 44px rgba(8, 8, 10, 0.56))
			drop-shadow(0 0 28px rgba(255, 188, 110, 0.18));
		opacity: 0.17;
	}

	.theme-totem-wheel {
		width: clamp(200px, 20vw, 300px);
		opacity: 0.18;
	}

	.theme-totem-wheel-blue {
		left: 8%;
		bottom: 188px;
		transform: rotate(-12deg);
	}

	.theme-totem-wheel-red {
		right: 10%;
		bottom: 172px;
		transform: rotate(10deg);
	}

	.hero,
	.stage,
	.loop-strip,
	.results-strip,
	.history-strip,
	.control-panel {
		background:
			linear-gradient(180deg, rgba(11, 21, 31, 0.84), rgba(7, 15, 23, 0.94)),
			radial-gradient(circle at top left, rgba(74, 132, 209, 0.1), transparent 34%);
		border: 1px solid rgba(145, 181, 214, 0.16);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 28px 48px rgba(1, 7, 13, 0.28);
		backdrop-filter: blur(10px);
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.55fr) minmax(460px, 0.9fr);
		gap: 14px;
		padding: 18px 20px;
		border-radius: 24px;
		background:
			linear-gradient(135deg, rgba(13, 25, 37, 0.9), rgba(8, 18, 28, 0.94)),
			radial-gradient(circle at top left, rgba(84, 152, 231, 0.16), transparent 34%),
			radial-gradient(circle at 88% 18%, rgba(191, 118, 79, 0.1), transparent 26%);
	}

	.hero-copy h1 {
		margin: 0;
		font-size: clamp(2rem, 3vw, 3rem);
		line-height: 0.92;
		letter-spacing: -0.05em;
	}

	.stage-topline h2,
	.results-header h2 {
		margin: 0;
		font-size: clamp(1.7rem, 2.2vw, 2.4rem);
		line-height: 1;
		letter-spacing: -0.04em;
	}

	.eyebrow,
	.panel-label {
		margin: 0 0 8px;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(151, 188, 221, 0.68);
	}

	.hero-note,
	.panel-note {
		margin: 0;
		max-width: 40ch;
		font-size: 0.92rem;
		color: rgba(202, 223, 243, 0.74);
		line-height: 1.45;
	}
	.hero-status {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 10px;
		align-content: center;
	}

	.hero-status-block,
	.footer-pill,
	.mini-stat {
		padding: 10px 12px;
		border-radius: 15px;
		background: rgba(6, 14, 22, 0.84);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.hero-status-block span,
	.footer-pill span,
	.mini-stat span,
	.stage-meta span,
	.results-summary span,
	.result-meta span,
	.result-numbers span,
	.result-meta em,
	.result-numbers em {
		display: block;
		font-size: 0.72rem;
		color: rgba(175, 208, 238, 0.72);
	}

	.hero-status-block em {
		display: block;
		margin-top: 6px;
		font-size: 0.72rem;
		font-style: normal;
		color: rgba(164, 196, 226, 0.56);
	}

	.hero-status-block strong,
	.footer-pill strong,
	.mini-stat strong,
	.stage-meta strong,
	.results-summary strong,
	.result-meta strong,
	.result-numbers strong {
		display: block;
		margin-top: 3px;
		font-weight: 800;
	}

	.hero-status-block strong {
		font-size: 0.98rem;
		letter-spacing: -0.02em;
	}

	.layout-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 18px;
		margin-top: 16px;
	}

	select,
	button {
		font: inherit;
	}

	select {
		width: 100%;
		padding: 12px 14px;
		border-radius: 14px;
		border: 1px solid rgba(150, 188, 222, 0.18);
		background: rgba(5, 13, 21, 0.92);
		color: #eef6ff;
	}

	button {
		padding: 14px 16px;
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		cursor: pointer;
		transition:
			transform 160ms ease,
			border-color 160ms ease,
			background 160ms ease;
	}

	button:hover:enabled {
		transform: translateY(-1px);
	}

	button:active:enabled {
		transform: translateY(1px) scale(0.985);
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.primary-button {
		min-height: 82px;
		padding: 18px 22px;
		border-radius: 22px;
		background: linear-gradient(180deg, #7acfff, #3699f6 54%, #1a73d8 100%);
		color: #04121d;
		font-weight: 800;
		font-size: 1.12rem;
		letter-spacing: 0.02em;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.36),
			0 18px 28px rgba(15, 84, 151, 0.34);
	}

	.primary-button-stop {
		background: linear-gradient(180deg, #ffc484, #f98f54 56%, #e55a2f 100%);
		color: #1b0903;
		border-color: rgba(255, 190, 148, 0.4);
		box-shadow:
			inset 0 1px 0 rgba(255, 231, 213, 0.42),
			0 18px 28px rgba(155, 73, 27, 0.3);
	}

	.primary-button-skip {
		background: linear-gradient(180deg, #c2e8ff, #6fc4ff 56%, #37a2f5 100%);
		color: #04121d;
		border-color: rgba(192, 231, 255, 0.44);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.44),
			0 18px 28px rgba(47, 122, 184, 0.24);
	}

	.secondary-button,
	.toggle-button {
		min-height: 36px;
		padding: 12px 14px;
		background: rgba(16, 28, 41, 0.92);
		color: #edf7ff;
	}

	.toggle-button.is-active {
		border-color: rgba(102, 198, 255, 0.44);
		background: rgba(26, 70, 116, 0.72);
	}

	.toggle-button.is-pending {
		border-color: rgba(255, 204, 121, 0.42);
		background:
			linear-gradient(180deg, rgba(58, 39, 16, 0.96), rgba(34, 22, 12, 0.92)),
			radial-gradient(circle at top, rgba(255, 208, 124, 0.14), transparent 56%);
		color: #ffe2b6;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.06),
			0 10px 22px rgba(22, 12, 5, 0.2);
	}

	.autoplay-confirm {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 14px 16px;
		padding: 14px 16px;
		border-radius: 18px;
		background:
			linear-gradient(180deg, rgba(27, 20, 11, 0.98), rgba(16, 13, 9, 0.94)),
			radial-gradient(circle at top right, rgba(255, 201, 106, 0.14), transparent 48%);
		border: 1px solid rgba(255, 201, 106, 0.2);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.03),
			0 16px 28px rgba(7, 5, 2, 0.18);
	}

	.autoplay-confirm-copy {
		display: grid;
		gap: 4px;
		min-width: 0;
	}

	.autoplay-confirm-copy span {
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(255, 215, 148, 0.74);
	}

	.autoplay-confirm-copy strong {
		font-size: 0.98rem;
		font-weight: 900;
		letter-spacing: -0.02em;
		color: #fff1d9;
	}

	.autoplay-confirm-copy em {
		margin: 0;
		font-size: 0.75rem;
		font-style: normal;
		line-height: 1.45;
		color: rgba(235, 218, 191, 0.7);
	}

	.autoplay-confirm-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.autoplay-confirm-start {
		background:
			linear-gradient(180deg, rgba(255, 214, 134, 0.96), rgba(230, 168, 74, 0.94)),
			radial-gradient(circle at top, rgba(255, 255, 255, 0.18), transparent 48%);
		color: #231207;
		border-color: rgba(255, 230, 184, 0.44);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 14px 22px rgba(110, 61, 15, 0.22);
	}

	.bet-stepper {
		display: grid;
		grid-template-columns: 56px minmax(0, 1fr) 56px;
		gap: 10px;
		align-items: center;
		margin-top: 12px;
	}

	.bet-stepper-disabled {
		opacity: 0.72;
	}

	.bet-stepper-readout {
		padding: 12px 14px;
		border-radius: 16px;
		background: rgba(6, 14, 22, 0.84);
		border: 1px solid rgba(255, 255, 255, 0.08);
		text-align: center;
	}

	.bet-stepper-readout span,
	.bet-stepper-readout em {
		display: block;
	}

	.bet-stepper-readout span {
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(171, 205, 236, 0.68);
	}

	.bet-stepper-readout strong {
		display: block;
		margin-top: 6px;
		font-size: 1.05rem;
		font-weight: 800;
	}

	.bet-stepper-readout em {
		margin-top: 4px;
		font-size: 0.72rem;
		font-style: normal;
		color: rgba(177, 208, 237, 0.62);
	}

	.bonus-buy-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
		margin-top: 12px;
	}

	.bonus-buy-button {
		min-height: 92px;
		padding: 12px 14px;
		display: grid;
		gap: 6px;
		align-content: center;
		text-align: left;
	}

	.bonus-buy-button span {
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(214, 234, 251, 0.68);
	}

	.bonus-buy-button strong {
		font-size: 1rem;
		font-weight: 900;
		letter-spacing: -0.02em;
	}

	.bonus-buy-button em {
		margin: 0;
		font-size: 0.74rem;
		font-style: normal;
		line-height: 1.35;
		color: rgba(204, 224, 242, 0.68);
	}

	.bonus-buy-button-regular {
		background:
			linear-gradient(180deg, rgba(12, 31, 53, 0.96), rgba(8, 21, 36, 0.94)),
			radial-gradient(circle at top left, rgba(88, 176, 255, 0.16), transparent 44%);
		border-color: rgba(98, 179, 245, 0.24);
	}

	.bonus-buy-button-regular strong {
		color: #aee4ff;
	}

	.bonus-buy-button-super {
		background:
			linear-gradient(180deg, rgba(37, 17, 14, 0.98), rgba(20, 11, 13, 0.94)),
			radial-gradient(circle at top left, rgba(255, 130, 92, 0.16), transparent 42%);
		border-color: rgba(255, 151, 105, 0.24);
	}

	.bonus-buy-button-super strong {
		color: #ffca8b;
	}

	.bonus-buy-note {
		margin: 10px 0 0;
		font-size: 0.76rem;
		line-height: 1.45;
		color: rgba(186, 211, 234, 0.62);
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	.rule-mode-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
		margin-top: 14px;
	}

	.rule-mode-card,
	.paytable-card {
		padding: 14px;
		border-radius: 18px;
		background: rgba(6, 14, 22, 0.76);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.rule-mode-card {
		display: grid;
		gap: 5px;
	}

	.rule-mode-card span,
	.paytable-header span,
	.paytable-row span {
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(174, 207, 236, 0.7);
	}

	.rule-mode-card strong {
		font-size: 0.94rem;
		font-weight: 900;
		color: #f0f7ff;
	}

	.rule-mode-card em {
		margin: 0;
		font-size: 0.75rem;
		font-style: normal;
		line-height: 1.45;
		color: rgba(196, 219, 239, 0.68);
	}

	.paytable-card {
		display: grid;
		gap: 12px;
		margin-top: 14px;
	}

	.paytable-header {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: end;
	}

	.paytable-header strong {
		font-size: 0.82rem;
		font-weight: 800;
		color: rgba(223, 237, 250, 0.84);
	}

	.paytable-grid {
		display: grid;
		gap: 8px;
	}

	.paytable-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) repeat(3, minmax(44px, auto));
		gap: 10px;
		align-items: center;
		padding: 10px 12px;
		border-radius: 14px;
		background: rgba(10, 19, 30, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.04);
	}

	.paytable-row strong {
		font-size: 0.84rem;
		font-weight: 800;
		text-align: right;
		color: #f2f8ff;
	}

	.metric-positive {
		color: #86f2c5;
	}

	.metric-negative {
		color: #ff9d8f;
	}

	.select-label {
		display: grid;
		gap: 8px;
		margin-top: 12px;
	}

	.select-label span {
		font-size: 0.72rem;
		font-weight: 700;
		color: rgba(179, 210, 240, 0.76);
	}

	.tool-action-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
		margin-top: 12px;
	}

	.rule-list {
		display: grid;
		gap: 12px;
	}

	.rule-list article {
		padding: 14px;
		border-radius: 18px;
		background: rgba(6, 14, 22, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.rule-list h2 {
		margin: 0 0 6px;
		font-size: 0.95rem;
	}

	.rule-list p {
		margin: 0;
		line-height: 1.55;
		color: rgba(202, 223, 243, 0.76);
	}

	.payline-list {
		display: grid;
		gap: 8px;
	}

	.payline-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 11px 12px;
		border-radius: 14px;
		background: rgba(6, 14, 22, 0.72);
		border: 1px solid transparent;
		color: rgba(215, 232, 248, 0.84);
	}

	.payline-row code {
		color: rgba(143, 197, 239, 0.82);
	}

	.active-payline {
		border-color: rgba(112, 210, 255, 0.42);
		background: rgba(18, 47, 73, 0.72);
	}

	.stage-column {
		display: grid;
		gap: 18px;
	}

	.stage {
		position: relative;
		padding: 22px;
		border-radius: 28px;
		background:
			linear-gradient(180deg, rgba(10, 18, 27, 0.86), rgba(6, 13, 20, 0.95)),
			radial-gradient(circle at top, rgba(92, 150, 224, 0.1), transparent 30%),
			radial-gradient(circle at bottom right, rgba(179, 101, 66, 0.08), transparent 24%);
		transition:
			box-shadow 220ms ease,
			border-color 220ms ease,
			transform 220ms ease;
	}

	.stage::before {
		content: '';
		position: absolute;
		inset: 18px;
		border-radius: 24px;
		border: 1px solid rgba(158, 193, 225, 0.08);
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.015), rgba(255, 255, 255, 0)),
			repeating-linear-gradient(
				90deg,
				rgba(255, 255, 255, 0.012) 0,
				rgba(255, 255, 255, 0.012) 1px,
				transparent 1px,
				transparent 108px
			);
		opacity: 0.66;
		pointer-events: none;
	}

	.stage > * {
		position: relative;
		z-index: 1;
	}

	.stage-tone-medium {
		border-color: rgba(116, 208, 255, 0.3);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 28px 48px rgba(1, 7, 13, 0.28),
			0 0 34px rgba(93, 185, 255, 0.1);
	}

	.stage-tone-big {
		border-color: rgba(255, 140, 98, 0.36);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 28px 48px rgba(1, 7, 13, 0.28),
			0 0 42px rgba(255, 108, 82, 0.14);
	}

	.stage-feature-mode {
		border-color: rgba(106, 192, 255, 0.3);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 28px 48px rgba(1, 7, 13, 0.28),
			0 0 50px rgba(78, 164, 255, 0.16);
	}

	.stage-feature-mode::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background:
			radial-gradient(circle at top, rgba(87, 164, 255, 0.14), transparent 34%),
			radial-gradient(circle at bottom left, rgba(38, 94, 170, 0.1), transparent 28%);
		opacity: 0.9;
		pointer-events: none;
		z-index: 0;
		animation: featureStageBreathe 3.8s ease-in-out infinite;
	}

	.stage-feature-super {
		border-color: rgba(255, 147, 104, 0.36);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 28px 48px rgba(1, 7, 13, 0.28),
			0 0 58px rgba(255, 110, 74, 0.18);
	}

	.stage-feature-super::after {
		background:
			radial-gradient(circle at top, rgba(255, 110, 74, 0.16), transparent 34%),
			radial-gradient(circle at bottom left, rgba(87, 164, 255, 0.12), transparent 30%);
		animation-duration: 3.3s;
	}

	.stage-transition-active::before {
		content: '';
		position: absolute;
		inset: 22px 18px auto;
		height: 180px;
		border-radius: 28px;
		background:
			linear-gradient(180deg, rgba(110, 196, 255, 0.12), rgba(110, 196, 255, 0)),
			radial-gradient(circle at top, rgba(132, 207, 255, 0.22), transparent 58%);
		opacity: 0.88;
		pointer-events: none;
		z-index: 0;
		animation: featureTransitionSweep 760ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.stage-transition-super::before {
		height: 220px;
		background:
			linear-gradient(180deg, rgba(255, 150, 108, 0.14), rgba(255, 150, 108, 0)),
			radial-gradient(circle at top, rgba(255, 178, 116, 0.18), transparent 56%),
			radial-gradient(circle at 28% 30%, rgba(88, 170, 255, 0.12), transparent 34%);
		animation-duration: 1.18s;
	}

	.stage-topline,
	.results-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 16px;
		align-items: start;
	}

	.stage-meta {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		justify-content: end;
	}

	.stage-meta > div {
		min-width: 110px;
		padding: 12px 14px;
		border-radius: 16px;
		background: rgba(10, 24, 36, 0.86);
		border: 1px solid rgba(149, 186, 222, 0.14);
	}

	.feature-banner {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 14px 16px;
		align-items: center;
		margin: 8px 0 14px;
		padding: 16px 18px;
		border-radius: 20px;
		background:
			linear-gradient(180deg, rgba(9, 22, 36, 0.96), rgba(8, 18, 28, 0.92)),
			radial-gradient(circle at left, rgba(78, 164, 255, 0.16), transparent 34%);
		border: 1px solid rgba(121, 183, 237, 0.2);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 18px 34px rgba(2, 8, 14, 0.22);
		animation: featureBannerEnter 360ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.feature-banner-super {
		background:
			linear-gradient(180deg, rgba(23, 16, 19, 0.96), rgba(14, 12, 16, 0.92)),
			radial-gradient(circle at right, rgba(255, 118, 78, 0.18), transparent 38%),
			radial-gradient(circle at left, rgba(84, 164, 255, 0.1), transparent 34%);
		border-color: rgba(255, 147, 104, 0.24);
	}

	.feature-banner-copy {
		display: grid;
		gap: 3px;
		min-width: 0;
	}

	.feature-banner-kicker,
	.feature-banner-stat span,
	.feature-sticky-pill span {
		display: block;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(175, 214, 244, 0.7);
	}

	.feature-banner-copy strong {
		display: block;
		font-size: 1.15rem;
		font-weight: 900;
		letter-spacing: -0.03em;
	}

	.feature-banner-copy em,
	.feature-sticky-pill strong {
		margin: 0;
		font-size: 0.82rem;
		font-style: normal;
		line-height: 1.45;
		color: rgba(203, 226, 247, 0.72);
	}

	.feature-banner-metrics {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: end;
	}

	.feature-banner-stat {
		min-width: 112px;
		padding: 10px 12px;
		border-radius: 14px;
		background: rgba(7, 18, 29, 0.72);
		border: 1px solid rgba(127, 176, 220, 0.16);
	}

	.feature-banner-stat strong {
		display: block;
		margin-top: 4px;
		font-size: 1rem;
		font-weight: 900;
		letter-spacing: -0.03em;
	}

	.feature-banner-stat-hot {
		border-color: rgba(255, 198, 118, 0.2);
		background:
			linear-gradient(180deg, rgba(21, 20, 26, 0.88), rgba(12, 16, 22, 0.84)),
			radial-gradient(circle at top, rgba(255, 188, 96, 0.12), transparent 44%);
	}

	.feature-sticky-pill {
		grid-column: 1 / -1;
		display: grid;
		gap: 4px;
		padding: 12px 14px;
		border-radius: 16px;
		background:
			linear-gradient(180deg, rgba(35, 15, 12, 0.96), rgba(21, 12, 13, 0.94)),
			radial-gradient(circle at right, rgba(255, 120, 82, 0.12), transparent 40%);
		border: 1px solid rgba(255, 150, 108, 0.18);
	}

	.feature-progress-band {
		grid-column: 1 / -1;
		display: grid;
		gap: 8px;
		margin-top: -2px;
	}

	.feature-progress-copy {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 12px;
		align-items: baseline;
		justify-content: space-between;
	}

	.feature-progress-copy span {
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgba(176, 208, 236, 0.62);
	}

	.feature-progress-copy strong {
		font-size: 0.82rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: rgba(230, 243, 255, 0.9);
	}

	.feature-progress-rail {
		position: relative;
		height: 10px;
		border-radius: 999px;
		overflow: hidden;
		background:
			linear-gradient(180deg, rgba(5, 12, 19, 0.92), rgba(8, 15, 24, 0.88)),
			radial-gradient(circle at left, rgba(96, 172, 243, 0.08), transparent 32%);
		border: 1px solid rgba(128, 170, 207, 0.12);
	}

	.feature-progress-fill {
		height: 100%;
		border-radius: inherit;
		background:
			linear-gradient(90deg, rgba(92, 184, 255, 0.82), rgba(127, 213, 255, 0.96)),
			radial-gradient(circle at right, rgba(255, 255, 255, 0.18), transparent 34%);
		box-shadow: 0 0 18px rgba(80, 170, 241, 0.22);
		transition: width 240ms ease;
	}

	.feature-progress-fill-super {
		background:
			linear-gradient(90deg, rgba(255, 148, 104, 0.82), rgba(255, 199, 116, 0.96)),
			radial-gradient(circle at right, rgba(255, 244, 214, 0.18), transparent 34%);
		box-shadow: 0 0 20px rgba(255, 131, 90, 0.24);
	}

	.feature-transition-card {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) auto;
		gap: 16px;
		align-items: center;
		margin: 0 0 16px;
		padding: 16px 18px;
		border-radius: 22px;
		background:
			linear-gradient(180deg, rgba(8, 22, 37, 0.98), rgba(7, 18, 29, 0.94)),
			radial-gradient(circle at left, rgba(79, 172, 255, 0.18), transparent 36%);
		border: 1px solid rgba(118, 184, 236, 0.24);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 18px 32px rgba(2, 9, 16, 0.24);
		animation: featureTransitionRegularIn 360ms cubic-bezier(0.16, 1, 0.3, 1);
		transform-origin: center top;
	}

	.feature-transition-card-super {
		background:
			linear-gradient(180deg, rgba(27, 17, 18, 0.98), rgba(15, 12, 16, 0.94)),
			radial-gradient(circle at right, rgba(255, 118, 78, 0.18), transparent 38%),
			radial-gradient(circle at left, rgba(84, 164, 255, 0.08), transparent 34%);
		border-color: rgba(255, 146, 102, 0.26);
		animation: featureTransitionSuperIn 820ms cubic-bezier(0.12, 1, 0.22, 1);
	}

	.bonus-trigger-card {
		background:
			linear-gradient(180deg, rgba(13, 27, 44, 0.98), rgba(8, 20, 32, 0.95)),
			radial-gradient(circle at left, rgba(88, 176, 255, 0.22), transparent 36%),
			radial-gradient(circle at right, rgba(255, 192, 98, 0.12), transparent 34%);
		border-color: rgba(136, 198, 246, 0.3);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.05),
			0 22px 36px rgba(2, 9, 16, 0.28),
			0 0 32px rgba(67, 151, 235, 0.12);
	}

	.bonus-trigger-card-super {
		background:
			linear-gradient(180deg, rgba(31, 17, 16, 0.98), rgba(17, 13, 18, 0.95)),
			radial-gradient(circle at left, rgba(255, 122, 82, 0.24), transparent 36%),
			radial-gradient(circle at right, rgba(255, 205, 118, 0.12), transparent 34%);
		border-color: rgba(255, 156, 112, 0.32);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.05),
			0 22px 38px rgba(10, 6, 8, 0.32),
			0 0 36px rgba(255, 107, 79, 0.14);
	}

	.feature-transition-card-outro {
		grid-template-columns: minmax(0, 1fr) auto auto;
		animation: featureTransitionRegularOut 420ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.feature-transition-card-outro.feature-transition-card-super {
		animation: featureTransitionSuperOut 720ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.feature-transition-card-intro:not(.feature-transition-card-super) .feature-transition-seals {
		animation: featureSealDrift 420ms cubic-bezier(0.2, 1, 0.3, 1);
	}

	.feature-transition-card-super .feature-transition-seals {
		animation: featureSealDriftHeavy 860ms cubic-bezier(0.14, 1, 0.24, 1);
	}

	.feature-transition-copy {
		display: grid;
		gap: 4px;
	}

	.feature-transition-kicker {
		display: block;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(181, 218, 246, 0.72);
	}

	.feature-transition-copy strong {
		display: block;
		font-size: 1.18rem;
		font-weight: 900;
		letter-spacing: -0.03em;
	}

	.feature-transition-copy em {
		margin: 0;
		font-size: 0.82rem;
		font-style: normal;
		line-height: 1.45;
		color: rgba(205, 226, 245, 0.72);
	}

	.feature-transition-seals {
		display: flex;
		flex-wrap: wrap;
		justify-content: end;
		gap: 10px;
	}

	.feature-trigger-seal {
		display: grid;
		place-items: center;
		width: 68px;
		height: 68px;
		border-radius: 20px;
		background:
			radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.24), transparent 26%),
			linear-gradient(180deg, rgba(21, 58, 91, 0.96), rgba(9, 23, 39, 0.94));
		border: 1px solid rgba(114, 187, 246, 0.26);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.05),
			0 14px 20px rgba(2, 9, 16, 0.24);
		text-align: center;
	}

	.feature-trigger-seal span,
	.feature-transition-total span {
		display: block;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgba(198, 226, 248, 0.74);
	}

	.feature-trigger-seal strong,
	.feature-transition-total strong {
		display: block;
		margin-top: 4px;
		font-size: 1.1rem;
		font-weight: 900;
		letter-spacing: -0.04em;
	}

	.feature-trigger-seal-super {
		background:
			radial-gradient(circle at 32% 28%, rgba(255, 237, 199, 0.18), transparent 24%),
			linear-gradient(180deg, rgba(98, 33, 24, 0.96), rgba(36, 15, 14, 0.94));
		border-color: rgba(255, 148, 102, 0.28);
	}

	.feature-transition-total {
		min-width: 132px;
		padding: 12px 14px;
		border-radius: 16px;
		background: rgba(7, 18, 29, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.08);
		text-align: right;
	}

	.stage-rhythm {
		display: grid;
		grid-template-columns: minmax(220px, 0.82fr) auto minmax(0, 1.45fr);
		gap: 10px;
		align-items: center;
		margin: 14px 0 18px;
		padding: 12px 14px;
		border-radius: 18px;
		background:
			linear-gradient(180deg, rgba(8, 18, 29, 0.94), rgba(7, 15, 24, 0.9)),
			radial-gradient(circle at right, rgba(76, 150, 220, 0.08), transparent 42%);
		border: 1px solid rgba(126, 167, 201, 0.12);
	}

	.stage-feature-mode .stage-rhythm {
		border-color: rgba(116, 184, 237, 0.18);
		background:
			linear-gradient(180deg, rgba(8, 20, 32, 0.94), rgba(7, 15, 24, 0.92)),
			radial-gradient(circle at right, rgba(82, 164, 244, 0.12), transparent 42%);
	}

	.stage-feature-super .stage-rhythm {
		border-color: rgba(255, 150, 108, 0.2);
		background:
			linear-gradient(180deg, rgba(16, 18, 27, 0.95), rgba(9, 14, 21, 0.92)),
			radial-gradient(circle at right, rgba(255, 120, 82, 0.14), transparent 44%);
	}

	.stage-bonus-trigger .stage-rhythm {
		border-color: rgba(120, 184, 235, 0.22);
		background:
			linear-gradient(180deg, rgba(9, 21, 34, 0.95), rgba(8, 16, 26, 0.92)),
			radial-gradient(circle at right, rgba(88, 175, 255, 0.16), transparent 44%);
	}

	.stage-bonus-trigger-super .stage-rhythm {
		border-color: rgba(255, 160, 118, 0.24);
		background:
			linear-gradient(180deg, rgba(17, 18, 28, 0.95), rgba(10, 14, 21, 0.92)),
			radial-gradient(circle at right, rgba(255, 121, 78, 0.18), transparent 44%);
	}

	.stage-rhythm-summary {
		display: grid;
		gap: 3px;
		min-width: 0;
	}

	.stage-rhythm-summary strong,
	.stage-rhythm-focus strong,
	.reel-rhythm-step strong {
		display: block;
		font-weight: 800;
	}

	.stage-rhythm-kicker,
	.stage-rhythm-focus span,
	.reel-rhythm-step span {
		display: block;
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(156, 195, 228, 0.62);
	}

	.stage-rhythm-summary strong {
		font-size: 1rem;
		letter-spacing: -0.03em;
	}

	.stage-rhythm-summary em,
	.stage-rhythm-focus em {
		margin: 0;
		color: rgba(189, 214, 237, 0.66);
		font-size: 0.74rem;
		font-style: normal;
		line-height: 1.35;
	}

	.stage-rhythm-focus {
		display: grid;
		gap: 2px;
		align-items: center;
		padding: 9px 12px;
		border-radius: 14px;
		background: rgba(12, 25, 39, 0.82);
		border: 1px solid rgba(130, 176, 216, 0.14);
		min-width: 132px;
	}

	.reel-rhythm-step em {
		display: block;
		margin-top: 3px;
		font-size: 0.62rem;
		font-style: normal;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(166, 198, 227, 0.48);
	}

	.stage-rhythm-focus strong {
		font-size: 0.92rem;
		letter-spacing: -0.02em;
	}

	.reel-rhythm-track {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 8px;
	}

	.reel-rhythm-step {
		padding: 9px 8px;
		border-radius: 13px;
		background: rgba(8, 18, 30, 0.78);
		border: 1px solid rgba(122, 160, 191, 0.12);
		text-align: center;
		transition:
			transform 180ms ease,
			border-color 180ms ease,
			background 180ms ease,
			box-shadow 180ms ease;
	}

	.reel-rhythm-step strong {
		margin-top: 4px;
		font-size: 0.84rem;
	}

	.reel-rhythm-step-hot {
		background: rgba(17, 33, 49, 0.92);
		border-color: rgba(117, 187, 242, 0.2);
	}

	.reel-rhythm-step-live {
		transform: translateY(-2px);
		background: linear-gradient(180deg, rgba(42, 103, 164, 0.4), rgba(16, 33, 50, 0.92));
		border-color: rgba(115, 207, 255, 0.44);
		box-shadow: 0 0 24px rgba(88, 183, 245, 0.12);
	}

	.reel-rhythm-step-brake {
		transform: translateY(-3px) scale(1.02);
		background: linear-gradient(180deg, rgba(78, 124, 176, 0.5), rgba(20, 35, 52, 0.96));
		border-color: rgba(181, 231, 255, 0.52);
		box-shadow:
			0 0 28px rgba(110, 195, 255, 0.16),
			inset 0 0 0 1px rgba(255, 255, 255, 0.04);
	}

	.reel-rhythm-step-brake em {
		color: rgba(214, 241, 255, 0.88);
	}

	.reel-rhythm-step-premium {
		border-color: rgba(255, 212, 131, 0.2);
		box-shadow: inset 0 0 0 1px rgba(255, 225, 171, 0.04);
	}

	.reel-rhythm-step-premium em {
		color: rgba(255, 218, 149, 0.72);
	}

	.reel-rhythm-step-wheel {
		border-color: rgba(116, 206, 255, 0.26);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.02),
			0 0 22px rgba(87, 178, 255, 0.08);
	}

	.reel-rhythm-step-wheel em {
		color: rgba(135, 214, 255, 0.82);
	}

	.stage-console {
		display: grid;
		grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.2fr) minmax(260px, 0.9fr);
		gap: 14px;
		margin-top: 22px;
		padding: 14px;
		border-radius: 24px;
		background:
			linear-gradient(180deg, rgba(6, 14, 22, 0.96), rgba(10, 19, 29, 0.92)),
			radial-gradient(circle at center, rgba(64, 142, 216, 0.1), transparent 44%);
		border: 1px solid rgba(146, 186, 223, 0.14);
	}

	.console-cluster {
		padding: 14px;
		border-radius: 18px;
		background: rgba(7, 16, 25, 0.88);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.console-cluster-actions {
		background:
			radial-gradient(circle at top, rgba(57, 138, 219, 0.14), transparent 54%),
			linear-gradient(180deg, rgba(8, 19, 31, 0.96), rgba(7, 17, 27, 0.92));
		border-color: rgba(124, 180, 228, 0.18);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 16px 30px rgba(2, 9, 16, 0.18);
	}

	.console-kicker {
		display: block;
		margin-bottom: 10px;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgba(171, 205, 236, 0.68);
	}

	.console-bank-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}

	.console-stat-tile {
		padding: 12px 14px;
		border-radius: 16px;
		background: rgba(10, 22, 34, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.console-stat-tile span,
	.console-action-note span {
		display: block;
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(160, 198, 230, 0.68);
	}

	.console-stat-tile strong,
	.console-action-note strong {
		display: block;
		margin-top: 6px;
		font-weight: 800;
	}

	.console-action-row {
		display: grid;
		grid-template-columns: minmax(0, 1.28fr) minmax(190px, 0.72fr);
		gap: 10px;
		align-items: stretch;
	}

	.console-toggle-stack {
		display: grid;
		grid-template-columns: 1fr;
		gap: 10px;
	}

	.console-action-note {
		margin-top: 12px;
		padding: 13px 15px;
		border-radius: 16px;
		background:
			linear-gradient(180deg, rgba(10, 22, 34, 0.96), rgba(7, 16, 25, 0.94)),
			radial-gradient(circle at right, rgba(62, 137, 206, 0.08), transparent 38%);
		border: 1px solid rgba(126, 172, 212, 0.16);
	}

	.console-action-note em {
		display: block;
		margin-top: 4px;
		font-size: 0.8rem;
		font-style: normal;
		line-height: 1.45;
		color: rgba(197, 221, 245, 0.68);
	}

	.console-cluster-bet .bet-stepper {
		margin-top: 0;
	}

	.console-action-note strong {
		font-size: 1.08rem;
		letter-spacing: -0.02em;
	}

	.tools-strip {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 14px;
		margin-top: 2px;
		opacity: 0.84;
	}

	.loop-strip {
		margin-top: 2px;
		padding: 18px 20px;
		border-radius: 24px;
		background:
			linear-gradient(180deg, rgba(9, 18, 28, 0.88), rgba(8, 16, 24, 0.84)),
			radial-gradient(circle at right, rgba(63, 137, 203, 0.08), transparent 38%);
	}

	.loop-strip .panel-note {
		max-width: 52ch;
		font-size: 0.82rem;
		color: rgba(179, 205, 228, 0.62);
	}

	.loop-summary {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) auto;
		gap: 16px;
		align-items: start;
		padding: 14px 16px;
		border-radius: 18px;
		background: rgba(7, 15, 23, 0.78);
		border: 1px solid rgba(117, 154, 186, 0.12);
	}

	.loop-summary-copy,
	.loop-summary-meta,
	.loop-metric {
		display: grid;
		gap: 4px;
	}

	.loop-summary-copy span,
	.loop-summary-meta span,
	.loop-metric span {
		display: block;
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(150, 187, 217, 0.58);
	}

	.loop-summary-copy strong,
	.loop-summary-meta strong,
	.loop-metric strong {
		display: block;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.loop-summary-copy strong {
		font-size: 1.08rem;
	}

	.loop-summary-copy em,
	.loop-summary-meta em,
	.loop-metric em {
		margin: 0;
		font-size: 0.78rem;
		font-style: normal;
		line-height: 1.45;
		color: rgba(191, 216, 238, 0.62);
	}

	.loop-summary-meta {
		grid-template-columns: repeat(2, minmax(140px, 1fr));
		gap: 12px;
	}

	.loop-summary-meta > div,
	.loop-metric {
		padding: 11px 12px;
		border-radius: 14px;
		background: rgba(8, 17, 26, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.loop-metrics-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
		margin-top: 12px;
	}

	.loop-metric strong {
		font-size: 1rem;
	}

	.tool-card {
		padding: 14px 15px;
		border-radius: 20px;
		background: rgba(7, 15, 24, 0.58);
		border: 1px solid rgba(103, 132, 159, 0.1);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.02),
			0 10px 18px rgba(1, 7, 13, 0.1);
	}

	.tool-card-paylines {
		grid-column: span 2;
	}

	.tool-card .panel-label {
		margin-bottom: 8px;
		font-size: 0.64rem;
		letter-spacing: 0.15em;
		color: rgba(142, 175, 205, 0.5);
	}

	.tool-card .panel-note {
		font-size: 0.8rem;
		line-height: 1.45;
		color: rgba(180, 205, 228, 0.56);
	}

	.tool-card select {
		padding: 10px 12px;
		border-radius: 12px;
		background: rgba(5, 12, 19, 0.76);
		border-color: rgba(124, 158, 189, 0.12);
		color: rgba(233, 243, 252, 0.88);
	}

	.tool-card .secondary-button {
		min-height: 0;
		padding: 10px 12px;
		border-radius: 12px;
		background: rgba(12, 23, 35, 0.7);
		border-color: rgba(121, 155, 186, 0.12);
	}

	.tool-card .mini-stat {
		padding: 10px 11px;
		border-radius: 14px;
		background: rgba(7, 16, 26, 0.56);
		border-color: rgba(255, 255, 255, 0.04);
	}

	.tool-card .mini-stat span,
	.tool-card .select-label span {
		color: rgba(153, 187, 216, 0.56);
	}

	.tool-card .mini-stat strong {
		font-size: 0.92rem;
	}

	.tool-card .rule-list {
		gap: 10px;
	}

	.tool-card .rule-list article {
		padding: 11px 12px;
		border-radius: 14px;
		background: rgba(6, 14, 22, 0.52);
		border-color: rgba(255, 255, 255, 0.04);
	}

	.tool-card .rule-list h2 {
		font-size: 0.86rem;
		color: rgba(232, 241, 249, 0.9);
	}

	.tool-card .rule-list p {
		color: rgba(190, 212, 232, 0.62);
	}

	.tool-card .payline-list {
		gap: 6px;
	}

	.tool-card .payline-row {
		padding: 9px 11px;
		border-radius: 12px;
		background: rgba(6, 14, 22, 0.5);
		color: rgba(201, 222, 241, 0.7);
	}

	.tool-card .payline-row code {
		color: rgba(135, 183, 220, 0.64);
	}

	.tool-card .active-payline {
		border-color: rgba(102, 193, 240, 0.22);
		background: rgba(15, 37, 58, 0.54);
	}

	.total-win-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 8px;
		background:
			radial-gradient(circle, rgba(32, 76, 119, 0.78), rgba(5, 11, 18, 0.92)),
			linear-gradient(180deg, rgba(6, 16, 25, 0.84), rgba(6, 12, 18, 0.92));
		backdrop-filter: blur(12px);
		z-index: 6;
		border-radius: 28px;
		outline: none;
	}

	.total-win-overlay-skippable {
		cursor: pointer;
	}

	.total-win-overlay-skippable strong {
		animation: totalWinPromptPulse 1.2s ease-in-out infinite;
	}

	.total-win-overlay-settled {
		cursor: default;
	}

	.total-win-kicker {
		margin: 0;
		padding: 7px 12px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #cce8ff;
		text-transform: uppercase;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.16em;
	}

	.total-win-overlay h3,
	.total-win-overlay strong,
	.total-win-overlay span {
		margin: 0;
	}

	.total-win-overlay h3 {
		font-size: 1.2rem;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: rgba(226, 239, 255, 0.8);
	}

	.total-win-overlay strong {
		font-size: clamp(3rem, 6vw, 4.8rem);
		font-weight: 900;
		text-shadow: 0 0 26px rgba(117, 199, 255, 0.42);
	}

	.total-win-overlay span {
		font-size: 1rem;
		font-weight: 700;
		color: rgba(205, 229, 255, 0.82);
	}

	.total-win-bonus-meta {
		margin: 2px 0 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(245, 214, 170, 0.8);
	}

	.total-win-hint {
		margin: 2px 0 0;
		padding: 6px 10px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: rgba(225, 239, 255, 0.78);
		font-style: normal;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.results-strip {
		padding: 22px;
		border-radius: 28px;
	}

	.history-strip {
		padding: 22px;
		border-radius: 28px;
	}

	.results-summary {
		min-width: 120px;
		text-align: right;
	}

	.empty-state {
		margin-top: 18px;
		padding: 16px 18px;
		border-radius: 18px;
		background: rgba(8, 19, 30, 0.88);
		border: 1px dashed rgba(148, 184, 218, 0.22);
		color: rgba(197, 221, 245, 0.72);
	}

	.result-list {
		display: grid;
		gap: 12px;
		margin-top: 18px;
	}

	@keyframes featureBannerEnter {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.985);
		}

		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes featureTransitionRegularIn {
		from {
			opacity: 0;
			transform: translateY(-16px) scale(0.985);
			filter: blur(6px);
		}

		to {
			opacity: 1;
			transform: translateY(0) scale(1);
			filter: blur(0);
		}
	}

	@keyframes featureTransitionSuperIn {
		0% {
			opacity: 0;
			transform: translateY(-24px) scale(0.94);
			filter: blur(10px);
		}

		62% {
			opacity: 1;
			transform: translateY(0) scale(1.02);
			filter: blur(0);
		}

		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
			filter: blur(0);
		}
	}

	@keyframes featureTransitionRegularOut {
		from {
			opacity: 1;
			transform: translateY(0) scale(1);
			filter: blur(0);
		}

		to {
			opacity: 0;
			transform: translateY(10px) scale(0.992);
			filter: blur(6px);
		}
	}

	@keyframes featureTransitionSuperOut {
		0% {
			opacity: 1;
			transform: translateY(0) scale(1);
			filter: blur(0);
		}

		100% {
			opacity: 0;
			transform: translateY(14px) scale(0.978);
			filter: blur(9px);
		}
	}

	@keyframes featureSealDrift {
		from {
			opacity: 0;
			transform: translateY(8px);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes featureSealDriftHeavy {
		0% {
			opacity: 0;
			transform: translateY(16px) scale(0.94);
		}

		60% {
			opacity: 1;
			transform: translateY(-2px) scale(1.02);
		}

		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes featureStageBreathe {
		0%,
		100% {
			opacity: 0.72;
		}

		50% {
			opacity: 1;
		}
	}

	@keyframes featureTransitionSweep {
		from {
			opacity: 0;
			transform: translateY(-10px) scaleY(0.88);
		}

		to {
			opacity: 0.92;
			transform: translateY(0) scaleY(1);
		}
	}

	@keyframes totalWinPromptPulse {
		0%,
		100% {
			transform: scale(1);
			text-shadow: 0 0 26px rgba(117, 199, 255, 0.42);
		}

		50% {
			transform: scale(1.03);
			text-shadow:
				0 0 34px rgba(117, 199, 255, 0.58),
				0 0 56px rgba(117, 199, 255, 0.2);
		}
	}

	.history-list {
		display: grid;
		gap: 12px;
		margin-top: 18px;
	}

	.result-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 12px;
		align-items: center;
		padding: 16px 18px;
		border-radius: 18px;
		background: rgba(7, 16, 25, 0.88);
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition:
			transform 160ms ease,
			border-color 160ms ease,
			box-shadow 160ms ease;
	}

	.history-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 14px;
		align-items: center;
		padding: 16px 18px;
		border-radius: 18px;
		background: rgba(7, 16, 25, 0.88);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.result-row-active {
		transform: translateY(-1px);
		border-color: rgba(112, 210, 255, 0.34);
		box-shadow: 0 0 22px rgba(88, 220, 255, 0.12);
	}

	.result-row-small {
		border-left: 3px solid rgba(136, 164, 190, 0.42);
	}

	.result-row-medium {
		border-left: 3px solid rgba(255, 210, 117, 0.5);
	}

	.result-row-big {
		border-left: 3px solid rgba(255, 110, 88, 0.62);
	}

	.result-meta,
	.result-numbers {
		display: grid;
		gap: 4px;
	}

	.history-main {
		display: grid;
		gap: 6px;
	}

	.history-main em {
		margin: 0;
		font-style: normal;
		color: rgba(197, 221, 245, 0.76);
	}

	.result-numbers {
		justify-items: end;
		text-align: right;
	}

	.history-title-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
	}

	.history-title-row strong {
		font-size: 1rem;
		font-weight: 800;
	}

	.history-source-chip {
		padding: 4px 9px;
		border-radius: 999px;
		background: rgba(13, 28, 42, 0.92);
		border: 1px solid rgba(150, 184, 217, 0.14);
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(199, 221, 242, 0.78);
	}

	.history-source-chip-live {
		border-color: rgba(104, 199, 255, 0.24);
		color: rgba(172, 230, 255, 0.9);
	}

	.history-source-chip-bonus {
		border-color: rgba(255, 177, 116, 0.24);
		color: rgba(255, 218, 166, 0.9);
	}

	.history-meta {
		display: grid;
		grid-template-columns: repeat(6, minmax(78px, auto));
		gap: 10px;
	}

	.history-meta > div {
		padding: 10px 12px;
		border-radius: 14px;
		background: rgba(6, 14, 22, 0.88);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.history-meta span {
		display: block;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(164, 198, 229, 0.66);
	}

	.history-meta strong {
		display: block;
		margin-top: 4px;
		font-size: 0.88rem;
		font-weight: 800;
	}

	@media (max-width: 1280px) {
		.tools-strip {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.loop-summary,
		.loop-metrics-grid {
			grid-template-columns: 1fr;
		}

		.loop-summary-meta {
			grid-template-columns: 1fr;
		}

		.tool-card-paylines {
			grid-column: span 2;
		}

		.stage-console {
			grid-template-columns: 1fr;
		}

		.console-action-row {
			grid-template-columns: 1fr;
		}

		.console-toggle-stack {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.rule-mode-grid {
			grid-template-columns: 1fr;
		}

		.bonus-buy-row {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 960px) {
		.workshop-shell {
			padding: 18px;
		}

		.hero,
		.hero-status,
		.stage-topline,
		.feature-banner,
		.feature-transition-card,
		.stage-rhythm,
		.results-header,
		.stage-console,
		.tools-strip,
		.console-bank-grid {
			grid-template-columns: 1fr;
		}

		.stat-grid,
		.reel-rhythm-track,
		.console-action-row,
		.console-toggle-stack,
		.bonus-buy-row,
		.tool-action-row,
		.autoplay-confirm,
		.autoplay-confirm-actions,
		.rule-mode-grid,
		.paytable-row {
			grid-template-columns: 1fr;
		}

		.result-row,
		.history-row,
		.history-meta {
			grid-template-columns: 1fr;
		}

		.stage-rhythm-focus {
			min-width: 0;
		}

		.feature-banner-metrics {
			justify-content: start;
		}

		.feature-transition-seals {
			justify-content: start;
		}

		.feature-transition-total {
			text-align: left;
		}

		.tool-card-paylines {
			grid-column: auto;
		}

		.paytable-row strong {
			text-align: left;
		}
	}
</style>

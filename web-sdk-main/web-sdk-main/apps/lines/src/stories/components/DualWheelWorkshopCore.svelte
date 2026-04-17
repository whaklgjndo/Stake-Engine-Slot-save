<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import DualWheelBoard from './DualWheelBoard.svelte';
	import bgFar from '../assets/background/bg_far.png';
	import bgFoliageSilhouette from '../assets/background/bg_foliage_silhouette.png';
	import bgHaze from '../assets/background/bg_haze.png';
	import bgWaterfalls from '../assets/background/bg_waterfalls.png';
	import archFrameArt from '../assets/midground/arch_frame.png';
	import lanternLeftArt from '../assets/midground/lantern_left.png';
	import lanternRightArt from '../assets/midground/lantern_right.png';
	import midRocksFoliageArt from '../assets/midground/mid_rocks_foliage.png';
	import portalCoreArt from '../assets/midground/portal_core.png';
	import portalDistortionMaskArt from '../assets/midground/portal_distortion_mask.png';
	import portalGlowArt from '../assets/midground/portal_glow.png';
	import fxFogStripArt from '../assets/fx/fx_fog_strip.png';
	import fxLightRayArt from '../assets/fx/fx_light_ray.png';
	import fxParticleMagicArt from '../assets/fx/fx_particle_magic.png';
	import fxParticleSoftArt from '../assets/fx/fx_particle_soft.png';
	import {
		autoplayPresets,
		bonusSymbolAssets,
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

<div
	class:workshop-shell={true}
	class:world-feature={Boolean(
		bonusPreviewState || bonusTriggerRevealState || activeStageTone === 'medium',
	)}
	class:world-big={Boolean(
		activeStageTone === 'big' ||
			bonusPreviewState?.mode === 'super' ||
			activeWheelState?.type === 'red',
	)}
	class:world-wheel-active={Boolean(activeWheelState)}
>
	<!-- full original workshop markup preserved -->
</div>

<style>
	/* full original workshop styles preserved */
</style>

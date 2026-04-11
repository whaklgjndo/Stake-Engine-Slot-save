import {
	BONUS_ROUND_CONFIG,
	BLUE_WHEEL_SEGMENTS,
	BLUE_WHEEL_SEGMENT_WEIGHTS,
	LIVE_BASE_GAME_WHEEL_PROFILE,
	paylines,
	paytable,
	PRODUCT_MAX_WIN_TARGET,
	RED_INNER_SEGMENTS,
	RED_INNER_SEGMENT_WEIGHTS,
	RED_OUTER_SEGMENTS,
	RED_OUTER_SEGMENT_WEIGHTS,
	reelStrips,
	REELS,
	regularSymbols,
	ROWS,
	symbolMeta,
} from './dualWheelWorkshopConfig.ts';
import type {
	BonusMode,
	LineResult,
	Position,
	RegularSymbolId,
	SpinMood,
	SymbolId,
	WheelAward,
} from './dualWheelWorkshopTypes.ts';

export type RandomFn = () => number;

export function clampWin(payout: number, bet: number): number {
	return Math.min(payout, bet * PRODUCT_MAX_WIN_TARGET);
}

export type LiveSpinMathResult = {
	board: SymbolId[][];
	wheelResults: Record<string, WheelAward>;
	lineResults: LineResult[];
	wheelQueue: LineResult['wheels'];
	totalWin: number;
	maxWinCapped: boolean;
	spinMood: SpinMood;
};

export type BonusRoundSessionResult = {
	mode: BonusMode;
	totalPaid: number;
	spins: LiveSpinMathResult[];
	maxSpinWin: number;
	blueWheels: number;
	redWheels: number;
};

type WheelProfile = {
	blueKeepChance: number;
	redKeepChance: number;
	maxBluePerBoard: number;
	maxRedPerBoard: number;
	injectAnywhere?: boolean;
	blueAdditionalCountWeights?: readonly number[];
	redAdditionalCountWeights?: readonly number[];
};

export type DualWheelSimulationReport = {
	requestedSpins: number;
	spins: number;
	bet: number;
	totalBet: number;
	totalPaid: number;
	rtp: number;
	hitSpins: number;
	deadSpins: number;
	wheelRounds: number;
	blueWheels: number;
	redWheels: number;
	totalWinningLines: number;
	averageWinOnHit: number;
	averageLinesOnHit: number;
	maxWin: number;
	maxWinMultiplier: number;
	distinctPaidMultipliers: number;
	paidMultipliers: number[];
	winRanges: {
		zero: number;
		upTo5x: number;
		upTo10x: number;
		upTo25x: number;
		upTo50x: number;
		upTo100x: number;
		over100x: number;
	};
	volatility: {
		lineOnlyRounds: number;
		blueWheelRounds: number;
		redWheelRounds: number;
		comboWheelRounds: number;
		fiftyPlusRounds: number;
		hundredPlusRounds: number;
		lineOnlyPaid: number;
		blueWheelPaid: number;
		redWheelPaid: number;
		comboWheelPaid: number;
	};
	bonuses: {
		regularTriggers: number;
		superTriggers: number;
		regularBonusSpins: number;
		superBonusSpins: number;
		regularBonusPaid: number;
		superBonusPaid: number;
		regularAverageBonus: number;
		superAverageBonus: number;
		maxRegularBonus: number;
		maxSuperBonus: number;
	};
	moods: Record<SpinMood, number>;
};

const reelRegularPools: RegularSymbolId[][] = reelStrips.map((strip) =>
	strip.filter(
		(symbol): symbol is RegularSymbolId => symbol !== 'blueWheel' && symbol !== 'redWheel',
	),
);

export function cloneBoard(source: SymbolId[][]): SymbolId[][] {
	return source.map((row) => [...row]);
}

export function cellKey(row: number, column: number): string {
	return `${row}-${column}`;
}

export function wheelPositionKey(position: Position): string {
	return cellKey(position.row, position.column);
}

export function isWild(symbol: SymbolId): boolean {
	return symbol === 'blueWheel' || symbol === 'redWheel';
}

function keyToPosition(key: string): Position {
	const [row, column] = key.split('-').map(Number);
	return {
		row: Number.isFinite(row) ? row : 0,
		column: Number.isFinite(column) ? column : 0,
	};
}

function randomColumnWindow(column: number, rng: RandomFn): SymbolId[] {
	const strip = reelStrips[column];
	const start = Math.floor(rng() * strip.length);
	return Array.from({ length: ROWS }, (_, offset) => strip[(start + offset) % strip.length]);
}

function randomRegularColumnWindow(column: number, rng: RandomFn): RegularSymbolId[] {
	const strip = reelRegularPools[column];
	const start = Math.floor(rng() * strip.length);
	return Array.from({ length: ROWS }, (_, offset) => strip[(start + offset) % strip.length]);
}

export function randomBoard(rng: RandomFn = Math.random): SymbolId[][] {
	const columns = Array.from({ length: REELS }, (_, column) => randomColumnWindow(column, rng));
	return Array.from({ length: ROWS }, (_, rowIndex) =>
		Array.from({ length: REELS }, (_, columnIndex) => columns[columnIndex][rowIndex]),
	);
}

function randomRegularBoard(rng: RandomFn = Math.random): SymbolId[][] {
	const columns = Array.from({ length: REELS }, (_, column) =>
		randomRegularColumnWindow(column, rng),
	);
	return Array.from({ length: ROWS }, (_, rowIndex) =>
		Array.from({ length: REELS }, (_, columnIndex) => columns[columnIndex][rowIndex]),
	);
}

function randomRegularFromColumn(column: number, rng: RandomFn): RegularSymbolId {
	const pool = reelRegularPools[column];
	return pool[Math.floor(rng() * pool.length)] ?? regularSymbols[0];
}

function shufflePositions<T>(items: T[], rng: RandomFn): T[] {
	const next = [...items];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(rng() * (index + 1));
		[next[index], next[swapIndex]] = [next[swapIndex], next[index]];
	}
	return next;
}

function pickWeightedCount(weights: readonly number[] | undefined, rng: RandomFn): number {
	if (!weights?.length) return 0;

	const totalWeight = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
	if (totalWeight <= 0) return 0;

	let threshold = rng() * totalWeight;
	for (const [index, weight] of weights.entries()) {
		threshold -= Math.max(0, weight);
		if (threshold <= 0) return index;
	}

	return Math.max(0, weights.length - 1);
}

function injectWheelsOntoBoard(
	board: SymbolId[][],
	profile: WheelProfile,
	rng: RandomFn = Math.random,
	lockedWheelResults: Record<string, WheelAward> = {},
): SymbolId[][] {
	const next = cloneBoard(board);
	const lockedKeys = new Set<string>();
	let blueCount = 0;
	let redCount = 0;

	for (const [key, award] of Object.entries(lockedWheelResults)) {
		const position = keyToPosition(key);
		next[position.row][position.column] = award.type === 'blue' ? 'blueWheel' : 'redWheel';
		lockedKeys.add(key);
		if (award.type === 'blue') {
			blueCount += 1;
		} else {
			redCount += 1;
		}
	}

	const availablePositions = shufflePositions(
		Array.from({ length: ROWS * REELS }, (_, index) => ({
			row: Math.floor(index / REELS),
			column: index % REELS,
		})).filter((position) => !lockedKeys.has(cellKey(position.row, position.column))),
		rng,
	);

	const blueLimit = Math.max(0, profile.maxBluePerBoard - blueCount);
	const redLimit = Math.max(0, profile.maxRedPerBoard - redCount);
	const redTarget = Math.min(redLimit, pickWeightedCount(profile.redAdditionalCountWeights, rng));
	const blueTarget = Math.min(
		blueLimit,
		pickWeightedCount(profile.blueAdditionalCountWeights, rng),
	);

	for (let index = 0; index < redTarget && availablePositions.length > 0; index += 1) {
		const position = availablePositions.shift();
		if (!position) break;
		next[position.row][position.column] = 'redWheel';
	}

	for (let index = 0; index < blueTarget && availablePositions.length > 0; index += 1) {
		const position = availablePositions.shift();
		if (!position) break;
		next[position.row][position.column] = 'blueWheel';
	}

	return next;
}

function applyWheelProfile(
	board: SymbolId[][],
	profile: WheelProfile,
	rng: RandomFn = Math.random,
	lockedWheelResults: Record<string, WheelAward> = {},
): SymbolId[][] {
	const next = cloneBoard(board);
	const bluePositions: Position[] = [];
	const redPositions: Position[] = [];
	const lockedPositions = new Set(Object.keys(lockedWheelResults));

	for (const [key, award] of Object.entries(lockedWheelResults)) {
		const position = keyToPosition(key);
		next[position.row][position.column] = award.type === 'blue' ? 'blueWheel' : 'redWheel';
	}

	for (const [rowIndex, row] of next.entries()) {
		for (const [columnIndex, symbol] of row.entries()) {
			if (lockedPositions.has(cellKey(rowIndex, columnIndex))) continue;
			if (symbol === 'blueWheel') bluePositions.push({ row: rowIndex, column: columnIndex });
			if (symbol === 'redWheel') redPositions.push({ row: rowIndex, column: columnIndex });
		}
	}

	let keptBlue = Object.values(lockedWheelResults).filter((award) => award.type === 'blue').length;
	for (const position of shufflePositions(bluePositions, rng)) {
		const keep = keptBlue < profile.maxBluePerBoard && rng() < profile.blueKeepChance;
		if (keep) {
			keptBlue += 1;
			continue;
		}
		next[position.row][position.column] = randomRegularFromColumn(position.column, rng);
	}

	let keptRed = Object.values(lockedWheelResults).filter((award) => award.type === 'red').length;
	for (const position of shufflePositions(redPositions, rng)) {
		const keep = keptRed < profile.maxRedPerBoard && rng() < profile.redKeepChance;
		if (keep) {
			keptRed += 1;
			continue;
		}
		next[position.row][position.column] = randomRegularFromColumn(position.column, rng);
	}

	return next;
}

export function applyLiveBaseGameWheelProfile(
	board: SymbolId[][],
	rng: RandomFn = Math.random,
): SymbolId[][] {
	return applyWheelProfile(board, LIVE_BASE_GAME_WHEEL_PROFILE, rng);
}

export function randomLiveBaseGameBoard(rng: RandomFn = Math.random): SymbolId[][] {
	return applyLiveBaseGameWheelProfile(randomBoard(rng), rng);
}

export function pickWeightedSegmentValue(
	segments: readonly number[],
	weights: readonly number[],
	rng: RandomFn = Math.random,
): number {
	const totalWeight = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
	if (totalWeight <= 0) {
		return segments[Math.floor(rng() * segments.length)] ?? segments[0] ?? 0;
	}

	let threshold = rng() * totalWeight;
	for (const [index, segment] of segments.entries()) {
		threshold -= Math.max(0, weights[index] ?? 0);
		if (threshold <= 0) return segment;
	}

	return segments[segments.length - 1] ?? segments[0] ?? 0;
}

export function buildWheelResults(
	board: SymbolId[][],
	rng: RandomFn = Math.random,
	existingWheelResults: Record<string, WheelAward> = {},
): Record<string, WheelAward> {
	const results: Record<string, WheelAward> = { ...existingWheelResults };

	for (const [rowIndex, row] of board.entries()) {
		for (const [columnIndex, symbol] of row.entries()) {
			const key = cellKey(rowIndex, columnIndex);
			if (results[key]) continue;

			if (symbol === 'blueWheel') {
				results[key] = {
					type: 'blue',
					value: pickWeightedSegmentValue(BLUE_WHEEL_SEGMENTS, BLUE_WHEEL_SEGMENT_WEIGHTS, rng),
				};
				continue;
			}

			if (symbol === 'redWheel') {
				results[key] = {
					type: 'red',
					outer: pickWeightedSegmentValue(RED_OUTER_SEGMENTS, RED_OUTER_SEGMENT_WEIGHTS, rng),
					inner: pickWeightedSegmentValue(RED_INNER_SEGMENTS, RED_INNER_SEGMENT_WEIGHTS, rng),
				};
			}
		}
	}

	return results;
}

function bestSymbolFromWilds(): RegularSymbolId {
	return regularSymbols.reduce((best, symbol) =>
		(paytable[symbol][5] ?? 0) > (paytable[best][5] ?? 0) ? symbol : best,
	);
}

function resolveLineSymbol(cells: Array<Position & { symbol: SymbolId }>): RegularSymbolId | null {
	for (const cell of cells) {
		if (!isWild(cell.symbol)) return cell.symbol as RegularSymbolId;
	}
	return cells.some((cell) => isWild(cell.symbol)) ? bestSymbolFromWilds() : null;
}

export function evaluateLine(
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

export function evaluateBoard(
	sourceBoard: SymbolId[][],
	wheelResults: Record<string, WheelAward>,
	bet: number,
): LineResult[] {
	return paylines
		.map((rows, index) => evaluateLine(rows, sourceBoard, wheelResults, bet, index + 1))
		.filter((result): result is LineResult => Boolean(result))
		.sort((left, right) => right.payout - left.payout || left.lineNumber - right.lineNumber);
}

export function deriveSpinMood(results: LineResult[], bet: number): SpinMood {
	if (!results.length) return 'dead';

	const hasRedWheel = results.some((result) => result.wheels.some((wheel) => wheel.type === 'red'));
	const hasAnyWheel = results.some((result) => result.wheels.length > 0);
	const total = results.reduce((sum, result) => sum + result.payout, 0);
	const strongest = results[0]?.totalMultiplier ?? 0;

	if (hasRedWheel || total >= bet * 50 || strongest >= 30) return 'big';
	if (
		hasAnyWheel ||
		strongest >= 10 ||
		results.some((result) => symbolMeta[result.symbol].tier === 'gold')
	) {
		return 'feature';
	}

	return 'base';
}

export function buildWheelQueue(results: LineResult[]): LineResult['wheels'] {
	const queue: LineResult['wheels'] = [];
	const seen = new Set<string>();

	for (const result of results) {
		for (const wheel of result.wheels) {
			const key = wheelPositionKey(wheel);
			if (seen.has(key)) continue;
			seen.add(key);
			queue.push(wheel);
		}
	}

	return queue;
}

export function buildLiveSpinMath(bet: number, rng: RandomFn = Math.random): LiveSpinMathResult {
	const board = randomLiveBaseGameBoard(rng);
	const wheelResults = buildWheelResults(board, rng);
	const lineResults = evaluateBoard(board, wheelResults, bet);
	const wheelQueue = buildWheelQueue(lineResults);
	const rawWin = lineResults.reduce((sum, result) => sum + result.payout, 0);
	const totalWin = clampWin(rawWin, bet);
	const spinMood = deriveSpinMood(lineResults, bet);

	return {
		board,
		wheelResults,
		lineResults,
		wheelQueue,
		totalWin,
		maxWinCapped: totalWin < rawWin,
		spinMood,
	};
}

function buildProfileSpinMath(
	bet: number,
	profile: WheelProfile,
	rng: RandomFn,
	stickyWheelResults: Record<string, WheelAward> = {},
): LiveSpinMathResult {
	const board = profile.injectAnywhere
		? injectWheelsOntoBoard(randomRegularBoard(rng), profile, rng, stickyWheelResults)
		: applyWheelProfile(randomBoard(rng), profile, rng, stickyWheelResults);
	const wheelResults = buildWheelResults(board, rng, stickyWheelResults);
	const lineResults = evaluateBoard(board, wheelResults, bet);
	const wheelQueue = buildWheelQueue(lineResults);
	const rawWin = lineResults.reduce((sum, result) => sum + result.payout, 0);
	const totalWin = clampWin(rawWin, bet);
	const spinMood = deriveSpinMood(lineResults, bet);

	return {
		board,
		wheelResults,
		lineResults,
		wheelQueue,
		totalWin,
		maxWinCapped: totalWin < rawWin,
		spinMood,
	};
}

function rollBonusTrigger(rng: RandomFn): BonusMode | null {
	const roll = rng();
	if (roll < BONUS_ROUND_CONFIG.super.triggerChance) return 'super';
	if (roll < BONUS_ROUND_CONFIG.super.triggerChance + BONUS_ROUND_CONFIG.regular.triggerChance) {
		return 'regular';
	}
	return null;
}

export function simulateBonusRoundSession(
	mode: BonusMode,
	bet: number,
	rng: RandomFn,
): BonusRoundSessionResult {
	const config = BONUS_ROUND_CONFIG[mode];
	let totalPaid = 0;
	let maxSpinWin = 0;
	let blueWheels = 0;
	let redWheels = 0;
	let stickyWheelResults: Record<string, WheelAward> = {};
	const spins: LiveSpinMathResult[] = [];

	for (let index = 0; index < config.freeSpins; index += 1) {
		const spin = buildProfileSpinMath(
			bet,
			config.wheelProfile,
			rng,
			config.stickyWheels ? stickyWheelResults : {},
		);
		totalPaid += spin.totalWin;
		maxSpinWin = Math.max(maxSpinWin, spin.totalWin);
		blueWheels += spin.wheelQueue.filter((wheel) => wheel.type === 'blue').length;
		redWheels += spin.wheelQueue.filter((wheel) => wheel.type === 'red').length;
		spins.push(spin);

		if (config.stickyWheels) {
			stickyWheelResults = { ...spin.wheelResults };
		}
	}

	const clampedTotalPaid = clampWin(totalPaid, bet);

	return {
		mode,
		totalPaid: clampedTotalPaid,
		spins,
		maxSpinWin,
		blueWheels,
		redWheels,
	};
}

function resolveWinRange(
	multiplier: number,
): 'zero' | 'upTo5x' | 'upTo10x' | 'upTo25x' | 'upTo50x' | 'upTo100x' | 'over100x' {
	if (multiplier <= 0) return 'zero';
	if (multiplier < 5) return 'upTo5x';
	if (multiplier < 10) return 'upTo10x';
	if (multiplier < 25) return 'upTo25x';
	if (multiplier < 50) return 'upTo50x';
	if (multiplier < 100) return 'upTo100x';
	return 'over100x';
}

function classifyVolatility(
	results: LineResult[],
	wheelQueue: LineResult['wheels'],
	totalWin: number,
	bet: number,
) {
	const hasBlue = wheelQueue.some((wheel) => wheel.type === 'blue');
	const hasRed = wheelQueue.some((wheel) => wheel.type === 'red');
	const multiplier = bet > 0 ? totalWin / bet : 0;

	return {
		lineOnly: totalWin > 0 && !hasBlue && !hasRed,
		blueWheel: totalWin > 0 && hasBlue && !hasRed,
		redWheel: totalWin > 0 && hasRed && !hasBlue,
		comboWheel: totalWin > 0 && hasBlue && hasRed,
		fiftyPlus: multiplier >= 50,
		hundredPlus: multiplier >= 100,
	};
}

function createEmptySimulationReport(
	requestedSpins: number,
	spins: number,
	bet: number,
): DualWheelSimulationReport {
	return {
		requestedSpins,
		spins,
		bet,
		totalBet: spins * bet,
		totalPaid: 0,
		rtp: 0,
		hitSpins: 0,
		deadSpins: spins,
		wheelRounds: 0,
		blueWheels: 0,
		redWheels: 0,
		totalWinningLines: 0,
		averageWinOnHit: 0,
		averageLinesOnHit: 0,
		maxWin: 0,
		maxWinMultiplier: 0,
		distinctPaidMultipliers: 0,
		paidMultipliers: [],
		winRanges: {
			zero: 0,
			upTo5x: 0,
			upTo10x: 0,
			upTo25x: 0,
			upTo50x: 0,
			upTo100x: 0,
			over100x: 0,
		},
		volatility: {
			lineOnlyRounds: 0,
			blueWheelRounds: 0,
			redWheelRounds: 0,
			comboWheelRounds: 0,
			fiftyPlusRounds: 0,
			hundredPlusRounds: 0,
			lineOnlyPaid: 0,
			blueWheelPaid: 0,
			redWheelPaid: 0,
			comboWheelPaid: 0,
		},
		bonuses: {
			regularTriggers: 0,
			superTriggers: 0,
			regularBonusSpins: 0,
			superBonusSpins: 0,
			regularBonusPaid: 0,
			superBonusPaid: 0,
			regularAverageBonus: 0,
			superAverageBonus: 0,
			maxRegularBonus: 0,
			maxSuperBonus: 0,
		},
		moods: {
			dead: 0,
			base: 0,
			feature: 0,
			big: 0,
		},
	};
}

export function simulateLiveSpins(
	{
		spins = 1000,
		bet = 1,
		maxSpins = 10000,
	}: {
		spins?: number;
		bet?: number;
		maxSpins?: number;
	} = {},
	rng: RandomFn = Math.random,
): DualWheelSimulationReport {
	const requestedSpins = Math.max(1, Math.floor(spins));
	const safeMax = Math.max(1, Math.floor(maxSpins));
	const safeSpins = Math.min(requestedSpins, safeMax);
	const moods: Record<SpinMood, number> = {
		dead: 0,
		base: 0,
		feature: 0,
		big: 0,
	};
	const winRanges = {
		zero: 0,
		upTo5x: 0,
		upTo10x: 0,
		upTo25x: 0,
		upTo50x: 0,
		upTo100x: 0,
		over100x: 0,
	};
	const volatility = {
		lineOnlyRounds: 0,
		blueWheelRounds: 0,
		redWheelRounds: 0,
		comboWheelRounds: 0,
		fiftyPlusRounds: 0,
		hundredPlusRounds: 0,
		lineOnlyPaid: 0,
		blueWheelPaid: 0,
		redWheelPaid: 0,
		comboWheelPaid: 0,
	};
	const distinctPaidMultipliers = new Set<number>();

	let totalPaid = 0;
	let hitSpins = 0;
	let wheelRounds = 0;
	let blueWheels = 0;
	let redWheels = 0;
	let totalWinningLines = 0;
	let maxWin = 0;

	for (let index = 0; index < safeSpins; index += 1) {
		const spin = buildLiveSpinMath(bet, rng);
		const spinMultiplier = bet > 0 ? spin.totalWin / bet : 0;
		const roundVolatility = classifyVolatility(
			spin.lineResults,
			spin.wheelQueue,
			spin.totalWin,
			bet,
		);
		totalPaid += spin.totalWin;
		if (spin.totalWin > 0) hitSpins += 1;
		if (spin.wheelQueue.length > 0) wheelRounds += 1;
		blueWheels += spin.wheelQueue.filter((wheel) => wheel.type === 'blue').length;
		redWheels += spin.wheelQueue.filter((wheel) => wheel.type === 'red').length;
		totalWinningLines += spin.lineResults.length;
		maxWin = Math.max(maxWin, spin.totalWin);
		moods[spin.spinMood] += 1;
		winRanges[resolveWinRange(spinMultiplier)] += 1;
		if (roundVolatility.lineOnly) {
			volatility.lineOnlyRounds += 1;
			volatility.lineOnlyPaid += spin.totalWin;
		}
		if (roundVolatility.blueWheel) {
			volatility.blueWheelRounds += 1;
			volatility.blueWheelPaid += spin.totalWin;
		}
		if (roundVolatility.redWheel) {
			volatility.redWheelRounds += 1;
			volatility.redWheelPaid += spin.totalWin;
		}
		if (roundVolatility.comboWheel) {
			volatility.comboWheelRounds += 1;
			volatility.comboWheelPaid += spin.totalWin;
		}
		if (roundVolatility.fiftyPlus) {
			volatility.fiftyPlusRounds += 1;
		}
		if (roundVolatility.hundredPlus) {
			volatility.hundredPlusRounds += 1;
		}

		if (spinMultiplier > 0) {
			distinctPaidMultipliers.add(Number(spinMultiplier.toFixed(2)));
		}
	}

	const totalBet = safeSpins * bet;
	const deadSpins = safeSpins - hitSpins;

	return {
		requestedSpins,
		spins: safeSpins,
		bet,
		totalBet,
		totalPaid,
		rtp: totalBet > 0 ? totalPaid / totalBet : 0,
		hitSpins,
		deadSpins,
		wheelRounds,
		blueWheels,
		redWheels,
		totalWinningLines,
		averageWinOnHit: hitSpins > 0 ? totalPaid / hitSpins : 0,
		averageLinesOnHit: hitSpins > 0 ? totalWinningLines / hitSpins : 0,
		maxWin,
		maxWinMultiplier: bet > 0 ? maxWin / bet : 0,
		distinctPaidMultipliers: distinctPaidMultipliers.size,
		paidMultipliers: Array.from(distinctPaidMultipliers).sort((left, right) => left - right),
		winRanges,
		volatility,
		bonuses: {
			regularTriggers: 0,
			superTriggers: 0,
			regularBonusSpins: 0,
			superBonusSpins: 0,
			regularBonusPaid: 0,
			superBonusPaid: 0,
			regularAverageBonus: 0,
			superAverageBonus: 0,
			maxRegularBonus: 0,
			maxSuperBonus: 0,
		},
		moods,
	};
}

export function simulateGameSpins(
	{
		spins = 1000,
		bet = 1,
		maxSpins = 10000,
	}: {
		spins?: number;
		bet?: number;
		maxSpins?: number;
	} = {},
	rng: RandomFn = Math.random,
): DualWheelSimulationReport {
	const requestedSpins = Math.max(1, Math.floor(spins));
	const safeMax = Math.max(1, Math.floor(maxSpins));
	const safeSpins = Math.min(requestedSpins, safeMax);
	const report = createEmptySimulationReport(requestedSpins, safeSpins, bet);
	const distinctPaidMultipliers = new Set<number>();

	for (let index = 0; index < safeSpins; index += 1) {
		const baseSpin = buildLiveSpinMath(bet, rng);
		const bonusMode = rollBonusTrigger(rng);
		const bonusRound = bonusMode ? simulateBonusRoundSession(bonusMode, bet, rng) : null;
		const rawRoundPaid = baseSpin.totalWin + (bonusRound?.totalPaid ?? 0);
		const totalRoundPaid = clampWin(rawRoundPaid, bet);
		const totalRoundMultiplier = bet > 0 ? totalRoundPaid / bet : 0;
		const roundVolatility = classifyVolatility(
			baseSpin.lineResults,
			baseSpin.wheelQueue,
			baseSpin.totalWin,
			bet,
		);

		report.totalPaid += totalRoundPaid;
		if (totalRoundPaid > 0) {
			report.hitSpins += 1;
			distinctPaidMultipliers.add(Number(totalRoundMultiplier.toFixed(2)));
		}

		report.wheelRounds += baseSpin.wheelQueue.length ? 1 : 0;
		report.blueWheels += baseSpin.wheelQueue.filter((wheel) => wheel.type === 'blue').length;
		report.redWheels += baseSpin.wheelQueue.filter((wheel) => wheel.type === 'red').length;
		report.totalWinningLines += baseSpin.lineResults.length;
		report.maxWin = Math.max(report.maxWin, totalRoundPaid);
		report.maxWinMultiplier = Math.max(report.maxWinMultiplier, totalRoundMultiplier);
		report.moods[baseSpin.spinMood] += 1;
		report.winRanges[resolveWinRange(totalRoundMultiplier)] += 1;

		if (roundVolatility.lineOnly) {
			report.volatility.lineOnlyRounds += 1;
			report.volatility.lineOnlyPaid += baseSpin.totalWin;
		}
		if (roundVolatility.blueWheel) {
			report.volatility.blueWheelRounds += 1;
			report.volatility.blueWheelPaid += baseSpin.totalWin;
		}
		if (roundVolatility.redWheel) {
			report.volatility.redWheelRounds += 1;
			report.volatility.redWheelPaid += baseSpin.totalWin;
		}
		if (roundVolatility.comboWheel) {
			report.volatility.comboWheelRounds += 1;
			report.volatility.comboWheelPaid += baseSpin.totalWin;
		}
		if (totalRoundMultiplier >= 50) {
			report.volatility.fiftyPlusRounds += 1;
		}
		if (totalRoundMultiplier >= 100) {
			report.volatility.hundredPlusRounds += 1;
		}

		if (bonusMode === 'regular' && bonusRound) {
			report.bonuses.regularTriggers += 1;
			report.bonuses.regularBonusSpins += bonusRound.spins.length;
			report.bonuses.regularBonusPaid += bonusRound.totalPaid;
			report.bonuses.maxRegularBonus = Math.max(
				report.bonuses.maxRegularBonus,
				bonusRound.totalPaid,
			);
		}

		if (bonusMode === 'super' && bonusRound) {
			report.bonuses.superTriggers += 1;
			report.bonuses.superBonusSpins += bonusRound.spins.length;
			report.bonuses.superBonusPaid += bonusRound.totalPaid;
			report.bonuses.maxSuperBonus = Math.max(report.bonuses.maxSuperBonus, bonusRound.totalPaid);
		}
	}

	report.deadSpins = report.spins - report.hitSpins;
	report.rtp = report.totalBet > 0 ? report.totalPaid / report.totalBet : 0;
	report.averageWinOnHit = report.hitSpins > 0 ? report.totalPaid / report.hitSpins : 0;
	report.averageLinesOnHit = report.hitSpins > 0 ? report.totalWinningLines / report.hitSpins : 0;
	report.distinctPaidMultipliers = distinctPaidMultipliers.size;
	report.paidMultipliers = Array.from(distinctPaidMultipliers).sort((left, right) => left - right);
	report.bonuses.regularAverageBonus =
		report.bonuses.regularTriggers > 0
			? report.bonuses.regularBonusPaid / report.bonuses.regularTriggers
			: 0;
	report.bonuses.superAverageBonus =
		report.bonuses.superTriggers > 0
			? report.bonuses.superBonusPaid / report.bonuses.superTriggers
			: 0;

	return report;
}

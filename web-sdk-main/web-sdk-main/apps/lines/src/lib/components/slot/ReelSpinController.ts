import { getTheme } from '$lib/themes';
import type {
	ControllerSnapshot,
	Matrix,
	SlotOutcomeTone,
	SpinPlan,
	SymbolId,
	ThemeId,
	WinLine,
} from './types';
import { DEFAULT_PAYLINES, REEL_COUNT, VISIBLE_ROWS } from './types';

type Listener = (snapshot: ControllerSnapshot) => void;

type SpinOptions = {
	staggerDelay?: number;
	forcedTone?: SlotOutcomeTone | 'random';
	forcedPlan?: SpinPlan;
};

type InternalState = {
	themeId: ThemeId;
	snapshot: ControllerSnapshot;
	timers: number[];
};

const SYMBOL_POOL: Array<{ id: SymbolId; weight: number }> = [
	{ id: 'low1', weight: 18 },
	{ id: 'low2', weight: 18 },
	{ id: 'low3', weight: 16 },
	{ id: 'low4', weight: 16 },
	{ id: 'mid1', weight: 10 },
	{ id: 'mid2', weight: 10 },
	{ id: 'high1', weight: 5 },
	{ id: 'high2', weight: 5 },
	{ id: 'wild', weight: 2 },
	{ id: 'scatter', weight: 2 },
	{ id: 'mult2', weight: 1 },
	{ id: 'mult3', weight: 1 },
];

const PAYOUTS: Record<SymbolId, number> = {
	low1: 6,
	low2: 6,
	low3: 8,
	low4: 8,
	mid1: 12,
	mid2: 14,
	high1: 22,
	high2: 26,
	wild: 30,
	scatter: 18,
	mult2: 14,
	mult3: 18,
};

const WIN_THEME_COLORS = [
	'#67e8f9',
	'#a78bfa',
	'#fb7185',
	'#fbbf24',
	'#34d399',
];

export const createRandomMatrix = (): Matrix<SymbolId> =>
	Array.from({ length: VISIBLE_ROWS }, () =>
		Array.from({ length: REEL_COUNT }, () => pickWeightedSymbol()),
	);

export const createWinningLine = (
	rows: number[],
	lineIndex: number,
	symbol: SymbolId,
	payout: number,
	tone: SlotOutcomeTone,
): WinLine => ({
	id: `line-${lineIndex + 1}`,
	label: `Payline ${lineIndex + 1}`,
	payout,
	color: WIN_THEME_COLORS[lineIndex % WIN_THEME_COLORS.length],
	glowColor: WIN_THEME_COLORS[(lineIndex + 2) % WIN_THEME_COLORS.length],
	positions: rows.map((row, column) => ({ row, column })),
	tone,
});

export const createSpinPlan = (forcedTone: SlotOutcomeTone | 'random' = 'random'): SpinPlan => {
	const matrix = createRandomMatrix();
	const stopPositions = Array.from({ length: REEL_COUNT }, () => Math.floor(Math.random() * 12));
	const scatterRoll = Math.random();
	const tone =
		forcedTone === 'random'
			? scatterRoll > 0.92
				? 'scatter'
				: scatterRoll > 0.68
					? 'line'
					: scatterRoll > 0.34
						? 'win'
						: 'big-win'
			: forcedTone;

	if (tone === 'none') {
		return {
			matrix,
			winLines: [],
			tone,
			totalWin: 0,
			scatterCount: 0,
			message: 'Dead spin. Spin again.',
			stopPositions,
		};
	}

	if (tone === 'scatter') {
		const scatterCount = Math.random() > 0.6 ? 4 : 3;
		const columns = shuffle([...Array(REEL_COUNT).keys()]).slice(0, scatterCount).sort((a, b) => a - b);
		for (const column of columns) {
			matrix[Math.floor(Math.random() * VISIBLE_ROWS)][column] = 'scatter';
		}

		const scatterLine: WinLine = {
			id: 'scatter-burst',
			label: `${scatterCount} Scatters`,
			payout: scatterCount === 4 ? 220 : 90,
			color: '#fbbf24',
			glowColor: '#fb7185',
			positions: columns.map((column, index) => ({ row: index % VISIBLE_ROWS, column })),
			tone: 'scatter',
		};

		return {
			matrix,
			winLines: [scatterLine],
			tone,
			totalWin: scatterLine.payout ?? 0,
			scatterCount,
			message: scatterCount === 4 ? 'Super scatter feature triggered.' : 'Scatter feature triggered.',
			stopPositions,
		};
	}

	const lineCount = tone === 'line' ? 1 : tone === 'win' ? 2 : 3 + Math.floor(Math.random() * 2);
	const chosenLines = shuffle(DEFAULT_PAYLINES.map((rows, index) => ({ rows, index }))).slice(0, lineCount);
	const winLines: WinLine[] = [];
	let totalWin = 0;

	for (const [sequence, { rows, index }] of chosenLines.entries()) {
		const symbol = pickShowcaseSymbol(tone, sequence);
		const hasWild = tone !== 'line' && Math.random() > 0.55;
		const hasMultiplier = tone === 'big-win' && Math.random() > 0.4;
		const payoutBase = PAYOUTS[symbol] ?? 10;
		const payout = payoutBase * (tone === 'big-win' ? 5 + sequence * 2 : tone === 'win' ? 2 + sequence : 1);

		rows.forEach((row, column) => {
			if (column === 0 || column === REEL_COUNT - 1) {
				matrix[row][column] = symbol;
				return;
			}

			if (hasMultiplier && column === 2 && tone === 'big-win') {
				matrix[row][column] = Math.random() > 0.5 ? 'mult3' : 'mult2';
				return;
			}

			if (hasWild && column === 1) {
				matrix[row][column] = 'wild';
				return;
			}

			matrix[row][column] = symbol;
		});

		const line = createWinningLine(rows, index, symbol, payout, tone);
		winLines.push(line);
		totalWin += payout;
	}

	return {
		matrix,
		winLines,
		tone,
		totalWin,
		scatterCount: 0,
		message:
			tone === 'big-win'
				? 'Big win. Premium symbols connected across multiple paylines.'
				: tone === 'win'
					? 'Multiple paylines connected.'
					: 'Single payline hit.',
		stopPositions,
	};
};

const createSnapshot = (): ControllerSnapshot => ({
	symbolsMatrix: createRandomMatrix(),
	isSpinning: Array.from({ length: REEL_COUNT }, () => false),
	stopPositions: Array.from({ length: REEL_COUNT }, () => 0),
	activeWinLines: [],
	outcomeTone: 'none',
	spinCount: 0,
	lastWin: 0,
	lastScatterCount: 0,
	message: 'Ready to spin.',
});

export class ReelSpinController {
	readonly #listeners = new Set<Listener>();
	readonly #state: InternalState;

	constructor(themeId: ThemeId = 'default') {
		this.#state = {
			themeId,
			snapshot: createSnapshot(),
			timers: [],
		};
	}

	get snapshot(): ControllerSnapshot {
		return this.#state.snapshot;
	}

	setTheme(themeId: ThemeId): void {
		this.#state.themeId = themeId;
		const theme = getTheme(themeId);
		this.#emit({
			message: `Theme switched to ${theme.name}.`,
		});
	}

	subscribe(listener: Listener): () => void {
		this.#listeners.add(listener);
		listener(this.#state.snapshot);
		return () => {
			this.#listeners.delete(listener);
		};
	}

	spin(options: SpinOptions = {}): void {
		const { staggerDelay = 96, forcedTone = 'random', forcedPlan } = options;
		const plan = forcedPlan ?? createSpinPlan(forcedTone);

		this.#clearTimers();
		this.#emit({
			symbolsMatrix: plan.matrix,
			isSpinning: Array.from({ length: REEL_COUNT }, () => true),
			stopPositions: plan.stopPositions,
			activeWinLines: [],
			outcomeTone: 'none',
			spinCount: this.#state.snapshot.spinCount + 1,
			lastWin: 0,
			lastScatterCount: plan.scatterCount,
			message: 'Reels spinning…',
		});

		for (let reelIndex = 0; reelIndex < REEL_COUNT; reelIndex += 1) {
			this.#state.timers.push(
				window.setTimeout(() => {
					const next = [...this.#state.snapshot.isSpinning];
					next[reelIndex] = false;
					this.#emit({ isSpinning: next });
				}, 520 + reelIndex * staggerDelay),
			);
		}

		this.#state.timers.push(
			window.setTimeout(() => {
				this.#emit({
					activeWinLines: plan.winLines,
					outcomeTone: plan.tone,
					lastWin: plan.totalWin,
					message: plan.message,
				});
			}, 520 + REEL_COUNT * staggerDelay + 640),
		);
	}

	stopNow(): void {
		this.#clearTimers();
		this.#emit({
			isSpinning: Array.from({ length: REEL_COUNT }, () => false),
			message: 'Reels stopped.',
		});
	}

	destroy(): void {
		this.#clearTimers();
		this.#listeners.clear();
	}

	#emit(patch: Partial<ControllerSnapshot>): void {
		this.#state.snapshot = {
			...this.#state.snapshot,
			...patch,
		};

		for (const listener of this.#listeners) {
			listener(this.#state.snapshot);
		}
	}

	#clearTimers(): void {
		for (const timer of this.#state.timers) {
			window.clearTimeout(timer);
		}

		this.#state.timers = [];
	}
}

function pickWeightedSymbol(): SymbolId {
	const totalWeight = SYMBOL_POOL.reduce((sum, item) => sum + item.weight, 0);
	let roll = Math.random() * totalWeight;

	for (const item of SYMBOL_POOL) {
		roll -= item.weight;
		if (roll <= 0) return item.id;
	}

	return 'low1';
}

function pickShowcaseSymbol(tone: SlotOutcomeTone, sequence: number): SymbolId {
	if (tone === 'big-win') {
		return (['high2', 'high1', 'wild', 'mid2'][sequence % 4] ?? 'high2') as SymbolId;
	}

	if (tone === 'win') {
		return (['mid2', 'high1', 'mid1'][sequence % 3] ?? 'mid2') as SymbolId;
	}

	return (['mid1', 'low4', 'mid2'][sequence % 3] ?? 'mid1') as SymbolId;
}

function shuffle<T>(items: T[]): T[] {
	const next = [...items];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[next[index], next[swapIndex]] = [next[swapIndex], next[index]];
	}

	return next;
}

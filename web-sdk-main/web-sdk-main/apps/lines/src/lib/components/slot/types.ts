export type ThemeId = 'default' | 'fantasy' | 'neon' | 'classic-fruit';

export type SymbolId =
	| 'low1'
	| 'low2'
	| 'low3'
	| 'low4'
	| 'mid1'
	| 'mid2'
	| 'high1'
	| 'high2'
	| 'wild'
	| 'scatter'
	| 'mult2'
	| 'mult3';

export type SymbolKind = 'regular' | 'wild' | 'scatter' | 'multiplier';

export type ReelVisualState = 'idle' | 'spinning' | 'stopping' | 'landing';

export type SlotOutcomeTone = 'none' | 'line' | 'win' | 'big-win' | 'scatter';

export type Matrix<T> = T[][];

export type GridPosition = {
	row: number;
	column: number;
};

export type WinLine = {
	id: string;
	label?: string;
	payout?: number;
	color?: string;
	glowColor?: string;
	positions: GridPosition[];
	tone?: SlotOutcomeTone;
};

export type UiColors = {
	text: string;
	textSoft: string;
	accent: string;
	accentAlt: string;
	button: string;
	buttonText: string;
	danger: string;
	success: string;
	panel: string;
	panelBorder: string;
};

export type ThemeSymbol = {
	id: SymbolId;
	label: string;
	kind: SymbolKind;
	svg: string;
	color: string;
	glowColor?: string;
	textColor?: string;
};

export type SlotTheme = {
	id: ThemeId;
	name: string;
	description: string;
	background: string;
	backgroundAccent: string;
	frameImage?: string;
	reelBackground: string;
	reelBorder: string;
	reelGlass: string;
	gridGlow: string;
	thumbnail: string;
	uiColors: UiColors;
	soundBank: {
		spin: string;
		stop: string;
		win: string;
		bigWin: string;
		scatter: string;
	};
	symbolMap: Record<SymbolId, ThemeSymbol>;
};

export type ReelGridProps = {
	symbolsMatrix: Matrix<SymbolId>;
	isSpinning: boolean[];
	stopPositions: number[];
	visibleRows?: number;
	reelCount?: number;
	staggerDelay?: number;
};

export type HudValue = {
	label: string;
	value: string;
	helper?: string;
};

export type SlotHudModel = {
	balance: number;
	totalBet: number;
	betPerLine: number;
	lines: number;
	lastWin: number;
	autoSpins: number;
	canAdjustBet: boolean;
	canSpin: boolean;
	isSpinning: boolean;
	stopMode: boolean;
	maxBet: number;
};

export type ControllerSnapshot = {
	symbolsMatrix: Matrix<SymbolId>;
	isSpinning: boolean[];
	stopPositions: number[];
	activeWinLines: WinLine[];
	outcomeTone: SlotOutcomeTone;
	spinCount: number;
	lastWin: number;
	lastScatterCount: number;
	message: string;
};

export type SpinPlan = {
	matrix: Matrix<SymbolId>;
	winLines: WinLine[];
	tone: SlotOutcomeTone;
	totalWin: number;
	scatterCount: number;
	message: string;
	stopPositions: number[];
};

export type SlotPerformanceHints = {
	virtualized: boolean;
	willChangeEnabled: boolean;
	requestAnimationFrameDriven: boolean;
};

export const REEL_COUNT = 5;
export const VISIBLE_ROWS = 5;

export const DEFAULT_SYMBOL_ORDER: SymbolId[] = [
	'low1',
	'low2',
	'low3',
	'low4',
	'mid1',
	'mid2',
	'high1',
	'high2',
	'wild',
	'scatter',
	'mult2',
	'mult3',
];

export const DEFAULT_PAYLINES: number[][] = [
	[0, 0, 0, 0, 0],
	[1, 1, 1, 1, 1],
	[2, 2, 2, 2, 2],
	[3, 3, 3, 3, 3],
	[4, 4, 4, 4, 4],
	[0, 1, 2, 1, 0],
	[4, 3, 2, 3, 4],
	[1, 2, 3, 2, 1],
	[3, 2, 1, 2, 3],
	[0, 1, 1, 1, 0],
];

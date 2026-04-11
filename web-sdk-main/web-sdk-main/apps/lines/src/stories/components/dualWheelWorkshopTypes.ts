export type SymbolTier = 'gold' | 'silver' | 'wood' | 'wheel' | 'bonus';

export type SymbolId =
	| 'crown'
	| 'scepter'
	| 'wolf'
	| 'ankh'
	| 'helmet'
	| 'sunDisc'
	| 'axes'
	| 'runeA'
	| 'runeB'
	| 'runeC'
	| 'runeD'
	| 'runeE'
	| 'runeF'
	| 'scatter'
	| 'blueWheel'
	| 'redWheel';

export type RegularSymbolId = Exclude<SymbolId, 'blueWheel' | 'redWheel' | 'scatter'>;

export type ReelState = 'idle' | 'spinning' | 'braking' | 'landing';

export type RoundState = 'idle' | 'spinning' | 'showingLines' | 'countingWin';

export type SpinMood = 'dead' | 'base' | 'feature' | 'big';

export type BonusMode = 'regular' | 'super';

export type LineTone = 'small' | 'medium' | 'big';

export type ReelAnticipation = 'none' | 'premium' | 'wheel';

export type WheelPhase =
	| 'blue-spinning'
	| 'blue-locked'
	| 'red-outer-spinning'
	| 'red-outer-locked'
	| 'red-inner-spinning'
	| 'red-locked';

export type Position = { row: number; column: number };

export type Point = { x: number; y: number };

export type WheelAward =
	| { type: 'blue'; value: number }
	| { type: 'red'; outer: number; inner: number };

export type BonusTrigger = {
	mode: BonusMode;
	count: number;
	positions: Position[];
};

export type Scenario = {
	key: string;
	label: string;
	note: string;
	bet: number;
	board: SymbolId[][];
	wheelResults: Record<string, WheelAward>;
};

export type LineResult = {
	lineNumber: number;
	rows: number[];
	symbol: RegularSymbolId;
	matchCount: number;
	baseMultiplier: number;
	bonusMultiplier: number;
	totalMultiplier: number;
	payout: number;
	positions: Position[];
	wheels: Array<Position & { type: 'blue' | 'red'; total: number; outer?: number; inner?: number }>;
};

export type ActiveWheelState = Position & {
	type: 'blue' | 'red';
	phase: WheelPhase;
	total: number;
	outer?: number;
	inner?: number;
	blueIndex?: number;
	outerIndex?: number;
	innerIndex?: number;
};

export type ResolvedWheelState = Position & {
	type: 'blue' | 'red';
	total: number;
	outer?: number;
	inner?: number;
};

export type LockedCellState = {
	locked: boolean;
	multiplierValue: number | null;
	symbol: SymbolId | null;
	type: 'blue' | 'red' | null;
	outer?: number | null;
	inner?: number | null;
};

export type WheelResultBurst = Position & {
	id: number;
	type: 'blue' | 'red';
	total: number;
	outer?: number;
	inner?: number;
	sticky?: boolean;
};

export type TimingConfig = {
	reelInterval: number;
	reelStopBase: number;
	reelStopStep: number;
	landing: number;
	resolveDelay: number;
	lineIntro: number;
	lineHold: number;
	lineGap: number;
	blueResolve: number;
	blueLocked: number;
	redOuterResolve: number;
	redOuterLocked: number;
	redInnerResolve: number;
	redLocked: number;
	totalWinCount: number;
	totalWinHold: number;
	autoplayPause: number;
};

export type AudioCueImportance = 'ambient' | 'light' | 'feature' | 'big';

export type AudioCueDetail = {
	cue: string;
	timestamp: number;
	spin: number;
	roundState: RoundState;
	mood: SpinMood;
	importance: AudioCueImportance;
	payload: Record<string, string | number | boolean | null>;
};

export type SymbolMeta = {
	label: string;
	short: string;
	flavor: string;
	tier: SymbolTier;
	background: string;
	glow: string;
	frame: string;
	kind: 'regular' | 'wheel' | 'bonus';
};

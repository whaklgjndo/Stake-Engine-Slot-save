import {
	BLUE_WHEEL_VALUES,
	BLUE_WHEEL_WEIGHTS,
	RED_INNER_WHEEL_VALUES,
	RED_INNER_WHEEL_WEIGHTS,
	RED_OUTER_WHEEL_VALUES,
	RED_OUTER_WHEEL_WEIGHTS,
} from './wheelValues.ts';
import type {
	BonusMode,
	ReelState,
	RegularSymbolId,
	Scenario,
	SymbolId,
	SymbolMeta,
} from './dualWheelWorkshopTypes.ts';

export const REELS = 5;
export const ROWS = 5;
export const SIZE = 104;
export const GAP = 12;
export const BOARD_PADDING = 12;
export const BOARD_W = REELS * SIZE + (REELS - 1) * GAP;
export const BOARD_H = ROWS * SIZE + (ROWS - 1) * GAP;
export const WHEEL_SEGMENT_ANGLE = 360 / BLUE_WHEEL_VALUES.length;
export const BLUE_WHEEL_SEGMENTS = BLUE_WHEEL_VALUES;
export const RED_OUTER_SEGMENTS = RED_OUTER_WHEEL_VALUES;
export const RED_INNER_SEGMENTS = RED_INNER_WHEEL_VALUES;
export const BLUE_WHEEL_SEGMENT_WEIGHTS = BLUE_WHEEL_WEIGHTS;
export const RED_OUTER_SEGMENT_WEIGHTS = RED_OUTER_WHEEL_WEIGHTS;
export const RED_INNER_SEGMENT_WEIGHTS = RED_INNER_WHEEL_WEIGHTS;
type WheelProfileConfig = {
	blueKeepChance: number;
	redKeepChance: number;
	maxBluePerBoard: number;
	maxRedPerBoard: number;
	injectAnywhere?: boolean;
	blueAdditionalCountWeights?: readonly number[];
	redAdditionalCountWeights?: readonly number[];
};

export const LIVE_BASE_GAME_WHEEL_PROFILE = {
	blueKeepChance: 0.268,
	redKeepChance: 0.06,
	maxBluePerBoard: 2,
	maxRedPerBoard: 1,
} as const satisfies WheelProfileConfig;
export const PREVIEW_BONUS_BUY_MULTIPLIERS = {
	regular: 40,
	super: 100,
} as const;
export const BONUS_ROUND_CONFIG: Record<
	BonusMode,
	{
		freeSpins: number;
		triggerChance: number;
		stickyWheels: boolean;
		wheelProfile: WheelProfileConfig;
	}
> = {
	regular: {
		freeSpins: 10,
		triggerChance: 0.00018,
		stickyWheels: false,
		wheelProfile: {
			blueKeepChance: 0.32,
			redKeepChance: 0.075,
			maxBluePerBoard: 3,
			maxRedPerBoard: 1,
			injectAnywhere: true,
			blueAdditionalCountWeights: [14, 12, 5, 1],
			redAdditionalCountWeights: [30, 2, 1],
		},
	},
	super: {
		freeSpins: 10,
		triggerChance: 0.00001,
		stickyWheels: true,
		wheelProfile: {
			blueKeepChance: 0.52,
			redKeepChance: 0.18,
			maxBluePerBoard: 7,
			maxRedPerBoard: 2,
			injectAnywhere: true,
			blueAdditionalCountWeights: [3, 8, 9, 6, 3, 1],
			redAdditionalCountWeights: [12, 7, 2, 1],
		},
	},
} as const;

const crownAsset = new URL('../assets/symbol-crown.png', import.meta.url).href;
const scepterAsset = new URL('../assets/symbol-scepter.png', import.meta.url).href;
const wolfAsset = new URL('../assets/symbol-wolf.png', import.meta.url).href;
const ankhAsset = new URL('../assets/symbol-ankh.png', import.meta.url).href;
const helmetAsset = new URL('../assets/symbol-helmet.png', import.meta.url).href;
const sunDiscAsset = new URL('../assets/symbol-sun-disc.png', import.meta.url).href;
const axesAsset = new URL('../assets/symbol-axes.png', import.meta.url).href;
const runeAAsset = new URL('../assets/symbol-rune-a.png', import.meta.url).href;
const runeBAsset = new URL('../assets/symbol-rune-b.png', import.meta.url).href;
const runeCAsset = new URL('../assets/symbol-rune-c.png', import.meta.url).href;
const runeDAsset = new URL('../assets/symbol-rune-d.png', import.meta.url).href;
const runeEAsset = new URL('../assets/symbol-rune-e.png', import.meta.url).href;
const runeFAsset = new URL('../assets/symbol-rune-f.png', import.meta.url).href;
const blueWheelSymbolAsset = new URL('../assets/blue-wheel-symbol.png', import.meta.url).href;
const redDualWheelSymbolAsset = new URL('../assets/red-dual-wheel-symbol.png', import.meta.url)
	.href;

export const regularSymbols: RegularSymbolId[] = [
	'crown',
	'wolf',
	'sunDisc',
	'scepter',
	'ankh',
	'axes',
	'helmet',
	'runeA',
	'runeB',
	'runeC',
	'runeD',
	'runeE',
	'runeF',
];

export const symbolArtAssets: Record<RegularSymbolId, string> = {
	crown: crownAsset,
	scepter: scepterAsset,
	wolf: wolfAsset,
	ankh: ankhAsset,
	helmet: helmetAsset,
	sunDisc: sunDiscAsset,
	axes: axesAsset,
	runeA: runeAAsset,
	runeB: runeBAsset,
	runeC: runeCAsset,
	runeD: runeDAsset,
	runeE: runeEAsset,
	runeF: runeFAsset,
};

export const wheelSymbolAssets: Record<'blueWheel' | 'redWheel', string> = {
	blueWheel: blueWheelSymbolAsset,
	redWheel: redDualWheelSymbolAsset,
};

export const symbolMeta: Record<SymbolId, SymbolMeta> = {
	crown: {
		label: 'Crown',
		short: 'CR',
		flavor: 'gold symbol',
		tier: 'gold',
		background: 'linear-gradient(145deg,#6f4208,#b27613 48%,#f7d977)',
		glow: 'rgba(255,211,112,.66)',
		frame: '#ffe29f',
		kind: 'regular',
	},
	scepter: {
		label: 'Scepter',
		short: 'SC',
		flavor: 'silver symbol',
		tier: 'silver',
		background: 'linear-gradient(145deg,#253344,#4a617d 48%,#b1becd)',
		glow: 'rgba(211,224,238,.44)',
		frame: '#ecf2f7',
		kind: 'regular',
	},
	wolf: {
		label: 'Wolf',
		short: 'WF',
		flavor: 'gold symbol',
		tier: 'gold',
		background: 'linear-gradient(145deg,#76490d,#b57416 48%,#edb85f)',
		glow: 'rgba(248,210,140,.58)',
		frame: '#f4d59c',
		kind: 'regular',
	},
	ankh: {
		label: 'Ankh',
		short: 'AK',
		flavor: 'silver symbol',
		tier: 'silver',
		background: 'linear-gradient(145deg,#243242,#51657d 48%,#aebdcb)',
		glow: 'rgba(206,223,238,.46)',
		frame: '#e9f0f6',
		kind: 'regular',
	},
	helmet: {
		label: 'Helmet',
		short: 'HM',
		flavor: 'silver symbol',
		tier: 'silver',
		background: 'linear-gradient(145deg,#263345,#4e6580 48%,#aebdcc)',
		glow: 'rgba(204,220,236,.42)',
		frame: '#e8eff5',
		kind: 'regular',
	},
	sunDisc: {
		label: 'Sun Disc',
		short: 'SD',
		flavor: 'gold symbol',
		tier: 'gold',
		background: 'linear-gradient(145deg,#72470d,#b97816 48%,#f0c460)',
		glow: 'rgba(248,205,110,.62)',
		frame: '#f8dd9b',
		kind: 'regular',
	},
	axes: {
		label: 'Axes',
		short: 'AX',
		flavor: 'silver symbol',
		tier: 'silver',
		background: 'linear-gradient(145deg,#243241,#51657e 48%,#afbcc8)',
		glow: 'rgba(205,220,235,.42)',
		frame: '#e7edf3',
		kind: 'regular',
	},
	runeA: {
		label: 'Rune F',
		short: 'RF',
		flavor: 'wood symbol',
		tier: 'wood',
		background: 'linear-gradient(145deg,#5d3413,#824f20 48%,#b7783a)',
		glow: 'rgba(218,159,92,.36)',
		frame: '#d4965d',
		kind: 'regular',
	},
	runeB: {
		label: 'Rune O',
		short: 'RO',
		flavor: 'wood symbol',
		tier: 'wood',
		background: 'linear-gradient(145deg,#593210,#7d4a1c 48%,#aa6f34)',
		glow: 'rgba(211,151,85,.34)',
		frame: '#ca8f56',
		kind: 'regular',
	},
	runeC: {
		label: 'Rune P',
		short: 'RP',
		flavor: 'wood symbol',
		tier: 'wood',
		background: 'linear-gradient(145deg,#5b3414,#865023 48%,#b6773b)',
		glow: 'rgba(216,157,90,.34)',
		frame: '#d19458',
		kind: 'regular',
	},
	runeD: {
		label: 'Rune S',
		short: 'RS',
		flavor: 'wood symbol',
		tier: 'wood',
		background: 'linear-gradient(145deg,#5b3515,#815022 48%,#ad7140)',
		glow: 'rgba(212,154,93,.34)',
		frame: '#cb8e57',
		kind: 'regular',
	},
	runeE: {
		label: 'Rune H',
		short: 'RH',
		flavor: 'wood symbol',
		tier: 'wood',
		background: 'linear-gradient(145deg,#553012,#7a481c 48%,#a96d36)',
		glow: 'rgba(206,148,83,.32)',
		frame: '#c5864f',
		kind: 'regular',
	},
	runeF: {
		label: 'Rune X',
		short: 'RX',
		flavor: 'wood symbol',
		tier: 'wood',
		background: 'linear-gradient(145deg,#5d3416,#825024 48%,#aa6d39)',
		glow: 'rgba(209,150,87,.34)',
		frame: '#c98b52',
		kind: 'regular',
	},
	blueWheel: {
		label: 'Blue Wheel',
		short: 'BW',
		flavor: 'wild wheel',
		tier: 'wheel',
		background: 'linear-gradient(145deg,#071430,#112658 55%,#1d4ec7)',
		glow: 'rgba(68,129,255,.7)',
		frame: '#c3d9ff',
		kind: 'wheel',
	},
	redWheel: {
		label: 'Red Wheel',
		short: 'RW',
		flavor: 'wild wheel',
		tier: 'wheel',
		background: 'linear-gradient(145deg,#300806,#5c1411 55%,#bb2a1b)',
		glow: 'rgba(255,94,68,.72)',
		frame: '#ffd8cc',
		kind: 'wheel',
	},
};

export const paytable: Record<RegularSymbolId, Record<number, number>> = {
	crown: { 3: 5.66, 4: 13.4, 5: 27.87 },
	wolf: { 3: 5.16, 4: 12.36, 5: 24.75 },
	sunDisc: { 3: 4.66, 4: 11.32, 5: 22.71 },
	scepter: { 3: 3.52, 4: 9.28, 5: 18.01 },
	ankh: { 3: 3.12, 4: 8.44, 5: 15.97 },
	axes: { 3: 2.72, 4: 7.2, 5: 13.6 },
	helmet: { 3: 2.38, 4: 6.3, 5: 11.56 },
	runeA: { 3: 1.68, 4: 4.56, 5: 8.08 },
	runeB: { 3: 1.58, 4: 4.32, 5: 7.48 },
	runeC: { 3: 1.48, 4: 4.12, 5: 6.94 },
	runeD: { 3: 1.38, 4: 3.82, 5: 6.34 },
	runeE: { 3: 1.28, 4: 3.42, 5: 5.44 },
	runeF: { 3: 1.28, 4: 3.62, 5: 5.84 },
};

export const reelStrips: SymbolId[][] = [
	[
		'runeA',
		'helmet',
		'runeB',
		'crown',
		'runeC',
		'ankh',
		'runeD',
		'scepter',
		'runeE',
		'blueWheel',
		'runeF',
		'sunDisc',
		'runeA',
		'wolf',
		'runeA',
		'axes',
		'runeF',
		'runeB',
		'helmet',
		'runeC',
		'ankh',
		'runeD',
		'crown',
		'runeE',
		'sunDisc',
		'runeF',
		'wolf',
		'runeA',
		'scepter',
		'redWheel',
		'runeA',
		'runeF',
	],
	[
		'runeB',
		'ankh',
		'runeC',
		'runeF',
		'runeD',
		'helmet',
		'runeE',
		'crown',
		'runeF',
		'sunDisc',
		'blueWheel',
		'runeA',
		'axes',
		'runeA',
		'wolf',
		'runeB',
		'helmet',
		'scepter',
		'runeC',
		'ankh',
		'runeD',
		'runeF',
		'runeE',
		'redWheel',
		'runeF',
		'crown',
		'runeA',
		'sunDisc',
		'runeA',
		'wolf',
		'runeB',
		'axes',
	],
	[
		'runeC',
		'sunDisc',
		'runeD',
		'wolf',
		'runeE',
		'ankh',
		'runeF',
		'crown',
		'runeA',
		'helmet',
		'runeA',
		'runeF',
		'blueWheel',
		'runeB',
		'axes',
		'runeC',
		'scepter',
		'runeD',
		'sunDisc',
		'runeE',
		'ankh',
		'runeF',
		'redWheel',
		'runeA',
		'wolf',
		'runeA',
		'crown',
		'runeB',
		'helmet',
		'runeC',
		'runeF',
		'axes',
	],
	[
		'runeD',
		'axes',
		'runeE',
		'scepter',
		'runeF',
		'sunDisc',
		'runeA',
		'crown',
		'runeA',
		'helmet',
		'blueWheel',
		'runeB',
		'ankh',
		'runeC',
		'wolf',
		'runeD',
		'runeF',
		'runeE',
		'axes',
		'runeF',
		'helmet',
		'runeA',
		'redWheel',
		'runeA',
		'scepter',
		'runeB',
		'crown',
		'runeC',
		'sunDisc',
		'runeD',
		'wolf',
		'ankh',
	],
	[
		'runeE',
		'helmet',
		'runeF',
		'wolf',
		'runeA',
		'ankh',
		'runeA',
		'runeF',
		'runeB',
		'sunDisc',
		'blueWheel',
		'runeC',
		'axes',
		'runeD',
		'crown',
		'runeE',
		'scepter',
		'runeF',
		'helmet',
		'runeA',
		'redWheel',
		'runeA',
		'ankh',
		'runeB',
		'wolf',
		'runeC',
		'runeF',
		'runeD',
		'sunDisc',
		'runeE',
		'crown',
		'axes',
	],
];

export const paylines = [
	[0, 0, 0, 0, 0],
	[1, 1, 1, 1, 1],
	[2, 2, 2, 2, 2],
	[3, 3, 3, 3, 3],
	[4, 4, 4, 4, 4],
	[0, 1, 2, 1, 0],
	[4, 3, 2, 3, 4],
	[1, 2, 3, 2, 1],
	[3, 2, 1, 2, 3],
	[0, 0, 1, 2, 3],
	[4, 4, 3, 2, 1],
	[1, 1, 2, 3, 3],
	[3, 3, 2, 1, 1],
	[0, 1, 1, 1, 0],
	[4, 3, 3, 3, 4],
] as const;

function minMax(values: readonly number[]) {
	return {
		min: Math.min(...values),
		max: Math.max(...values),
	};
}

function cellKey(row: number, column: number): string {
	return `${row}-${column}`;
}

function deriveBaseGameMaxRoundMultiplier({
	baseMultiplier,
	blueValue,
	redValue,
	maxBlue,
	maxRed,
}: {
	baseMultiplier: number;
	blueValue: number;
	redValue: number;
	maxBlue: number;
	maxRed: number;
}): number {
	const positions = Array.from({ length: ROWS * REELS }, (_, index) => ({
		row: Math.floor(index / REELS),
		column: index % REELS,
	}));

	let best = 0;

	for (const redPosition of maxRed > 0 ? positions : [null]) {
		for (let blueIndexA = 0; blueIndexA < positions.length; blueIndexA += 1) {
			for (let blueIndexB = blueIndexA + 1; blueIndexB < positions.length; blueIndexB += 1) {
				const wheelMap = new Map<string, number>();

				if (redPosition) {
					wheelMap.set(cellKey(redPosition.row, redPosition.column), redValue);
				}

				if (maxBlue > 0) {
					const blueA = positions[blueIndexA];
					const blueB = positions[blueIndexB];
					if (wheelMap.has(cellKey(blueA.row, blueA.column))) continue;
					if (wheelMap.has(cellKey(blueB.row, blueB.column))) continue;
					wheelMap.set(cellKey(blueA.row, blueA.column), blueValue);
					if (maxBlue > 1) {
						wheelMap.set(cellKey(blueB.row, blueB.column), blueValue);
					}
				}

				let total = 0;
				for (const line of paylines) {
					let lineBonus = 0;
					for (const [columnIndex, rowIndex] of line.entries()) {
						lineBonus += wheelMap.get(cellKey(rowIndex, columnIndex)) ?? 0;
					}
					total += baseMultiplier + lineBonus;
				}

				best = Math.max(best, total);
			}
		}
	}

	return best;
}

const highestFiveOfAKind = Math.max(...regularSymbols.map((symbol) => paytable[symbol][5] ?? 0));

export const STAKE_APPROVAL_RTP_BAND = {
	min: 0.9,
	max: 0.98,
} as const;
export const DESIGN_RTP_TARGET = 0.95;
export const PRODUCT_MAX_WIN_TARGET = 10000;
export const BLUE_WHEEL_RANGE = minMax(BLUE_WHEEL_VALUES);
export const RED_OUTER_WHEEL_RANGE = minMax(RED_OUTER_WHEEL_VALUES);
export const RED_INNER_WHEEL_RANGE = minMax(RED_INNER_WHEEL_VALUES);
export const RED_FINAL_WHEEL_RANGE = {
	min: RED_OUTER_WHEEL_RANGE.min * RED_INNER_WHEEL_RANGE.min,
	max: RED_OUTER_WHEEL_RANGE.max * RED_INNER_WHEEL_RANGE.max,
} as const;
export const BASE_GAME_THEORETICAL_MAX_ROUND_MULTIPLIER = deriveBaseGameMaxRoundMultiplier({
	baseMultiplier: highestFiveOfAKind,
	blueValue: BLUE_WHEEL_RANGE.max,
	redValue: RED_FINAL_WHEEL_RANGE.max,
	maxBlue: LIVE_BASE_GAME_WHEEL_PROFILE.maxBluePerBoard,
	maxRed: LIVE_BASE_GAME_WHEEL_PROFILE.maxRedPerBoard,
});

export const scenarios: Scenario[] = [
	{
		key: 'dead-spin',
		label: 'Dead Spin',
		note: 'Reel motion only.',
		bet: 1,
		board: [
			['crown', 'runeA', 'helmet', 'runeB', 'runeF'],
			['ankh', 'wolf', 'runeC', 'sunDisc', 'runeD'],
			['scepter', 'runeE', 'axes', 'runeF', 'crown'],
			['runeA', 'helmet', 'runeF', 'runeA', 'wolf'],
			['sunDisc', 'runeB', 'ankh', 'runeC', 'scepter'],
		],
		wheelResults: {},
	},
	{
		key: 'line-hit',
		label: 'Line Hit',
		note: 'Single clean 5OAK line.',
		bet: 1,
		board: [
			['runeA', 'helmet', 'runeB', 'sunDisc', 'runeC'],
			['ankh', 'runeD', 'wolf', 'runeE', 'axes'],
			['crown', 'crown', 'crown', 'crown', 'crown'],
			['runeF', 'runeF', 'helmet', 'runeA', 'scepter'],
			['runeB', 'ankh', 'runeC', 'sunDisc', 'wolf'],
		],
		wheelResults: {},
	},
	{
		key: 'blue-wheel',
		label: 'Blue Wheel',
		note: 'Blue wheel adds one bonus multiplier.',
		bet: 1,
		board: [
			['crown', 'helmet', 'runeA', 'ankh', 'wolf'],
			['runeF', 'runeF', 'blueWheel', 'runeF', 'runeF'],
			['runeB', 'sunDisc', 'runeC', 'axes', 'runeD'],
			['scepter', 'runeE', 'helmet', 'runeF', 'crown'],
			['wolf', 'runeA', 'ankh', 'runeA', 'sunDisc'],
		],
		wheelResults: { '1-2': { type: 'blue', value: 20 } },
	},
	{
		key: 'red-wheel',
		label: 'Red Wheel',
		note: 'Outer then inner spin.',
		bet: 1,
		board: [
			['runeA', 'crown', 'helmet', 'runeB', 'runeF'],
			['ankh', 'sunDisc', 'runeC', 'axes', 'runeD'],
			['wolf', 'redWheel', 'wolf', 'wolf', 'wolf'],
			['scepter', 'runeE', 'helmet', 'runeF', 'crown'],
			['runeA', 'runeF', 'ankh', 'runeA', 'sunDisc'],
		],
		wheelResults: { '2-1': { type: 'red', outer: 20, inner: 3 } },
	},
	{
		key: 'combo-wheels',
		label: 'Combo Wheels',
		note: 'Blue and red in one round.',
		bet: 1,
		board: [
			['crown', 'runeA', 'helmet', 'runeB', 'runeF'],
			['scepter', 'blueWheel', 'scepter', 'scepter', 'scepter'],
			['wolf', 'redWheel', 'wolf', 'wolf', 'wolf'],
			['ankh', 'runeC', 'sunDisc', 'runeD', 'axes'],
			['runeE', 'helmet', 'runeF', 'crown', 'runeA'],
		],
		wheelResults: {
			'1-1': { type: 'blue', value: 15 },
			'2-1': { type: 'red', outer: 10, inner: 2 },
		},
	},
	{
		key: 'fifty-plus',
		label: '50x Celebration',
		note: 'Forces the total-win count-up.',
		bet: 1,
		board: [
			['crown', 'crown', 'crown', 'crown', 'crown'],
			['scepter', 'blueWheel', 'scepter', 'scepter', 'scepter'],
			['runeF', 'redWheel', 'runeF', 'runeF', 'runeF'],
			['wolf', 'blueWheel', 'wolf', 'wolf', 'wolf'],
			['ankh', 'helmet', 'sunDisc', 'axes', 'runeA'],
		],
		wheelResults: {
			'1-1': { type: 'blue', value: 20 },
			'2-1': { type: 'red', outer: 20, inner: 5 },
			'3-1': { type: 'blue', value: 15 },
		},
	},
];

export const reelStatesDefault: ReelState[] = Array(REELS).fill('idle');
export const autoplayPresets = [10, 25, 50, 100] as const;

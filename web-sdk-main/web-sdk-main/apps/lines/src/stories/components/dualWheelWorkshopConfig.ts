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

export const LIVE_BASE_GAME_BONUS_SEAL_WEIGHTS = [98840, 920, 190, 45, 5] as const;

export const PREVIEW_BONUS_BUY_MULTIPLIERS = {
	regular: 20.2,
	super: 532,
} as const;

export const BONUS_ROUND_CONFIG: Record<
	BonusMode,
	{
		freeSpins: number;
		triggerCount: number;
		stickyWheels: boolean;
		wheelProfile: WheelProfileConfig;
	}
> = {
	regular: {
		freeSpins: 10,
		triggerCount: 3,
		stickyWheels: false,
		wheelProfile: {
			blueKeepChance: 0.27,
			redKeepChance: 0.055,
			maxBluePerBoard: 2,
			maxRedPerBoard: 1,
			injectAnywhere: true,
			blueAdditionalCountWeights: [20, 10, 3, 1],
			redAdditionalCountWeights: [38, 2, 1],
		},
	},
	super: {
		freeSpins: 10,
		triggerCount: 4,
		stickyWheels: true,
		wheelProfile: {
			blueKeepChance: 0.36,
			redKeepChance: 0.1,
			maxBluePerBoard: 5,
			maxRedPerBoard: 1,
			injectAnywhere: true,
			blueAdditionalCountWeights: [10, 12, 8, 4, 1, 0],
			redAdditionalCountWeights: [20, 5, 1, 0],
		},
	},
} as const;

const crownAsset = new URL('../assets/reference-fantasy/crown.svg', import.meta.url).href;
const scepterAsset = new URL('../assets/symbol-scepter.png', import.meta.url).href;
const wolfAsset = new URL('../assets/symbol-wolf.png', import.meta.url).href;
const ankhAsset = new URL('../assets/symbol-ankh.png', import.meta.url).href;
const helmetAsset = new URL('../assets/reference-fantasy/helmet.svg', import.meta.url).href;
const sunDiscAsset = new URL('../assets/reference-fantasy/sun-disc.svg', import.meta.url).href;
const axesAsset = new URL('../assets/symbol-axes.png', import.meta.url).href;
const runeAAsset = new URL('../assets/symbol-rune-a.png', import.meta.url).href;
const runeBAsset = new URL('../assets/symbol-rune-b.png', import.meta.url).href;
const runeCAsset = new URL('../assets/symbol-rune-c.png', import.meta.url).href;
const runeDAsset = new URL('../assets/symbol-rune-d.png', import.meta.url).href;
const runeEAsset = new URL('../assets/symbol-rune-e.png', import.meta.url).href;
const runeFAsset = new URL('../assets/symbol-rune-f.png', import.meta.url).href;
const scatterAsset = new URL('../assets/reference-fantasy/scatter.svg', import.meta.url).href;
const blueWheelSymbolAsset = new URL(
	'../assets/reference-fantasy/blue-wheel-symbol.svg',
	import.meta.url,
).href;
const redDualWheelSymbolAsset = new URL(
	'../assets/reference-fantasy/red-dual-wheel-symbol.svg',
	import.meta.url,
).href;

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

export const bonusSymbolAssets: Record<'scatter', string> = {
	scatter: scatterAsset,
};

export const symbolMeta: Record<SymbolId, SymbolMeta> = {
	crown: {
		label: 'Crown',
		short: 'CR',
		flavor: 'royal premium',
		tier: 'gold',
		background: 'linear-gradient(145deg,#5f3210,#a86a1c 52%,#f2d28c)',
		glow: 'rgba(255,214,132,.62)',
		frame: '#f8e0a3',
		kind: 'regular',
	},
	scepter: {
		label: 'Royal Scepter',
		short: 'SC',
		flavor: 'royal relic',
		tier: 'gold',
		background: 'linear-gradient(145deg,#5a3312,#986220 52%,#e7c57c)',
		glow: 'rgba(255,220,150,.52)',
		frame: '#f1d79b',
		kind: 'regular',
	},
	wolf: {
		label: 'Heraldic Wolf',
		short: 'WF',
		flavor: 'crest premium',
		tier: 'gold',
		background: 'linear-gradient(145deg,#17304b,#274a74 52%,#c0d6f6)',
		glow: 'rgba(122,187,255,.52)',
		frame: '#e7f1ff',
		kind: 'regular',
	},
	ankh: {
		label: 'Sanctum Sigil',
		short: 'SG',
		flavor: 'vault relic',
		tier: 'silver',
		background: 'linear-gradient(145deg,#1d2638,#344868 52%,#c8d5ea)',
		glow: 'rgba(196,220,255,.4)',
		frame: '#edf3fb',
		kind: 'regular',
	},
	helmet: {
		label: 'Knight Helm',
		short: 'HM',
		flavor: 'museum relic',
		tier: 'silver',
		background: 'linear-gradient(145deg,#182436,#2a4265 52%,#b9ccea)',
		glow: 'rgba(130,194,255,.42)',
		frame: '#eaf2fb',
		kind: 'regular',
	},
	sunDisc: {
		label: 'Solar Seal',
		short: 'SD',
		flavor: 'royal medallion',
		tier: 'gold',
		background: 'linear-gradient(145deg,#693e10,#b9791d 52%,#f0cd74)',
		glow: 'rgba(255,211,110,.6)',
		frame: '#f8e19a',
		kind: 'regular',
	},
	axes: {
		label: 'Twin Axes',
		short: 'AX',
		flavor: 'armory relic',
		tier: 'silver',
		background: 'linear-gradient(145deg,#1a2434,#364868 52%,#c3cfdf)',
		glow: 'rgba(166,210,255,.42)',
		frame: '#e9eff8',
		kind: 'regular',
	},
	runeA: {
		label: 'Rune Ember',
		short: 'RE',
		flavor: 'amber rune',
		tier: 'wood',
		background: 'linear-gradient(145deg,#553012,#824c1f 52%,#c17b40)',
		glow: 'rgba(255,176,96,.34)',
		frame: '#dc9c63',
		kind: 'regular',
	},
	runeB: {
		label: 'Rune Tide',
		short: 'RT',
		flavor: 'azure rune',
		tier: 'wood',
		background: 'linear-gradient(145deg,#24344a,#35557b 52%,#7cb2f1)',
		glow: 'rgba(118,188,255,.3)',
		frame: '#a8cbf7',
		kind: 'regular',
	},
	runeC: {
		label: 'Rune Stone',
		short: 'RS',
		flavor: 'shield rune',
		tier: 'wood',
		background: 'linear-gradient(145deg,#583414,#845120 52%,#bf8a4b)',
		glow: 'rgba(224,186,100,.3)',
		frame: '#d5a15c',
		kind: 'regular',
	},
	runeD: {
		label: 'Rune Gale',
		short: 'RG',
		flavor: 'pale rune',
		tier: 'wood',
		background: 'linear-gradient(145deg,#31334d,#565878 52%,#c4c8de)',
		glow: 'rgba(216,222,240,.28)',
		frame: '#d8dcef',
		kind: 'regular',
	},
	runeE: {
		label: 'Rune Oath',
		short: 'RO',
		flavor: 'sanctum rune',
		tier: 'wood',
		background: 'linear-gradient(145deg,#5b3414,#88511f 52%,#c69046)',
		glow: 'rgba(255,216,111,.28)',
		frame: '#e0ab5b',
		kind: 'regular',
	},
	runeF: {
		label: 'Rune Night',
		short: 'RN',
		flavor: 'midnight rune',
		tier: 'wood',
		background: 'linear-gradient(145deg,#26364a,#3b5a7e 52%,#86b8ef)',
		glow: 'rgba(118,188,255,.28)',
		frame: '#a9cbf6',
		kind: 'regular',
	},
	scatter: {
		label: 'Throne Scatter',
		short: 'SC',
		flavor: 'scatter crest',
		tier: 'bonus',
		background: 'linear-gradient(145deg,#5a2410,#923713 50%,#efb24c)',
		glow: 'rgba(255,183,78,.72)',
		frame: '#ffd590',
		kind: 'bonus',
	},
	blueWheel: {
		label: 'Blue Wheel',
		short: 'BW',
		flavor: 'moon wheel',
		tier: 'wheel',
		background: 'linear-gradient(145deg,#081731,#16346a 55%,#2d6de0)',
		glow: 'rgba(86,152,255,.72)',
		frame: '#d2e3ff',
		kind: 'wheel',
	},
	redWheel: {
		label: 'Red Wheel',
		short: 'RW',
		flavor: 'ember wheel',
		tier: 'wheel',
		background: 'linear-gradient(145deg,#300b07,#621512 55%,#c53321)',
		glow: 'rgba(255,104,76,.72)',
		frame: '#ffd7cf',
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
	{
		key: 'regular-bonus-trigger',
		label: 'Regular Bonus Trigger',
		note: 'Three scatters unlock 10 free spins.',
		bet: 1,
		board: [
			['scatter', 'runeA', 'helmet', 'runeB', 'runeF'],
			['ankh', 'scatter', 'runeC', 'sunDisc', 'runeD'],
			['scepter', 'runeE', 'scatter', 'runeF', 'crown'],
			['runeA', 'helmet', 'runeF', 'runeA', 'wolf'],
			['sunDisc', 'runeB', 'ankh', 'runeC', 'scepter'],
		],
		wheelResults: {},
	},
	{
		key: 'super-bonus-trigger',
		label: 'Super Bonus Trigger',
		note: 'Four scatters unlock sticky super free spins.',
		bet: 1,
		board: [
			['scatter', 'runeA', 'helmet', 'scatter', 'runeF'],
			['ankh', 'runeD', 'wolf', 'runeE', 'axes'],
			['crown', 'scatter', 'crown', 'crown', 'crown'],
			['runeF', 'runeF', 'helmet', 'scatter', 'scepter'],
			['runeB', 'ankh', 'runeC', 'sunDisc', 'wolf'],
		],
		wheelResults: {},
	},
];

export const reelStatesDefault: ReelState[] = Array(REELS).fill('idle');
export const autoplayPresets = [10, 25, 50, 100] as const;

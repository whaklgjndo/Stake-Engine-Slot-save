import { simulateGameSpins, simulateLiveSpins } from './dualWheelEngine.ts';
import type { DualWheelSimulationReport } from './dualWheelEngine.ts';

const DEFAULT_SPINS = 1000;
const DEFAULT_BET = 1;
const DEFAULT_CHUNK_SIZE = 10000;
const MAX_SAFE_CHUNK_SIZE = 10000;
const MAX_SAFE_TOTAL_SPINS = 100000;

function readArg(name: string): string | undefined {
	const index = process.argv.indexOf(name);
	if (index < 0) return undefined;
	return process.argv[index + 1];
}

function parseNumberArg(name: string, fallback: number): number {
	const raw = readArg(name);
	if (!raw) return fallback;
	const value = Number(raw);
	return Number.isFinite(value) ? value : fallback;
}

const requestedSpins = parseNumberArg('--spins', DEFAULT_SPINS);
const bet = parseNumberArg('--bet', DEFAULT_BET);
const requestedChunkSize = parseNumberArg('--chunk', DEFAULT_CHUNK_SIZE);
const chunkSize = Math.min(Math.max(1, Math.floor(requestedChunkSize)), MAX_SAFE_CHUNK_SIZE);
const safeSpins = Math.min(Math.max(1, Math.floor(requestedSpins)), MAX_SAFE_TOTAL_SPINS);
const seed = parseNumberArg('--seed', Date.now());
const baseOnly = process.argv.includes('--base-only');

function createSeededRng(startSeed: number): () => number {
	let state = Math.floor(Math.abs(startSeed)) % 2147483647;
	if (state <= 0) state = 1;

	return () => {
		state = (state * 16807) % 2147483647;
		return (state - 1) / 2147483646;
	};
}

function createEmptyAggregate(spins: number, wager: number): DualWheelSimulationReport {
	return {
		requestedSpins,
		spins,
		bet: wager,
		totalBet: 0,
		totalPaid: 0,
		rtp: 0,
		hitSpins: 0,
		deadSpins: 0,
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

function mergeReports(
	target: DualWheelSimulationReport,
	source: DualWheelSimulationReport,
	paidMultiplierSet: Set<number>,
): DualWheelSimulationReport {
	target.totalBet += source.totalBet;
	target.totalPaid += source.totalPaid;
	target.hitSpins += source.hitSpins;
	target.deadSpins += source.deadSpins;
	target.wheelRounds += source.wheelRounds;
	target.blueWheels += source.blueWheels;
	target.redWheels += source.redWheels;
	target.totalWinningLines += source.totalWinningLines;
	target.maxWin = Math.max(target.maxWin, source.maxWin);
	target.maxWinMultiplier = Math.max(target.maxWinMultiplier, source.maxWinMultiplier);

	target.winRanges.zero += source.winRanges.zero;
	target.winRanges.upTo5x += source.winRanges.upTo5x;
	target.winRanges.upTo10x += source.winRanges.upTo10x;
	target.winRanges.upTo25x += source.winRanges.upTo25x;
	target.winRanges.upTo50x += source.winRanges.upTo50x;
	target.winRanges.upTo100x += source.winRanges.upTo100x;
	target.winRanges.over100x += source.winRanges.over100x;

	target.volatility.lineOnlyRounds += source.volatility.lineOnlyRounds;
	target.volatility.blueWheelRounds += source.volatility.blueWheelRounds;
	target.volatility.redWheelRounds += source.volatility.redWheelRounds;
	target.volatility.comboWheelRounds += source.volatility.comboWheelRounds;
	target.volatility.fiftyPlusRounds += source.volatility.fiftyPlusRounds;
	target.volatility.hundredPlusRounds += source.volatility.hundredPlusRounds;
	target.volatility.lineOnlyPaid += source.volatility.lineOnlyPaid;
	target.volatility.blueWheelPaid += source.volatility.blueWheelPaid;
	target.volatility.redWheelPaid += source.volatility.redWheelPaid;
	target.volatility.comboWheelPaid += source.volatility.comboWheelPaid;

	target.bonuses.regularTriggers += source.bonuses.regularTriggers;
	target.bonuses.superTriggers += source.bonuses.superTriggers;
	target.bonuses.regularBonusSpins += source.bonuses.regularBonusSpins;
	target.bonuses.superBonusSpins += source.bonuses.superBonusSpins;
	target.bonuses.regularBonusPaid += source.bonuses.regularBonusPaid;
	target.bonuses.superBonusPaid += source.bonuses.superBonusPaid;
	target.bonuses.maxRegularBonus = Math.max(
		target.bonuses.maxRegularBonus,
		source.bonuses.maxRegularBonus,
	);
	target.bonuses.maxSuperBonus = Math.max(
		target.bonuses.maxSuperBonus,
		source.bonuses.maxSuperBonus,
	);

	target.moods.dead += source.moods.dead;
	target.moods.base += source.moods.base;
	target.moods.feature += source.moods.feature;
	target.moods.big += source.moods.big;

	for (const multiplier of source.paidMultipliers) {
		paidMultiplierSet.add(multiplier);
	}

	return target;
}

const rng = createSeededRng(seed);
const aggregate = createEmptyAggregate(safeSpins, bet);
const paidMultiplierSet = new Set<number>();

let spinsRemaining = safeSpins;
while (spinsRemaining > 0) {
	const batchSpins = Math.min(spinsRemaining, chunkSize);
	const batchReport = (baseOnly ? simulateLiveSpins : simulateGameSpins)(
		{
			spins: batchSpins,
			bet,
			maxSpins: chunkSize,
		},
		rng,
	);
	mergeReports(aggregate, batchReport, paidMultiplierSet);
	spinsRemaining -= batchSpins;
}

aggregate.rtp = aggregate.totalBet > 0 ? aggregate.totalPaid / aggregate.totalBet : 0;
aggregate.averageWinOnHit = aggregate.hitSpins > 0 ? aggregate.totalPaid / aggregate.hitSpins : 0;
aggregate.averageLinesOnHit =
	aggregate.hitSpins > 0 ? aggregate.totalWinningLines / aggregate.hitSpins : 0;
aggregate.distinctPaidMultipliers = paidMultiplierSet.size;
aggregate.paidMultipliers = Array.from(paidMultiplierSet).sort((left, right) => left - right);
aggregate.bonuses.regularAverageBonus =
	aggregate.bonuses.regularTriggers > 0
		? aggregate.bonuses.regularBonusPaid / aggregate.bonuses.regularTriggers
		: 0;
aggregate.bonuses.superAverageBonus =
	aggregate.bonuses.superTriggers > 0
		? aggregate.bonuses.superBonusPaid / aggregate.bonuses.superTriggers
		: 0;

const report = aggregate;

if (report.requestedSpins > report.spins) {
	console.log(`Requested ${report.requestedSpins} spins, capped to ${report.spins} for safety.`);
}

console.log('Dual Wheel Simulation');
console.log('--------------------------------');
console.log(`Mode: ${baseOnly ? 'Base only' : 'Full session with bonuses'}`);
console.log(`Spins: ${report.spins}`);
console.log(`Bet: ${report.bet.toFixed(2)}`);
console.log(`Seed: ${seed}`);
console.log(`Chunk size: ${chunkSize}`);
console.log(`Total bet: ${report.totalBet.toFixed(2)}`);
console.log(`Total paid: ${report.totalPaid.toFixed(2)}`);
console.log(`RTP: ${(report.rtp * 100).toFixed(2)}%`);
console.log(`Hit rate: ${((report.hitSpins / report.spins) * 100).toFixed(2)}%`);
console.log(`Dead-spin rate: ${((report.deadSpins / report.spins) * 100).toFixed(2)}%`);
console.log(`Wheel round rate: ${((report.wheelRounds / report.spins) * 100).toFixed(2)}%`);
console.log(`Blue wheels: ${report.blueWheels}`);
console.log(`Red wheels: ${report.redWheels}`);
console.log(`Average paid hit: ${report.averageWinOnHit.toFixed(2)}`);
console.log(`Average lines on hit: ${report.averageLinesOnHit.toFixed(2)}`);
console.log(`Max win: ${report.maxWin.toFixed(2)} (${report.maxWinMultiplier.toFixed(2)}x)`);
console.log(`Distinct paid multipliers: ${report.distinctPaidMultipliers}`);
console.log(
	[
		`0x ${report.winRanges.zero}`,
		`>0x-5x ${report.winRanges.upTo5x}`,
		`5x-10x ${report.winRanges.upTo10x}`,
		`10x-25x ${report.winRanges.upTo25x}`,
		`25x-50x ${report.winRanges.upTo50x}`,
		`50x-100x ${report.winRanges.upTo100x}`,
		`100x+ ${report.winRanges.over100x}`,
	].join(' | '),
);
console.log(
	[
		`Line-only ${report.volatility.lineOnlyRounds}`,
		`Blue-wheel ${report.volatility.blueWheelRounds}`,
		`Red-wheel ${report.volatility.redWheelRounds}`,
		`Combo ${report.volatility.comboWheelRounds}`,
		`50x+ ${report.volatility.fiftyPlusRounds}`,
		`100x+ ${report.volatility.hundredPlusRounds}`,
	].join(' | '),
);
console.log(
	[
		`Line-only paid ${report.volatility.lineOnlyPaid.toFixed(2)}`,
		`Blue paid ${report.volatility.blueWheelPaid.toFixed(2)}`,
		`Red paid ${report.volatility.redWheelPaid.toFixed(2)}`,
		`Combo paid ${report.volatility.comboWheelPaid.toFixed(2)}`,
	].join(' | '),
);
console.log(
	[
		`Regular triggers ${report.bonuses.regularTriggers}`,
		`Super triggers ${report.bonuses.superTriggers}`,
		`Regular paid ${report.bonuses.regularBonusPaid.toFixed(2)}`,
		`Super paid ${report.bonuses.superBonusPaid.toFixed(2)}`,
	].join(' | '),
);
console.log(
	[
		`Regular avg ${report.bonuses.regularAverageBonus.toFixed(2)}`,
		`Super avg ${report.bonuses.superAverageBonus.toFixed(2)}`,
		`Regular max ${report.bonuses.maxRegularBonus.toFixed(2)}`,
		`Super max ${report.bonuses.maxSuperBonus.toFixed(2)}`,
	].join(' | '),
);
console.log(
	`Mood mix: dead ${report.moods.dead}, base ${report.moods.base}, feature ${report.moods.feature}, big ${report.moods.big}`,
);

<script lang="ts">
	import { onMount } from 'svelte';
	import {
		simulateGameSpins,
		simulateLiveSpins,
		type DualWheelSimulationReport,
	} from './dualWheelEngine';
	import {
		DESIGN_RTP_TARGET,
		PRODUCT_MAX_WIN_TARGET,
		STAKE_APPROVAL_RTP_BAND,
	} from './dualWheelWorkshopConfig';

	type SimulationMode = 'liveBase' | 'fullGame';
	type WinRangeKey =
		| 'zero'
		| 'upTo5x'
		| 'upTo10x'
		| 'upTo25x'
		| 'upTo50x'
		| 'upTo100x'
		| 'over100x';
	type WinRangeRow = {
		key: WinRangeKey;
		label: string;
		count: number;
		rate: number;
	};
	type MoodKey = 'dead' | 'base' | 'feature' | 'big';
	type MoodRow = {
		key: MoodKey;
		label: string;
		count: number;
		rate: number;
	};

	const SPIN_PRESETS = [1000, 5000, 10000, 50000] as const;
	const BET_PRESETS = [0.2, 0.4, 1, 2, 5, 10] as const;

	let simulationMode: SimulationMode = 'fullGame';
	let requestedSpins = 10000;
	let bet = 1;
	let running = false;
	let lastRuntimeMs = 0;
	let report: DualWheelSimulationReport | null = null;
	let runLabel = 'No simulation yet';
	let errorMessage = '';

	$: safeRequestedSpins = clampInt(requestedSpins, 1, 100000);
	$: safeBet = clampNumber(bet, 0.01, 1000);
	$: reportModeLabel = simulationMode === 'fullGame' ? 'Full Game Model' : 'Live Base Spins';
	$: hitRate = report ? ratio(report.hitSpins, report.spins) : 0;
	$: deadRate = report ? ratio(report.deadSpins, report.spins) : 0;
	$: wheelRate = report ? ratio(report.wheelRounds, report.spins) : 0;
	$: blueWheelRate = report ? ratio(report.blueWheels, report.spins) : 0;
	$: redWheelRate = report ? ratio(report.redWheels, report.spins) : 0;
	$: averageLinesOnHit = report?.averageLinesOnHit ?? 0;
	$: targetDelta = report ? report.rtp - DESIGN_RTP_TARGET : 0;
	$: targetRead = !report
		? 'Awaiting run'
		: report.rtp < STAKE_APPROVAL_RTP_BAND.min
			? 'Below approval band'
			: report.rtp > STAKE_APPROVAL_RTP_BAND.max
				? 'Above approval band'
				: 'Inside approval band';
	$: targetTone = !report
		? 'idle'
		: report.rtp < STAKE_APPROVAL_RTP_BAND.min
			? 'cold'
			: report.rtp > STAKE_APPROVAL_RTP_BAND.max
				? 'hot'
				: 'good';
	$: winRangeRows = buildWinRangeRows(report);
	$: moodRows = buildMoodRows(report);
	$: regularTriggerRate = report ? ratio(report.bonuses.regularTriggers, report.spins) : 0;
	$: superTriggerRate = report ? ratio(report.bonuses.superTriggers, report.spins) : 0;
	$: bonusContribution = report
		? ratio(report.bonuses.regularBonusPaid + report.bonuses.superBonusPaid, report.totalPaid)
		: 0;

	function clampInt(value: number, min: number, max: number): number {
		if (!Number.isFinite(value)) return min;
		return Math.min(max, Math.max(min, Math.floor(value)));
	}

	function clampNumber(value: number, min: number, max: number): number {
		if (!Number.isFinite(value)) return min;
		return Math.min(max, Math.max(min, value));
	}

	function ratio(numerator: number, denominator: number): number {
		return denominator > 0 ? numerator / denominator : 0;
	}

	function formatValue(value: number): string {
		return value.toFixed(2);
	}

	function formatPercent(value: number): string {
		return `${(value * 100).toFixed(2)}%`;
	}

	function formatSignedPercent(value: number): string {
		const percent = (value * 100).toFixed(2);
		if (value > 0) return `+${percent}%`;
		if (value < 0) return `${percent}%`;
		return '0.00%';
	}

	function formatMultiplier(value: number): string {
		return Number.isInteger(value) ? `${value}x` : `${value.toFixed(2)}x`;
	}

	function modeLabel(mode: SimulationMode): string {
		return mode === 'fullGame' ? 'Full Game Model' : 'Live Base Spins';
	}

	function moodLabel(mood: MoodKey): string {
		switch (mood) {
			case 'dead':
				return 'Dead';
			case 'feature':
				return 'Feature';
			case 'big':
				return 'Big';
			default:
				return 'Base';
		}
	}

	function winRangeLabel(key: WinRangeKey): string {
		switch (key) {
			case 'zero':
				return '0x';
			case 'upTo5x':
				return '0x to <5x';
			case 'upTo10x':
				return '5x to <10x';
			case 'upTo25x':
				return '10x to <25x';
			case 'upTo50x':
				return '25x to <50x';
			case 'upTo100x':
				return '50x to <100x';
			default:
				return '100x+';
		}
	}

	function buildWinRangeRows(simulation: DualWheelSimulationReport | null): WinRangeRow[] {
		const keys: WinRangeKey[] = [
			'zero',
			'upTo5x',
			'upTo10x',
			'upTo25x',
			'upTo50x',
			'upTo100x',
			'over100x',
		];

		if (!simulation) {
			return keys.map((key) => ({
				key,
				label: winRangeLabel(key),
				count: 0,
				rate: 0,
			}));
		}

		return keys.map((key) => ({
			key,
			label: winRangeLabel(key),
			count: simulation.winRanges[key],
			rate: ratio(simulation.winRanges[key], simulation.spins),
		}));
	}

	function buildMoodRows(simulation: DualWheelSimulationReport | null): MoodRow[] {
		const keys: MoodKey[] = ['dead', 'base', 'feature', 'big'];

		if (!simulation) {
			return keys.map((key) => ({
				key,
				label: moodLabel(key),
				count: 0,
				rate: 0,
			}));
		}

		return keys.map((key) => ({
			key,
			label: moodLabel(key),
			count: simulation.moods[key],
			rate: ratio(simulation.moods[key], simulation.spins),
		}));
	}

	async function runSimulation(): Promise<void> {
		running = true;
		errorMessage = '';
		report = null;
		runLabel = `Running ${modeLabel(simulationMode)}...`;
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

		try {
			const start = performance.now();
			report =
				simulationMode === 'fullGame'
					? simulateGameSpins({ spins: safeRequestedSpins, bet: safeBet, maxSpins: 100000 })
					: simulateLiveSpins({ spins: safeRequestedSpins, bet: safeBet, maxSpins: 100000 });
			lastRuntimeMs = performance.now() - start;
			runLabel = `${modeLabel(simulationMode)} · ${report.spins.toLocaleString()} spins`;
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Simulation failed with an unknown error.';
			runLabel = 'Simulation failed';
		} finally {
			running = false;
		}
	}

	function setSpinPreset(value: number): void {
		requestedSpins = value;
	}

	function setBetPreset(value: number): void {
		bet = value;
	}

	onMount(() => {
		void runSimulation();
	});
</script>

<div class="math-lab-shell">
	<section class="hero-card">
		<div class="hero-copy">
			<p class="eyebrow">Stake Engine Workshop</p>
			<h1>Dual Wheel Math Lab</h1>
			<p class="hero-note">
				Run the existing engine in two modes: live base spins only, or full game rounds with random
				bonus triggers and feature payouts folded into the result.
			</p>
		</div>

		<div class="hero-status-grid">
			<div class="hero-pill">
				<span>Status</span>
				<strong>{running ? 'Running' : runLabel}</strong>
			</div>
			<div class="hero-pill">
				<span>Requested Spins</span>
				<strong>{safeRequestedSpins.toLocaleString()}</strong>
			</div>
			<div class="hero-pill">
				<span>Bet</span>
				<strong>${formatValue(safeBet)}</strong>
			</div>
			<div class="hero-pill">
				<span>Runtime</span>
				<strong>{lastRuntimeMs ? `${lastRuntimeMs.toFixed(1)} ms` : '—'}</strong>
			</div>
		</div>
	</section>

	<section class="controls-card">
		<div class="controls-grid">
			<label class="control-field">
				<span>Model</span>
				<select bind:value={simulationMode} disabled={running}>
					<option value="fullGame">Full Game Model</option>
					<option value="liveBase">Live Base Spins</option>
				</select>
				<em>
					{simulationMode === 'fullGame'
						? 'Includes base spins plus random bonus triggers and feature-round payouts.'
						: 'Only the weighted live-strip base game is simulated.'}
				</em>
			</label>

			<label class="control-field">
				<span>Spin Count</span>
				<input
					bind:value={requestedSpins}
					type="number"
					min="1"
					max="100000"
					step="1000"
					disabled={running}
				/>
				<em>Hard capped at 100,000 spins per run to keep Storybook responsive.</em>
			</label>

			<label class="control-field">
				<span>Bet</span>
				<input bind:value={bet} type="number" min="0.01" max="1000" step="0.1" disabled={running} />
				<em>Use the same stake ladder you are previewing in the main workshop.</em>
			</label>

			<div class="control-field control-field-actions">
				<span>Run</span>
				<button class="primary-button" on:click={() => void runSimulation()} disabled={running}>
					{running ? 'Running...' : 'Run Simulation'}
				</button>
				<em>The report resets on each run so you can compare model changes cleanly.</em>
			</div>
		</div>

		<div class="preset-strip">
			<div class="preset-group">
				<span class="preset-label">Spin Presets</span>
				<div class="preset-buttons">
					{#each SPIN_PRESETS as preset}
						<button
							class:secondary-button={true}
							class:is-active={safeRequestedSpins === preset}
							on:click={() => setSpinPreset(preset)}
							disabled={running}
						>
							{preset.toLocaleString()}
						</button>
					{/each}
				</div>
			</div>

			<div class="preset-group">
				<span class="preset-label">Bet Presets</span>
				<div class="preset-buttons">
					{#each BET_PRESETS as preset}
						<button
							class:secondary-button={true}
							class:is-active={safeBet === preset}
							on:click={() => setBetPreset(preset)}
							disabled={running}
						>
							${formatValue(preset)}
						</button>
					{/each}
				</div>
			</div>
		</div>

		{#if errorMessage}
			<div class="error-banner">{errorMessage}</div>
		{/if}
	</section>

	<section class="summary-card">
		<div class="summary-header">
			<div>
				<p class="eyebrow">Core Read</p>
				<h2>Balancing Snapshot</h2>
			</div>
			<div
				class:target-pill={true}
				class:target-pill-good={targetTone === 'good'}
				class:target-pill-cold={targetTone === 'cold'}
				class:target-pill-hot={targetTone === 'hot'}
			>
				<span>{targetRead}</span>
				<strong>{report ? formatPercent(report.rtp) : '—'}</strong>
				<em>vs target {formatPercent(DESIGN_RTP_TARGET)}</em>
			</div>
		</div>

		<div class="metric-grid">
			<div class="metric-card">
				<span>Total Bet</span>
				<strong>{report ? `$${formatValue(report.totalBet)}` : '—'}</strong>
				<em
					>{report
						? `${report.spins.toLocaleString()} rounds simulated`
						: 'Run a sample to populate this.'}</em
				>
			</div>
			<div class="metric-card">
				<span>Total Paid</span>
				<strong>{report ? `$${formatValue(report.totalPaid)}` : '—'}</strong>
				<em
					>{report
						? `${formatPercent(report.rtp)} paid back`
						: 'Run a sample to populate this.'}</em
				>
			</div>
			<div class="metric-card">
				<span>RTP Delta</span>
				<strong>{report ? formatSignedPercent(targetDelta) : '—'}</strong>
				<em>
					approval band {formatPercent(STAKE_APPROVAL_RTP_BAND.min)} to
					{formatPercent(STAKE_APPROVAL_RTP_BAND.max)}
				</em>
			</div>
			<div class="metric-card">
				<span>Max Win</span>
				<strong>{report ? formatMultiplier(report.maxWinMultiplier) : '—'}</strong>
				<em
					>{report
						? `$${formatValue(report.maxWin)}`
						: `product ceiling ${formatMultiplier(PRODUCT_MAX_WIN_TARGET)}`}</em
				>
			</div>
			<div class="metric-card">
				<span>Hit Rate</span>
				<strong>{report ? formatPercent(hitRate) : '—'}</strong>
				<em
					>{report
						? `${report.hitSpins.toLocaleString()} paid spins`
						: 'Run a sample to populate this.'}</em
				>
			</div>
			<div class="metric-card">
				<span>Dead Space</span>
				<strong>{report ? formatPercent(deadRate) : '—'}</strong>
				<em
					>{report
						? `${report.deadSpins.toLocaleString()} zero-win spins`
						: 'Run a sample to populate this.'}</em
				>
			</div>
			<div class="metric-card">
				<span>Wheel Rounds</span>
				<strong>{report ? formatPercent(wheelRate) : '—'}</strong>
				<em
					>{report
						? `${report.wheelRounds.toLocaleString()} rounds with wheels`
						: 'Run a sample to populate this.'}</em
				>
			</div>
			<div class="metric-card">
				<span>Average Hit</span>
				<strong>{report ? `$${formatValue(report.averageWinOnHit)}` : '—'}</strong>
				<em
					>{report
						? `${averageLinesOnHit.toFixed(2)} lines per paid round`
						: 'Run a sample to populate this.'}</em
				>
			</div>
		</div>
	</section>

	<div class="panel-grid">
		<section class="panel-card">
			<div class="panel-header">
				<div>
					<p class="eyebrow">Distribution</p>
					<h2>Win Ranges</h2>
				</div>
				<div class="panel-meta">
					{report ? report.distinctPaidMultipliers.toLocaleString() : '0'} paid multipliers
				</div>
			</div>

			<div class="distribution-list">
				{#each winRangeRows as row}
					<div class="distribution-row">
						<div class="distribution-copy">
							<span>{row.label}</span>
							<strong>{row.count.toLocaleString()}</strong>
						</div>
						<div class="distribution-bar-track">
							<div
								class="distribution-bar-fill"
								style={`width:${Math.max(row.rate * 100, 0)}%;`}
							></div>
						</div>
						<div class="distribution-rate">{formatPercent(row.rate)}</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="panel-card">
			<div class="panel-header">
				<div>
					<p class="eyebrow">Flow</p>
					<h2>Spin Mood Split</h2>
				</div>
				<div class="panel-meta">{reportModeLabel}</div>
			</div>

			<div class="distribution-list">
				{#each moodRows as row}
					<div class="distribution-row">
						<div class="distribution-copy">
							<span>{row.label}</span>
							<strong>{row.count.toLocaleString()}</strong>
						</div>
						<div class="distribution-bar-track">
							<div
								class="distribution-bar-fill distribution-bar-fill-cool"
								style={`width:${Math.max(row.rate * 100, 0)}%;`}
							></div>
						</div>
						<div class="distribution-rate">{formatPercent(row.rate)}</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="panel-card">
			<div class="panel-header">
				<div>
					<p class="eyebrow">Volatility</p>
					<h2>Wheel Mix</h2>
				</div>
				<div class="panel-meta">
					{report ? `${report.blueWheels} blue / ${report.redWheels} red` : 'Awaiting run'}
				</div>
			</div>

			<div class="metric-stack">
				<div class="stack-row">
					<span>Blue wheel frequency</span>
					<strong>{report ? formatPercent(blueWheelRate) : '—'}</strong>
					<em
						>{report
							? `${report.blueWheels.toLocaleString()} blue wheels across all rounds`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Red wheel frequency</span>
					<strong>{report ? formatPercent(redWheelRate) : '—'}</strong>
					<em
						>{report
							? `${report.redWheels.toLocaleString()} red wheels across all rounds`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Line-only paid rounds</span>
					<strong>{report ? report.volatility.lineOnlyRounds.toLocaleString() : '—'}</strong>
					<em
						>{report
							? `$${formatValue(report.volatility.lineOnlyPaid)} returned without wheel help`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Blue-led paid rounds</span>
					<strong>{report ? report.volatility.blueWheelRounds.toLocaleString() : '—'}</strong>
					<em
						>{report
							? `$${formatValue(report.volatility.blueWheelPaid)} returned from blue-led rounds`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Red-led paid rounds</span>
					<strong
						>{report
							? (
									report.volatility.redWheelRounds + report.volatility.comboWheelRounds
								).toLocaleString()
							: '—'}</strong
					>
					<em
						>{report
							? `$${formatValue(report.volatility.redWheelPaid + report.volatility.comboWheelPaid)} returned from red-led or combo rounds`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Pressure rounds</span>
					<strong
						>{report
							? `${report.volatility.fiftyPlusRounds.toLocaleString()} at 50x+`
							: '—'}</strong
					>
					<em
						>{report
							? `${report.volatility.hundredPlusRounds.toLocaleString()} at 100x+`
							: 'Run a sample to populate this.'}</em
					>
				</div>
			</div>
		</section>

		<section class="panel-card">
			<div class="panel-header">
				<div>
					<p class="eyebrow">Features</p>
					<h2>Bonus Contribution</h2>
				</div>
				<div class="panel-meta">
					{simulationMode === 'fullGame' ? 'trigger model enabled' : 'live base only'}
				</div>
			</div>

			<div class="metric-stack">
				<div class="stack-row">
					<span>Regular trigger rate</span>
					<strong
						>{simulationMode === 'fullGame' && report
							? formatPercent(regularTriggerRate)
							: '—'}</strong
					>
					<em
						>{report
							? `${report.bonuses.regularTriggers.toLocaleString()} regular bonuses`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Super trigger rate</span>
					<strong
						>{simulationMode === 'fullGame' && report
							? formatPercent(superTriggerRate)
							: '—'}</strong
					>
					<em
						>{report
							? `${report.bonuses.superTriggers.toLocaleString()} super bonuses`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Bonus-paid share</span>
					<strong
						>{simulationMode === 'fullGame' && report
							? formatPercent(bonusContribution)
							: '—'}</strong
					>
					<em
						>{report
							? `$${formatValue(report.bonuses.regularBonusPaid + report.bonuses.superBonusPaid)} came from feature rounds`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Average regular bonus</span>
					<strong
						>{simulationMode === 'fullGame' && report
							? formatMultiplier(report.bonuses.regularAverageBonus / safeBet)
							: '—'}</strong
					>
					<em
						>{report
							? `$${formatValue(report.bonuses.regularAverageBonus)} average regular feature`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Average super bonus</span>
					<strong
						>{simulationMode === 'fullGame' && report
							? formatMultiplier(report.bonuses.superAverageBonus / safeBet)
							: '—'}</strong
					>
					<em
						>{report
							? `$${formatValue(report.bonuses.superAverageBonus)} average super feature`
							: 'Run a sample to populate this.'}</em
					>
				</div>
				<div class="stack-row">
					<span>Largest feature</span>
					<strong
						>{simulationMode === 'fullGame' && report
							? formatMultiplier(
									Math.max(report.bonuses.maxRegularBonus, report.bonuses.maxSuperBonus) / safeBet,
								)
							: '—'}</strong
					>
					<em
						>{report
							? `regular ${formatValue(report.bonuses.maxRegularBonus)} / super ${formatValue(report.bonuses.maxSuperBonus)}`
							: 'Run a sample to populate this.'}</em
					>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #08111a;
	}

	.math-lab-shell {
		min-height: 100vh;
		padding: 28px;
		color: #eff7ff;
		background:
			radial-gradient(circle at 18% 12%, rgba(85, 145, 230, 0.18), transparent 20%),
			radial-gradient(circle at 82% 14%, rgba(181, 84, 48, 0.16), transparent 18%),
			linear-gradient(180deg, #0d1722 0%, #08111a 56%, #060d15 100%);
	}

	.hero-card,
	.controls-card,
	.summary-card,
	.panel-card {
		background:
			linear-gradient(180deg, rgba(11, 21, 31, 0.88), rgba(7, 15, 23, 0.94)),
			radial-gradient(circle at top left, rgba(74, 132, 209, 0.1), transparent 34%);
		border: 1px solid rgba(145, 181, 214, 0.16);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.04),
			0 28px 48px rgba(1, 7, 13, 0.28);
		backdrop-filter: blur(10px);
		border-radius: 24px;
	}

	.hero-card {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(340px, 0.9fr);
		gap: 16px;
		padding: 20px;
	}

	.hero-copy h1,
	.summary-header h2,
	.panel-header h2 {
		margin: 0;
		font-size: clamp(1.8rem, 2.8vw, 2.8rem);
		line-height: 0.95;
		letter-spacing: -0.04em;
	}

	.hero-note {
		margin: 10px 0 0;
		max-width: 50ch;
		font-size: 0.94rem;
		line-height: 1.5;
		color: rgba(202, 223, 243, 0.74);
	}

	.eyebrow {
		margin: 0 0 8px;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(151, 188, 221, 0.68);
	}

	.hero-status-grid,
	.metric-grid,
	.panel-grid {
		display: grid;
		gap: 12px;
	}

	.hero-status-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-content: center;
	}

	.hero-pill,
	.metric-card,
	.stack-row,
	.target-pill {
		padding: 12px 14px;
		border-radius: 16px;
		background: rgba(6, 14, 22, 0.84);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.hero-pill span,
	.metric-card span,
	.stack-row span,
	.target-pill span,
	.control-field span,
	.preset-label,
	.distribution-copy span {
		display: block;
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(171, 205, 236, 0.68);
	}

	.hero-pill strong,
	.metric-card strong,
	.stack-row strong,
	.target-pill strong,
	.distribution-copy strong {
		display: block;
		margin-top: 5px;
		font-weight: 900;
		letter-spacing: -0.03em;
	}

	.hero-pill strong {
		font-size: 0.98rem;
	}

	.hero-pill em,
	.metric-card em,
	.stack-row em,
	.target-pill em,
	.control-field em {
		display: block;
		margin-top: 6px;
		font-size: 0.78rem;
		font-style: normal;
		line-height: 1.45;
		color: rgba(191, 216, 238, 0.62);
	}

	.controls-card,
	.summary-card {
		margin-top: 16px;
		padding: 18px 20px;
	}

	.controls-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	.control-field {
		display: grid;
		gap: 8px;
	}

	.control-field-actions {
		align-content: start;
	}

	select,
	input,
	button {
		font: inherit;
	}

	select,
	input {
		width: 100%;
		padding: 12px 14px;
		border-radius: 14px;
		border: 1px solid rgba(150, 188, 222, 0.18);
		background: rgba(5, 13, 21, 0.92);
		color: #eef6ff;
	}

	button {
		padding: 12px 14px;
		border-radius: 14px;
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

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.primary-button {
		background: linear-gradient(180deg, #7acfff, #3699f6 54%, #1a73d8 100%);
		color: #04121d;
		font-weight: 800;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.36),
			0 16px 28px rgba(15, 84, 151, 0.28);
	}

	.secondary-button {
		background: rgba(16, 28, 41, 0.92);
		color: #edf7ff;
	}

	.secondary-button.is-active {
		border-color: rgba(102, 198, 255, 0.44);
		background: rgba(26, 70, 116, 0.72);
	}

	.preset-strip {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		margin-top: 14px;
	}

	.preset-group {
		display: grid;
		gap: 8px;
	}

	.preset-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.error-banner {
		margin-top: 14px;
		padding: 12px 14px;
		border-radius: 14px;
		background: rgba(56, 18, 16, 0.9);
		border: 1px solid rgba(255, 119, 96, 0.22);
		color: #ffd0c6;
	}

	.summary-header,
	.panel-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 12px;
		align-items: start;
	}

	.target-pill {
		min-width: 180px;
		text-align: right;
	}

	.target-pill-good {
		border-color: rgba(120, 214, 166, 0.24);
		box-shadow: 0 0 0 1px rgba(120, 214, 166, 0.06);
	}

	.target-pill-cold {
		border-color: rgba(113, 206, 255, 0.24);
		box-shadow: 0 0 0 1px rgba(113, 206, 255, 0.06);
	}

	.target-pill-hot {
		border-color: rgba(255, 156, 120, 0.24);
		box-shadow: 0 0 0 1px rgba(255, 156, 120, 0.06);
	}

	.metric-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
		margin-top: 14px;
	}

	.metric-card strong {
		font-size: 1.12rem;
	}

	.panel-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		margin-top: 16px;
	}

	.panel-card {
		padding: 18px 20px;
	}

	.panel-meta {
		padding: 10px 12px;
		border-radius: 14px;
		background: rgba(6, 14, 22, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.06);
		font-size: 0.82rem;
		color: rgba(202, 223, 243, 0.74);
	}

	.distribution-list,
	.metric-stack {
		display: grid;
		gap: 10px;
		margin-top: 14px;
	}

	.distribution-row {
		display: grid;
		grid-template-columns: minmax(110px, 0.9fr) minmax(0, 1fr) 88px;
		gap: 12px;
		align-items: center;
	}

	.distribution-bar-track {
		position: relative;
		height: 12px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		overflow: hidden;
	}

	.distribution-bar-fill {
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, rgba(255, 186, 117, 0.9), rgba(255, 110, 82, 0.88));
	}

	.distribution-bar-fill-cool {
		background: linear-gradient(90deg, rgba(132, 219, 255, 0.9), rgba(54, 153, 246, 0.88));
	}

	.distribution-rate {
		text-align: right;
		font-size: 0.82rem;
		font-weight: 800;
		color: rgba(225, 238, 250, 0.88);
	}

	.stack-row strong {
		font-size: 1rem;
	}

	@media (max-width: 1200px) {
		.hero-card,
		.controls-grid,
		.metric-grid,
		.panel-grid,
		.preset-strip {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 860px) {
		.math-lab-shell {
			padding: 18px;
		}

		.hero-status-grid,
		.distribution-row {
			grid-template-columns: 1fr;
		}

		.summary-header,
		.panel-header {
			grid-template-columns: 1fr;
		}

		.target-pill,
		.distribution-rate {
			text-align: left;
		}
	}
</style>

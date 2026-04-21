<script lang="ts">
	import BlueSingleWheel from './BlueSingleWheel.svelte';
	import RedDualWheel from './RedDualWheel.svelte';

	import {
		BOARD_H,
		BOARD_PADDING,
		BOARD_W,
		bonusSymbolAssets,
		GAP,
		REELS,
		ROWS,
		SIZE,
		symbolArtAssets,
		symbolMeta,
		wheelSymbolAssets,
	} from './dualWheelWorkshopConfig';
	import type {
		ActiveWheelState,
		BonusTrigger,
		LineTone,
		LineResult,
		Point,
		ReelAnticipation,
		ReelState,
		ResolvedWheelState,
		RegularSymbolId,
		RoundState,
		SpinMood,
		SymbolId,
		WheelResultBurst,
	} from './dualWheelWorkshopTypes';

	type WheelMessage = { title: string; detail: string };

	export let displayBoard: SymbolId[][] = [];
	export let reelStates: ReelState[] = [];
	export let roundState: RoundState = 'idle';
	export let activeLine: LineResult | null = null;
	export let activeLinePath = '';
	export let activeLinePoints: Point[] = [];
	export let activePayoutPoint: Point | null = null;
	export let activeWheelState: ActiveWheelState | null = null;
	export let resolvedWheelStates: Record<string, ResolvedWheelState> = {};
	export let wheelResultBursts: WheelResultBurst[] = [];
	export let reelAnticipation: ReelAnticipation[] = Array(REELS).fill('none');
	export let blueWheelOverlayStyle = '';
	export let redWheelOverlayStyle = '';
	export let wheelMessage: WheelMessage = { title: '', detail: '' };
	export let spinMood: SpinMood = 'base';
	export let activeLineTone: LineTone | null = null;
	export let stickyResolvedWheelMode = false;
	export let activeBonusTrigger: BonusTrigger | null = null;

	$: presentedSpinMood =
		roundState === 'spinning'
			? spinMood === 'dead'
				? 'dead'
				: reelAnticipation.some((signal) => signal !== 'none')
					? 'feature'
					: 'base'
			: roundState === 'countingWin' || activeWheelState?.type === 'red' || activeLineTone === 'big'
				? 'big'
				: activeWheelState || activeLineTone === 'medium' || spinMood === 'feature'
					? 'feature'
					: spinMood === 'dead'
						? 'dead'
						: 'base';

	function cellKey(row: number, column: number): string {
		return `${row}-${column}`;
	}

	function formatCurrency(value: number): string {
		return `$${value.toFixed(2)}`;
	}

	function formatMultiplier(value: number): string {
		return Number.isInteger(value) ? `${value}x` : `${value.toFixed(1)}x`;
	}

	function lineIncludesPosition(line: LineResult | null, row: number, column: number): boolean {
		return Boolean(
			line?.positions.some((position) => position.row === row && position.column === column),
		);
	}

	function lineWheelAtPosition(
		line: LineResult | null,
		row: number,
		column: number,
	): LineResult['wheels'][number] | null {
		return line?.wheels.find((wheel) => wheel.row === row && wheel.column === column) ?? null;
	}

	function activeWheelAtPosition(row: number, column: number): ActiveWheelState | null {
		return activeWheelState?.row === row && activeWheelState?.column === column
			? activeWheelState
			: null;
	}

	function resolvedWheelAtPosition(row: number, column: number): ResolvedWheelState | null {
		return resolvedWheelStates[cellKey(row, column)] ?? null;
	}

	function wheelOverlayPosition(wheel: ActiveWheelState | null): Point {
		if (!wheel) {
			return {
				x: BOARD_PADDING + SIZE / 2,
				y: BOARD_PADDING + SIZE / 2,
			};
		}

		return {
			x: BOARD_PADDING + wheel.column * (SIZE + GAP) + SIZE / 2,
			y: BOARD_PADDING + wheel.row * (SIZE + GAP) + SIZE / 2,
		};
	}

	function wheelBurstPosition(wheel: WheelResultBurst | null): Point {
		if (!wheel) {
			return {
				x: BOARD_PADDING + SIZE / 2,
				y: BOARD_PADDING + SIZE / 2,
			};
		}

		return {
			x: BOARD_PADDING + wheel.column * (SIZE + GAP) + SIZE / 2,
			y: BOARD_PADDING + wheel.row * (SIZE + GAP) + SIZE / 2,
		};
	}

	function wheelBurstAtPosition(row: number, column: number): WheelResultBurst | null {
		return wheelResultBursts.find((wheel) => wheel.row === row && wheel.column === column) ?? null;
	}

	function boardPoint(row: number, column: number): Point {
		return {
			x: BOARD_PADDING + column * (SIZE + GAP) + SIZE / 2,
			y: BOARD_PADDING + row * (SIZE + GAP) + SIZE / 2,
		};
	}

	function resolvedWheelPrimaryLabel(wheel: ResolvedWheelState | null): string {
		if (!wheel) return '';
		return `+${formatMultiplier(wheel.total)}`;
	}

	function resolvedWheelDetailLabel(wheel: ResolvedWheelState | null): string {
		if (!wheel) return '';
		return wheel.type === 'red'
			? `${formatMultiplier(wheel.outer ?? 0)} x ${formatMultiplier(wheel.inner ?? 0)}`
			: '';
	}

	function lineWheelBurstKey(
		line: LineResult | null,
		wheel: LineResult['wheels'][number] | null,
	): string {
		if (!line || !wheel) return 'wheel-line-burst';
		return `${line.lineNumber}-${wheel.row}-${wheel.column}-${wheel.total}`;
	}

	function wheelLineSummary(line: LineResult | null): string {
		if (!line?.wheels.length) return '';
		if (line.wheels.length === 1) {
			return `incl +${formatMultiplier(line.wheels[0].total)} wheel`;
		}

		return `${line.wheels.length} wheel bonuses`;
	}

	function bonusTriggeredAtPosition(row: number, column: number): boolean {
		return Boolean(
			activeBonusTrigger?.positions.some(
				(position) => position.row === row && position.column === column,
			),
		);
	}

	function cellMuted(row: number, column: number): boolean {
		if (activeBonusTrigger) {
			return !bonusTriggeredAtPosition(row, column);
		}

		if (activeWheelState) {
			return !(activeWheelState.row === row && activeWheelState.column === column);
		}

		if (activeLine) {
			return !lineIncludesPosition(activeLine, row, column);
		}

		return false;
	}

	function stickyWheelSymbol(
		resolvedWheel: ResolvedWheelState | null,
	): 'blueWheel' | 'redWheel' | null {
		if (!resolvedWheel) return null;
		return resolvedWheel.type === 'blue' ? 'blueWheel' : 'redWheel';
	}
</script>

<div
	class:board-frame={true}
	class:board-frame-dead={presentedSpinMood === 'dead'}
	class:board-frame-feature={presentedSpinMood === 'feature'}
	class:board-frame-big={presentedSpinMood === 'big'}
	style={`--board-width:${BOARD_W}px; --board-height:${BOARD_H}px;`}
>
	<!-- Velvet backdrop (red left / blue right) -->
	<div class="frame-velvet" aria-hidden="true">
		<div class="frame-velvet-red"></div>
		<div class="frame-velvet-blue"></div>
	</div>
	<!-- Crown clasp at top center -->
	<div class="frame-crown" aria-hidden="true"></div>
	<!-- Scroll bar caps -->
	<div class="frame-scroll frame-scroll-top" aria-hidden="true">
		<div class="frame-scroll-cap frame-scroll-cap-left"></div>
		<div class="frame-scroll-cap frame-scroll-cap-right"></div>
	</div>
	<div class="frame-scroll frame-scroll-bottom" aria-hidden="true">
		<div class="frame-scroll-cap frame-scroll-cap-left"></div>
		<div class="frame-scroll-cap frame-scroll-cap-right"></div>
	</div>
	<div
		class:board={true}
		class:board-active={reelStates.some((state) => state !== 'idle')}
		class:board-focus-line={Boolean(activeLine) && !activeWheelState}
		class:board-focus-wheel={Boolean(activeWheelState)}
		class:board-active-feature={(reelStates.some((state) => state !== 'idle') ||
			roundState === 'showingLines') &&
			presentedSpinMood === 'feature'}
		class:board-active-big={roundState === 'countingWin' ||
			activeWheelState?.type === 'red' ||
			activeLineTone === 'big'}
		style={`grid-template-columns: repeat(${REELS}, ${SIZE}px); grid-template-rows: repeat(${ROWS}, ${SIZE}px); gap: ${GAP}px;`}
	>
		{#each displayBoard as row, rowIndex}
			{#each row as symbol, columnIndex}
				{@const resolvedWheel = resolvedWheelAtPosition(rowIndex, columnIndex)}
				{@const stickyWheelVisual = stickyResolvedWheelMode && Boolean(resolvedWheel)}
				{@const stickyCellLocked = stickyResolvedWheelMode && Boolean(resolvedWheel)}
				{@const displaySymbol = stickyWheelVisual
					? (stickyWheelSymbol(resolvedWheel) ?? symbol)
					: symbol}
				{@const meta = symbolMeta[displaySymbol]}
				{@const highlighted = lineIncludesPosition(activeLine, rowIndex, columnIndex)}
				{@const wheelData = lineWheelAtPosition(activeLine, rowIndex, columnIndex)}
				{@const activeWheel = activeWheelAtPosition(rowIndex, columnIndex)}
				{@const resolvedWheelDetail = resolvedWheelDetailLabel(resolvedWheel)}
				{@const resolvedWheelBurst = wheelBurstAtPosition(rowIndex, columnIndex)}
				<div
					class:cell={true}
					class:cell-muted={cellMuted(rowIndex, columnIndex) && !stickyCellLocked}
					class:cell-highlighted={highlighted}
					class:cell-highlighted-quiet={highlighted && activeLineTone === 'small'}
					class:cell-highlighted-big={highlighted && activeLineTone === 'big'}
					class:cell-anticipation-premium={roundState === 'spinning' &&
						reelStates[columnIndex] !== 'idle' &&
						reelAnticipation[columnIndex] === 'premium'}
					class:cell-anticipation-wheel={roundState === 'spinning' &&
						reelStates[columnIndex] !== 'idle' &&
						reelAnticipation[columnIndex] === 'wheel'}
					class:cell-wheel={meta.kind === 'wheel'}
					class:cell-bonus={meta.kind === 'bonus'}
					class:cell-bonus-triggered={bonusTriggeredAtPosition(rowIndex, columnIndex)}
					class:cell-wheel-active={Boolean(activeWheel)}
					class:cell-wheel-queued={Boolean(wheelData) && !activeWheel}
					class:cell-sticky-locked={stickyCellLocked && !activeWheel}
					class:cell-spinning={reelStates[columnIndex] === 'spinning' && !stickyCellLocked}
					class:cell-braking={reelStates[columnIndex] === 'braking' && !stickyCellLocked}
					class:cell-landing={reelStates[columnIndex] === 'landing' && !stickyCellLocked}
					data-tier={meta.tier}
					data-symbol={displaySymbol}
					style={`--cell-background:${meta.background}; --cell-glow:${meta.glow}; --cell-frame:${meta.frame};`}
				>
					{#if meta.kind === 'wheel'}
						<div class="symbol-shell symbol-shell-wheel">
							<div
								class={`wheel-tile-shell wheel-tile-shell-${displaySymbol === 'blueWheel' ? 'blue' : 'red'}`}
								class:wheel-tile-shell-hidden={Boolean(activeWheel)}
								class:wheel-tile-shell-sticky={Boolean(stickyWheelVisual)}
							>
								<img
									class="wheel-tile-art"
									src={wheelSymbolAssets[displaySymbol as 'blueWheel' | 'redWheel']}
									alt={meta.label}
								/>
							</div>
							{#if resolvedWheel && !activeWheel && (!resolvedWheelBurst || stickyCellLocked)}
								<div
									class:wheel-result-chip={true}
									class:wheel-result-chip-blue={resolvedWheel.type === 'blue'}
									class:wheel-result-chip-red={resolvedWheel.type === 'red'}
									class:wheel-result-chip-highlighted={Boolean(highlighted && wheelData)}
									class:wheel-result-chip-sticky={stickyCellLocked}
								>
									<strong>{resolvedWheelPrimaryLabel(resolvedWheel)}</strong>
									{#if resolvedWheelDetail}
										<em>{resolvedWheelDetail}</em>
									{/if}
								</div>
							{/if}
						</div>
					{:else if meta.kind === 'bonus'}
						<div class="symbol-shell">
							<div
								class:symbol-tile-shell={true}
								class:symbol-tile-shell-bonus={true}
								class:symbol-tile-shell-bonus-triggered={bonusTriggeredAtPosition(rowIndex, columnIndex)}
							>
								<img class="scatter-symbol" src={bonusSymbolAssets.scatter} alt={meta.label} />
								{#if bonusTriggeredAtPosition(rowIndex, columnIndex) && activeBonusTrigger}
									<div class="scatter-trigger-flare" aria-hidden="true">
										<span>Scatter</span>
										<strong>{activeBonusTrigger.count}</strong>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<div class="symbol-shell">
							<div class={`symbol-tile-shell symbol-tile-shell-${meta.tier}`}>
								<img
									class="symbol-art symbol-art-sheet"
									src={symbolArtAssets[symbol as RegularSymbolId]}
									alt={meta.label}
								/>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/each}
		{#if activeWheelState}
			{@const activeWheelPoint = wheelOverlayPosition(activeWheelState)}
			<div
				class:wheel-overlay={true}
				class:red-overlay={activeWheelState.type === 'red'}
				style={activeWheelState.type === 'blue'
					? `left:${activeWheelPoint.x}px; top:${activeWheelPoint.y}px; ${blueWheelOverlayStyle}`
					: `left:${activeWheelPoint.x}px; top:${activeWheelPoint.y}px; ${redWheelOverlayStyle}`}
			>
				{#if activeWheelState.type === 'blue'}
					<div class="wheel-stack wheel-overlay-stack">
						<BlueSingleWheel scale="overlay" phase={activeWheelState.phase} />
					</div>
				{:else}
					<div class="wheel-stack wheel-overlay-stack wheel-overlay-stack-red">
						<RedDualWheel scale="overlay" phase={activeWheelState.phase} />
					</div>
				{/if}

				<div class="wheel-overlay-panel">
					<span>{activeWheelState.type === 'blue' ? 'Blue Wheel' : 'Red Wheel'}</span>
					<strong>{wheelMessage.title}</strong>
					<em>{wheelMessage.detail}</em>
				</div>

				{#if activeWheelState.type === 'blue' && activeWheelState.phase === 'blue-locked'}
					<div class="wheel-stop-banner wheel-stop-banner-blue">
						<span>Result</span><strong>{formatMultiplier(activeWheelState.total)}</strong>
					</div>
				{:else if activeWheelState.type === 'red' && activeWheelState.phase === 'red-outer-locked'}
					<div class="wheel-stop-banner wheel-stop-banner-red">
						<span>Outer</span><strong>{formatMultiplier(activeWheelState.outer ?? 0)}</strong>
					</div>
				{:else if activeWheelState.type === 'red' && activeWheelState.phase === 'red-locked'}
					<div class="wheel-stop-banner wheel-stop-banner-red">
						<span>Final</span><strong>{formatMultiplier(activeWheelState.total)}</strong><em
							>{formatMultiplier(activeWheelState.outer ?? 0)} x {formatMultiplier(
								activeWheelState.inner ?? 0,
							)}</em
						>
					</div>
				{/if}
			</div>
		{/if}
		{#each wheelResultBursts as wheelResultBurst (wheelResultBurst.id)}
			{@const burstPoint = wheelBurstPosition(wheelResultBurst)}
			<div
				class:wheel-result-burst={true}
				class:wheel-result-burst-blue={wheelResultBurst.type === 'blue'}
				class:wheel-result-burst-red={wheelResultBurst.type === 'red'}
				style={`left:${burstPoint.x}px; top:${burstPoint.y}px;`}
			>
				<strong>{formatMultiplier(wheelResultBurst.total)}</strong>
				{#if wheelResultBurst.type === 'red'}
					<em>
						{formatMultiplier(wheelResultBurst.outer ?? 0)} x
						{formatMultiplier(wheelResultBurst.inner ?? 0)}
					</em>
				{:else}
					<em>wheel value</em>
				{/if}
			</div>
		{/each}
		{#if activeLine && activeLinePath}
			<svg
				class="payline-overlay"
				class:payline-overlay-quiet={activeLineTone === 'small'}
				class:payline-overlay-big={activeLineTone === 'big'}
				class:payline-overlay-wheel={activeLine.wheels.length > 0}
				viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
				aria-label={`Winning line ${activeLine.lineNumber}`}
			>
				{#if activeLineTone !== 'small'}
					<path class="payline-glow" d={activeLinePath} />
				{/if}
				<path class="payline-stroke" d={activeLinePath} />
				{#if activeLine.wheels.length > 0}
					<path class="payline-wheel-trace" d={activeLinePath} />
					{#each activeLine.wheels as wheel}
						{@const point = boardPoint(wheel.row, wheel.column)}
						{#key lineWheelBurstKey(activeLine, wheel)}
							<g
								class:payline-wheel-pulse={true}
								class:payline-wheel-pulse-blue={wheel.type === 'blue'}
								class:payline-wheel-pulse-red={wheel.type === 'red'}
							>
								<circle class="payline-wheel-halo" cx={point.x} cy={point.y} r="18" />
								<circle
									class="payline-wheel-halo payline-wheel-halo-delayed"
									cx={point.x}
									cy={point.y}
									r="18"
								/>
								<circle class="payline-wheel-core" cx={point.x} cy={point.y} r="11" />
							</g>
						{/key}
					{/each}
				{/if}
				{#if activeLineTone !== 'small'}
					{#each activeLinePoints as point}
						<circle class="payline-node" cx={point.x} cy={point.y} r="10" />
					{/each}
				{/if}
			</svg>
		{/if}
		{#if activeLine && activePayoutPoint}
			<div
				class:payout-chip={true}
				class:payout-chip-quiet={activeLineTone === 'small'}
				class:payout-chip-big={activeLineTone === 'big'}
				style={`left:${activePayoutPoint.x}px; top:${activePayoutPoint.y - 40}px;`}
			>
				<span>Line {activeLine.lineNumber}</span><strong>{formatCurrency(activeLine.payout)}</strong>
				{#if activeLine.wheels.length}
					<em class="payout-chip-wheel-note">{wheelLineSummary(activeLine)}</em>
				{/if}
				{#if activeLineTone !== 'small'}
					<em>{formatMultiplier(activeLine.totalMultiplier)}</em>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.board-frame {
		--symbol-size: 92px;
		--board-scan-opacity: 0;
		--board-scan-duration: 0ms;
		--board-scan-height: 22%;
		--spin-saturate: 0.72;
		--spin-blur: 0.6px;
		--spin-shift: 6px;
		--spin-scale: 0.985;
		--land-duration: 220ms;
		--land-start-y: 8px;
		--land-overshoot-y: -2px;
		--land-start-scale: 0.97;
		--land-overshoot-scale: 1.01;
		--silver-land-duration: 150ms;
		--gold-land-duration: 250ms;
		--gold-shine-duration: 250ms;
		--blue-wheel-land-duration: 220ms;
		--red-wheel-land-duration: 340ms;
		--red-wheel-land-delay: 70ms;
		--board-aura: rgba(68, 121, 255, 0.22);
		--board-border: rgba(160, 140, 90, 0.5);
		--frame-cool: rgba(80, 140, 220, 0.12);
		--frame-warm: rgba(220, 150, 80, 0.14);
		position: relative;
		display: grid;
		place-items: center;
		width: calc(var(--board-width) + 100px);
		min-width: calc(var(--board-width) + 100px);
		max-width: 100%;
		margin: 0 auto;
		padding: 60px 44px 56px;
		border-radius: 6px;
		overflow: visible;
		/* Ornate gold frame — multi-layer border with embossed look */
		background:
			/* Etched pattern overlay */
			repeating-linear-gradient(
				90deg,
				transparent,
				transparent 18px,
				rgba(180, 150, 80, 0.04) 18px,
				rgba(180, 150, 80, 0.04) 19px
			),
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 18px,
				rgba(180, 150, 80, 0.04) 18px,
				rgba(180, 150, 80, 0.04) 19px
			),
			/* Gold frame body — warm metallic gradient */
			linear-gradient(180deg,
				rgb(195, 160, 80) 0%,
				rgb(165, 130, 55) 6%,
				rgb(140, 105, 40) 15%,
				rgb(110, 80, 30) 30%,
				rgb(95, 70, 28) 50%,
				rgb(110, 80, 30) 70%,
				rgb(140, 105, 40) 85%,
				rgb(165, 130, 55) 94%,
				rgb(195, 160, 80) 100%
			);
		border: 3px solid rgb(85, 65, 25);
		box-shadow:
			/* Inner gold bevel */
			inset 0 2px 0 rgba(240, 210, 130, 0.5),
			inset 0 -2px 0 rgba(60, 40, 10, 0.6),
			inset 2px 0 0 rgba(200, 170, 90, 0.3),
			inset -2px 0 0 rgba(200, 170, 90, 0.3),
			/* Inner shadow on board well */
			inset 0 8px 20px rgba(0, 0, 0, 0.4),
			/* Outer dark border */
			0 0 0 2px rgb(45, 32, 12),
			0 0 0 5px rgb(130, 100, 40),
			0 0 0 7px rgb(55, 40, 15),
			/* Drop shadow */
			0 20px 60px rgba(0, 0, 0, 0.7),
			0 8px 24px rgba(0, 0, 0, 0.5);
	}

	/* ── Velvet backdrop (red left, blue right) ── */
	.frame-velvet {
		position: absolute;
		/* Match the board area: top and bottom align with where cells begin */
		inset: 36px 32px;
		display: flex;
		border-radius: 4px;
		overflow: hidden;
		z-index: -1;
	}

	.frame-velvet-red {
		flex: 1;
		background:
			/* Velvet sheen — cross-light to simulate fabric */
			radial-gradient(ellipse 90% 55% at 25% 20%, rgba(210, 90, 55, 0.5), transparent 55%),
			radial-gradient(ellipse 60% 70% at 75% 80%, rgba(140, 35, 18, 0.35), transparent 50%),
			radial-gradient(ellipse 40% 40% at 50% 50%, rgba(100, 28, 14, 0.25), transparent 70%),
			linear-gradient(155deg,
				rgb(165, 58, 34) 0%,
				rgb(140, 44, 24) 25%,
				rgb(115, 32, 16) 50%,
				rgb(88, 22, 11) 75%,
				rgb(68, 16, 8) 100%
			);
	}

	.frame-velvet-blue {
		flex: 1;
		background:
			radial-gradient(ellipse 90% 55% at 75% 20%, rgba(70, 130, 220, 0.5), transparent 55%),
			radial-gradient(ellipse 60% 70% at 25% 80%, rgba(24, 52, 130, 0.35), transparent 50%),
			radial-gradient(ellipse 40% 40% at 50% 50%, rgba(18, 36, 90, 0.25), transparent 70%),
			linear-gradient(205deg,
				rgb(48, 82, 158) 0%,
				rgb(34, 60, 122) 25%,
				rgb(22, 42, 94) 50%,
				rgb(14, 28, 68) 75%,
				rgb(9, 18, 48) 100%
			);
	}

	/* ── Crown clasp at top center ── */
	.frame-crown {
		position: absolute;
		top: -36px;
		left: 50%;
		transform: translateX(-50%);
		width: 64px;
		height: 44px;
		z-index: 5;
		background:
			/* Crown arch shape */
			radial-gradient(ellipse 80% 50% at 50% 60%,
				rgb(200, 170, 90) 0%,
				rgb(160, 130, 55) 40%,
				rgb(120, 90, 35) 70%,
				transparent 72%
			);
		border-radius: 50% 50% 10% 10%;
		border: 2px solid rgb(85, 65, 25);
		box-shadow:
			inset 0 2px 4px rgba(240, 210, 130, 0.4),
			inset 0 -2px 4px rgba(40, 25, 8, 0.5),
			0 4px 12px rgba(0, 0, 0, 0.5);
	}

	.frame-crown::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background:
			radial-gradient(circle at 40% 35%,
				rgb(240, 220, 150),
				rgb(180, 150, 70) 50%,
				rgb(120, 90, 35) 100%
			);
		border: 2px solid rgb(100, 75, 30);
		box-shadow:
			inset 0 1px 2px rgba(255, 240, 180, 0.5),
			0 1px 4px rgba(0, 0, 0, 0.4);
	}

	/* ── Scroll bar cylinders (top & bottom) ── */
	.frame-scroll {
		position: absolute;
		left: -24px;
		right: -24px;
		height: 48px;
		z-index: 4;
		border-radius: 24px;
		/* 3-D cylindrical look: bright highlight on top, shadow beneath */
		background:
			linear-gradient(180deg,
				rgba(240, 210, 140, 0.55) 0%,
				rgba(240, 210, 140, 0.0) 18%,
				transparent 35%,
				transparent 60%,
				rgba(20, 12, 2, 0.28) 82%,
				rgba(20, 12, 2, 0.45) 100%
			),
			linear-gradient(180deg,
				rgb(210, 175, 90) 0%,
				rgb(175, 138, 58) 18%,
				rgb(130, 98, 34) 42%,
				rgb(105, 76, 26) 58%,
				rgb(130, 100, 38) 78%,
				rgb(175, 140, 62) 92%,
				rgb(205, 168, 82) 100%
			);
		border: 2px solid rgb(72, 52, 16);
		box-shadow:
			/* Cylinder highlight */
			inset 0 3px 0 rgba(255, 240, 180, 0.45),
			inset 0 5px 10px rgba(240, 210, 130, 0.18),
			/* Cylinder underside shadow */
			inset 0 -3px 0 rgba(20, 10, 2, 0.5),
			/* Drop shadow */
			0 6px 20px rgba(0, 0, 0, 0.55),
			0 2px 6px rgba(0, 0, 0, 0.35);
	}

	.frame-scroll-top { top: -28px; }
	.frame-scroll-bottom { bottom: -28px; }

	/* Spherical gold knob end caps */
	.frame-scroll-cap {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 58px;
		height: 58px;
		border-radius: 50%;
		background:
			/* Specular highlight */
			radial-gradient(circle at 38% 30%,
				rgba(255, 248, 200, 0.9) 0%,
				rgba(240, 210, 130, 0.6) 18%,
				transparent 40%
			),
			/* Main sphere gradient */
			radial-gradient(circle at 42% 38%,
				rgb(240, 210, 130) 0%,
				rgb(200, 165, 75) 28%,
				rgb(155, 118, 40) 55%,
				rgb(110, 80, 25) 80%,
				rgb(72, 52, 16) 100%
			);
		border: 2px solid rgb(62, 44, 12);
		box-shadow:
			/* Inner bevel highlight */
			inset 0 2px 4px rgba(255, 248, 200, 0.4),
			inset 2px 0 4px rgba(255, 240, 160, 0.18),
			/* Inner shadow bottom-right */
			inset -2px -3px 6px rgba(20, 10, 2, 0.5),
			/* Drop shadow */
			0 4px 14px rgba(0, 0, 0, 0.55),
			0 1px 4px rgba(0, 0, 0, 0.35);
	}

	.frame-scroll-cap-left { left: -29px; }
	.frame-scroll-cap-right { right: -29px; }

	/* Rope-groove etching on scroll cylinders */
	.frame-scroll::before {
		content: '';
		position: absolute;
		inset: 8px 40px;
		border-radius: 16px;
		background:
			repeating-linear-gradient(
				90deg,
				transparent,
				transparent 10px,
				rgba(60, 42, 10, 0.22) 10px,
				rgba(60, 42, 10, 0.22) 11px,
				transparent 11px,
				transparent 14px,
				rgba(220, 185, 95, 0.10) 14px,
				rgba(220, 185, 95, 0.10) 15px
			);
	}

	.board-frame-dead {
		--spin-saturate: 0.82;
		--spin-blur: 0.22px;
		--spin-shift: 2px;
		--spin-scale: 0.994;
		--land-duration: 120ms;
		--land-start-y: 3px;
		--land-overshoot-y: -1px;
		--land-start-scale: 0.992;
		--land-overshoot-scale: 1.006;
		--silver-land-duration: 110ms;
		--gold-land-duration: 160ms;
		--gold-shine-duration: 160ms;
		--blue-wheel-land-duration: 150ms;
		--red-wheel-land-duration: 220ms;
		--red-wheel-land-delay: 30ms;
		--board-aura: rgba(68, 121, 255, 0.14);
		--board-border: rgba(140, 120, 70, 0.35);
	}

	.board-frame-feature {
		--spin-saturate: 0.66;
		--spin-blur: 1px;
		--spin-shift: 10px;
		--spin-scale: 0.978;
		--land-duration: 280ms;
		--land-start-y: 10px;
		--land-overshoot-y: -3px;
		--land-start-scale: 0.962;
		--land-overshoot-scale: 1.016;
		--silver-land-duration: 180ms;
		--gold-land-duration: 320ms;
		--gold-shine-duration: 320ms;
		--blue-wheel-land-duration: 260ms;
		--red-wheel-land-duration: 420ms;
		--red-wheel-land-delay: 90ms;
		--board-scan-opacity: 0.58;
		--board-scan-duration: 720ms;
		--board-aura: rgba(74, 144, 255, 0.28);
		--board-border: rgba(120, 160, 220, 0.35);
	}

	.board-frame-big {
		--spin-saturate: 0.6;
		--spin-blur: 1.2px;
		--spin-shift: 12px;
		--spin-scale: 0.972;
		--land-duration: 340ms;
		--land-start-y: 12px;
		--land-overshoot-y: -4px;
		--land-start-scale: 0.956;
		--land-overshoot-scale: 1.024;
		--silver-land-duration: 200ms;
		--gold-land-duration: 360ms;
		--gold-shine-duration: 360ms;
		--blue-wheel-land-duration: 280ms;
		--red-wheel-land-duration: 460ms;
		--red-wheel-land-delay: 110ms;
		--board-scan-opacity: 0.66;
		--board-scan-duration: 820ms;
		--board-aura: rgba(255, 98, 74, 0.18);
		--board-border: rgba(220, 140, 80, 0.4);
	}

	.board {
		position: relative;
		display: grid;
		width: fit-content;
		margin: 0 auto;
		padding: 6px;
		border-radius: 4px;
		overflow: visible;
		/* Velvet gradient directly on the board — red left, blue right */
		/* Copying the exact gradient from ArtBoardRuntime for colour accuracy */
		background:
			radial-gradient(circle at 20% 22%, rgba(255, 154, 90, 0.18), transparent 34%),
			radial-gradient(circle at 78% 20%, rgba(162, 198, 255, 0.16), transparent 34%),
			linear-gradient(90deg,
				#6e1d11 0%,
				#892818 18%,
				#7b2a1a 39%,
				#6a2620 51%,
				#45587f 66%,
				#24375e 82%,
				#182b4b 100%
			);
		/* Gold inner border around the cell area */
		box-shadow:
			inset 0 0 0 3px rgb(160, 128, 48),
			inset 0 0 0 5px rgb(80, 58, 18),
			inset 0 4px 16px rgba(0, 0, 0, 0.35),
			inset 0 -4px 16px rgba(0, 0, 0, 0.25);
	}

	.board::before {
		content: '';
		position: absolute;
		inset: 8px;
		border-radius: 22px;
		background:
			radial-gradient(circle at center, rgba(6, 15, 24, 0) 0%, rgba(6, 15, 24, 0.44) 100%),
			linear-gradient(180deg, rgba(3, 8, 14, 0.18), rgba(3, 8, 14, 0.38));
		opacity: 0;
		pointer-events: none;
		transition: opacity 180ms ease;
		z-index: 1;
	}

	.board::after {
		content: '';
		position: absolute;
		inset: 10px;
		border-radius: 20px;
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgba(255, 255, 255, 0.02) 28%,
			rgba(122, 205, 255, 0.22) 50%,
			rgba(255, 255, 255, 0.02) 72%,
			transparent 100%
		);
		opacity: 0;
		pointer-events: none;
		transform: translateY(-125%);
		mix-blend-mode: screen;
		z-index: 1;
	}

	.board-focus-line::before {
		opacity: 0.24;
	}

	.board-focus-wheel::before {
		opacity: 0.4;
	}

	.board-active-feature::after,
	.board-active-big::after {
		opacity: var(--board-scan-opacity);
		animation: boardSweep var(--board-scan-duration) linear infinite;
	}

	.cell {
		position: relative;
		display: grid;
		place-items: center;
		width: 104px;
		height: 104px;
		border-radius: 8px;
		/* Fully transparent — velvet from .board shows through each cell */
		background: transparent;
		/* Gold divider border — ornamental grid look */
		border: 2px solid rgb(180, 145, 55);
		box-shadow:
			/* Very subtle inner outline for depth */
			inset 0 0 0 1px rgba(240, 210, 130, 0.25),
			/* Outer gold separator line between cells */
			0 0 0 1px rgb(90, 68, 20);
		overflow: visible;
		transition:
			transform 0.22s ease,
			box-shadow 0.22s ease,
			filter 0.22s ease,
			opacity 0.18s ease;
		z-index: 0;
	}

	.cell::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 6px;
		/* Very subtle top sheen only */
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 30%);
		pointer-events: none;
	}

	.cell-spinning {
		transform: translateY(var(--spin-shift)) scale(var(--spin-scale));
		filter: saturate(var(--spin-saturate)) blur(var(--spin-blur));
	}

	.cell-braking {
		transform: translateY(calc(var(--spin-shift) * 0.3)) scale(calc(var(--spin-scale) + 0.01));
		filter: saturate(calc(var(--spin-saturate) + 0.08)) blur(calc(var(--spin-blur) * 0.24))
			brightness(1.04);
		box-shadow:
			0 0 0 1px rgba(187, 229, 255, 0.12),
			0 0 24px color-mix(in srgb, var(--cell-glow) 34%, transparent),
			0 18px 28px rgba(0, 0, 0, 0.26);
	}

	.cell-landing {
		animation: landPulse var(--land-duration) cubic-bezier(0.22, 1, 0.36, 1);
	}

	.cell-sticky-locked {
		transform: translateY(0) scale(1);
		filter: none;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.05),
			0 0 20px color-mix(in srgb, var(--cell-glow) 18%, transparent),
			0 18px 26px rgba(0, 0, 0, 0.24);
	}

	.cell-sticky-locked::before {
		opacity: 0.96;
		background:
			radial-gradient(circle at 50% 28%, rgba(255, 255, 255, 0.04), transparent 44%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.018), rgba(0, 0, 0, 0.16));
	}

	.cell-highlighted {
		transform: translateY(-2px) scale(1.03);
		box-shadow:
			0 0 0 2px rgba(255, 255, 255, 0.08),
			0 0 26px var(--cell-glow),
			0 22px 32px rgba(0, 0, 0, 0.3);
	}

	.cell-muted {
		opacity: 0.34;
		transform: scale(0.97);
		filter: saturate(0.56) brightness(0.78);
	}

	.cell-highlighted-quiet {
		transform: translateY(-1px) scale(1.015);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.07),
			0 0 14px color-mix(in srgb, var(--cell-glow) 34%, transparent),
			0 16px 24px rgba(0, 0, 0, 0.26);
	}

	.cell-highlighted-big {
		transform: translateY(-3px) scale(1.042);
		box-shadow:
			0 0 0 2px rgba(255, 255, 255, 0.1),
			0 0 34px color-mix(in srgb, var(--cell-glow) 84%, transparent),
			0 24px 36px rgba(0, 0, 0, 0.34);
	}

	.cell-anticipation-premium,
	.cell-anticipation-wheel {
		animation: anticipationPulse 760ms ease-in-out infinite;
	}

	.cell-anticipation-premium {
		box-shadow:
			0 0 0 1px rgba(255, 226, 176, 0.08),
			0 0 20px color-mix(in srgb, var(--cell-glow) 26%, transparent);
	}

	.cell-anticipation-wheel {
		box-shadow:
			0 0 0 1px rgba(176, 231, 255, 0.1),
			0 0 28px color-mix(in srgb, var(--cell-glow) 42%, transparent),
			0 12px 22px rgba(0, 0, 0, 0.2);
	}

	.cell-highlighted,
	.cell-highlighted-quiet,
	.cell-highlighted-big,
	.cell-wheel-active {
		z-index: 3;
	}

	.symbol-shell {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
	}

	.symbol-tile-shell {
		position: relative;
		width: var(--symbol-size);
		height: var(--symbol-size);
		display: grid;
		place-items: center;
		border-radius: 18px;
		overflow: hidden;
		will-change: transform, filter;
		transition:
			transform 220ms ease,
			filter 220ms ease,
			opacity 160ms ease;
	}

	.symbol-tile-shell::after {
		content: '';
		position: absolute;
		inset: -8px;
		background: linear-gradient(
			112deg,
			transparent 22%,
			rgba(255, 255, 255, 0.04) 38%,
			rgba(255, 255, 255, 0.32) 50%,
			rgba(255, 255, 255, 0.04) 62%,
			transparent 78%
		);
		transform: translateX(-140%) skewX(-20deg);
		opacity: 0;
		pointer-events: none;
	}

	.symbol-tile-shell-gold {
		filter: drop-shadow(0 18px 26px rgba(193, 135, 28, 0.24))
			drop-shadow(0 4px 10px rgba(255, 215, 132, 0.08));
	}

	.symbol-tile-shell-silver {
		filter: drop-shadow(0 18px 26px rgba(102, 120, 146, 0.22))
			drop-shadow(0 4px 10px rgba(220, 232, 246, 0.06));
	}

	.symbol-tile-shell-gold .symbol-art {
		filter: brightness(1.02) saturate(1.03) contrast(1.04)
			drop-shadow(0 16px 22px rgba(0, 0, 0, 0.26)) drop-shadow(0 2px 4px rgba(255, 214, 124, 0.14));
	}

	.symbol-tile-shell-silver .symbol-art {
		filter: brightness(0.94) saturate(0.92) contrast(1.06)
			drop-shadow(0 16px 22px rgba(0, 0, 0, 0.24)) drop-shadow(0 2px 4px rgba(221, 232, 245, 0.12));
	}

	.symbol-tile-shell-wood {
		filter: drop-shadow(0 18px 26px rgba(128, 84, 34, 0.22))
			drop-shadow(0 4px 10px rgba(255, 205, 150, 0.05));
	}

	.symbol-tile-shell-wood .symbol-art {
		filter: saturate(1.02) contrast(1.08) drop-shadow(0 16px 22px rgba(0, 0, 0, 0.26))
			drop-shadow(0 2px 4px rgba(255, 201, 143, 0.08));
	}

	/* ── Scatter / Bonus Symbol ── */
	.symbol-tile-shell-bonus {
		position: relative;
		width: var(--symbol-size);
		height: var(--symbol-size);
		display: grid;
		place-items: center;
		border-radius: 14px;
		overflow: visible;
		filter: drop-shadow(0 0 14px rgba(255, 183, 78, 0.5)) drop-shadow(0 18px 28px rgba(0, 0, 0, 0.3));
		transition: filter 240ms ease, transform 240ms ease;
	}

	.symbol-tile-shell-bonus-triggered {
		filter: drop-shadow(0 0 22px rgba(255, 195, 80, 0.82)) drop-shadow(0 0 48px rgba(255, 150, 40, 0.4)) drop-shadow(0 18px 28px rgba(0, 0, 0, 0.26));
		transform: scale(1.06);
		animation: scatterTriggerPulse 1.4s ease-in-out infinite;
	}

	.scatter-symbol {
		width: var(--symbol-size);
		height: var(--symbol-size);
		object-fit: contain;
		position: relative;
		z-index: 1;
	}

	.scatter-trigger-flare {
		position: absolute;
		bottom: -28px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		padding: 3px 8px 4px;
		border-radius: 8px;
		background: linear-gradient(135deg, rgba(255, 180, 60, 0.95), rgba(220, 130, 20, 0.95));
		border: 1px solid rgba(255, 220, 120, 0.5);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4), 0 0 18px rgba(255, 170, 40, 0.3);
		white-space: nowrap;
		z-index: 5;
		animation: scatterFlareEnter 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.scatter-trigger-flare span {
		font-size: 0.54rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(80, 40, 5, 0.82);
	}

	.scatter-trigger-flare strong {
		font-size: 1.1rem;
		font-weight: 900;
		color: rgba(40, 20, 2, 0.92);
		line-height: 1;
	}

	@keyframes scatterTriggerPulse {
		0%, 100% { filter: drop-shadow(0 0 22px rgba(255, 195, 80, 0.82)) drop-shadow(0 0 48px rgba(255, 150, 40, 0.4)) drop-shadow(0 18px 28px rgba(0, 0, 0, 0.26)); }
		50% { filter: drop-shadow(0 0 32px rgba(255, 215, 100, 1)) drop-shadow(0 0 64px rgba(255, 170, 50, 0.6)) drop-shadow(0 18px 28px rgba(0, 0, 0, 0.22)); }
	}

	@keyframes scatterFlareEnter {
		from { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.86); }
		to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
	}

	.symbol-art {
		width: var(--symbol-size);
		height: var(--symbol-size);
		object-fit: contain;
		position: relative;
		z-index: 1;
		filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.24))
			drop-shadow(0 2px 4px rgba(255, 255, 255, 0.03));
	}

	.symbol-art-sheet {
		width: var(--symbol-size);
		height: var(--symbol-size);
	}

	.cell-highlighted .symbol-tile-shell {
		transform: translateY(-1px) scale(1.03);
		filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.12));
	}

	.cell-highlighted-quiet .symbol-tile-shell,
	.cell-highlighted-quiet .wheel-tile-shell {
		transform: translateY(0) scale(1.01);
		filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.08));
	}

	.cell-highlighted .symbol-art {
		filter: drop-shadow(0 0 16px color-mix(in srgb, var(--cell-glow) 36%, transparent))
			drop-shadow(0 10px 16px rgba(0, 0, 0, 0.28));
	}

	.cell-highlighted .symbol-tile-shell-silver .symbol-art {
		filter: brightness(0.96) saturate(0.98) contrast(1.04)
			drop-shadow(0 0 16px color-mix(in srgb, var(--cell-glow) 28%, transparent))
			drop-shadow(0 10px 16px rgba(0, 0, 0, 0.28));
	}

	.cell-highlighted-quiet .symbol-art,
	.cell-highlighted-quiet .wheel-tile-art {
		filter: drop-shadow(0 0 10px color-mix(in srgb, var(--cell-glow) 24%, transparent))
			drop-shadow(0 8px 14px rgba(0, 0, 0, 0.24));
	}

	.cell-wheel {
		background: transparent;
	}

	.cell-bonus {
		border-color: rgb(200, 140, 50);
		box-shadow:
			inset 0 3px 8px rgba(0, 0, 0, 0.7),
			inset 0 -1px 3px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgb(80, 60, 22),
			0 0 12px rgba(255, 183, 78, 0.15);
	}

	.cell-bonus-triggered {
		border-color: rgb(240, 190, 80);
		box-shadow:
			inset 0 3px 8px rgba(0, 0, 0, 0.5),
			0 0 0 2px rgba(255, 200, 80, 0.3),
			0 0 24px rgba(255, 183, 78, 0.4),
			0 0 48px rgba(255, 150, 40, 0.2);
	}

	.symbol-shell-wheel {
		position: relative;
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		isolation: isolate;
	}

	.wheel-tile-shell {
		position: relative;
		width: var(--symbol-size);
		height: var(--symbol-size);
		display: grid;
		place-items: center;
		will-change: transform, filter;
		transition:
			transform 220ms ease,
			filter 220ms ease,
			opacity 160ms ease;
	}

	.wheel-tile-shell-sticky {
		filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.28))
			drop-shadow(0 0 24px rgba(255, 214, 132, 0.16));
	}

	.wheel-tile-shell-blue {
		filter: drop-shadow(0 14px 22px rgba(20, 84, 194, 0.22));
	}

	.wheel-tile-shell-red {
		filter: drop-shadow(0 14px 22px rgba(194, 64, 20, 0.22));
	}

	.wheel-tile-shell-hidden {
		opacity: 0;
		transform: scale(0.56);
		filter: none;
	}

	.wheel-tile-art {
		position: relative;
		width: var(--symbol-size);
		height: var(--symbol-size);
		object-fit: contain;
		filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.26));
	}

	.wheel-result-chip {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 12;
		display: grid;
		justify-items: center;
		gap: 2px;
		min-width: 82px;
		padding: 9px 12px 8px;
		border-radius: 18px;
		transform: translate(-50%, -52%);
		background: linear-gradient(180deg, rgba(7, 16, 25, 0.98), rgba(4, 10, 18, 0.96));
		border: 1px solid rgba(255, 255, 255, 0.14);
		box-shadow:
			0 16px 24px rgba(0, 0, 0, 0.34),
			0 0 22px rgba(4, 11, 18, 0.28),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(8px);
		animation: wheelResultReveal 320ms cubic-bezier(0.18, 0.88, 0.32, 1);
	}

	.wheel-result-chip strong {
		font-size: 1.08rem;
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.04em;
		color: #f4f9ff;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
	}

	.wheel-result-chip em {
		font-style: normal;
		font-size: 0.62rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(204, 225, 245, 0.78);
	}

	.wheel-result-chip-blue {
		border-color: rgba(110, 201, 255, 0.24);
		box-shadow:
			0 14px 20px rgba(0, 0, 0, 0.3),
			0 0 20px rgba(64, 156, 255, 0.16),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.wheel-result-chip-red {
		border-color: rgba(255, 131, 105, 0.24);
		box-shadow:
			0 14px 20px rgba(0, 0, 0, 0.3),
			0 0 20px rgba(255, 96, 74, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.wheel-result-chip-highlighted {
		transform: translate(-50%, -56%) scale(1.1);
		animation: wheelChipFocusPulse 520ms cubic-bezier(0.18, 0.88, 0.32, 1) both;
		box-shadow:
			0 18px 28px rgba(0, 0, 0, 0.36),
			0 0 26px color-mix(in srgb, var(--cell-glow) 52%, transparent),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.wheel-result-chip-highlighted strong {
		color: #ffffff;
	}

	.wheel-result-chip-sticky {
		background:
			linear-gradient(180deg, rgba(8, 18, 28, 0.98), rgba(5, 12, 20, 0.96)),
			radial-gradient(circle at top, rgba(255, 223, 138, 0.1), transparent 58%);
		border-color: rgba(255, 225, 154, 0.2);
		box-shadow:
			0 18px 26px rgba(0, 0, 0, 0.34),
			0 0 24px rgba(255, 214, 132, 0.14),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.wheel-line-burst {
		position: absolute;
		left: 50%;
		top: -6px;
		z-index: 10;
		display: grid;
		justify-items: center;
		gap: 2px;
		min-width: 92px;
		padding: 6px 10px 7px;
		border-radius: 16px;
		pointer-events: none;
		transform: translate(-50%, -100%);
		background: rgba(7, 16, 25, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			0 14px 24px rgba(0, 0, 0, 0.34),
			0 0 18px rgba(90, 178, 255, 0.14);
		animation: wheelLineBurst 560ms cubic-bezier(0.18, 0.88, 0.32, 1) both;
	}

	.wheel-line-burst span {
		font-size: 0.56rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(184, 214, 241, 0.72);
	}

	.wheel-line-burst strong {
		font-size: 1rem;
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.03em;
		color: #f9fcff;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.26);
	}

	.wheel-line-burst em {
		font-style: normal;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(208, 228, 245, 0.76);
	}

	.wheel-line-burst-blue {
		border-color: rgba(121, 206, 255, 0.18);
		box-shadow:
			0 14px 24px rgba(0, 0, 0, 0.34),
			0 0 18px rgba(90, 178, 255, 0.16);
	}

	.wheel-line-burst-blue strong {
		color: #97eaff;
	}

	.wheel-line-burst-red {
		border-color: rgba(255, 142, 102, 0.18);
		box-shadow:
			0 14px 24px rgba(0, 0, 0, 0.34),
			0 0 18px rgba(255, 118, 88, 0.18);
	}

	.wheel-line-burst-red strong {
		color: #ffd981;
	}

	.cell-highlighted .wheel-tile-shell {
		transform: translateY(-1px) scale(1.03);
		filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.1));
	}

	.cell-highlighted .wheel-tile-art {
		filter: drop-shadow(0 0 16px color-mix(in srgb, var(--cell-glow) 36%, transparent))
			drop-shadow(0 10px 18px rgba(0, 0, 0, 0.28));
	}

	.cell[data-tier='silver'].cell-landing .symbol-tile-shell {
		animation: silverSymbolPulse var(--silver-land-duration) ease both;
	}

	.cell[data-tier='gold'].cell-landing .symbol-tile-shell {
		animation: goldSymbolSettle var(--gold-land-duration) cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.cell[data-tier='gold'].cell-landing .symbol-tile-shell::after {
		animation: goldShineSweep var(--gold-shine-duration) ease-out both;
	}

	.cell[data-tier='wheel'][data-symbol='blueWheel'].cell-landing .wheel-tile-shell {
		animation: blueWheelTilePop var(--blue-wheel-land-duration) cubic-bezier(0.2, 0.9, 0.28, 1.1)
			both;
	}

	.cell[data-tier='wheel'][data-symbol='redWheel'].cell-landing .wheel-tile-shell {
		animation: redWheelTilePop var(--red-wheel-land-duration) cubic-bezier(0.18, 0.88, 0.28, 1.16)
			var(--red-wheel-land-delay) both;
	}

	.payline-overlay {
		position: absolute;
		inset: 12px;
		width: calc(100% - 24px);
		height: calc(100% - 24px);
		pointer-events: none;
		overflow: visible;
	}

	.payline-glow,
	.payline-stroke {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.payline-glow {
		stroke: rgba(88, 220, 255, 0.36);
		stroke-width: 20;
		filter: blur(7px);
	}

	.payline-stroke {
		stroke: #7fe8ff;
		stroke-width: 6;
		stroke-dasharray: 18 16;
		animation:
			dashFlow 0.8s linear infinite,
			pathPulse 1.25s ease-in-out infinite;
	}

	.payline-wheel-trace {
		fill: none;
		stroke: rgba(255, 244, 176, 0.92);
		stroke-width: 5;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 14 18;
		filter: drop-shadow(0 0 10px rgba(255, 224, 123, 0.24));
		animation:
			wheelTraceFlow 0.72s linear infinite,
			wheelTracePulse 0.7s ease-out infinite;
	}

	.payline-node {
		fill: #fff4b3;
		stroke: #fff;
		stroke-width: 4;
		filter: drop-shadow(0 0 8px rgba(255, 223, 127, 0.66));
	}

	.payline-wheel-pulse {
		transform-origin: center;
	}

	.payline-wheel-halo {
		fill: none;
		stroke-width: 4;
		animation: wheelHaloPulse 760ms ease-out both;
	}

	.payline-wheel-halo-delayed {
		animation-delay: 110ms;
	}

	.payline-wheel-core {
		stroke: rgba(255, 255, 255, 0.92);
		stroke-width: 3;
		animation: wheelCorePulse 520ms cubic-bezier(0.18, 0.88, 0.32, 1) both;
	}

	.payline-wheel-pulse-blue .payline-wheel-halo {
		stroke: rgba(121, 223, 255, 0.9);
	}

	.payline-wheel-pulse-blue .payline-wheel-core {
		fill: rgba(52, 164, 255, 0.46);
		filter: drop-shadow(0 0 10px rgba(80, 189, 255, 0.52));
	}

	.payline-wheel-pulse-red .payline-wheel-halo {
		stroke: rgba(255, 178, 118, 0.92);
	}

	.payline-wheel-pulse-red .payline-wheel-core {
		fill: rgba(255, 111, 75, 0.46);
		filter: drop-shadow(0 0 10px rgba(255, 145, 98, 0.52));
	}

	.payline-overlay-quiet .payline-stroke {
		stroke: rgba(158, 236, 255, 0.9);
		stroke-width: 4;
		stroke-dasharray: none;
		animation: quietPathPulse 340ms ease-in-out 2 both;
	}

	.payline-overlay-big .payline-glow {
		stroke-width: 24;
		filter: blur(8px);
	}

	.payline-overlay-big .payline-stroke {
		stroke-width: 7;
	}

	.payline-overlay-wheel .payline-glow {
		stroke: rgba(255, 211, 120, 0.42);
	}

	.payline-overlay-wheel .payline-node {
		filter: drop-shadow(0 0 10px rgba(255, 225, 142, 0.76));
	}

	.payout-chip {
		position: absolute;
		display: grid;
		gap: 3px;
		min-width: 116px;
		padding: 11px 13px;
		border-radius: 18px;
		transform: translate(-50%, -100%);
		background: linear-gradient(180deg, rgba(12, 24, 37, 0.98), rgba(7, 14, 23, 0.98));
		border: 1px solid rgba(113, 206, 255, 0.3);
		box-shadow: 0 20px 36px rgba(0, 0, 0, 0.36);
		pointer-events: none;
		animation: chipBounce 0.34s ease;
	}

	.payout-chip-quiet {
		gap: 2px;
		min-width: 94px;
		padding: 8px 10px;
		border-color: rgba(113, 206, 255, 0.16);
		box-shadow: 0 14px 24px rgba(0, 0, 0, 0.28);
		animation: quietChipRise 0.22s ease;
	}

	.payout-chip-quiet span {
		font-size: 0.68rem;
	}

	.payout-chip-quiet strong {
		font-size: 0.96rem;
	}

	.payout-chip-big {
		box-shadow:
			0 22px 40px rgba(0, 0, 0, 0.38),
			0 0 20px rgba(113, 206, 255, 0.14);
	}

	.payout-chip span,
	.payout-chip em,
	.wheel-overlay-panel span,
	.wheel-overlay-panel em,
	.wheel-stop-banner span,
	.wheel-stop-banner em {
		font-size: 0.74rem;
		font-style: normal;
		color: rgba(178, 214, 245, 0.78);
	}

	.payout-chip strong,
	.wheel-overlay-panel strong,
	.wheel-stop-banner strong {
		font-weight: 800;
	}

	.payout-chip-wheel-note {
		color: rgba(255, 228, 154, 0.9);
	}

	.cell-wheel-active {
		z-index: 12;
		filter: drop-shadow(0 0 24px rgba(111, 196, 255, 0.28));
	}

	.cell-wheel-queued {
		box-shadow:
			0 0 0 2px rgba(255, 255, 255, 0.08),
			0 0 20px rgba(132, 199, 255, 0.22),
			0 14px 26px rgba(0, 0, 0, 0.26);
	}

	.wheel-overlay {
		position: absolute;
		left: 0;
		top: 0;
		display: grid;
		place-items: start center;
		width: max-content;
		pointer-events: none;
		transform: translate(-50%, calc(-50% - 8px));
		transform-origin: center center;
		z-index: 22;
		overflow: visible;
	}

	.red-overlay {
		transform: translate(-50%, calc(-50% - 10px));
	}

	.wheel-stack {
		position: relative;
		display: grid;
		place-items: center;
	}

	.wheel-overlay-stack {
		width: 264px;
		height: 264px;
		animation: wheelPopBlue 460ms cubic-bezier(0.18, 0.88, 0.32, 1) both;
	}

	.wheel-overlay-stack-red {
		width: 286px;
		height: 286px;
		animation: wheelPopRed 500ms cubic-bezier(0.18, 0.88, 0.32, 1) both;
	}

	.wheel-overlay-stack::before {
		content: '';
		position: absolute;
		inset: 10px;
		border-radius: 50%;
		background:
			radial-gradient(
				circle,
				rgba(5, 11, 18, 0.98) 0%,
				rgba(5, 11, 18, 0.92) 48%,
				rgba(5, 11, 18, 0.52) 66%,
				transparent 84%
			),
			radial-gradient(circle, rgba(96, 174, 255, 0.18) 0%, transparent 64%);
		box-shadow:
			0 28px 44px rgba(3, 8, 17, 0.42),
			0 0 26px rgba(58, 122, 255, 0.18);
		transform: scale(1.03);
		z-index: -1;
	}

	.wheel-overlay-stack-red::before {
		inset: 6px;
		background:
			radial-gradient(
				circle,
				rgba(8, 9, 13, 0.98) 0%,
				rgba(8, 9, 13, 0.94) 48%,
				rgba(8, 9, 13, 0.58) 66%,
				transparent 84%
			),
			radial-gradient(circle, rgba(255, 112, 88, 0.22) 0%, transparent 64%);
		box-shadow:
			0 30px 46px rgba(3, 8, 17, 0.44),
			0 0 28px rgba(255, 96, 74, 0.22);
	}

	.wheel-overlay-panel {
		position: absolute;
		bottom: -96px;
		min-width: 186px;
		display: grid;
		justify-items: center;
		gap: 3px;
		padding: 10px 14px;
		border-radius: 16px;
		background: rgba(5, 14, 22, 0.94);
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 18px 30px rgba(0, 0, 0, 0.34);
	}

	.wheel-stop-banner {
		position: absolute;
		top: -24px;
		display: grid;
		justify-items: center;
		gap: 2px;
		padding: 9px 12px;
		border-radius: 16px;
		background: rgba(5, 14, 22, 0.94);
		border: 1px solid rgba(255, 255, 255, 0.14);
		box-shadow: 0 16px 26px rgba(0, 0, 0, 0.3);
		animation: chipBounce 0.28s ease;
	}

	.wheel-stop-banner-blue {
		border-color: rgba(113, 206, 255, 0.3);
	}

	.wheel-stop-banner-red {
		border-color: rgba(255, 129, 104, 0.32);
	}

	.wheel-stop-banner em {
		font-style: normal;
		font-size: 0.72rem;
		color: rgba(210, 228, 247, 0.76);
	}

	.wheel-result-burst {
		position: absolute;
		z-index: 44;
		display: grid;
		justify-items: center;
		gap: 3px;
		min-width: 120px;
		pointer-events: none;
		transform: translate(-50%, -52%);
		animation: wheelValueSettle 640ms cubic-bezier(0.16, 0.84, 0.24, 1) both;
	}

	.wheel-result-burst strong {
		font-size: clamp(2rem, 3.2vw, 3.2rem);
		font-weight: 900;
		line-height: 0.9;
		letter-spacing: -0.06em;
		color: #ffe18a;
		text-shadow:
			0 0 12px rgba(255, 219, 109, 0.52),
			0 3px 0 rgba(94, 49, 4, 0.92),
			0 12px 26px rgba(0, 0, 0, 0.42);
	}

	.wheel-result-burst em {
		padding: 4px 8px;
		border-radius: 999px;
		font-style: normal;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(245, 249, 255, 0.92);
		background: rgba(7, 16, 25, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.26);
	}

	.wheel-result-burst-blue strong {
		color: #8fe4ff;
		text-shadow:
			0 0 12px rgba(98, 211, 255, 0.52),
			0 3px 0 rgba(7, 49, 82, 0.92),
			0 12px 26px rgba(0, 0, 0, 0.42);
	}

	.wheel-result-burst-blue em {
		background: rgba(8, 27, 44, 0.82);
		border-color: rgba(121, 206, 255, 0.16);
	}

	.wheel-result-burst-red strong {
		color: #ffd671;
		text-shadow:
			0 0 12px rgba(255, 180, 83, 0.52),
			0 3px 0 rgba(92, 22, 8, 0.94),
			0 12px 26px rgba(0, 0, 0, 0.42);
	}

	.wheel-result-burst-red em {
		background: rgba(40, 14, 13, 0.84);
		border-color: rgba(255, 142, 102, 0.18);
	}

	@keyframes dashFlow {
		from {
			stroke-dashoffset: 0;
		}

		to {
			stroke-dashoffset: -34;
		}
	}

	@keyframes wheelTraceFlow {
		from {
			stroke-dashoffset: 0;
		}

		to {
			stroke-dashoffset: -32;
		}
	}

	@keyframes wheelTracePulse {
		0%,
		100% {
			opacity: 0.42;
		}

		45% {
			opacity: 0.94;
		}
	}

	@keyframes pathPulse {
		0%,
		100% {
			opacity: 0.78;
		}

		50% {
			opacity: 1;
		}
	}

	@keyframes wheelHaloPulse {
		0% {
			opacity: 0.92;
			transform: scale(0.72);
			stroke-width: 6;
		}

		100% {
			opacity: 0;
			transform: scale(1.72);
			stroke-width: 1.2;
		}
	}

	@keyframes wheelCorePulse {
		0% {
			opacity: 0;
			transform: scale(0.7);
		}

		52% {
			opacity: 1;
			transform: scale(1.16);
		}

		100% {
			opacity: 0.88;
			transform: scale(1);
		}
	}

	@keyframes chipBounce {
		from {
			opacity: 0;
			transform: translate(-50%, -85%) scale(0.88);
		}

		to {
			opacity: 1;
			transform: translate(-50%, -100%) scale(1);
		}
	}

	@keyframes quietChipRise {
		from {
			opacity: 0;
			transform: translate(-50%, -92%) scale(0.94);
		}

		to {
			opacity: 1;
			transform: translate(-50%, -100%) scale(1);
		}
	}

	@keyframes quietPathPulse {
		0%,
		100% {
			opacity: 0.78;
		}

		50% {
			opacity: 1;
		}
	}

	@keyframes wheelResultReveal {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(8px) scale(0.9);
		}

		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0) scale(1);
		}
	}

	@keyframes wheelChipFocusPulse {
		0% {
			transform: translate(-50%, -32%) scale(0.76);
			opacity: 0;
		}

		48% {
			transform: translate(-50%, -60%) scale(1.16);
			opacity: 1;
		}

		100% {
			transform: translate(-50%, -56%) scale(1.1);
			opacity: 1;
		}
	}

	@keyframes wheelLineBurst {
		0% {
			opacity: 0;
			transform: translate(-50%, -70%) scale(0.82);
		}

		52% {
			opacity: 1;
			transform: translate(-50%, -108%) scale(1.08);
		}

		100% {
			opacity: 1;
			transform: translate(-50%, -100%) scale(1);
		}
	}

	@keyframes wheelValueSettle {
		0% {
			opacity: 0;
			transform: translate(-50%, -18%) scale(0.54) rotate(-6deg);
			filter: blur(10px);
		}

		34% {
			opacity: 1;
			transform: translate(-50%, -66%) scale(1.18) rotate(2deg);
			filter: blur(0);
		}

		72% {
			opacity: 1;
			transform: translate(-50%, -48%) scale(0.96) rotate(0deg);
		}

		100% {
			opacity: 1;
			transform: translate(-50%, -52%) scale(1) rotate(0deg);
			filter: blur(0);
		}
	}

	@keyframes wheelPopBlue {
		0% {
			transform: translateY(20px) scale(0.7);
			opacity: 0;
		}

		62% {
			transform: translateY(-34px) scale(1.04);
			opacity: 1;
		}

		100% {
			transform: translateY(-28px) scale(1);
			opacity: 1;
		}
	}

	@keyframes wheelPopRed {
		0% {
			transform: translateY(28px) scale(0.68);
			opacity: 0;
		}

		62% {
			transform: translateY(-42px) scale(1.04);
			opacity: 1;
		}

		100% {
			transform: translateY(-36px) scale(1);
			opacity: 1;
		}
	}

	@keyframes landPulse {
		0% {
			transform: translateY(var(--land-start-y)) scale(var(--land-start-scale));
		}

		62% {
			transform: translateY(var(--land-overshoot-y)) scale(var(--land-overshoot-scale));
		}

		100% {
			transform: translateY(0) scale(1);
		}
	}

	@keyframes boardSweep {
		from {
			transform: translateY(-130%);
		}

		to {
			transform: translateY(130%);
		}
	}

	@keyframes silverSymbolPulse {
		0% {
			transform: translateY(4px) scale(0.98);
			filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.22));
		}

		58% {
			transform: translateY(-1px) scale(1.015);
			filter: drop-shadow(0 0 10px rgba(220, 234, 247, 0.28))
				drop-shadow(0 12px 18px rgba(0, 0, 0, 0.24));
		}

		100% {
			transform: translateY(0) scale(1);
		}
	}

	@keyframes goldSymbolSettle {
		0% {
			transform: translateY(8px) scale(0.95);
		}

		52% {
			transform: translateY(-3px) scale(1.045);
		}

		100% {
			transform: translateY(0) scale(1);
		}
	}

	@keyframes goldShineSweep {
		0% {
			opacity: 0;
			transform: translateX(-140%) skewX(-20deg);
		}

		28% {
			opacity: 0.25;
		}

		100% {
			opacity: 0;
			transform: translateX(140%) skewX(-20deg);
		}
	}

	@keyframes blueWheelTilePop {
		0% {
			transform: translateY(10px) scale(0.94);
		}

		58% {
			transform: translateY(-2px) scale(1.06);
		}

		100% {
			transform: translateY(0) scale(1);
		}
	}

	@keyframes redWheelTilePop {
		0% {
			transform: translateY(14px) scale(0.9);
		}

		52% {
			transform: translateY(-4px) scale(1.08);
		}

		82% {
			transform: translateY(1px) scale(1.01);
		}

		100% {
			transform: translateY(0) scale(1);
		}
	}

	@keyframes anticipationPulse {
		0%,
		100% {
			opacity: 0.86;
		}

		50% {
			opacity: 1;
		}
	}

	@media (max-width: 960px) {
		.board {
			transform: scale(0.88);
			transform-origin: top center;
		}
	}
</style>
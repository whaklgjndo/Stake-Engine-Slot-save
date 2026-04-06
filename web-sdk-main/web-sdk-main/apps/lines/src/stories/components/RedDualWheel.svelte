<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { RED_INNER_WHEEL_VALUES, RED_OUTER_WHEEL_VALUES } from './wheelValues';

	type RedWheelPhase =
		| 'idle'
		| 'red-outer-spinning'
		| 'red-outer-locked'
		| 'red-inner-spinning'
		| 'red-locked';

	type RingSlice = {
		label: string;
		path: string;
		fill: string;
		fontSize: number;
	};

	type LabelPlacement = {
		label: string;
		x: number;
		y: number;
		rotation: number;
		fontSize: number;
	};

	export let phase: RedWheelPhase = 'idle';
	export let scale: 'card' | 'symbol' | 'overlay' = 'overlay';
	export let style = '';

	const OUTER_VALUES = RED_OUTER_WHEEL_VALUES.map((value) => `${value}x`);
	const INNER_VALUES = RED_INNER_WHEEL_VALUES.map((value) => `${value}x`);
	const OUTER_SLICE_ANGLE = 360 / OUTER_VALUES.length;
	const INNER_SLICE_ANGLE = 360 / INNER_VALUES.length;
	const CX = 400;
	const CY = 400;
	const OUTER_EDGE_RADIUS = 352;
	const OUTER_CORE_RADIUS = 232;
	const INNER_EDGE_RADIUS = 206;
	const INNER_CORE_RADIUS = 118;
	const HUB_RADIUS = 86;
	const OUTER_LABEL_RADIUS = 290;
	const INNER_LABEL_RADIUS = 162;
	const DIVIDER_COLOR = '#dc2f28';
	const uid = Math.random().toString(36).slice(2, 10);

	let rootEl: HTMLDivElement | null = null;
	let outerFrameHandle = 0;
	let innerFrameHandle = 0;
	let outerAnimationSerial = 0;
	let innerAnimationSerial = 0;
	let currentOuterRotation = 0;
	let currentInnerRotation = 0;
	let lastPhase: RedWheelPhase | null = null;

	function polar(thetaDeg: number, radius: number): { x: number; y: number } {
		const radians = (thetaDeg * Math.PI) / 180;
		return {
			x: CX + Math.sin(radians) * radius,
			y: CY - Math.cos(radians) * radius,
		};
	}

	function ringSlicePath(
		startDeg: number,
		endDeg: number,
		outerRadius: number,
		innerRadius: number,
	): string {
		const p1 = polar(startDeg, outerRadius);
		const p2 = polar(endDeg, outerRadius);
		const p3 = polar(endDeg, innerRadius);
		const p4 = polar(startDeg, innerRadius);
		const largeArc = endDeg - startDeg > 180 ? 1 : 0;
		return [
			`M ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`,
			`A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`,
			`L ${p3.x.toFixed(3)} ${p3.y.toFixed(3)}`,
			`A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p4.x.toFixed(3)} ${p4.y.toFixed(3)}`,
			'Z',
		].join(' ');
	}

	function normalize(angle: number): number {
		return ((angle % 360) + 360) % 360;
	}

	function uprightTangentRotation(angle: number): number {
		const normalized = normalize(angle);
		return normalized > 90 && normalized < 270 ? normalized - 180 : normalized;
	}

	function easeOutBack(t: number): number {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		const delta = t - 1;
		return 1 + c3 * delta * delta * delta + c1 * delta * delta;
	}

	function readStyleNumber(property: string, fallback: number): number {
		if (!rootEl) return fallback;
		const value = getComputedStyle(rootEl).getPropertyValue(property).trim();
		if (!value) return fallback;
		const parsed = Number.parseFloat(value.replace('deg', '').replace('ms', ''));
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	function stopOuterAnimation(): void {
		outerAnimationSerial += 1;
		if (outerFrameHandle) {
			cancelAnimationFrame(outerFrameHandle);
			outerFrameHandle = 0;
		}
	}

	function stopInnerAnimation(): void {
		innerAnimationSerial += 1;
		if (innerFrameHandle) {
			cancelAnimationFrame(innerFrameHandle);
			innerFrameHandle = 0;
		}
	}

	async function animateOuterSpin(): Promise<void> {
		stopOuterAnimation();
		await tick();
		const serial = outerAnimationSerial;
		const startRotation = currentOuterRotation;
		const targetRotation = readStyleNumber('--outer-target', 3240);
		const duration = readStyleNumber('--outer-duration', 2100);
		const startTime = performance.now();

		const advance = (now: number): void => {
			if (serial !== outerAnimationSerial) return;
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = easeOutBack(progress);
			currentOuterRotation = startRotation + (targetRotation - startRotation) * eased;

			if (progress < 1) {
				outerFrameHandle = requestAnimationFrame(advance);
				return;
			}

			currentOuterRotation = targetRotation;
			outerFrameHandle = 0;
		};

		outerFrameHandle = requestAnimationFrame(advance);
	}

	async function animateInnerSpin(): Promise<void> {
		stopInnerAnimation();
		await tick();
		const serial = innerAnimationSerial;
		const startRotation = currentInnerRotation;
		const targetRotation = readStyleNumber('--inner-target', -2160);
		const duration = readStyleNumber('--inner-duration', 1600);
		const startTime = performance.now();

		const advance = (now: number): void => {
			if (serial !== innerAnimationSerial) return;
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = easeOutBack(progress);
			currentInnerRotation = startRotation + (targetRotation - startRotation) * eased;

			if (progress < 1) {
				innerFrameHandle = requestAnimationFrame(advance);
				return;
			}

			currentInnerRotation = targetRotation;
			innerFrameHandle = 0;
		};

		innerFrameHandle = requestAnimationFrame(advance);
	}

	function syncOuterRotation(): void {
		currentOuterRotation = readStyleNumber('--outer-target', currentOuterRotation);
	}

	function syncInnerRotation(): void {
		currentInnerRotation = readStyleNumber('--inner-target', currentInnerRotation);
	}

	const outerSlices: RingSlice[] = OUTER_VALUES.map((label, index) => {
		const start = index * OUTER_SLICE_ANGLE - OUTER_SLICE_ANGLE / 2;
		const end = start + OUTER_SLICE_ANGLE;
		return {
			label,
			path: ringSlicePath(start, end, OUTER_EDGE_RADIUS, OUTER_CORE_RADIUS),
			fill: index % 2 === 0 ? `url(#redSteelLight-${uid})` : `url(#redSteelDark-${uid})`,
			fontSize: label.length >= 4 ? 42 : 54,
		};
	});

	const innerSlices: RingSlice[] = INNER_VALUES.map((label, index) => {
		const start = index * INNER_SLICE_ANGLE - INNER_SLICE_ANGLE / 2;
		const end = start + INNER_SLICE_ANGLE;
		return {
			label,
			path: ringSlicePath(start, end, INNER_EDGE_RADIUS, INNER_CORE_RADIUS),
			fill: index % 2 === 0 ? `url(#redSteelDark-${uid})` : `url(#redSteelLight-${uid})`,
			fontSize: label.length >= 3 ? 42 : 48,
		};
	});

	$: outerLabels = OUTER_VALUES.map((label, index): LabelPlacement => {
		const angle = normalize(index * OUTER_SLICE_ANGLE + currentOuterRotation);
		const point = polar(angle, OUTER_LABEL_RADIUS);
		return {
			label,
			x: point.x,
			y: point.y,
			rotation: uprightTangentRotation(angle),
			fontSize: label.length >= 4 ? 42 : 54,
		};
	});

	$: innerLabels = INNER_VALUES.map((label, index): LabelPlacement => {
		const angle = normalize(index * INNER_SLICE_ANGLE + currentInnerRotation);
		const point = polar(angle, INNER_LABEL_RADIUS);
		return {
			label,
			x: point.x,
			y: point.y,
			rotation: uprightTangentRotation(angle),
			fontSize: label.length >= 3 ? 42 : 48,
		};
	});

	$: outerGlowVisible =
		phase === 'red-outer-locked' || phase === 'red-inner-spinning' || phase === 'red-locked';
	$: innerGlowVisible = phase === 'red-locked';

	$: if (phase !== lastPhase) {
		lastPhase = phase;

		if (phase === 'idle') {
			stopOuterAnimation();
			stopInnerAnimation();
			currentOuterRotation = 0;
			currentInnerRotation = 0;
		} else if (phase === 'red-outer-spinning') {
			stopInnerAnimation();
			currentInnerRotation = 0;
			void animateOuterSpin();
		} else if (phase === 'red-outer-locked') {
			stopOuterAnimation();
			stopInnerAnimation();
			syncOuterRotation();
			currentInnerRotation = 0;
		} else if (phase === 'red-inner-spinning') {
			stopOuterAnimation();
			syncOuterRotation();
			void animateInnerSpin();
		} else if (phase === 'red-locked') {
			stopOuterAnimation();
			stopInnerAnimation();
			syncOuterRotation();
			syncInnerRotation();
		}
	}

	onDestroy(() => {
		stopOuterAnimation();
		stopInnerAnimation();
	});
</script>

<div class={`red-dual-wheel red-dual-wheel-${scale}`} bind:this={rootEl} {style} aria-hidden="true">
	<svg viewBox="0 0 800 800" role="presentation">
		<defs>
			<linearGradient id={`rimRed-${uid}`} x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="#ff8574" />
				<stop offset="45%" stop-color="#f0362d" />
				<stop offset="100%" stop-color="#9e130d" />
			</linearGradient>
			<radialGradient id={`redSteelLight-${uid}`} cx="36%" cy="28%" r="92%">
				<stop offset="0%" stop-color="#eceef2" />
				<stop offset="100%" stop-color="#b9c0c7" />
			</radialGradient>
			<radialGradient id={`redSteelDark-${uid}`} cx="42%" cy="34%" r="92%">
				<stop offset="0%" stop-color="#354252" />
				<stop offset="100%" stop-color="#1d2530" />
			</radialGradient>
			<radialGradient id={`redCenterCap-${uid}`} cx="42%" cy="34%" r="92%">
				<stop offset="0%" stop-color="#354252" />
				<stop offset="100%" stop-color="#202833" />
			</radialGradient>
		</defs>

		<circle
			class="red-wheel-glow"
			class:red-wheel-glow-visible={outerGlowVisible}
			cx={CX}
			cy={CY}
			r="358"
		/>
		<circle
			class="red-wheel-glow red-wheel-glow-inner"
			class:red-wheel-glow-inner-visible={innerGlowVisible}
			cx={CX}
			cy={CY}
			r="208"
		/>

		<g transform={`rotate(${currentOuterRotation} ${CX} ${CY})`}>
			<circle
				cx={CX}
				cy={CY}
				r="360"
				fill={`url(#rimRed-${uid})`}
				stroke="#ffb0a7"
				stroke-width="4"
			/>
			<circle cx={CX} cy={CY} r="344" fill="#171f28" stroke="#ff6b5d" stroke-width="2" />

			{#each outerSlices as slice}
				<path
					d={slice.path}
					fill={slice.fill}
					stroke={DIVIDER_COLOR}
					stroke-width="5"
					stroke-linejoin="round"
				/>
			{/each}

			<circle
				cx={CX}
				cy={CY}
				r={OUTER_CORE_RADIUS}
				fill="none"
				stroke={DIVIDER_COLOR}
				stroke-width="5"
			/>
		</g>

		<g class="red-wheel-label-layer">
			{#each outerLabels as label}
				<text
					x={label.x}
					y={label.y}
					font-size={label.fontSize}
					transform={`rotate(${label.rotation} ${label.x} ${label.y})`}
				>
					{label.label}
				</text>
			{/each}
		</g>

		<g transform={`rotate(${currentInnerRotation} ${CX} ${CY})`}>
			<circle
				cx={CX}
				cy={CY}
				r={INNER_EDGE_RADIUS}
				fill="#171f28"
				stroke={DIVIDER_COLOR}
				stroke-width="5"
			/>

			{#each innerSlices as slice}
				<path
					d={slice.path}
					fill={slice.fill}
					stroke={DIVIDER_COLOR}
					stroke-width="4"
					stroke-linejoin="round"
				/>
			{/each}

			<circle
				cx={CX}
				cy={CY}
				r={INNER_CORE_RADIUS}
				fill="none"
				stroke={DIVIDER_COLOR}
				stroke-width="4"
			/>
		</g>

		<g class="red-wheel-label-layer red-wheel-label-layer-inner">
			{#each innerLabels as label}
				<text
					x={label.x}
					y={label.y}
					font-size={label.fontSize}
					transform={`rotate(${label.rotation} ${label.x} ${label.y})`}
				>
					{label.label}
				</text>
			{/each}
		</g>

		<g class="red-wheel-indicator">
			<path d="M 388 18 L 412 18 L 422 48 L 400 74 L 378 48 Z" class="red-wheel-pointer-shadow" />
			<path d="M 388 12 L 412 12 L 422 42 L 400 68 L 378 42 Z" class="red-wheel-pointer" />
		</g>

		<g class="red-wheel-indicator red-wheel-indicator-inner">
			<path
				d="M 389 166 L 411 166 L 419 192 L 400 214 L 381 192 Z"
				class="red-wheel-pointer-shadow"
			/>
			<path d="M 389 160 L 411 160 L 419 186 L 400 208 L 381 186 Z" class="red-wheel-pointer" />
		</g>

		<circle cx="400" cy="412" r="88" class="red-wheel-hub-shadow" />
		<circle cx={CX} cy={CY} r={HUB_RADIUS} fill="#253140" stroke="#1a2430" stroke-width="8" />
		<circle
			cx={CX}
			cy={CY}
			r="74"
			fill={`url(#redCenterCap-${uid})`}
			stroke="#45505f"
			stroke-width="2"
		/>
	</svg>
</div>

<style>
	.red-dual-wheel {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
	}

	.red-dual-wheel-card {
		width: 84px;
		height: 84px;
	}

	.red-dual-wheel-symbol {
		width: 58px;
		height: 58px;
	}

	.red-dual-wheel-overlay {
		width: 100%;
		height: 100%;
	}

	svg {
		width: 100%;
		height: 100%;
		display: block;
		overflow: visible;
		filter: drop-shadow(0 18px 30px rgba(7, 8, 15, 0.44));
	}

	.red-wheel-label-layer text {
		fill: #f6f8fb;
		font-weight: 900;
		text-anchor: middle;
		dominant-baseline: middle;
		letter-spacing: -0.03em;
		paint-order: stroke;
		stroke: rgba(0, 0, 0, 0.22);
		stroke-width: 12px;
	}

	.red-wheel-label-layer-inner text {
		stroke-width: 10px;
	}

	.red-wheel-glow {
		fill: none;
		stroke: #ff5f52;
		stroke-width: 12;
		opacity: 0.15;
		filter: blur(6px);
		transition: opacity 160ms ease;
	}

	.red-wheel-glow-visible {
		opacity: 0.3;
		animation: redGlowPulse 420ms ease both;
	}

	.red-wheel-glow-inner {
		stroke-width: 10;
		opacity: 0;
	}

	.red-wheel-glow-inner-visible {
		opacity: 0.34;
		animation: redGlowPulse 300ms ease both;
	}

	.red-wheel-pointer-shadow {
		fill: rgba(0, 0, 0, 0.28);
	}

	.red-wheel-pointer {
		fill: rgba(255, 255, 255, 0.98);
	}

	.red-wheel-hub-shadow {
		fill: rgba(0, 0, 0, 0.34);
	}

	@keyframes redGlowPulse {
		0% {
			opacity: 0.08;
			transform: scale(0.94);
		}
		100% {
			opacity: 0.32;
			transform: scale(1);
		}
	}
</style>

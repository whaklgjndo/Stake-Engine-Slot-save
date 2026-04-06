<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { BLUE_WHEEL_VALUES } from './wheelValues';

	type BlueWheelPhase = 'idle' | 'blue-spinning' | 'blue-locked';
	type WheelSlice = {
		label: string;
		outerPath: string;
		innerPath: string;
		fill: string;
		innerFill: string;
		fontSize: number;
	};

	type LabelPlacement = {
		label: string;
		x: number;
		y: number;
		rotation: number;
		fontSize: number;
	};

	export let phase: BlueWheelPhase = 'idle';
	export let scale: 'card' | 'symbol' | 'overlay' = 'overlay';
	export let style = '';

	const VALUES = BLUE_WHEEL_VALUES.map((value) => `${value}x`);
	const SLICE_ANGLE = 360 / BLUE_WHEEL_VALUES.length;
	const CX = 400;
	const CY = 400;
	const OUTER_RADIUS = 352;
	const INNER_RADIUS = 210;
	const CORE_RADIUS = 110;
	const HUB_RADIUS = 84;
	const LABEL_RADIUS = 286;
	const DIVIDER_COLOR = '#1797ea';
	const uid = Math.random().toString(36).slice(2, 10);

	let rootEl: HTMLDivElement | null = null;
	let frameHandle = 0;
	let animationSerial = 0;
	let currentRotation = 0;
	let lastPhase: BlueWheelPhase | null = null;

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

	function easeOutCubic(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	function readStyleNumber(property: string, fallback: number): number {
		if (!rootEl) return fallback;
		const value = getComputedStyle(rootEl).getPropertyValue(property).trim();
		if (!value) return fallback;
		const parsed = Number.parseFloat(value.replace('deg', '').replace('ms', ''));
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	function stopAnimation(): void {
		animationSerial += 1;
		if (frameHandle) {
			cancelAnimationFrame(frameHandle);
			frameHandle = 0;
		}
	}

	async function animateSpin(): Promise<void> {
		stopAnimation();
		await tick();
		const serial = animationSerial;
		const startRotation = currentRotation;
		const targetRotation = readStyleNumber('--wheel-target', 2880);
		const duration = readStyleNumber('--wheel-duration', 3200);
		const startTime = performance.now();

		const advance = (now: number): void => {
			if (serial !== animationSerial) return;
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = easeOutCubic(progress);
			currentRotation = startRotation + (targetRotation - startRotation) * eased;

			if (progress < 1) {
				frameHandle = requestAnimationFrame(advance);
				return;
			}

			currentRotation = targetRotation;
			frameHandle = 0;
		};

		frameHandle = requestAnimationFrame(advance);
	}

	function syncLockedRotation(): void {
		currentRotation = readStyleNumber('--wheel-target', currentRotation);
	}

	const slices: WheelSlice[] = VALUES.map((label, index) => {
		const start = index * SLICE_ANGLE - SLICE_ANGLE / 2;
		const end = start + SLICE_ANGLE;
		return {
			label,
			outerPath: ringSlicePath(start, end, OUTER_RADIUS, INNER_RADIUS),
			innerPath: ringSlicePath(start, end, INNER_RADIUS, CORE_RADIUS),
			fill: index % 2 === 0 ? `url(#steelLight-${uid})` : `url(#steelDark-${uid})`,
			innerFill: index % 2 === 0 ? `url(#steelDark-${uid})` : `url(#steelLight-${uid})`,
			fontSize: label.length >= 4 ? 46 : 54,
		};
	});

	$: labels = VALUES.map((label, index): LabelPlacement => {
		const angle = normalize(index * SLICE_ANGLE + currentRotation);
		const point = polar(angle, LABEL_RADIUS);
		return {
			label,
			x: point.x,
			y: point.y,
			rotation: uprightTangentRotation(angle),
			fontSize: label.length >= 4 ? 46 : 54,
		};
	});

	$: glowVisible = phase === 'blue-locked';

	$: if (phase !== lastPhase) {
		lastPhase = phase;
		if (phase === 'idle') {
			stopAnimation();
			currentRotation = 0;
		} else if (phase === 'blue-spinning') {
			void animateSpin();
		} else if (phase === 'blue-locked') {
			stopAnimation();
			syncLockedRotation();
		}
	}

	onDestroy(() => {
		stopAnimation();
	});
</script>

<div
	class={`blue-single-wheel blue-single-wheel-${scale}`}
	bind:this={rootEl}
	{style}
	aria-hidden="true"
>
	<svg viewBox="0 0 800 800" role="presentation">
		<defs>
			<linearGradient id={`rimBlue-${uid}`} x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="#58d2ff" />
				<stop offset="45%" stop-color="#29aaf2" />
				<stop offset="100%" stop-color="#156bb2" />
			</linearGradient>
			<radialGradient id={`steelLight-${uid}`} cx="38%" cy="30%" r="90%">
				<stop offset="0%" stop-color="#e7e7e7" />
				<stop offset="100%" stop-color="#a9a9a9" />
			</radialGradient>
			<radialGradient id={`steelDark-${uid}`} cx="42%" cy="32%" r="90%">
				<stop offset="0%" stop-color="#31495d" />
				<stop offset="100%" stop-color="#182430" />
			</radialGradient>
			<radialGradient id={`centerCap-${uid}`} cx="42%" cy="35%" r="90%">
				<stop offset="0%" stop-color="#33485d" />
				<stop offset="100%" stop-color="#17222d" />
			</radialGradient>
		</defs>

		<circle
			class="blue-wheel-glow"
			class:blue-wheel-glow-visible={glowVisible}
			cx={CX}
			cy={CY}
			r="356"
		/>

		<g class="blue-wheel-ring" transform={`rotate(${currentRotation} ${CX} ${CY})`}>
			<circle
				cx={CX}
				cy={CY}
				r="360"
				fill={`url(#rimBlue-${uid})`}
				stroke="#78d9ff"
				stroke-width="4"
			/>
			<circle cx={CX} cy={CY} r="344" fill="#122031" stroke="#78d9ff" stroke-width="2" />

			{#each slices as slice}
				<path
					d={slice.outerPath}
					fill={slice.fill}
					stroke={DIVIDER_COLOR}
					stroke-width="4"
					stroke-linejoin="round"
				/>
				<path
					d={slice.innerPath}
					fill={slice.innerFill}
					stroke={DIVIDER_COLOR}
					stroke-width="3"
					stroke-linejoin="round"
					opacity="0.97"
				/>
			{/each}

			<circle
				cx={CX}
				cy={CY}
				r={INNER_RADIUS}
				fill="none"
				stroke={DIVIDER_COLOR}
				stroke-width="4"
			/>
			<circle cx={CX} cy={CY} r={CORE_RADIUS} fill="none" stroke={DIVIDER_COLOR} stroke-width="4" />
		</g>

		<g class="blue-wheel-label-layer">
			{#each labels as label}
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

		<g class="blue-wheel-indicator">
			<rect x="386" y="20" width="28" height="10" rx="5" class="blue-wheel-notch-shadow" />
			<rect x="386" y="18" width="28" height="10" rx="5" class="blue-wheel-notch" />
		</g>

		<circle cx="400" cy="412" r="86" class="blue-wheel-hub-shadow" />
		<circle cx={CX} cy={CY} r={HUB_RADIUS} fill="#243445" stroke="#1a2733" stroke-width="8" />
		<circle
			cx={CX}
			cy={CY}
			r="74"
			fill={`url(#centerCap-${uid})`}
			stroke="#304257"
			stroke-width="2"
		/>
	</svg>
</div>

<style>
	.blue-single-wheel {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
	}

	.blue-single-wheel-card {
		width: 84px;
		height: 84px;
	}

	.blue-single-wheel-symbol {
		width: 58px;
		height: 58px;
	}

	.blue-single-wheel-overlay {
		width: 100%;
		height: 100%;
	}

	svg {
		width: 100%;
		height: 100%;
		display: block;
		overflow: visible;
		filter: drop-shadow(0 18px 28px rgba(2, 8, 18, 0.44));
	}

	.blue-wheel-label-layer text {
		fill: #f5f8fb;
		font-weight: 900;
		text-anchor: middle;
		dominant-baseline: middle;
		letter-spacing: -0.03em;
		paint-order: stroke;
		stroke: rgba(0, 0, 0, 0.2);
		stroke-width: 12px;
	}

	.blue-wheel-glow {
		fill: none;
		stroke: #46c8ff;
		stroke-width: 12;
		opacity: 0.18;
		filter: blur(5px);
		transition: opacity 180ms ease;
	}

	.blue-wheel-glow-visible {
		opacity: 0.32;
		animation: blueGlowPulse 420ms ease both;
	}

	.blue-wheel-notch-shadow {
		fill: rgba(0, 0, 0, 0.28);
	}

	.blue-wheel-notch {
		fill: rgba(255, 255, 255, 0.96);
	}

	.blue-wheel-hub-shadow {
		fill: rgba(0, 0, 0, 0.34);
	}

	@keyframes blueGlowPulse {
		0% {
			opacity: 0.1;
			transform: scale(0.92);
		}
		100% {
			opacity: 0.32;
			transform: scale(1);
		}
	}
</style>

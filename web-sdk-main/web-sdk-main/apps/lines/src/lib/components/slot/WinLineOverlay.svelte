<script lang="ts">
	import type { WinLine } from './types';

	type Props = {
		reelCount?: number;
		visibleRows?: number;
		winLines?: WinLine[];
	};

	let {
		reelCount = 5,
		visibleRows = 5,
		winLines = [],
	}: Props = $props();

	const cellSize = 100;
	const width = $derived(reelCount * cellSize);
	const height = $derived(visibleRows * cellSize);

	function point(column: number, row: number): { x: number; y: number } {
		return {
			x: column * cellSize + cellSize / 2,
			y: row * cellSize + cellSize / 2,
		};
	}

	function pointsToPath(line: WinLine): string {
		if (!line.positions.length) return '';
		if (line.positions.length === 1) {
			const only = point(line.positions[0].column, line.positions[0].row);
			return `M ${only.x} ${only.y}`;
		}

		const points = line.positions.map((position) => point(position.column, position.row));
		const [first, ...rest] = points;
		let path = `M ${first.x} ${first.y}`;

		for (let index = 0; index < rest.length; index += 1) {
			const current = rest[index];
			const previous = points[index];
			const midX = (previous.x + current.x) / 2;
			path += ` Q ${midX} ${previous.y} ${current.x} ${current.y}`;
		}

		return path;
	}
</script>

<svg
	class="overlay"
	viewBox={`0 0 ${width} ${height}`}
	preserveAspectRatio="none"
	aria-hidden="true"
>
	<defs>
		<filter id="slot-line-glow" x="-40%" y="-40%" width="180%" height="180%">
			<feGaussianBlur stdDeviation="6" result="blur" />
			<feMerge>
				<feMergeNode in="blur" />
				<feMergeNode in="SourceGraphic" />
			</feMerge>
		</filter>
	</defs>

	{#each winLines as line, index (`${line.id}-${index}`)}
		<g class="line-group" style={`--line-delay:${index * 80}ms; --line-color:${line.color ?? 'var(--slot-accent, #6bd6ff)'}; --line-glow:${line.glowColor ?? line.color ?? 'var(--slot-accent, #6bd6ff)'}`}>
			<path class="line-path line-path-glow" d={pointsToPath(line)} />
			<path class="line-path line-path-main" d={pointsToPath(line)} />
			{#each line.positions as position, pointIndex (`${line.id}-${position.row}-${position.column}-${pointIndex}`)}
				{@const center = point(position.column, position.row)}
				<g class="line-node" transform={`translate(${center.x} ${center.y})`}>
					<circle r="10" class="line-node-glow" />
					<circle r="5.5" class="line-node-core" />
				</g>
				{#if pointIndex === line.positions.length - 1}
					<g class="particle-burst" transform={`translate(${center.x} ${center.y})`}>
						{#each Array.from({ length: 8 }, (_, burstIndex) => burstIndex) as burstIndex}
							<circle
								r="2.2"
								class="particle"
								style={`--particle-angle:${burstIndex * 45}deg; --particle-delay:${burstIndex * 30}ms;`}
							/>
						{/each}
					</g>
				{/if}
			{/each}
		</g>
	{/each}
</svg>

<style>
	.overlay {
		position: absolute;
		inset: 18px;
		inline-size: calc(100% - 36px);
		block-size: calc(100% - 36px);
		pointer-events: none;
		overflow: visible;
	}

	.line-group {
		--line-color: var(--slot-accent, #6bd6ff);
		--line-glow: var(--slot-accent, #6bd6ff);
	}

	.line-path {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 680;
		stroke-dashoffset: 680;
		animation: lineSweep 1.08s cubic-bezier(0.16, 1, 0.3, 1) forwards;
		animation-delay: var(--line-delay, 0ms);
	}

	.line-path-glow {
		stroke: color-mix(in srgb, var(--line-glow) 58%, transparent);
		stroke-width: 16;
		filter: url(#slot-line-glow);
		opacity: 0.85;
	}

	.line-path-main {
		stroke: var(--line-color);
		stroke-width: 7.5;
	}

	.line-node-glow {
		fill: color-mix(in srgb, var(--line-glow) 42%, transparent);
		filter: url(#slot-line-glow);
		animation: nodePulse 1.1s ease-in-out infinite;
		animation-delay: var(--line-delay, 0ms);
	}

	.line-node-core {
		fill: var(--line-color);
		stroke: rgba(255, 255, 255, 0.78);
		stroke-width: 2;
	}

	.particle {
		fill: var(--line-color);
		transform-origin: center;
		animation: particleBurst 720ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
		animation-delay: calc(var(--line-delay, 0ms) + var(--particle-delay, 0ms));
	}

	@keyframes lineSweep {
		0% {
			stroke-dashoffset: 680;
			opacity: 0;
		}

		22% {
			opacity: 1;
		}

		100% {
			stroke-dashoffset: 0;
			opacity: 1;
		}
	}

	@keyframes nodePulse {
		0%,
		100% {
			transform: scale(1);
		}

		50% {
			transform: scale(1.18);
		}
	}

	@keyframes particleBurst {
		0% {
			transform: rotate(var(--particle-angle)) translateY(0);
			opacity: 0;
		}

		20% {
			opacity: 1;
		}

		100% {
			transform: rotate(var(--particle-angle)) translateY(-24px) scale(0.2);
			opacity: 0;
		}
	}
</style>

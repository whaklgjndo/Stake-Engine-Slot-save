<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type Props = {
		canSpin?: boolean;
		isSpinning?: boolean;
		stopMode?: boolean;
		compact?: boolean;
		label?: string;
	};

	const dispatch = createEventDispatcher<{ press: void }>();

	let {
		canSpin = true,
		isSpinning = false,
		stopMode = false,
		compact = false,
		label = 'Spin',
	}: Props = $props();

	const text = $derived(stopMode ? 'Stop' : isSpinning ? 'Spinning' : label);

	function handlePress(): void {
		if (!canSpin && !stopMode) return;
		dispatch('press');
	}
</script>

<button
	class="spin-button"
	class:is-active={isSpinning}
	class:is-stop={stopMode}
	class:is-compact={compact}
	disabled={!canSpin && !stopMode}
	on:click={handlePress}
>
	<span class="spin-ring"></span>
	<span class="spin-core">
		<strong>{text}</strong>
		<small>{stopMode ? 'Tap to halt reels' : isSpinning ? 'Good luck' : 'Tap to play'}</small>
	</span>
</button>

<style>
	.spin-button {
		position: relative;
		display: grid;
		place-items: center;
		inline-size: min(168px, 100%);
		aspect-ratio: 1;
		padding: 0;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: transparent;
		cursor: pointer;
		will-change: transform, filter;
		transition:
			transform 140ms ease,
			filter 140ms ease;
	}

	.spin-button:hover:enabled {
		transform: translateY(-2px);
	}

	.spin-button:active:enabled {
		transform: translateY(1px) scale(0.98);
	}

	.spin-button:disabled {
		opacity: 0.46;
		cursor: not-allowed;
	}

	.spin-button.is-compact {
		inline-size: 120px;
	}

	.spin-ring,
	.spin-core {
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}

	.spin-ring {
		background:
			conic-gradient(from 0deg, rgba(255, 255, 255, 0.4), transparent 22%, rgba(255, 255, 255, 0.15) 44%, transparent 62%, rgba(255, 255, 255, 0.36)),
			radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.3), transparent 40%);
		filter: blur(0.2px);
		animation: ringSpin 4.2s linear infinite;
	}

	.spin-core {
		inset: 10px;
		display: grid;
		place-items: center;
		gap: 6px;
		background:
			var(--slot-button, linear-gradient(180deg, #8fe4ff 0%, #4bbcff 54%, #1e7fe3 100%));
		color: var(--slot-button-text, #041726);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 18px 28px rgba(0, 0, 0, 0.28);
		text-align: center;
	}

	.spin-core::before {
		content: '';
		position: absolute;
		inset: 14px;
		border-radius: inherit;
		background:
			radial-gradient(circle at 50% 24%, rgba(255, 255, 255, 0.2), transparent 38%);
		opacity: 0.7;
	}

	.spin-core strong,
	.spin-core small {
		position: relative;
		z-index: 1;
		display: block;
	}

	.spin-core strong {
		font-size: 1.24rem;
		font-weight: 900;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.spin-core small {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.8;
	}

	.is-active .spin-ring {
		animation-duration: 1.2s;
	}

	.is-stop .spin-core {
		background:
			linear-gradient(180deg, #ffca88 0%, #ff9558 52%, #ea5f38 100%);
		color: #2b1007;
	}

	@keyframes ringSpin {
		from {
			transform: rotate(0deg);
		}

		to {
			transform: rotate(360deg);
		}
	}
</style>

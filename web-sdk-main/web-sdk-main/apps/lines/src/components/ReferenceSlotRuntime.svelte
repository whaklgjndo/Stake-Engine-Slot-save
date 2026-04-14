<script lang="ts">
	let balance = 12345.67;
	let betSize = 10;
	let win = 0;
	let quickSpin = false;
	let autoSpinsRemaining = 0;
	let isSpinning = false;
	let pulseSpin = false;

	const betOptions = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];

	function formatCurrency(value: number): string {
		return value.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function adjustBet(direction: -1 | 1): void {
		if (isSpinning) {
			return;
		}

		const currentIndex = betOptions.findIndex((value) => value === betSize);
		const safeIndex = currentIndex === -1 ? betOptions.indexOf(10) : currentIndex;
		const nextIndex = Math.min(Math.max(safeIndex + direction, 0), betOptions.length - 1);

		betSize = betOptions[nextIndex];
	}

	function toggleQuickSpin(): void {
		quickSpin = !quickSpin;
	}

	function queueAutoSpins(): void {
		if (isSpinning) {
			return;
		}

		autoSpinsRemaining = autoSpinsRemaining === 10 ? 0 : 10;

		if (autoSpinsRemaining > 0) {
			void spin();
		}
	}

	async function spin(): Promise<void> {
		if (isSpinning) {
			return;
		}

		isSpinning = true;
		pulseSpin = true;

		const result = Number((Math.random() * betSize * 12).toFixed(2));
		win = result;
		balance = Number(Math.max(0, balance - betSize + result).toFixed(2));

		const spinDurationMs = quickSpin ? 240 : 850;

		await new Promise((resolve) => setTimeout(resolve, spinDurationMs));

		pulseSpin = false;
		isSpinning = false;

		if (autoSpinsRemaining > 0) {
			autoSpinsRemaining -= 1;

			if (autoSpinsRemaining > 0) {
				void spin();
			}
		}
	}
</script>

<svelte:head>
	<title>Reference Slot Runtime</title>
</svelte:head>

<div class="reference-slot-shell">
	<div
		class="reference-slot-stage"
		class:is-spinning={isSpinning}
		aria-label={`Reference slot skin. Balance ${formatCurrency(balance)}. Bet ${formatCurrency(betSize)}. Win ${formatCurrency(win)}.`}
	>
		<img
			class="reference-slot-image"
			src="/reference-slot.svg"
			alt="Medieval fantasy slot machine reference layout"
			draggable="false"
		/>

		<div class="reference-slot-effects" aria-hidden="true">
			<div class="spin-glow" class:is-active={pulseSpin}></div>
		</div>

		<div class="reference-slot-hitbox-layer">
			<button
				type="button"
				class="hitbox spin-button"
				on:click={spin}
				aria-label={isSpinning ? 'Slot is spinning' : 'Spin'}
				title={isSpinning ? 'Spinning…' : 'Spin'}
			></button>

			<button
				type="button"
				class="hitbox bet-minus-button"
				on:click={() => adjustBet(-1)}
				aria-label={`Decrease bet. Current bet ${formatCurrency(betSize)}`}
				title={`Decrease bet — current ${formatCurrency(betSize)}`}
			></button>

			<button
				type="button"
				class="hitbox bet-plus-button"
				on:click={() => adjustBet(1)}
				aria-label={`Increase bet. Current bet ${formatCurrency(betSize)}`}
				title={`Increase bet — current ${formatCurrency(betSize)}`}
			></button>

			<button
				type="button"
				class="hitbox quick-spin-button"
				class:is-active={quickSpin}
				on:click={toggleQuickSpin}
				aria-pressed={quickSpin}
				aria-label={`Quick spin ${quickSpin ? 'enabled' : 'disabled'}`}
				title={`Quick spin ${quickSpin ? 'enabled' : 'disabled'}`}
			></button>

			<button
				type="button"
				class="hitbox auto-spin-button"
				class:is-active={autoSpinsRemaining > 0}
				on:click={queueAutoSpins}
				aria-pressed={autoSpinsRemaining > 0}
				aria-label={autoSpinsRemaining > 0 ? `Auto spin running. ${autoSpinsRemaining} spins remaining` : 'Start auto spin'}
				title={autoSpinsRemaining > 0 ? `Auto spin running — ${autoSpinsRemaining} remaining` : 'Start auto spin'}
			></button>
		</div>

		<div class="sr-only" aria-live="polite">
			Balance {formatCurrency(balance)}. Bet {formatCurrency(betSize)}. Win {formatCurrency(win)}.
			{#if quickSpin} Quick spin enabled. {/if}
			{#if autoSpinsRemaining > 0} Auto spin remaining {autoSpinsRemaining}. {/if}
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background:
			radial-gradient(circle at 50% 20%, rgba(52, 73, 108, 0.18), transparent 22%),
			linear-gradient(180deg, #090a0f 0%, #030406 100%);
	}

	.reference-slot-shell {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 0;
		background:
			radial-gradient(circle at 50% 15%, rgba(42, 60, 93, 0.16), transparent 18%),
			linear-gradient(180deg, #0a0b10 0%, #030406 100%);
	}

	.reference-slot-stage {
		position: relative;
		width: min(100vw, calc(100vh * 1.1094257855));
		aspect-ratio: 2048 / 1846;
		overflow: hidden;
		user-select: none;
	}

	.reference-slot-image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
	}

	.reference-slot-effects,
	.reference-slot-hitbox-layer {
		position: absolute;
		inset: 0;
	}

	.reference-slot-effects {
		pointer-events: none;
	}

	.spin-glow {
		position: absolute;
		left: 42.4%;
		top: 83.8%;
		width: 15.6%;
		height: 15.6%;
		border-radius: 999px;
		opacity: 0;
		background:
			radial-gradient(circle, rgba(131, 212, 255, 0.45) 0%, rgba(91, 180, 255, 0.12) 42%, transparent 72%);
		filter: blur(14px);
		transform: scale(0.92);
		transition:
			opacity 180ms ease,
			transform 180ms ease;
	}

	.spin-glow.is-active {
		opacity: 1;
		transform: scale(1.06);
		animation: spinPulse 680ms ease-in-out infinite;
	}

	.hitbox {
		position: absolute;
		border: 0;
		padding: 0;
		background: transparent;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		border-radius: 999px;
		outline: none;
	}

	.hitbox::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow: 0 0 0 0 rgba(121, 201, 255, 0);
		transition: box-shadow 150ms ease, background-color 150ms ease;
	}

	.hitbox:hover::after,
	.hitbox:focus-visible::after {
		box-shadow: 0 0 0 2px rgba(134, 209, 255, 0.5);
		background-color: rgba(134, 209, 255, 0.06);
	}

	.hitbox:active::after,
	.hitbox.is-active::after {
		box-shadow: 0 0 0 2px rgba(255, 218, 125, 0.6);
		background-color: rgba(255, 218, 125, 0.08);
	}

	.spin-button {
		left: 42.8%;
		top: 84.6%;
		width: 14.7%;
		height: 14.4%;
	}

	.bet-minus-button {
		left: 59.75%;
		top: 89.0%;
		width: 6.6%;
		height: 4.4%;
		border-radius: 999px 0 0 999px;
	}

	.bet-plus-button {
		left: 76.9%;
		top: 89.0%;
		width: 6.8%;
		height: 4.4%;
		border-radius: 0 999px 999px 0;
	}

	.quick-spin-button {
		left: 87.4%;
		top: 88.05%;
		width: 8.1%;
		height: 5.35%;
		border-radius: 999px;
	}

	.auto-spin-button {
		left: 86.8%;
		top: 94.15%;
		width: 10.1%;
		height: 4.45%;
		border-radius: 14px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.is-spinning .reference-slot-image {
		animation: boardBreath 850ms ease-in-out;
	}

	@keyframes spinPulse {
		0%,
		100% {
			opacity: 0.42;
			transform: scale(0.98);
		}

		50% {
			opacity: 1;
			transform: scale(1.06);
		}
	}

	@keyframes boardBreath {
		0%,
		100% {
			transform: scale(1);
			filter: brightness(1);
		}

		50% {
			transform: scale(1.006);
			filter: brightness(1.04);
		}
	}
</style>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type Events = {
		spin: void;
		betDown: void;
		betUp: void;
		toggleQuick: void;
		toggleAuto: void;
	};

	const dispatch = createEventDispatcher<Events>();

	export let artSrc: string;
	export let balanceText = '0.00';
	export let betText = '0.00';
	export let winText = '0.00';
	export let quickSpin = false;
	export let autoSpin = false;
	export let spinLabel = 'SPIN';
	export let spinDisabled = false;
</script>

<div class="slot-hud-bar">
	<img class="hud-art" src={artSrc} alt="Slot controls" draggable="false" />

	<div class="spin-core-shell" aria-hidden="true">
		<div class="spin-core-button">{spinLabel}</div>
	</div>

	<div class="hud-readout balance-readout">{balanceText}</div>
	<div class="hud-readout bet-readout">{betText}</div>
	<div class="hud-readout win-readout">{winText}</div>

	<button type="button" class="hud-hitbox spin-hitbox" on:click={() => dispatch('spin')} disabled={spinDisabled} aria-label={spinLabel}></button>
	<button type="button" class="hud-hitbox bet-minus-hitbox" on:click={() => dispatch('betDown')} aria-label="Decrease bet"></button>
	<button type="button" class="hud-hitbox bet-plus-hitbox" on:click={() => dispatch('betUp')} aria-label="Increase bet"></button>
	<button type="button" class="hud-hitbox quick-spin-hitbox" class:is-active={quickSpin} on:click={() => dispatch('toggleQuick')} aria-pressed={quickSpin} aria-label="Toggle quick spin"></button>
	<button type="button" class="hud-hitbox auto-spin-hitbox" class:is-active={autoSpin} on:click={() => dispatch('toggleAuto')} aria-pressed={autoSpin} aria-label="Toggle auto spin"></button>
</div>

<style>
	.slot-hud-bar {
		position: absolute;
		left: 50%;
		bottom: 0.25%;
		width: 69.4%;
		transform: translateX(-50%);
		filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 0.5));
	}

	.hud-art {
		display: block;
		width: 100%;
		height: auto;
		pointer-events: none;
	}

	.spin-core-shell {
		position: absolute;
		left: 42.05%;
		top: 6.55%;
		width: 6.55%;
		aspect-ratio: 1;
		border-radius: 50%;
		pointer-events: none;
		display: grid;
		place-items: center;
	}

	.spin-core-button {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font: 900 clamp(10px, 0.8vw, 16px) / 1 'Trebuchet MS', 'Segoe UI', sans-serif;
		letter-spacing: 0.03em;
		color: #082544;
		background: radial-gradient(circle at 38% 28%, rgba(233, 247, 255, 0.96), rgba(171, 222, 255, 0.96) 34%, rgba(83, 166, 236, 0.98) 68%, rgba(33, 99, 174, 0.98) 100%);
		box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.58), inset 0 -4px 8px rgba(10, 52, 110, 0.42), 0 0 12px rgba(114, 194, 255, 0.14);
	}

	.hud-readout {
		position: absolute;
		height: 12.4%;
		display: grid;
		place-items: center;
		font: 800 clamp(12px, 1vw, 24px) / 1 'Trebuchet MS', 'Segoe UI', sans-serif;
		letter-spacing: 0.02em;
		color: #f2f2f2;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75);
	}

	.balance-readout {
		left: 5.9%;
		top: 37.6%;
		width: 25.2%;
	}

	.bet-readout {
		left: 57.1%;
		top: 37.2%;
		width: 19.8%;
	}

	.win-readout {
		left: 56.45%;
		top: 69.9%;
		width: 27.1%;
	}

	.hud-hitbox {
		position: absolute;
		border: 0;
		padding: 0;
		background: transparent;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.hud-hitbox:disabled {
		cursor: not-allowed;
	}

	.hud-hitbox::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow: 0 0 0 0 rgba(160, 213, 255, 0);
		transition: box-shadow 140ms ease, background-color 140ms ease;
	}

	.hud-hitbox:hover::after,
	.hud-hitbox:focus-visible::after {
		box-shadow: 0 0 0 2px rgba(160, 213, 255, 0.52);
		background: rgba(160, 213, 255, 0.07);
	}

	.hud-hitbox.is-active::after {
		box-shadow: 0 0 0 2px rgba(255, 212, 112, 0.58);
		background: rgba(255, 212, 112, 0.08);
	}

	.spin-hitbox {
		left: 41.55%;
		top: 5.65%;
		width: 7.65%;
		height: 33.2%;
		border-radius: 50%;
	}

	.bet-minus-hitbox {
		left: 76.6%;
		top: 21%;
		width: 4.1%;
		height: 21.4%;
		border-radius: 50%;
	}

	.bet-plus-hitbox {
		left: 80.9%;
		top: 21%;
		width: 4.1%;
		height: 21.4%;
		border-radius: 50%;
	}

	.quick-spin-hitbox {
		left: 89.8%;
		top: 14.7%;
		width: 7.5%;
		height: 28.3%;
		border-radius: 999px;
	}

	.auto-spin-hitbox {
		left: 87.3%;
		top: 53.2%;
		width: 11.1%;
		height: 19.2%;
		border-radius: 10px;
	}
</style>

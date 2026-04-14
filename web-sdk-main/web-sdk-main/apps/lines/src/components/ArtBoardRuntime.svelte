<script lang="ts">
	const backgroundArt = new URL('../stories/assets/bg-throne-room.png', import.meta.url).href;
	const boardFrameArt = new URL('../stories/assets/board-frame.png', import.meta.url).href;
	const cellGridOverlayArt = new URL('../stories/assets/cell-grid-overlay.png', import.meta.url).href;
	const hudControlsArt = new URL('../stories/assets/hud-controls-bar.png', import.meta.url).href;

	let balance = 12345.67;
	let betSize = 10;
	let win = 0;
	let quickSpin = false;
	let autoSpin = false;
	let isSpinning = false;

	const betOptions = [0.2, 0.4, 1, 2, 5, 10, 20, 50] as const;

	function formatNumber(value: number): string {
		return value.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	}

	function updateBet(direction: -1 | 1): void {
		if (isSpinning) return;
		const currentIndex = Math.max(0, betOptions.findIndex((value) => value === betSize));
		const nextIndex = Math.min(Math.max(currentIndex + direction, 0), betOptions.length - 1);
		betSize = betOptions[nextIndex];
	}

	function toggleQuickSpin(): void {
		if (isSpinning) return;
		quickSpin = !quickSpin;
	}

	function toggleAutoSpin(): void {
		if (isSpinning) return;
		autoSpin = !autoSpin;
	}

	async function spin(): Promise<void> {
		if (isSpinning) return;
		isSpinning = true;
		const result = Number((Math.random() * betSize * 8).toFixed(2));
		win = result;
		balance = Number(Math.max(0, balance - betSize + result).toFixed(2));
		await new Promise((resolve) => setTimeout(resolve, quickSpin ? 240 : 700));
		isSpinning = false;
	}
</script>

<div class="art-slot-shell">
	<img class="background-art" src={backgroundArt} alt="" draggable="false" />
	<div class="stage-vignette" aria-hidden="true"></div>

	<div class="board-wrap" class:is-spinning={isSpinning}>
		<img class="board-frame-art" src={boardFrameArt} alt="Medieval slot board" draggable="false" />
		<div class="board-grid-window" aria-hidden="true">
			<div class="board-grid-velvet"></div>
			<img class="board-grid-overlay" src={cellGridOverlayArt} alt="" draggable="false" />
		</div>
	</div>

	<div class="hud-wrap">
		<img class="hud-art" src={hudControlsArt} alt="Slot controls" draggable="false" />

		<div class="spin-core-shell" aria-hidden="true">
			<div class="spin-core-button">SPIN</div>
		</div>

		<div class="hud-readout balance-readout">{formatNumber(balance)}</div>
		<div class="hud-readout bet-readout">{formatNumber(betSize)}</div>
		<div class="hud-readout win-readout">{formatNumber(win)}</div>

		<button type="button" class="hud-hitbox spin-hitbox" on:click={spin} aria-label={isSpinning ? 'Spinning' : 'Spin'} title={isSpinning ? 'Spinning' : 'Spin'}></button>
		<button type="button" class="hud-hitbox bet-minus-hitbox" on:click={() => updateBet(-1)} aria-label="Decrease bet" title="Decrease bet"></button>
		<button type="button" class="hud-hitbox bet-plus-hitbox" on:click={() => updateBet(1)} aria-label="Increase bet" title="Increase bet"></button>
		<button type="button" class="hud-hitbox quick-spin-hitbox" class:is-active={quickSpin} on:click={toggleQuickSpin} aria-pressed={quickSpin} aria-label="Toggle quick spin" title="Quick spin"></button>
		<button type="button" class="hud-hitbox auto-spin-hitbox" class:is-active={autoSpin} on:click={toggleAutoSpin} aria-pressed={autoSpin} aria-label="Toggle auto spin" title="Auto spin"></button>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #040608;
	}

	.art-slot-shell {
		position: relative;
		width: min(100vw, calc(100vh * 1.7655));
		aspect-ratio: 2048 / 1160;
		margin: 0 auto;
		overflow: hidden;
		background: #040608;
		user-select: none;
	}

	.background-art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center center;
		pointer-events: none;
	}

	.stage-vignette {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0) 72%, rgba(0, 0, 0, 0.28) 100%),
			radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 44%, rgba(0, 0, 0, 0.18) 100%);
		pointer-events: none;
	}

	.board-wrap {
		position: absolute;
		left: 50.15%;
		top: 46.1%;
		width: 49.9%;
		transform: translate(-50%, -50%);
		filter: drop-shadow(0 24px 42px rgba(0, 0, 0, 0.46));
	}

	.board-frame-art {
		display: block;
		width: 100%;
		height: auto;
		pointer-events: none;
	}

	.board-grid-window {
		position: absolute;
		left: 5.78%;
		top: 13.85%;
		width: 88.28%;
		height: 73.15%;
		overflow: hidden;
		border-radius: 2%;
	}

	.board-grid-velvet {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 20% 22%, rgba(255, 154, 90, 0.2), transparent 34%),
			radial-gradient(circle at 78% 20%, rgba(162, 198, 255, 0.18), transparent 34%),
			linear-gradient(90deg, #6e1d11 0%, #892818 18%, #7b2a1a 39%, #6a2620 51%, #45587f 66%, #24375e 82%, #182b4b 100%);
	}

	.board-grid-overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: fill;
		mix-blend-mode: screen;
		opacity: 0.98;
		filter: brightness(1.04) saturate(1.12);
		pointer-events: none;
	}

	.board-wrap.is-spinning {
		animation: boardPulse 700ms ease-in-out;
	}

	.hud-wrap {
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

	@keyframes boardPulse {
		0%,
		100% {
			transform: translate(-50%, -50%) scale(1);
		}

		50% {
			transform: translate(-50%, -50%) scale(1.01);
		}
	}
</style>

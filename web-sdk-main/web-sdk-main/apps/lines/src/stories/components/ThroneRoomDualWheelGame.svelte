<script lang="ts">
	import DualWheelGame from './DualWheelGame.svelte';
	import ThroneRoomBackdrop from '../../components/art/ThroneRoomBackdrop.svelte';

	const backgroundArt = new URL('../assets/bg-throne-room.png', import.meta.url).href;
	const hudControlsArt = new URL('../assets/hud-controls-bar.png', import.meta.url).href;
</script>

<div class="throne-room-game-shell">
	<ThroneRoomBackdrop src={backgroundArt} />
	<img class="hud-underlay" src={hudControlsArt} alt="" draggable="false" />
	<DualWheelGame />
</div>

<style>
	.throne-room-game-shell {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		background: #040608;
	}

	.hud-underlay {
		position: absolute;
		left: 50%;
		bottom: 0.25%;
		width: min(69.4vw, calc(100vh * 1.225));
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 1;
		filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 0.5));
	}

	:global(.throne-room-game-shell .game-shell) {
		background: transparent;
		min-height: 100vh;
	}

	:global(.throne-room-game-shell .theme-backdrop) {
		display: none;
	}

	:global(.throne-room-game-shell .top-bar) {
		position: absolute;
		top: 16px;
		right: 18px;
		left: auto;
		padding: 8px 12px;
		gap: 8px;
		border: 1px solid rgba(145, 181, 214, 0.12);
		border-radius: 14px;
		background: rgba(5, 12, 18, 0.52);
		backdrop-filter: blur(6px);
		z-index: 4;
	}

	:global(.throne-room-game-shell .top-bar-brand) {
		display: none;
	}

	:global(.throne-room-game-shell .top-bar-stats) {
		gap: 8px;
	}

	:global(.throne-room-game-shell .stat-pill) {
		padding: 6px 10px;
		border-radius: 10px;
		background: rgba(3, 10, 16, 0.64);
	}

	:global(.throne-room-game-shell .stat-pill span) {
		font-size: 0.54rem;
	}

	:global(.throne-room-game-shell .stat-pill strong) {
		font-size: 0.74rem;
	}

	:global(.throne-room-game-shell .game-stage) {
		padding: 84px 24px 174px;
	}

	:global(.throne-room-game-shell .feature-banner) {
		margin-inline: auto;
		width: min(720px, calc(100vw - 120px));
	}

	:global(.throne-room-game-shell .game-controls) {
		position: absolute;
		left: 50%;
		bottom: 0.25%;
		width: min(69.4vw, calc(100vh * 1.225));
		height: calc(min(69.4vw, calc(100vh * 1.225)) * 0.1903);
		transform: translateX(-50%);
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		grid-template-columns: 1fr;
		gap: 0;
		z-index: 2;
	}

	:global(.throne-room-game-shell .controls-left),
	:global(.throne-room-game-shell .controls-center),
	:global(.throne-room-game-shell .controls-right) {
		position: absolute;
		gap: 0;
	}

	:global(.throne-room-game-shell .controls-left) {
		left: 4.8%;
		top: 23%;
		width: 31.5%;
		height: 54%;
	}

	:global(.throne-room-game-shell .controls-center) {
		left: 42.8%;
		top: 22%;
		width: 14%;
		height: 58%;
		transform: translateX(-50%);
		justify-items: center;
	}

	:global(.throne-room-game-shell .controls-right) {
		right: 1.8%;
		top: 16%;
		width: 17.2%;
		height: 60%;
	}

	:global(.throne-room-game-shell .bet-stepper) {
		position: absolute;
		right: 0;
		top: 12%;
		width: 48.5%;
		grid-template-columns: 13% 74% 13%;
		gap: 0;
	}

	:global(.throne-room-game-shell .bet-display) {
		padding: 0;
		border: 0;
		background: transparent;
	}

	:global(.throne-room-game-shell .bet-display span) {
		display: none;
	}

	:global(.throne-room-game-shell .bet-display strong) {
		font-size: clamp(10px, 1vw, 20px);
		line-height: 1;
	}

	:global(.throne-room-game-shell .ctrl-button) {
		padding: 0;
		border: 0;
		background: transparent;
		font-size: 0;
	}

	:global(.throne-room-game-shell .ctrl-button:hover:enabled) {
		transform: none;
	}

	:global(.throne-room-game-shell .bonus-buy-row) {
		position: absolute;
		left: 50%;
		bottom: -6%;
		width: 124px;
		transform: translateX(-50%);
		gap: 6px;
	}

	:global(.throne-room-game-shell .bonus-buy-button) {
		padding: 5px 6px;
		border-radius: 8px;
		background: rgba(8, 18, 28, 0.78);
		border: 1px solid rgba(255, 255, 255, 0.08);
		text-align: center;
	}

	:global(.throne-room-game-shell .bonus-buy-button span) {
		font-size: 0.5rem;
	}

	:global(.throne-room-game-shell .bonus-buy-button strong) {
		font-size: 0.78rem;
	}

	:global(.throne-room-game-shell .spin-button) {
		width: 68px;
		height: 68px;
		font-size: 0.92rem;
		box-shadow: none;
		background: radial-gradient(circle at 38% 28%, rgba(233, 247, 255, 0.96), rgba(171, 222, 255, 0.96) 34%, rgba(83, 166, 236, 0.98) 68%, rgba(33, 99, 174, 0.98) 100%);
	}

	:global(.throne-room-game-shell .spin-button-stop) {
		background: linear-gradient(180deg, #ffc484, #f98f54 56%, #e55a2f 100%);
	}

	:global(.throne-room-game-shell .spin-button-skip) {
		background: linear-gradient(180deg, #c2e8ff, #6fc4ff 56%, #37a2f5 100%);
	}

	:global(.throne-room-game-shell .status-text) {
		display: none;
	}

	:global(.throne-room-game-shell .toggle-row) {
		position: absolute;
		right: 0;
		top: 8%;
		width: 100%;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}

	:global(.throne-room-game-shell .toggle-button) {
		padding: 6px 0;
		background: rgba(5, 12, 18, 0.62);
		border-radius: 8px;
		font-size: 0.68rem;
	}

	:global(.throne-room-game-shell .autoplay-select),
	:global(.throne-room-game-shell .autoplay-label) {
		position: absolute;
		right: 0;
		bottom: 10%;
		width: 100%;
		padding: 6px 8px;
		border-radius: 8px;
		font-size: 0.7rem;
		background: rgba(5, 12, 18, 0.72);
	}

	:global(.throne-room-game-shell .info-button) {
		position: absolute;
		right: 101%;
		bottom: 11%;
		width: 30px;
		height: 30px;
	}

	@media (max-width: 960px) {
		.hud-underlay,
		:global(.throne-room-game-shell .game-controls) {
			width: min(86vw, calc(100vh * 1.52));
		}

		:global(.throne-room-game-shell .top-bar) {
			top: 10px;
			right: 10px;
		}

		:global(.throne-room-game-shell .game-stage) {
			padding-bottom: 150px;
		}
	}
</style>

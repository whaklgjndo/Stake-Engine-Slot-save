<script lang="ts">
	import DualWheelGame from './DualWheelGame.svelte';
	import ThroneRoomBackdrop from '../../components/art/ThroneRoomBackdrop.svelte';

	const backgroundArt = new URL('../assets/bg-throne-room.png', import.meta.url).href;
	const boardFrameArt = new URL('../assets/board-frame.png', import.meta.url).href;
	const hudControlsArt = new URL('../assets/hud-controls-bar.png', import.meta.url).href;
</script>

<div
	class="goal-scene-shell"
	style={`--goal-board-frame:url('${boardFrameArt}'); --goal-hud-width:min(42vw, 640px);`}
>
	<ThroneRoomBackdrop src={backgroundArt} />
	<img class="goal-hud-art" src={hudControlsArt} alt="" draggable="false" />
	<DualWheelGame />
</div>

<style>
	:global(body) {
		margin: 0;
		background: #040608;
	}

	.goal-scene-shell {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		background: #040608;
	}

	.goal-hud-art {
		position: absolute;
		left: 50%;
		bottom: 0.15%;
		width: var(--goal-hud-width);
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 1;
		filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.48));
	}

	:global(.goal-scene-shell .game-shell) {
		background: transparent;
		min-height: 100vh;
	}

	:global(.goal-scene-shell .theme-backdrop) {
		display: none;
	}

	:global(.goal-scene-shell .top-bar-brand) {
		display: none;
	}

	:global(.goal-scene-shell .game-stage) {
		place-content: start center;
		padding: 12px 24px 154px;
	}

	:global(.goal-scene-shell .feature-banner) {
		margin: 0 auto 10px;
		width: min(700px, calc(100vw - 120px));
	}

	:global(.goal-scene-shell .top-bar) {
		position: absolute;
		left: 50%;
		bottom: 0.15%;
		width: var(--goal-hud-width);
		height: calc(var(--goal-hud-width) * 0.1903);
		transform: translateX(-50%);
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		z-index: 3;
		pointer-events: none;
	}

	:global(.goal-scene-shell .top-bar-stats) {
		position: absolute;
		inset: 0;
		display: block;
	}

	:global(.goal-scene-shell .stat-pill) {
		position: absolute;
		padding: 0;
		border: 0;
		background: transparent;
		box-shadow: none;
		text-align: center;
	}

	:global(.goal-scene-shell .stat-pill span) {
		display: none;
	}

	:global(.goal-scene-shell .stat-pill strong) {
		display: grid;
		place-items: center;
		height: 100%;
		font-size: clamp(10px, 0.92vw, 18px);
		font-weight: 800;
		color: #f2f2f2;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75);
	}

	:global(.goal-scene-shell .top-bar-stats .stat-pill:nth-child(1)) {
		left: 5.9%;
		top: 37.6%;
		width: 25.2%;
		height: 12.4%;
	}

	:global(.goal-scene-shell .top-bar-stats .stat-pill:nth-child(2)) {
		left: 57.1%;
		top: 37.2%;
		width: 19.8%;
		height: 12.4%;
	}

	:global(.goal-scene-shell .top-bar-stats .stat-pill:nth-child(3)) {
		left: 56.45%;
		top: 69.9%;
		width: 27.1%;
		height: 12.4%;
	}

	:global(.goal-scene-shell .game-controls) {
		position: absolute;
		left: 50%;
		bottom: 0.15%;
		width: var(--goal-hud-width);
		height: calc(var(--goal-hud-width) * 0.1903);
		transform: translateX(-50%);
		padding: 0;
		border: 0;
		background: transparent;
		grid-template-columns: 1fr;
		gap: 0;
		z-index: 4;
	}

	:global(.goal-scene-shell .controls-left),
	:global(.goal-scene-shell .controls-center),
	:global(.goal-scene-shell .controls-right) {
		position: absolute;
		gap: 0;
	}

	:global(.goal-scene-shell .controls-left) {
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	:global(.goal-scene-shell .controls-center) {
		left: 44.95%;
		top: 4.8%;
		width: 7.8%;
		height: 33%;
		transform: translateX(-50%);
		justify-items: center;
	}

	:global(.goal-scene-shell .controls-right) {
		right: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	:global(.goal-scene-shell .bet-stepper) {
		position: absolute;
		left: 58.5%;
		top: 18.5%;
		width: 26.8%;
		grid-template-columns: 12% 76% 12%;
		gap: 0;
	}

	:global(.goal-scene-shell .bet-display) {
		padding: 0;
		border: 0;
		background: transparent;
	}

	:global(.goal-scene-shell .bet-display span) {
		display: none;
	}

	:global(.goal-scene-shell .bet-display strong) {
		font-size: clamp(10px, 0.92vw, 18px);
		line-height: 1;
		color: #f2f2f2;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75);
	}

	:global(.goal-scene-shell .ctrl-button) {
		padding: 0;
		border: 0;
		background: transparent;
		font-size: 0;
		box-shadow: none;
	}

	:global(.goal-scene-shell .ctrl-button:hover:enabled) {
		transform: none;
	}

	:global(.goal-scene-shell .bonus-buy-row),
	:global(.goal-scene-shell .status-text),
	:global(.goal-scene-shell .info-button) {
		display: none;
	}

	:global(.goal-scene-shell .spin-button) {
		width: 100%;
		height: 100%;
		margin-top: 0;
		font-size: 0;
		box-shadow: none;
		border: 0;
		background: transparent;
	}

	:global(.goal-scene-shell .toggle-row) {
		position: absolute;
		left: 86.6%;
		top: 10.8%;
		width: 12.8%;
		grid-template-columns: 1fr;
		gap: 6px;
	}

	:global(.goal-scene-shell .toggle-button) {
		padding: 0;
		background: transparent;
		border: 0;
		border-radius: 0;
		font-size: 0.72rem;
		color: rgba(241, 236, 206, 0.95);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.72);
	}

	:global(.goal-scene-shell .toggle-button.is-active) {
		background: transparent;
		border: 0;
	}

	:global(.goal-scene-shell .autoplay-select),
	:global(.goal-scene-shell .autoplay-label) {
		position: absolute;
		left: 86.45%;
		bottom: 16.8%;
		width: 13.1%;
		padding: 2px 4px;
		border-radius: 8px;
		font-size: 0.7rem;
		background: rgba(5, 12, 18, 0.24);
		border: 0;
		color: rgba(241, 236, 206, 0.95);
	}

	:global(.goal-scene-shell .board-frame) {
		position: relative;
		width: min(42vw, 640px);
		min-width: min(42vw, 640px);
		margin: 0 auto;
		padding: 76px 46px 64px;
		border: 0;
		border-radius: 0;
		background: transparent;
		background-image: var(--goal-board-frame);
		background-repeat: no-repeat;
		background-size: 100% 100%;
		box-shadow: none;
		filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.42));
	}

	:global(.goal-scene-shell .frame-velvet),
	:global(.goal-scene-shell .frame-crown),
	:global(.goal-scene-shell .frame-scroll) {
		display: none;
	}

	:global(.goal-scene-shell .board) {
		padding: 0;
		background: transparent;
		box-shadow: none;
	}

	:global(.goal-scene-shell .board::before),
	:global(.goal-scene-shell .board::after) {
		display: none;
	}

	:global(.goal-scene-shell .cell) {
		border-radius: 6px;
		border: 1px solid rgba(196, 153, 65, 0.9);
		box-shadow: inset 0 0 0 1px rgba(255, 224, 152, 0.16), inset 0 -10px 18px rgba(0,0,0,0.16);
	}

	:global(.goal-scene-shell .cell:nth-child(5n + 1)),
	:global(.goal-scene-shell .cell:nth-child(5n + 2)),
	:global(.goal-scene-shell .cell:nth-child(5n + 3)) {
		background: linear-gradient(180deg, rgba(125, 31, 19, 0.96) 0%, rgba(146, 40, 25, 0.96) 35%, rgba(101, 23, 15, 0.98) 100%);
	}

	:global(.goal-scene-shell .cell:nth-child(5n + 4)),
	:global(.goal-scene-shell .cell:nth-child(5n + 5)) {
		background: linear-gradient(180deg, rgba(47, 77, 135, 0.96) 0%, rgba(56, 91, 156, 0.96) 35%, rgba(28, 52, 103, 0.98) 100%);
	}

	:global(.goal-scene-shell .symbol-tile-shell),
	:global(.goal-scene-shell .wheel-tile-shell),
	:global(.goal-scene-shell .symbol-shell) {
		filter: none;
	}

	:global(.goal-scene-shell .symbol-art),
	:global(.goal-scene-shell .wheel-tile-art),
	:global(.goal-scene-shell .scatter-symbol) {
		width: 72px;
		height: 72px;
		filter: drop-shadow(0 4px 8px rgba(0,0,0,0.26));
	}

	:global(.goal-scene-shell .cell-highlighted),
	:global(.goal-scene-shell .cell-highlighted-big),
	:global(.goal-scene-shell .cell-highlighted-quiet) {
		transform: none;
		box-shadow: inset 0 0 0 1px rgba(255, 235, 170, 0.3), 0 0 14px rgba(255, 225, 140, 0.18);
	}

	@media (max-width: 1200px) {
		.goal-scene-shell {
			--goal-hud-width: min(54vw, 640px);
		}

		:global(.goal-scene-shell .board-frame) {
			width: min(54vw, 640px);
			min-width: min(54vw, 640px);
		}
	}

	@media (max-width: 960px) {
		.goal-scene-shell {
			--goal-hud-width: min(86vw, 620px);
		}

		:global(.goal-scene-shell .board-frame) {
			width: min(86vw, 620px);
			min-width: min(86vw, 620px);
			padding: 64px 36px 54px;
		}

		:global(.goal-scene-shell .game-stage) {
			padding-bottom: 142px;
		}
	}
</style>

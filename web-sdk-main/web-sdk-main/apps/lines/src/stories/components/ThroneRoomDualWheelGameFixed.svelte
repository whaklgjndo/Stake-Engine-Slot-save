<script lang="ts">
	import DualWheelGame from './DualWheelGame.svelte';
	const atlasSceneUrl = 'https://bitchdontkillmyvibe.my.canva.site/dahg6n2hxiy/_assets/media/c8a368834b91c4b0f843901e6e57e128.png';
</script>

<div class="throne-room-game-shell">
	<img class="atlas-scene" src={atlasSceneUrl} alt="" draggable="false" />
	<DualWheelGame />
</div>

<style>
	.throne-room-game-shell {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		background: #040608;
		--scene-ratio: 1.7768817204;
		--scene-width: min(100vw, calc(100vh * var(--scene-ratio)));
		--scene-height: calc(var(--scene-width) / var(--scene-ratio));
		--scene-top: calc((100vh - var(--scene-height)) * 0.5);
		--board-frame-width: calc(var(--scene-width) * 0.41755);
		--board-grid-shift: calc(var(--scene-height) * 0.1035);
		--hud-width: calc(var(--scene-width) * 0.44175);
		--hud-height: calc(var(--scene-height) * 0.16667);
		--hud-top: calc(var(--scene-top) + var(--scene-height) * 0.83333);
	}

	.atlas-scene {
		position: absolute;
		left: 50%;
		top: var(--scene-top);
		width: var(--scene-width);
		height: var(--scene-height);
		transform: translateX(-50%);
		object-fit: contain;
		pointer-events: none;
		user-select: none;
	}

	:global(.throne-room-game-shell .game-shell) {
		background: transparent;
		min-height: 100vh;
	}

	:global(.throne-room-game-shell .theme-backdrop),
	:global(.throne-room-game-shell .top-bar-brand),
	:global(.throne-room-game-shell .frame-velvet),
	:global(.throne-room-game-shell .frame-crown),
	:global(.throne-room-game-shell .frame-scroll),
	:global(.throne-room-game-shell .board::before),
	:global(.throne-room-game-shell .board::after),
	:global(.throne-room-game-shell .bonus-buy-row),
	:global(.throne-room-game-shell .status-text),
	:global(.throne-room-game-shell .autoplay-select),
	:global(.throne-room-game-shell .autoplay-label),
	:global(.throne-room-game-shell .info-button) {
		display: none !important;
	}

	:global(.throne-room-game-shell .game-stage) {
		display: block;
		min-height: 100vh;
		padding: 0;
	}

	:global(.throne-room-game-shell .feature-banner) {
		position: absolute;
		left: 50%;
		top: calc(var(--scene-top) + 10px);
		transform: translateX(-50%);
		width: min(640px, calc(var(--scene-width) * 0.56));
		z-index: 3;
	}

	:global(.throne-room-game-shell .board-frame) {
		position: absolute;
		left: 50%;
		top: var(--scene-top);
		transform: translateX(-50%);
		padding: 0 !important;
		width: var(--board-frame-width) !important;
		min-width: var(--board-frame-width) !important;
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
	}

	:global(.throne-room-game-shell .board) {
		padding: 0 !important;
		background: transparent !important;
		box-shadow: none !important;
		transform: translateY(var(--board-grid-shift)) scale(0.766);
		transform-origin: top center;
	}

	:global(.throne-room-game-shell .cell) {
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
	}

	:global(.throne-room-game-shell .symbol-art),
	:global(.throne-room-game-shell .symbol-art-sheet),
	:global(.throne-room-game-shell .wheel-tile-art),
	:global(.throne-room-game-shell .scatter-symbol),
	:global(.throne-room-game-shell .symbol-tile-shell),
	:global(.throne-room-game-shell .wheel-tile-shell),
	:global(.throne-room-game-shell .symbol-tile-shell-bonus) {
		width: 78px;
		height: 78px;
	}

	:global(.throne-room-game-shell .top-bar) {
		position: absolute;
		left: 50%;
		top: var(--hud-top);
		width: var(--hud-width);
		height: var(--hud-height);
		transform: translateX(-50%);
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		pointer-events: none;
	}

	:global(.throne-room-game-shell .top-bar-stats) {
		position: absolute;
		inset: 0;
		display: block;
	}

	:global(.throne-room-game-shell .stat-pill) {
		position: absolute;
		padding: 0;
		border: 0;
		background: transparent;
		box-shadow: none;
		text-align: center;
	}

	:global(.throne-room-game-shell .stat-pill span) {
		display: none;
	}

	:global(.throne-room-game-shell .stat-pill strong) {
		display: grid;
		place-items: center;
		height: 100%;
		font-size: clamp(9px, 0.72vw, 13px);
		font-weight: 800;
		color: #f2f2f2;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.82);
	}

	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(1)) {
		left: 5.3%;
		top: 43.8%;
		width: 26.4%;
		height: 13.5%;
	}

	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(2)) {
		left: 58.7%;
		top: 40.0%;
		width: 13.7%;
		height: 13.5%;
	}

	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(3)) {
		left: 55.8%;
		top: 60.8%;
		width: 22.8%;
		height: 13.5%;
	}

	:global(.throne-room-game-shell .game-controls) {
		position: absolute;
		left: 50%;
		top: var(--hud-top);
		width: var(--hud-width);
		height: var(--hud-height);
		transform: translateX(-50%);
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		grid-template-columns: 1fr;
		gap: 0;
	}

	:global(.throne-room-game-shell .controls-left),
	:global(.throne-room-game-shell .controls-center),
	:global(.throne-room-game-shell .controls-right) {
		position: absolute;
		gap: 0;
	}

	:global(.throne-room-game-shell .controls-left) {
		left: 55.2%;
		top: 19.2%;
		width: 24.2%;
		height: 17.6%;
	}

	:global(.throne-room-game-shell .controls-center) {
		left: 40.85%;
		top: 3.5%;
		width: 10.95%;
		height: 50.8%;
		transform: none;
		justify-items: center;
		margin-top: 0;
	}

	:global(.throne-room-game-shell .controls-right) {
		left: 84.8%;
		top: 16.1%;
		width: 12.9%;
		height: 45.4%;
	}

	:global(.throne-room-game-shell .bet-stepper) {
		position: absolute;
		inset: 0;
		display: block;
	}

	:global(.throne-room-game-shell .bet-display) {
		display: none;
	}

	:global(.throne-room-game-shell .bet-stepper .ctrl-button:first-child) {
		position: absolute;
		left: 0;
		top: 0;
		width: 12.5%;
		height: 100%;
		padding: 0;
		border-radius: 999px;
	}

	:global(.throne-room-game-shell .bet-stepper .ctrl-button:last-child) {
		position: absolute;
		right: 0;
		top: 0;
		width: 12.5%;
		height: 100%;
		padding: 0;
		border-radius: 999px;
	}

	:global(.throne-room-game-shell .ctrl-button) {
		padding: 0;
		border: 0;
		background: transparent;
		font-size: 0;
		box-shadow: none;
	}

	:global(.throne-room-game-shell .ctrl-button:hover:enabled) {
		transform: none;
	}

	:global(.throne-room-game-shell .spin-button) {
		width: 100%;
		height: 100%;
		margin-top: 0;
		font-size: 0.72rem;
		box-shadow: none;
		border: 0;
		background: radial-gradient(circle at 38% 28%, rgba(233, 247, 255, 0.96), rgba(171, 222, 255, 0.96) 34%, rgba(83, 166, 236, 0.98) 68%, rgba(33, 99, 174, 0.98) 100%);
	}

	:global(.throne-room-game-shell .spin-button-stop) {
		background: linear-gradient(180deg, #ffc484, #f98f54 56%, #e55a2f 100%);
	}

	:global(.throne-room-game-shell .spin-button-skip) {
		background: linear-gradient(180deg, #c2e8ff, #6fc4ff 56%, #37a2f5 100%);
	}

	:global(.throne-room-game-shell .toggle-row) {
		position: absolute;
		inset: 0;
		display: block;
	}

	:global(.throne-room-game-shell .toggle-button) {
		position: absolute;
		padding: 0;
		background: transparent;
		border: 0;
		border-radius: 8px;
		font-size: 0;
		color: transparent;
		line-height: 0;
		box-shadow: none;
	}

	:global(.throne-room-game-shell .toggle-button > *) {
		font-size: 0 !important;
		color: transparent !important;
	}

	:global(.throne-room-game-shell .toggle-row .toggle-button:first-child) {
		left: 18.5%;
		top: 0;
		width: 73.5%;
		height: 34.5%;
	}

	:global(.throne-room-game-shell .toggle-row .toggle-button:last-child) {
		left: 0;
		top: 51.5%;
		width: 100%;
		height: 45%;
		margin-top: 0;
	}

	@media (max-width: 1200px) {
		.throne-room-game-shell {
			--scene-width: min(100vw, calc(100vh * 1.72));
		}
	}

	@media (max-width: 960px) {
		.throne-room-game-shell {
			--scene-width: min(100vw, calc(100vh * 1.58));
		}
	}
</style>

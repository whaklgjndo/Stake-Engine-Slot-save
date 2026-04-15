<script lang="ts">
	import DualWheelGame from './DualWheelGame.svelte';

	const sceneHallArt = new URL(
		'../../components/art/svg_components_bundle/scene_hall.svg',
		import.meta.url
	).href;
	const frameOpenArt = new URL(
		'../../components/art/svg_components_bundle/frame_open.svg',
		import.meta.url
	).href;
	const frameInnerBevelArt = new URL(
		'../../components/art/svg_components_bundle/frame_inner_bevel.svg',
		import.meta.url
	).href;
	const gridLeftArt = new URL(
		'../../components/art/svg_components_bundle/grid_left.svg',
		import.meta.url
	).href;
	const gridRightArt = new URL(
		'../../components/art/svg_components_bundle/grid_right.svg',
		import.meta.url
	).href;
	const controlBarArt = new URL(
		'../../components/art/svg_components_bundle/control_bar.svg',
		import.meta.url
	).href;
	const spinIconArt = new URL(
		'../../components/art/svg_components_bundle/spin_icon.svg',
		import.meta.url
	).href;
	const autospinIconArt = new URL(
		'../../components/art/svg_components_bundle/autospin_icon.svg',
		import.meta.url
	).href;
	const lightningYellowArt = new URL(
		'../../components/art/svg_components_bundle/lightning_yellow.svg',
		import.meta.url
	).href;
</script>

<div class="throne-room-game-shell">
	<img class="scene-underlay" src={sceneHallArt} alt="" draggable="false" />

	<div class="board-art-shell" aria-hidden="true">
		<img class="board-frame-open" src={frameOpenArt} alt="" draggable="false" />
		<img class="board-frame-bevel" src={frameInnerBevelArt} alt="" draggable="false" />

		<div class="board-grid-bed">
			<img class="board-grid-left" src={gridLeftArt} alt="" draggable="false" />
			<img class="board-grid-right" src={gridRightArt} alt="" draggable="false" />
		</div>
	</div>

	<img class="hud-underlay" src={controlBarArt} alt="" draggable="false" />

	<DualWheelGame />
</div>

<style>
	.throne-room-game-shell {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		background: #040608;

		--scene-ratio: 1.8257425743;
		--scene-width: min(100vw, calc(100vh * var(--scene-ratio)));
		--scene-height: calc(var(--scene-width) / var(--scene-ratio));
		--scene-top: calc((100vh - var(--scene-height)) * 0.5);

		--board-width: calc(var(--scene-width) * 0.34273);
		--board-height: calc(var(--board-width) * 1.31962);
		--board-top: calc(var(--scene-top) + var(--scene-height) * 0.015);

		--grid-width: calc(var(--scene-width) * 0.26681);
		--grid-height: calc(var(--grid-width) * 1.27079);
		--grid-top: calc(var(--scene-top) + var(--scene-height) * 0.1435);

		--hud-width: calc(var(--scene-width) * 0.39262);
		--hud-height: calc(var(--hud-width) * 0.20994);
		--hud-top: calc(var(--scene-top) + var(--scene-height) * 0.826);
	}

	.scene-underlay,
	.hud-underlay,
	.board-frame-open,
	.board-frame-bevel,
	.board-grid-left,
	.board-grid-right {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		pointer-events: none;
		user-select: none;
		display: block;
	}

	.scene-underlay {
		top: var(--scene-top);
		width: var(--scene-width);
		height: var(--scene-height);
		object-fit: contain;
	}

	.board-art-shell {
		position: absolute;
		left: 50%;
		top: var(--board-top);
		width: var(--board-width);
		height: var(--board-height);
		transform: translateX(-50%);
		pointer-events: none;
	}

	.board-frame-open,
	.board-frame-bevel {
		left: 50%;
		top: 0;
		width: 100%;
		height: auto;
		transform: translateX(-50%);
	}

	.board-frame-bevel {
		inset: auto 0 0 50%;
		width: calc(100% - 2px);
		opacity: 0.98;
	}

	.board-grid-bed {
		position: absolute;
		left: 50%;
		top: calc(var(--board-height) * 0.165);
		width: var(--grid-width);
		height: var(--grid-height);
		transform: translateX(-50%);
		display: flex;
		pointer-events: none;
		overflow: hidden;
	}

	.board-grid-left,
	.board-grid-right {
		position: relative;
		left: auto;
		top: auto;
		transform: none;
		height: 100%;
		width: auto;
	}

	.board-grid-left {
		width: 50.5%;
		height: 100%;
	}

	.board-grid-right {
		width: 49.5%;
		height: 100%;
	}

	.hud-underlay {
		top: var(--hud-top);
		width: var(--hud-width);
		height: auto;
		filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 0.5));
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
		display: grid;
		place-items: center;
		padding: calc(var(--scene-top) + 10px) 24px calc(var(--scene-top) + var(--scene-height) * 0.19);
	}

	:global(.throne-room-game-shell .feature-banner) {
		margin-inline: auto;
		width: min(640px, calc(var(--scene-width) * 0.56));
	}

	:global(.throne-room-game-shell .board-frame) {
		position: relative;
		z-index: 1;
		padding: 0 !important;
		width: var(--board-width) !important;
		min-width: var(--board-width) !important;
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
	}

	:global(.throne-room-game-shell .board) {
		padding: 0 !important;
		background: transparent !important;
		box-shadow: none !important;
		transform: translateY(calc(var(--scene-height) * 0.1435)) scale(0.638);
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
		width: 72px;
		height: 72px;
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
		left: 5.2%;
		top: 43.4%;
		width: 26.5%;
		height: 14%;
	}

	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(2)) {
		left: 58.2%;
		top: 24.5%;
		width: 14.2%;
		height: 12.8%;
	}

	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(3)) {
		left: 55.6%;
		top: 61.2%;
		width: 23.1%;
		height: 13.4%;
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
		left: 40.8%;
		top: 3.4%;
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
		font-size: 0;
		color: transparent;
		box-shadow: none;
		border: 0;
		background:
			center / 58% 58% no-repeat url("${spinIconArt}"),
			radial-gradient(circle at 38% 28%, rgba(233, 247, 255, 0.96), rgba(171, 222, 255, 0.96) 34%, rgba(83, 166, 236, 0.98) 68%, rgba(33, 99, 174, 0.98) 100%);
	}

	:global(.throne-room-game-shell .spin-button-stop) {
		background:
			center / 58% 58% no-repeat url("${spinIconArt}"),
			linear-gradient(180deg, #ffc484, #f98f54 56%, #e55a2f 100%);
	}

	:global(.throne-room-game-shell .spin-button-skip) {
		background:
			center / 58% 58% no-repeat url("${spinIconArt}"),
			linear-gradient(180deg, #c2e8ff, #6fc4ff 56%, #37a2f5 100%);
	}

	:global(.throne-room-game-shell .status-text) {
		display: none;
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
		background: center / 34% 70% no-repeat url("${lightningYellowArt}");
	}

	:global(.throne-room-game-shell .toggle-row .toggle-button:last-child) {
		left: 0;
		top: 51.5%;
		width: 100%;
		height: 45%;
		margin-top: 0;
		background: center / 32% 68% no-repeat url("${autospinIconArt}");
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

		:global(.throne-room-game-shell .board) {
			transform: translateY(calc(var(--scene-height) * 0.1435)) scale(0.57);
		}
	}
</style>
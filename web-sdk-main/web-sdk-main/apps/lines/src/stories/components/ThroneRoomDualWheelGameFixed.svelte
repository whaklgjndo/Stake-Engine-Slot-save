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
	const bonusIconArt = new URL(
		'../../components/art/svg_components_bundle/bonus_icon.svg',
		import.meta.url
	).href;
	const lightningYellowArt = new URL(
		'../../components/art/svg_components_bundle/lightning_yellow.svg',
		import.meta.url
	).href;
	const menuIconArt = new URL(
		'../../components/art/svg_components_bundle/menu_icon.svg',
		import.meta.url
	).href;
</script>

<div class="throne-room-game-shell">
	<img class="scene-underlay" src={sceneHallArt} alt="" draggable="false" />

	<div class="board-art-shell" aria-hidden="true">
		<img class="board-frame-open" src={frameOpenArt} alt="" draggable="false" />
		<div class="board-cloth-bed">
			<div class="board-cloth-left"></div>
			<div class="board-cloth-right"></div>
		</div>
		<div class="board-grid-bed">
			<img class="board-grid-left" src={gridLeftArt} alt="" draggable="false" />
			<img class="board-grid-right" src={gridRightArt} alt="" draggable="false" />
		</div>
	</div>

	<div class="hud-art-shell" aria-hidden="true">
		<img class="hud-underlay" src={controlBarArt} alt="" draggable="false" />
		<div class="hud-icon hud-icon-bonus"></div>
		<div class="hud-icon hud-icon-spin"></div>
		<div class="hud-icon hud-icon-quick"></div>
		<div class="hud-icon hud-icon-auto"></div>
		<div class="hud-icon hud-icon-menu"></div>
	</div>

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
		--board-width: calc(var(--scene-width) * 0.3427);
		--board-height: calc(var(--board-width) * 1.3196);
		--board-top: calc(var(--scene-top) + var(--scene-height) * 0.015);
		--grid-width: calc(var(--scene-width) * 0.2668);
		--grid-height: calc(var(--grid-width) * 1.2708);
		--grid-top-in-frame: 16.45%;
		--grid-left-in-frame: 10.7%;
		--hud-width: calc(var(--scene-width) * 0.3926);
		--hud-height: calc(var(--hud-width) * 0.2099);
		--hud-top: calc(var(--scene-top) + var(--scene-height) * 0.826);
	}

	.scene-underlay,
	.board-frame-open,
	.hud-underlay {
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

	.board-frame-open {
		left: 50%;
		top: 0;
		width: 100%;
		height: auto;
		transform: translateX(-50%);
		z-index: 3;
	}

	.board-cloth-bed,
	.board-grid-bed {
		position: absolute;
		left: var(--grid-left-in-frame);
		top: var(--grid-top-in-frame);
		width: 78.6%;
		height: 74.9%;
		border-radius: 12px;
		overflow: hidden;
	}

	.board-cloth-bed {
		display: flex;
		z-index: 1;
		box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.28);
	}

	.board-cloth-left,
	.board-cloth-right {
		flex: 1 1 0;
		height: 100%;
	}

	.board-cloth-left {
		background:
			radial-gradient(circle at 30% 22%, rgba(255, 201, 170, 0.18), transparent 34%),
			radial-gradient(circle at 72% 74%, rgba(71, 8, 8, 0.28), transparent 38%),
			linear-gradient(180deg, #8b281d 0%, #7a2017 22%, #67170f 62%, #55110d 100%);
	}

	.board-cloth-right {
		background:
			radial-gradient(circle at 72% 22%, rgba(193, 220, 255, 0.18), transparent 34%),
			radial-gradient(circle at 28% 74%, rgba(8, 28, 71, 0.30), transparent 40%),
			linear-gradient(180deg, #3b5b9a 0%, #315084 22%, #29436f 62%, #203256 100%);
	}

	.board-grid-bed {
		display: flex;
		z-index: 2;
	}

	.board-grid-left,
	.board-grid-right {
		height: 100%;
		width: 50%;
		object-fit: fill;
		display: block;
	}

	.hud-art-shell {
		position: absolute;
		left: 50%;
		top: var(--hud-top);
		width: var(--hud-width);
		height: var(--hud-height);
		transform: translateX(-50%);
		pointer-events: none;
	}

	.hud-underlay {
		top: 0;
		width: 100%;
		height: auto;
		filter: drop-shadow(0 16px 24px rgba(0,0,0,.5));
	}

	.hud-icon {
		position: absolute;
		background-repeat: no-repeat;
		background-position: center;
		background-size: contain;
		opacity: 0.96;
	}

	.hud-icon-bonus {
		left: 8.9%;
		top: 53.5%;
		width: 10.4%;
		height: 30%;
		background-image: url("${bonusIconArt}");
	}

	.hud-icon-spin {
		left: 45.3%;
		top: 28%;
		width: 7.4%;
		height: 40%;
		background-image: url("${spinIconArt}");
		background-size: 72% 72%;
	}

	.hud-icon-quick {
		left: 79.5%;
		top: 29%;
		width: 6.5%;
		height: 21%;
		background-image: url("${lightningYellowArt}");
	}

	.hud-icon-auto {
		left: 80.2%;
		top: 59%;
		width: 6%;
		height: 22%;
		background-image: url("${autospinIconArt}");
	}

	.hud-icon-menu {
		left: 94.4%;
		top: 56%;
		width: 2.6%;
		height: 10%;
		background-image: url("${menuIconArt}");
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
		z-index: 5;
	}

	:global(.throne-room-game-shell .board-frame) {
		position: absolute;
		left: 50%;
		top: var(--board-top);
		width: var(--board-width) !important;
		height: var(--board-height);
		min-width: var(--board-width) !important;
		transform: translateX(-50%);
		padding: 0 !important;
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
		z-index: 4;
	}

	:global(.throne-room-game-shell .board) {
		position: absolute;
		left: var(--grid-left-in-frame);
		top: var(--grid-top-in-frame);
		width: 78.6%;
		height: 74.9%;
		padding: 0 !important;
		background: transparent !important;
		box-shadow: none !important;
		transform: none !important;
		transform-origin: top left;
		overflow: hidden;
		clip-path: inset(0 round 12px);
	}

	:global(.throne-room-game-shell .board .cell) {
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
		width: 64px;
		height: 64px;
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
		z-index: 5;
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
		font-size: clamp(10px, 0.72vw, 14px);
		font-weight: 800;
		color: #f2f2f2;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.82);
	}

	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(1)) {
		left: 10.8%;
		top: 58.5%;
		width: 18.5%;
		height: 13%;
	}

	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(2)) {
		left: 59.6%;
		top: 39.8%;
		width: 12.5%;
		height: 12%;
	}

	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(3)) {
		left: 56.8%;
		top: 73.6%;
		width: 17.8%;
		height: 12.6%;
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
		z-index: 6;
	}

	:global(.throne-room-game-shell .controls-left),
	:global(.throne-room-game-shell .controls-center),
	:global(.throne-room-game-shell .controls-right) {
		position: absolute;
		gap: 0;
	}

	:global(.throne-room-game-shell .controls-left) {
		left: 55.2%;
		top: 18.8%;
		width: 24.2%;
		height: 18%;
	}

	:global(.throne-room-game-shell .controls-center) {
		left: 42.7%;
		top: 11.2%;
		width: 7.6%;
		height: 34%;
		transform: none;
		justify-items: center;
		margin-top: 0;
	}

	:global(.throne-room-game-shell .controls-right) {
		left: 79.2%;
		top: 25.8%;
		width: 18%;
		height: 46%;
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
		background: transparent;
	}

	:global(.throne-room-game-shell .spin-button-stop),
	:global(.throne-room-game-shell .spin-button-skip) {
		background: transparent;
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
		left: 4%;
		top: 52%;
		width: 16%;
		height: 28%;
	}

	:global(.throne-room-game-shell .toggle-row .toggle-button:last-child) {
		left: 80%;
		top: 56%;
		width: 7%;
		height: 23%;
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

		:global(.throne-room-game-shell .symbol-art),
		:global(.throne-room-game-shell .symbol-art-sheet),
		:global(.throne-room-game-shell .wheel-tile-art),
		:global(.throne-room-game-shell .scatter-symbol),
		:global(.throne-room-game-shell .symbol-tile-shell),
		:global(.throne-room-game-shell .wheel-tile-shell),
		:global(.throne-room-game-shell .symbol-tile-shell-bonus) {
			width: 56px;
			height: 56px;
		}
	}
</style>

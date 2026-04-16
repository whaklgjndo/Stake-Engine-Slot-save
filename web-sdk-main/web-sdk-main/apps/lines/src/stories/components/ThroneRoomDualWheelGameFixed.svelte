<script lang="ts">
	import DualWheelGame from './DualWheelGame.svelte';

	const sceneHallArt = new URL('../../components/art/svg_components_bundle/scene_hall.svg', import.meta.url).href;
	const frameOpenArt = new URL('../../components/art/svg_components_bundle/frame_open.svg', import.meta.url).href;
	const frameInnerBevelArt = new URL('../../components/art/svg_components_bundle/frame_inner_bevel.svg', import.meta.url).href;
	const gridLeftArt = new URL('../../components/art/svg_components_bundle/grid_left.svg', import.meta.url).href;
	const gridRightArt = new URL('../../components/art/svg_components_bundle/grid_right.svg', import.meta.url).href;
	const controlBarArt = new URL('../../components/art/svg_components_bundle/control_bar.svg', import.meta.url).href;
	const spinIconArt = new URL('../../components/art/svg_components_bundle/spin_icon.svg', import.meta.url).href;
	const autospinIconArt = new URL('../../components/art/svg_components_bundle/autospin_icon.svg', import.meta.url).href;
	const bonusIconArt = new URL('../../components/art/svg_components_bundle/bonus_icon.svg', import.meta.url).href;
	const lightningYellowArt = new URL('../../components/art/svg_components_bundle/lightning_yellow.svg', import.meta.url).href;
	const menuIconArt = new URL('../../components/art/svg_components_bundle/menu_icon.svg', import.meta.url).href;
</script>

<div class="throne-room-shell">
	<div class="design-stage">
		<img class="scene-layer" src={sceneHallArt} alt="" draggable="false" />

		<div class="board-anchor" aria-hidden="true">
			<img class="board-frame-layer" src={frameOpenArt} alt="" draggable="false" />
			<div class="board-cloth-layer"></div>
			<img class="board-grid-layer" src={frameInnerBevelArt} alt="" draggable="false" />
		</div>

		<div class="footer-anchor" aria-hidden="true">
			<img class="footer-layer" src={controlBarArt} alt="" draggable="false" />
			<div class="footer-icon footer-icon-bonus"></div>
			<div class="footer-icon footer-icon-spin"></div>
			<div class="footer-icon footer-icon-quick"></div>
			<div class="footer-icon footer-icon-auto"></div>
			<div class="footer-icon footer-icon-menu"></div>
		</div>

		<DualWheelGame />
	</div>
</div>

<style>
	.throne-room-shell {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		background: #040608;
	}

	.design-stage {
		position: absolute;
		left: 50%;
		top: 50%;
		width: min(100vw, calc(100vh * (922 / 505)));
		aspect-ratio: 922 / 505;
		transform: translate(-50%, -50%);
		isolation: isolate;
	}

	.scene-layer,
	.board-frame-layer,
	.board-grid-layer,
	.footer-layer {
		position: absolute;
		display: block;
		pointer-events: none;
		user-select: none;
	}

	.scene-layer {
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.board-anchor {
		position: absolute;
		left: 32.86%;
		top: 2.77%;
		width: 34.27%;
		height: 82.57%;
		pointer-events: none;
	}

	.board-frame-layer,
	.board-grid-layer {
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.board-frame-layer { z-index: 1; }
	.board-grid-layer { z-index: 3; }

	.board-cloth-layer {
		position: absolute;
		left: 11.4%;
		top: 13.9%;
		width: 77.2%;
		height: 73.4%;
		z-index: 2;
		border-radius: 10px;
		overflow: hidden;
		background-image: url("${gridLeftArt}"), url("${gridRightArt}");
		background-position: left top, right top;
		background-size: 50% 100%, 50% 100%;
		background-repeat: no-repeat, no-repeat;
	}

	.footer-anchor {
		position: absolute;
		left: 30.37%;
		top: 83.37%;
		width: 39.26%;
		height: 15.05%;
		pointer-events: none;
	}

	.footer-layer {
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.footer-icon {
		position: absolute;
		background-repeat: no-repeat;
		background-position: center;
		background-size: contain;
		opacity: 0.96;
	}

	.footer-icon-bonus { left: 8.8%; top: 52%; width: 10.5%; height: 30%; background-image: url("${bonusIconArt}"); }
	.footer-icon-spin { left: 44.8%; top: 24%; width: 10%; height: 40%; background-image: url("${spinIconArt}"); }
	.footer-icon-quick { left: 80%; top: 28%; width: 5.5%; height: 20%; background-image: url("${lightningYellowArt}"); }
	.footer-icon-auto { left: 80%; top: 58%; width: 5.5%; height: 22%; background-image: url("${autospinIconArt}"); }
	.footer-icon-menu { left: 95%; top: 57%; width: 2.2%; height: 10%; background-image: url("${menuIconArt}"); }

	:global(.throne-room-shell .game-shell) {
		background: transparent;
		min-height: 100%;
	}

	:global(.throne-room-shell .theme-backdrop),
	:global(.throne-room-shell .top-bar-brand),
	:global(.throne-room-shell .frame-velvet),
	:global(.throne-room-shell .frame-crown),
	:global(.throne-room-shell .frame-scroll),
	:global(.throne-room-shell .board::before),
	:global(.throne-room-shell .board::after),
	:global(.throne-room-shell .bonus-buy-row),
	:global(.throne-room-shell .status-text),
	:global(.throne-room-shell .autoplay-select),
	:global(.throne-room-shell .autoplay-label),
	:global(.throne-room-shell .info-button) {
		display: none !important;
	}

	:global(.throne-room-shell .game-stage) {
		position: absolute;
		inset: 0;
		display: block;
		min-height: 0;
		padding: 0;
	}

	:global(.throne-room-shell .feature-banner) {
		position: absolute;
		left: 50%;
		top: 1.6%;
		transform: translateX(-50%);
		width: 48%;
		z-index: 8;
	}

	:global(.throne-room-shell .board-frame) {
		position: absolute;
		left: 36.78%;
		top: 14.26%;
		width: 580px !important;
		height: 580px;
		min-width: 580px !important;
		padding: 0 !important;
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
		transform-origin: top left;
		transform: scale(0.422);
		z-index: 4;
	}

	:global(.throne-room-shell .board) {
		position: relative;
		padding: 6px !important;
		background: transparent !important;
		box-shadow: none !important;
		transform: none !important;
		transform-origin: top left;
		overflow: hidden;
		clip-path: inset(0 round 10px);
	}

	:global(.throne-room-shell .board .cell) {
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
	}

	:global(.throne-room-shell .symbol-art),
	:global(.throne-room-shell .symbol-art-sheet),
	:global(.throne-room-shell .wheel-tile-art),
	:global(.throne-room-shell .scatter-symbol),
	:global(.throne-room-shell .symbol-tile-shell),
	:global(.throne-room-shell .wheel-tile-shell),
	:global(.throne-room-shell .symbol-tile-shell-bonus) {
		width: 64px;
		height: 64px;
	}

	:global(.throne-room-shell .top-bar) {
		position: absolute;
		left: 30.37%;
		top: 83.37%;
		width: 39.26%;
		height: 15.05%;
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		pointer-events: none;
		z-index: 9;
	}

	:global(.throne-room-shell .top-bar-stats) {
		position: absolute;
		inset: 0;
		display: block;
	}

	:global(.throne-room-shell .stat-pill) {
		position: absolute;
		padding: 0;
		border: 0;
		background: transparent;
		box-shadow: none;
		text-align: center;
	}

	:global(.throne-room-shell .stat-pill span) { display: none; }
	:global(.throne-room-shell .stat-pill strong) {
		display: grid;
		place-items: center;
		height: 100%;
		font-size: clamp(9px, 0.72vw, 13px);
		font-weight: 800;
		color: #f2f2f2;
		text-shadow: 0 1px 2px rgba(0,0,0,.82);
	}
	:global(.throne-room-shell .top-bar-stats .stat-pill:nth-child(1)) { left: 10.8%; top: 58.5%; width: 18.5%; height: 13%; }
	:global(.throne-room-shell .top-bar-stats .stat-pill:nth-child(2)) { left: 59.6%; top: 39.8%; width: 12.5%; height: 12%; }
	:global(.throne-room-shell .top-bar-stats .stat-pill:nth-child(3)) { left: 56.8%; top: 73.6%; width: 17.8%; height: 12.6%; }

	:global(.throne-room-shell .game-controls) {
		position: absolute;
		left: 30.37%;
		top: 83.37%;
		width: 39.26%;
		height: 15.05%;
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		grid-template-columns: 1fr;
		gap: 0;
		z-index: 10;
	}

	:global(.throne-room-shell .controls-left),
	:global(.throne-room-shell .controls-center),
	:global(.throne-room-shell .controls-right) {
		position: absolute;
		gap: 0;
	}

	:global(.throne-room-shell .controls-left) { left: 55.1%; top: 18.5%; width: 24.5%; height: 18%; }
	:global(.throne-room-shell .controls-center) { left: 42.5%; top: 11%; width: 7.8%; height: 34%; transform: none; justify-items: center; margin-top: 0; }
	:global(.throne-room-shell .controls-right) { left: 79.2%; top: 25.5%; width: 18%; height: 46%; }

	:global(.throne-room-shell .bet-stepper) { position: absolute; inset: 0; display: block; }
	:global(.throne-room-shell .bet-display) { display: none; }
	:global(.throne-room-shell .bet-stepper .ctrl-button:first-child) { position: absolute; left: 0; top: 0; width: 12.5%; height: 100%; padding: 0; border-radius: 999px; }
	:global(.throne-room-shell .bet-stepper .ctrl-button:last-child) { position: absolute; right: 0; top: 0; width: 12.5%; height: 100%; padding: 0; border-radius: 999px; }
	:global(.throne-room-shell .ctrl-button) { padding: 0; border: 0; background: transparent; font-size: 0; box-shadow: none; }
	:global(.throne-room-shell .ctrl-button:hover:enabled) { transform: none; }
	:global(.throne-room-shell .spin-button) { width: 100%; height: 100%; margin-top: 0; font-size: 0; color: transparent; box-shadow: none; border: 0; background: transparent; }
	:global(.throne-room-shell .spin-button-stop), :global(.throne-room-shell .spin-button-skip) { background: transparent; }
	:global(.throne-room-shell .toggle-row) { position: absolute; inset: 0; display: block; }
	:global(.throne-room-shell .toggle-button) { position: absolute; padding: 0; background: transparent; border: 0; border-radius: 8px; font-size: 0; color: transparent; line-height: 0; box-shadow: none; }
	:global(.throne-room-shell .toggle-button > *) { font-size: 0 !important; color: transparent !important; }
	:global(.throne-room-shell .toggle-row .toggle-button:first-child) { left: 4%; top: 52%; width: 16%; height: 28%; }
	:global(.throne-room-shell .toggle-row .toggle-button:last-child) { left: 80%; top: 56%; width: 7%; height: 23%; margin-top: 0; }

	@media (max-width: 960px) {
		:global(.throne-room-shell .board-frame) { transform: scale(0.36); }
		:global(.throne-room-shell .symbol-art),
		:global(.throne-room-shell .symbol-art-sheet),
		:global(.throne-room-shell .wheel-tile-art),
		:global(.throne-room-shell .scatter-symbol),
		:global(.throne-room-shell .symbol-tile-shell),
		:global(.throne-room-shell .wheel-tile-shell),
		:global(.throne-room-shell .symbol-tile-shell-bonus) { width: 56px; height: 56px; }
	}
</style>

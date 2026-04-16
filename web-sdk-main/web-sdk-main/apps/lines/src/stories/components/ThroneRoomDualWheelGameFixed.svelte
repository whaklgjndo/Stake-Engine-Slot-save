<script lang="ts">
	import DualWheelGame from './DualWheelGame.svelte';

	const sceneHallArt = new URL('../../components/art/svg_components_bundle/scene_hall.svg', import.meta.url).href;
	const frameOpenArt = new URL('../../components/art/svg_components_bundle/frame_open.svg', import.meta.url).href;
	const bannerArt = new URL('../../components/art/svg_components_bundle/banner.svg', import.meta.url).href;
	const gridArt = new URL('../../components/art/svg_components_bundle/grid_left.svg', import.meta.url).href;
	const controlBarArt = new URL('../../components/art/svg_components_bundle/control_bar.svg', import.meta.url).href;
	const spinIconArt = new URL('../../components/art/svg_components_bundle/spin_icon.svg', import.meta.url).href;
	const autospinIconArt = new URL('../../components/art/svg_components_bundle/autospin_icon.svg', import.meta.url).href;
	const bonusIconArt = new URL('../../components/art/svg_components_bundle/bonus_icon.svg', import.meta.url).href;
	const lightningYellowArt = new URL('../../components/art/svg_components_bundle/lightning_yellow.svg', import.meta.url).href;
	const menuIconArt = new URL('../../components/art/svg_components_bundle/menu_icon.svg', import.meta.url).href;
	const chevronsIconArt = new URL('../../components/art/svg_components_bundle/chevrons_icon.svg', import.meta.url).href;
</script>

<div class="throne-room-shell">
	<div class="design-stage">
		<img class="layer background" src={sceneHallArt} alt="" draggable="false" />
		<img class="layer banner" src={bannerArt} alt="" draggable="false" />
		<img class="layer grid" src={gridArt} alt="" draggable="false" />
		<img class="layer frame" src={frameOpenArt} alt="" draggable="false" />
		<img class="layer bar" src={controlBarArt} alt="" draggable="false" />

		<div class="controls-art" aria-hidden="true">
			<img class="control-icon menu" src={menuIconArt} alt="" draggable="false" />
			<img class="control-icon bonus" src={bonusIconArt} alt="" draggable="false" />
			<img class="control-icon spin" src={spinIconArt} alt="" draggable="false" />
			<img class="control-icon chevrons" src={chevronsIconArt} alt="" draggable="false" />
			<img class="control-icon autospin" src={autospinIconArt} alt="" draggable="false" />
			<img class="control-icon lightning" src={lightningYellowArt} alt="" draggable="false" />
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
	}

	.layer,
	.control-icon {
		position: absolute;
		display: block;
		max-width: none;
		user-select: none;
		-webkit-user-drag: none;
		pointer-events: none;
	}

	.background { inset: 0; width: 100%; height: 100%; object-fit: contain; z-index: 0; }
	.banner { left: 35.03%; top: 12.87%; width: 23.10%; z-index: 1; }
	.grid { left: 34.82%; top: 14.06%; width: 24.30%; z-index: 2; }
	.frame { left: 32.54%; top: 2.18%; width: 30.15%; z-index: 3; filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.18)); }
	.bar { left: 39.57%; top: 87.58%; width: 19.26%; z-index: 4; filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.18)); }

	.controls-art {
		position: absolute;
		left: 39.57%;
		top: 84.16%;
		width: 19.26%;
		height: 11.88%;
		z-index: 5;
		pointer-events: none;
	}

	.controls-art .menu { left: 7%; top: 66%; width: 6.5%; transform: translateY(-50%); opacity: 0.75; }
	.controls-art .bonus { left: 18%; top: 64%; width: 18%; transform: translateY(-50%); }
	.controls-art .spin { left: 51%; top: 34%; width: 30%; transform: translate(-50%, -50%); filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.22)); }
	.controls-art .chevrons { left: 67%; top: 61%; width: 4.5%; transform: translateY(-50%); opacity: 0.7; }
	.controls-art .autospin { left: 83%; top: 63%; width: 11%; transform: translate(-50%, -50%); }
	.controls-art .lightning { left: 92%; top: 62%; width: 7%; transform: translate(-50%, -50%); }

	:global(.throne-room-shell .game-shell) { background: transparent; min-height: 100%; }
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
	:global(.throne-room-shell .info-button) { display: none !important; }

	:global(.throne-room-shell .game-stage) { position: absolute; inset: 0; display: block; min-height: 0; padding: 0; }
	:global(.throne-room-shell .feature-banner) { position: absolute; left: 50%; top: 1.6%; transform: translateX(-50%); width: 48%; z-index: 8; }

	:global(.throne-room-shell .board-frame) {
		position: absolute;
		left: 34.82%;
		top: 14.06%;
		width: 580px !important;
		height: 580px;
		min-width: 580px !important;
		padding: 0 !important;
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
		transform-origin: top left;
		transform: scale(0.3863);
		z-index: 6;
	}

	:global(.throne-room-shell .board) {
		position: relative;
		padding: 6px !important;
		background: transparent !important;
		box-shadow: none !important;
		transform: none !important;
		transform-origin: top left;
		overflow: hidden;
		clip-path: inset(0 round 8px);
	}

	:global(.throne-room-shell .board .cell) { background: transparent !important; border: 0 !important; box-shadow: none !important; }
	:global(.throne-room-shell .symbol-art),
	:global(.throne-room-shell .symbol-art-sheet),
	:global(.throne-room-shell .wheel-tile-art),
	:global(.throne-room-shell .scatter-symbol),
	:global(.throne-room-shell .symbol-tile-shell),
	:global(.throne-room-shell .wheel-tile-shell),
	:global(.throne-room-shell .symbol-tile-shell-bonus) { width: 64px; height: 64px; }

	:global(.throne-room-shell .top-bar) {
		position: absolute;
		left: 39.57%;
		top: 84.16%;
		width: 19.26%;
		height: 11.88%;
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		pointer-events: none;
		z-index: 7;
	}

	:global(.throne-room-shell .top-bar-stats) { position: absolute; inset: 0; display: block; }
	:global(.throne-room-shell .stat-pill) { position: absolute; padding: 0; border: 0; background: transparent; box-shadow: none; text-align: center; }
	:global(.throne-room-shell .stat-pill span) { display: none; }
	:global(.throne-room-shell .stat-pill strong) { display: grid; place-items: center; height: 100%; font-size: clamp(9px, 0.72vw, 13px); font-weight: 800; color: #f2f2f2; text-shadow: 0 1px 2px rgba(0,0,0,.82); }
	:global(.throne-room-shell .top-bar-stats .stat-pill:nth-child(1)) { left: 11%; top: 58%; width: 18%; height: 13%; }
	:global(.throne-room-shell .top-bar-stats .stat-pill:nth-child(2)) { left: 59.5%; top: 40%; width: 12%; height: 12%; }
	:global(.throne-room-shell .top-bar-stats .stat-pill:nth-child(3)) { left: 56.5%; top: 73.5%; width: 18%; height: 12.5%; }

	:global(.throne-room-shell .game-controls) {
		position: absolute;
		left: 39.57%;
		top: 84.16%;
		width: 19.26%;
		height: 11.88%;
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		grid-template-columns: 1fr;
		gap: 0;
		z-index: 8;
	}

	:global(.throne-room-shell .controls-left),
	:global(.throne-room-shell .controls-center),
	:global(.throne-room-shell .controls-right) { position: absolute; gap: 0; }
	:global(.throne-room-shell .controls-left) { left: 0; top: 0; width: 100%; height: 100%; }
	:global(.throne-room-shell .controls-center) { left: 36%; top: 7%; width: 30%; height: 44%; transform: none; justify-items: center; margin-top: 0; }
	:global(.throne-room-shell .controls-right) { left: 64%; top: 50%; width: 32%; height: 20%; }
	:global(.throne-room-shell .bet-stepper) { position: absolute; left: 42%; top: 49%; width: 17%; height: 10%; display: block; }
	:global(.throne-room-shell .bet-display) { display: none; }
	:global(.throne-room-shell .bet-stepper .ctrl-button:first-child) { position: absolute; left: 0; top: 0; width: 18%; height: 100%; padding: 0; border-radius: 999px; }
	:global(.throne-room-shell .bet-stepper .ctrl-button:last-child) { position: absolute; right: 0; top: 0; width: 18%; height: 100%; padding: 0; border-radius: 999px; }
	:global(.throne-room-shell .ctrl-button) { padding: 0; border: 0; background: transparent; font-size: 0; box-shadow: none; }
	:global(.throne-room-shell .ctrl-button:hover:enabled) { transform: none; }
	:global(.throne-room-shell .spin-button) { width: 100%; height: 100%; margin-top: 0; font-size: 0; color: transparent; box-shadow: none; border: 0; background: transparent; }
	:global(.throne-room-shell .spin-button-stop), :global(.throne-room-shell .spin-button-skip) { background: transparent; }
	:global(.throne-room-shell .toggle-row) { position: absolute; inset: 0; display: block; }
	:global(.throne-room-shell .toggle-button) { position: absolute; padding: 0; background: transparent; border: 0; border-radius: 8px; font-size: 0; color: transparent; line-height: 0; box-shadow: none; }
	:global(.throne-room-shell .toggle-button > *) { font-size: 0 !important; color: transparent !important; }
	:global(.throne-room-shell .toggle-row .toggle-button:first-child) { left: 16%; top: 50%; width: 18%; height: 28%; }
	:global(.throne-room-shell .toggle-row .toggle-button:last-child) { left: 78%; top: 52%; width: 12%; height: 26%; margin-top: 0; }

	@media (max-width: 960px) {
		:global(.throne-room-shell .board-frame) { transform: scale(0.33); }
		:global(.throne-room-shell .symbol-art),
		:global(.throne-room-shell .symbol-art-sheet),
		:global(.throne-room-shell .wheel-tile-art),
		:global(.throne-room-shell .scatter-symbol),
		:global(.throne-room-shell .symbol-tile-shell),
		:global(.throne-room-shell .wheel-tile-shell),
		:global(.throne-room-shell .symbol-tile-shell-bonus) { width: 56px; height: 56px; }
	}
</style>

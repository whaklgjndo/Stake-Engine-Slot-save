<script lang="ts">
	import DualWheelWorkshop from './DualWheelWorkshop.svelte';

	const sceneHallArt = new URL('../../components/art/svg_components_bundle/scene_hall.svg', import.meta.url).href;
	const frameOpenArt = new URL('../../components/art/svg_components_bundle/frame_open.svg', import.meta.url).href;
	const bannerLeftArt = new URL('../../components/art/svg_components_bundle/banner_left.svg', import.meta.url).href;
	const bannerRightArt = new URL('../../components/art/svg_components_bundle/banner_right.svg', import.meta.url).href;
	const gridArt = new URL('../../components/art/svg_components_bundle/grid_left.svg', import.meta.url).href;
	const controlBarArt = new URL('../../components/art/svg_components_bundle/control_bar.svg', import.meta.url).href;
	const spinIconArt = new URL('../../components/art/svg_components_bundle/spin_icon.svg', import.meta.url).href;
	const autospinIconArt = new URL('../../components/art/svg_components_bundle/autospin_icon.svg', import.meta.url).href;
	const bonusIconArt = new URL('../../components/art/svg_components_bundle/bonus_icon.svg', import.meta.url).href;
	const lightningYellowArt = new URL('../../components/art/svg_components_bundle/lightning_yellow.svg', import.meta.url).href;
	const menuIconArt = new URL('../../components/art/svg_components_bundle/menu_icon.svg', import.meta.url).href;
	const chevronsIconArt = new URL('../../components/art/svg_components_bundle/chevrons_icon.svg', import.meta.url).href;
</script>

<div class="workshop-surface-shell">
	<div class="design-stage">
		<img class="layer background" src={sceneHallArt} alt="" draggable="false" />
		<div class="layer cloth" aria-hidden="true">
			<img class="cloth-half cloth-half-left" src={bannerLeftArt} alt="" draggable="false" />
			<img class="cloth-half cloth-half-right" src={bannerRightArt} alt="" draggable="false" />
		</div>
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

		<DualWheelWorkshop />
	</div>
</div>

<style>
	.workshop-surface-shell {
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
	.control-icon,
	.cloth-half {
		position: absolute;
		display: block;
		max-width: none;
		user-select: none;
		-webkit-user-drag: none;
		pointer-events: none;
	}

	.background { inset: 0; width: 100%; height: 100%; object-fit: contain; z-index: 0; }
	.cloth {
		left: 35.03%;
		top: 12.87%;
		width: 23.10%;
		height: 61.78%;
		z-index: 1;
		overflow: hidden;
	}
	.cloth-half-left { left: 0; top: 0; width: 49.2%; height: 100%; object-fit: fill; }
	.cloth-half-right { right: 0; top: 0; width: 50.8%; height: 100%; object-fit: fill; }
	.grid { left: 34.82%; top: 14.06%; width: 24.30%; z-index: 3; }
	.frame { left: 32.54%; top: 2.18%; width: 30.15%; z-index: 4; }
	.bar { left: 39.57%; top: 87.58%; width: 19.26%; z-index: 4; }

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
	.controls-art .spin { left: 51%; top: 34%; width: 30%; transform: translate(-50%, -50%); }
	.controls-art .chevrons { left: 67%; top: 61%; width: 4.5%; transform: translateY(-50%); opacity: 0.7; }
	.controls-art .autospin { left: 83%; top: 63%; width: 11%; transform: translate(-50%, -50%); }
	.controls-art .lightning { left: 92%; top: 62%; width: 7%; transform: translate(-50%, -50%); }

	:global(.workshop-surface-shell .workshop-shell) {
		position: absolute;
		inset: 0;
		padding: 0;
		background: transparent;
		min-height: 100%;
	}

	:global(.workshop-surface-shell .theme-backdrop),
	:global(.workshop-surface-shell .hero),
	:global(.workshop-surface-shell .tools-strip),
	:global(.workshop-surface-shell .loop-strip),
	:global(.workshop-surface-shell .results-strip),
	:global(.workshop-surface-shell .history-strip),
	:global(.workshop-surface-shell .stage-topline),
	:global(.workshop-surface-shell .stage-rhythm),
	:global(.workshop-surface-shell .stage-scene-side),
	:global(.workshop-surface-shell .stage-canopy),
	:global(.workshop-surface-shell .stage-pedestal),
	:global(.workshop-surface-shell .console-kicker),
	:global(.workshop-surface-shell .bonus-buy-note),
	:global(.workshop-surface-shell .bet-stepper-readout),
	:global(.workshop-surface-shell .console-action-note),
	:global(.workshop-surface-shell .feature-banner),
	:global(.workshop-surface-shell .feature-transition-card) {
		display: none !important;
	}

	:global(.workshop-surface-shell .layout-grid),
	:global(.workshop-surface-shell .stage-column),
	:global(.workshop-surface-shell .stage) {
		display: block;
		max-width: none;
		margin: 0;
		padding: 0;
		background: transparent;
		border: 0;
		box-shadow: none;
	}

	:global(.workshop-surface-shell .stage::before),
	:global(.workshop-surface-shell .stage::after) {
		display: none !important;
	}

	:global(.workshop-surface-shell .stage-scene) {
		display: block;
		max-width: none;
		margin: 0;
		padding: 0;
	}

	:global(.workshop-surface-shell .stage-board-shell),
	:global(.workshop-surface-shell .stage-board-aura) {
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
		padding: 0 !important;
		width: auto !important;
	}

	:global(.workshop-surface-shell .stage-board-wrap) {
		position: absolute;
		left: 34.82%;
		top: 14.06%;
		transform: none !important;
		filter: none !important;
		z-index: 2;
	}

	:global(.workshop-surface-shell .board-frame) {
		width: 568px !important;
		height: 568px;
		min-width: 568px !important;
		padding: 0 !important;
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
		transform-origin: top left;
		transform: scale(0.3947);
	}

	:global(.workshop-surface-shell .board),
	:global(.workshop-surface-shell .board .cell) {
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
	}

	:global(.workshop-surface-shell .board) {
		width: 568px;
		height: 568px;
		padding: 0 !important;
		overflow: hidden;
		clip-path: inset(0 round 8px);
	}

	:global(.workshop-surface-shell .symbol-art),
	:global(.workshop-surface-shell .symbol-art-sheet),
	:global(.workshop-surface-shell .wheel-tile-art),
	:global(.workshop-surface-shell .scatter-symbol),
	:global(.workshop-surface-shell .symbol-tile-shell),
	:global(.workshop-surface-shell .wheel-tile-shell),
	:global(.workshop-surface-shell .symbol-tile-shell-bonus) {
		width: 70px;
		height: 70px;
	}

	:global(.workshop-surface-shell .stage-console) {
		position: absolute;
		left: 39.57%;
		top: 84.16%;
		width: 19.26%;
		height: 11.88%;
		padding: 0;
		border: 0;
		background: transparent;
		box-shadow: none;
		grid-template-columns: 1fr;
		gap: 0;
		z-index: 8;
	}

	:global(.workshop-surface-shell .console-cluster-bank) {
		position: absolute;
		inset: 0;
		padding: 0;
		background: transparent;
		border: 0;
		box-shadow: none;
	}
	:global(.workshop-surface-shell .console-bank-grid) { position: absolute; inset: 0; display: block; }
	:global(.workshop-surface-shell .console-stat-tile) { position: absolute; padding: 0; background: transparent; border: 0; box-shadow: none; text-align: center; }
	:global(.workshop-surface-shell .console-stat-tile span) { display: none; }
	:global(.workshop-surface-shell .console-stat-tile strong) { display: grid; place-items: center; height: 100%; font-size: clamp(9px, 0.72vw, 13px); font-weight: 800; color: #f2f2f2; text-shadow: 0 1px 2px rgba(0,0,0,.82); }
	:global(.workshop-surface-shell .console-bank-grid .console-stat-tile:nth-child(1)) { left: 9.5%; top: 58%; width: 23%; height: 13%; }
	:global(.workshop-surface-shell .console-bank-grid .console-stat-tile:nth-child(2)) { left: 55%; top: 73%; width: 20%; height: 12.5%; }
	:global(.workshop-surface-shell .console-bank-grid .console-stat-tile:nth-child(3)) { left: 58.5%; top: 39%; width: 14%; height: 12%; }

	:global(.workshop-surface-shell .console-cluster-actions),
	:global(.workshop-surface-shell .console-cluster-bet) {
		position: absolute;
		inset: 0;
		padding: 0;
		background: transparent;
		border: 0;
		box-shadow: none;
	}

	:global(.workshop-surface-shell .console-action-row) { position: absolute; inset: 0; display: block; }
	:global(.workshop-surface-shell .primary-button) { position: absolute; left: 37.2%; top: 5%; width: 28%; height: 48%; padding: 0; font-size: 0; color: transparent; background: transparent; border: 0; box-shadow: none; }
	:global(.workshop-surface-shell .console-toggle-stack) { position: absolute; inset: 0; display: block; }
	:global(.workshop-surface-shell .console-toggle-stack .toggle-button:nth-child(1)) { left: 87.5%; top: 51%; width: 8%; height: 28%; }
	:global(.workshop-surface-shell .console-toggle-stack .toggle-button:nth-child(2)) { left: 78.5%; top: 52%; width: 13%; height: 28%; }
	:global(.workshop-surface-shell .console-toggle-stack .toggle-button:nth-child(3)) { display:none !important; }
	:global(.workshop-surface-shell .toggle-button) { position: absolute; padding: 0; background: transparent; border: 0; border-radius: 8px; font-size: 0; color: transparent; box-shadow: none; }

	:global(.workshop-surface-shell .console-cluster-bet .bet-stepper) { position: absolute; left: 64%; top: 55%; width: 7%; height: 14%; display: block; margin: 0; }
	:global(.workshop-surface-shell .bet-stepper .secondary-button:first-child) { position: absolute; left: -22%; top: 0; width: 36%; height: 100%; padding: 0; }
	:global(.workshop-surface-shell .bet-stepper .secondary-button:last-child) { position: absolute; right: -22%; top: 0; width: 36%; height: 100%; padding: 0; }
	:global(.workshop-surface-shell .secondary-button) { background: transparent; border: 0; font-size: 0; color: transparent; box-shadow: none; }
	:global(.workshop-surface-shell .console-cluster-bet .bonus-buy-row) { position: absolute; left: 16%; top: 54%; width: 18%; height: 28%; display: block; margin: 0; }
	:global(.workshop-surface-shell .bonus-buy-button-super) { display:none !important; }
	:global(.workshop-surface-shell .bonus-buy-button-regular) { position: absolute; inset: 0; padding: 0; background: transparent; border:0; box-shadow:none; }
	:global(.workshop-surface-shell .bonus-buy-button span),
	:global(.workshop-surface-shell .bonus-buy-button strong),
	:global(.workshop-surface-shell .bonus-buy-button em) { display:none !important; }

	@media (max-width: 960px) {
		:global(.workshop-surface-shell .board-frame) { transform: scale(0.34); }
		:global(.workshop-surface-shell .symbol-art),
		:global(.workshop-surface-shell .symbol-art-sheet),
		:global(.workshop-surface-shell .wheel-tile-art),
		:global(.workshop-surface-shell .scatter-symbol),
		:global(.workshop-surface-shell .symbol-tile-shell),
		:global(.workshop-surface-shell .wheel-tile-shell),
		:global(.workshop-surface-shell .symbol-tile-shell-bonus) { width: 60px; height: 60px; }
	}
</style>

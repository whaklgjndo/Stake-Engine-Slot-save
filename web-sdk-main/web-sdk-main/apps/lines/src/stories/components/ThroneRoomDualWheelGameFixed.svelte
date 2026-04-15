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
		--hud-width: min(69.4vw, calc(100vh * 1.225));
	}

	.hud-underlay {
		position: absolute;
		left: 50%;
		bottom: 0.25%;
		width: var(--hud-width);
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 1;
		filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 0.5));
	}

	:global(.throne-room-game-shell .game-shell) {
		background: transparent;
		min-height: 100vh;
	}

	:global(.throne-room-game-shell .theme-backdrop) { display: none; }
	:global(.throne-room-game-shell .game-stage) { padding: 92px 24px 174px; }
	:global(.throne-room-game-shell .feature-banner) { margin-inline: auto; width: min(720px, calc(100vw - 120px)); }

	:global(.throne-room-game-shell .top-bar) {
		position: absolute;
		left: 50%;
		bottom: 0.25%;
		width: var(--hud-width);
		height: calc(var(--hud-width) * 0.1903);
		transform: translateX(-50%);
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		z-index: 3;
		pointer-events: none;
	}

	:global(.throne-room-game-shell .top-bar-brand) { display: none; }
	:global(.throne-room-game-shell .top-bar-stats) { position: absolute; inset: 0; display: block; }
	:global(.throne-room-game-shell .stat-pill) { position: absolute; padding: 0; border: 0; background: transparent; border-radius: 0; box-shadow: none; text-align: center; }
	:global(.throne-room-game-shell .stat-pill span) { display: none; }
	:global(.throne-room-game-shell .stat-pill strong) { display: grid; place-items: center; height: 100%; font-size: clamp(10px, 1vw, 20px); font-weight: 800; color: #f2f2f2; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75); }
	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(1)) { left: 5.9%; top: 37.6%; width: 25.2%; height: 12.4%; }
	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(2)) { left: 57.1%; top: 37.2%; width: 19.8%; height: 12.4%; }
	:global(.throne-room-game-shell .top-bar-stats .stat-pill:nth-child(3)) { left: 56.45%; top: 69.9%; width: 27.1%; height: 12.4%; }

	:global(.throne-room-game-shell .game-controls) {
		position: absolute;
		left: 50%;
		bottom: 0.25%;
		width: var(--hud-width);
		height: calc(var(--hud-width) * 0.1903);
		transform: translateX(-50%);
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		grid-template-columns: 1fr;
		gap: 0;
		z-index: 4;
	}

	:global(.throne-room-game-shell .controls-left), :global(.throne-room-game-shell .controls-center), :global(.throne-room-game-shell .controls-right) { position: absolute; gap: 0; }
	:global(.throne-room-game-shell .controls-left) { left: 4.8%; top: 23%; width: 31.5%; height: 54%; }
	:global(.throne-room-game-shell .controls-center) { left: 45.35%; top: 5.65%; width: 7.65%; height: 33.2%; transform: translateX(-50%); justify-items: center; margin-top: 0; }
	:global(.throne-room-game-shell .controls-right) { right: 1.8%; top: 16%; width: 17.2%; height: 60%; }
	:global(.throne-room-game-shell .bet-stepper) { position: absolute; right: 0; top: 12%; width: 48.5%; grid-template-columns: 13% 74% 13%; gap: 0; }
	:global(.throne-room-game-shell .bet-display) { padding: 0; border: 0; background: transparent; }
	:global(.throne-room-game-shell .bet-display span) { display: none; }
	:global(.throne-room-game-shell .bet-display strong) { font-size: clamp(10px, 1vw, 20px); line-height: 1; color: #f2f2f2; text-shadow: 0 1px 2px rgba(0,0,0,.75); }
	:global(.throne-room-game-shell .ctrl-button) { padding: 0; border: 0; background: transparent; font-size: 0; box-shadow: none; }
	:global(.throne-room-game-shell .ctrl-button:hover:enabled) { transform: none; }
	:global(.throne-room-game-shell .bonus-buy-row) { position: absolute; left: 50%; bottom: -6%; width: 124px; transform: translateX(-50%); gap: 6px; }
	:global(.throne-room-game-shell .bonus-buy-button) { padding: 5px 6px; border-radius: 8px; background: rgba(8,18,28,.78); border: 1px solid rgba(255,255,255,.08); text-align: center; }
	:global(.throne-room-game-shell .bonus-buy-button span) { font-size: .5rem; }
	:global(.throne-room-game-shell .bonus-buy-button strong) { font-size: .78rem; }
	:global(.throne-room-game-shell .spin-button) { width: 100%; height: 100%; margin-top: 0; font-size: .88rem; box-shadow: none; border: 0; background: radial-gradient(circle at 38% 28%, rgba(233,247,255,.96), rgba(171,222,255,.96) 34%, rgba(83,166,236,.98) 68%, rgba(33,99,174,.98) 100%); }
	:global(.throne-room-game-shell .spin-button-stop) { background: linear-gradient(180deg, #ffc484, #f98f54 56%, #e55a2f 100%); }
	:global(.throne-room-game-shell .spin-button-skip) { background: linear-gradient(180deg, #c2e8ff, #6fc4ff 56%, #37a2f5 100%); }
	:global(.throne-room-game-shell .status-text) { display: none; }
	:global(.throne-room-game-shell .toggle-row) { position: absolute; right: 0; top: 8%; width: 100%; grid-template-columns: 1fr 1fr; gap: 6px; }
	:global(.throne-room-game-shell .toggle-button) { padding: 6px 0; background: rgba(5,12,18,.4); border: 1px solid rgba(255,255,255,.08); border-radius: 8px; font-size: .68rem; }
	:global(.throne-room-game-shell .autoplay-select), :global(.throne-room-game-shell .autoplay-label) { position: absolute; right: 0; bottom: 10%; width: 100%; padding: 6px 8px; border-radius: 8px; font-size: .7rem; background: rgba(5,12,18,.56); }
	:global(.throne-room-game-shell .info-button) { position: absolute; right: 101%; bottom: 11%; width: 30px; height: 30px; }

	@media (max-width: 960px) {
		.throne-room-game-shell { --hud-width: min(86vw, calc(100vh * 1.52)); }
		:global(.throne-room-game-shell .game-stage) { padding-bottom: 150px; }
	}
</style>

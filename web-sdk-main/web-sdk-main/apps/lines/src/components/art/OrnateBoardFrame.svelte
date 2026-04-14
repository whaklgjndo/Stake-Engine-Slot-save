<script lang="ts">
	export let frameSrc: string;
	export let gridSrc: string;
	export let isSpinning = false;
	export let frameAlt = 'Ornate slot board';
</script>

<div class:ornate-board-frame={true} class:is-spinning={isSpinning}>
	<img class="board-frame-art" src={frameSrc} alt={frameAlt} draggable="false" />
	<div class="board-grid-window" aria-hidden="true">
		<div class="board-grid-velvet"></div>
		<img class="board-grid-overlay" src={gridSrc} alt="" draggable="false" />
		<div class="board-grid-content">
			<slot />
		</div>
	</div>
</div>

<style>
	.ornate-board-frame {
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

	.board-grid-content {
		position: absolute;
		inset: 0;
	}

	.ornate-board-frame.is-spinning {
		animation: boardPulse 700ms ease-in-out;
	}

	@keyframes boardPulse {
		0%,
		100% { transform: translate(-50%, -50%) scale(1); }
		50% { transform: translate(-50%, -50%) scale(1.01); }
	}
</style>

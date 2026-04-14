<script lang="ts">
	export let src: string;
	export let alt = '';
	export let showVignette = true;
</script>

<div class="throne-room-backdrop">
	<img class="background-art" {src} {alt} draggable="false" />
	{#if showVignette}
		<div class="stage-vignette" aria-hidden="true"></div>
	{/if}
	<slot />
</div>

<style>
	.throne-room-backdrop {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.background-art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center center;
	}

	.stage-vignette {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0) 72%, rgba(0, 0, 0, 0.28) 100%),
			radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 44%, rgba(0, 0, 0, 0.18) 100%);
	}
</style>

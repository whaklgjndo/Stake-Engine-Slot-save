<script lang="ts">
	import { Rectangle, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const backgroundProps = $derived(context.stateLayoutDerived.normalBackgroundLayout({ scale: 0.56 }));
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType !== 'basegame');
</script>

<Rectangle {...canvas} backgroundColor={0x05070d} zIndex={-6} />

<Rectangle
	width={canvas.width * 0.45}
	height={canvas.height}
	backgroundColor={0x7a2a10}
	alpha={0.16}
	zIndex={-5}
/>

<Rectangle
	x={canvas.width * 0.55}
	width={canvas.width * 0.45}
	height={canvas.height}
	backgroundColor={0x143862}
	alpha={0.16}
	zIndex={-5}
/>

<Rectangle
	width={canvas.width}
	height={canvas.height * 0.16}
	backgroundColor={0x000000}
	alpha={0.24}
	zIndex={-4}
/>

<Rectangle
	y={canvas.height * 0.72}
	width={canvas.width}
	height={canvas.height * 0.28}
	backgroundColor={0x07101b}
	alpha={0.78}
	zIndex={-4}
/>

<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-3}>
	<SpineProvider key="foregroundAnimation" {...backgroundProps}>
		<SpineTrack trackIndex={0} animationName={'idle'} loop />
	</SpineProvider>
	<SpineProvider key="foregroundAnimation" {...backgroundProps}>
		<SpineTrack trackIndex={0} animationName={'dust'} loop />
	</SpineProvider>
</FadeContainer>

<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-2}>
	<SpineProvider key="foregroundFeatureAnimation" {...backgroundProps}>
		<SpineTrack trackIndex={0} animationName={'idle'} loop />
	</SpineProvider>
	<SpineProvider key="foregroundFeatureAnimation" {...backgroundProps}>
		<SpineTrack trackIndex={0} animationName={'dust'} loop />
	</SpineProvider>
</FadeContainer>

<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Rectangle, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	const SPINE_SCALE = { width: 0.78, height: 0.78 };
	const SPRITE_SCALE = { width: 1.58, height: 1.46 };
	const POSITION_ADJUSTMENT = { x: 1, y: 1.008 };

	type AnimationName = 'reelhouse_glow_start' | 'reelhouse_glow_idle' | 'reelhouse_glow_exit';

	let animationName = $state<AnimationName | undefined>(undefined);
	let loop = $state(false);

	const frameX = $derived(context.stateGameDerived.boardLayout().x * POSITION_ADJUSTMENT.x);
	const frameY = $derived(context.stateGameDerived.boardLayout().y * POSITION_ADJUSTMENT.y);
	const frameWidth = $derived(context.stateGameDerived.boardLayout().width * SPRITE_SCALE.width);
	const frameHeight = $derived(context.stateGameDerived.boardLayout().width * SPRITE_SCALE.height);
	const glowWidth = $derived(context.stateGameDerived.boardLayout().width * SPINE_SCALE.width);
	const glowHeight = $derived(context.stateGameDerived.boardLayout().height * SPINE_SCALE.height);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => {
			animationName = 'reelhouse_glow_start';
			loop = false;
		},
		boardFrameGlowHide: () => {
			if (animationName) animationName = 'reelhouse_glow_exit';
		},
	});
</script>

<Rectangle
	x={frameX - frameWidth * 0.52}
	y={frameY - frameHeight * 0.43}
	width={frameWidth * 1.04}
	height={frameHeight * 0.94}
	backgroundColor={0x05070d}
	alpha={0.7}
	zIndex={-2}
/>

<Rectangle
	x={frameX - frameWidth * 0.49}
	y={frameY - frameHeight * 0.4}
	width={frameWidth * 0.98}
	height={frameHeight * 0.88}
	backgroundColor={0x8f5d17}
	alpha={0.08}
	zIndex={-2}
/>

{#if animationName}
	<SpineProvider zIndex={-1} key="reelhouse" x={frameX} y={frameY} width={glowWidth} height={glowHeight}>
		<SpineTrack
			trackIndex={0}
			{animationName}
			{loop}
			listener={{
				complete: (entry) => {
					if (entry.animation) {
						if (entry.animation.name === 'reelhouse_glow_start') {
							animationName = 'reelhouse_glow_idle';
							loop = true;
						}

						if (entry.animation.name === 'reelhouse_glow_exit') {
							animationName = undefined;
							loop = false;
						}
					}
				},
			}}
		/>
	</SpineProvider>
{/if}

<Sprite
	key="frame_bg.png"
	anchor={0.5}
	x={frameX}
	y={frameY}
	width={frameWidth}
	height={frameHeight}
/>

<Sprite
	key="frame_edge.png"
	anchor={0.5}
	x={frameX}
	y={frameY}
	width={frameWidth}
	height={frameHeight}
/>

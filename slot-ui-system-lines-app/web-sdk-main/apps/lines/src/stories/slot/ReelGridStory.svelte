<script lang="ts">
	import { getTheme } from '$lib/themes';
	import { ReelGrid, WinLineOverlay, createWinningLine, type ThemeId, type SlotOutcomeTone, type SymbolId } from '$lib/components/slot';

	type Props = {
		themeId?: ThemeId;
		spinning?: boolean;
		winVariant?: SlotOutcomeTone;
		staggerDelay?: number;
	};

	let {
		themeId = 'default',
		spinning = false,
		winVariant = 'win',
		staggerDelay = 96,
	}: Props = $props();

	const theme = $derived(getTheme(themeId));
	const matrix = $derived<SymbolId[][]>([
		['high1', 'wild', 'high1', 'mult2', 'high1'],
		['low1', 'mid1', 'scatter', 'mid1', 'low1'],
		['high2', 'high2', 'wild', 'high2', 'high2'],
		['mid2', 'low3', 'mid2', 'low3', 'mid2'],
		['scatter', 'low2', 'low4', 'low2', 'scatter'],
	]);
	const spinningState = $derived(Array.from({ length: 5 }, () => spinning));
	const stopPositions = $derived([0, 1, 2, 0, 2]);
	const winLines = $derived(
		winVariant === 'none'
			? []
			: [
					createWinningLine([2, 2, 2, 2, 2], 2, 'high2', winVariant === 'big-win' ? 220 : 64, winVariant),
					...(winVariant === 'big-win'
						? [createWinningLine([0, 0, 0, 0, 0], 0, 'high1', 140, 'big-win')]
						: []),
				],
	);
</script>

<div class="story-shell" style={`background:${theme.background};`}>
	<div class="frame">
		<ReelGrid
			theme={theme}
			symbolsMatrix={matrix}
			isSpinning={spinningState}
			stopPositions={stopPositions}
			staggerDelay={staggerDelay}
			activeWinLines={winLines}
		/>
		<WinLineOverlay winLines={winLines} reelCount={5} visibleRows={5} />
	</div>
</div>

<style>
	.story-shell {
		padding: 24px;
		min-height: 100vh;
	}

	.frame {
		position: relative;
		max-width: 760px;
		margin-inline: auto;
	}
</style>

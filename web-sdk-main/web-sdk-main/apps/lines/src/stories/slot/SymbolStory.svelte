<script lang="ts">
	import { getTheme } from '$lib/themes';
	import Symbol from '$lib/components/slot/Symbol.svelte';
	import type { ThemeId, SymbolId } from '$lib/components/slot';

	type Props = {
		themeId?: ThemeId;
		symbolId?: SymbolId;
		winning?: boolean;
		landing?: boolean;
		scatterBurst?: boolean;
		wildTransform?: boolean;
	};

	let {
		themeId = 'default',
		symbolId = 'wild',
		winning = true,
		landing = false,
		scatterBurst = false,
		wildTransform = false,
	}: Props = $props();

	const theme = $derived(getTheme(themeId));
</script>

<div class="symbol-stage" style={`background:${theme.background};`}>
	<Symbol
		{theme}
		{symbolId}
		size={128}
		showLabel={true}
		isWinning={winning}
		isLanding={landing}
		isScatterBurst={scatterBurst}
		isWildTransform={wildTransform}
	/>
</div>

<style>
	.symbol-stage {
		display: grid;
		place-items: center;
		min-height: 100vh;
		padding: 24px;
	}
</style>

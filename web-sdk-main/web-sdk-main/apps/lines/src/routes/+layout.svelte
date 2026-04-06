<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import DualWheelRuntime from '../components/DualWheelRuntime.svelte';

	type Props = { children: Snippet };

	const props: Props = $props();
</script>

<GlobalStyle>
	<DualWheelRuntime />
</GlobalStyle>

{@render props.children()}

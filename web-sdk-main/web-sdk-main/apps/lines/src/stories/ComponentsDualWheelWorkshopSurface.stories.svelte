<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DualWheelWorkshopSurface from './components/DualWheelWorkshopSurface.svelte';

	const { Story } = defineMeta({
		title: 'PROTOTYPES/Dual Wheel Workshop',
		component: DualWheelWorkshopSurface,
	});
</script>

<Story name="workshop">
	<DualWheelWorkshopSurface />
</Story>

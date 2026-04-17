<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DualWheelWorkshopSurface from './components/DualWheelWorkshopSurface.svelte';

	const { Story } = defineMeta({
		title: 'PROTOTYPES/Dual Wheel Workshop Surface',
		component: DualWheelWorkshopSurface,
	});
</script>

<Story name="surface">
	<DualWheelWorkshopSurface />
</Story>

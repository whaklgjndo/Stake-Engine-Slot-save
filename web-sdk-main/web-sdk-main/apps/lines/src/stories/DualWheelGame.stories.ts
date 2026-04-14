import type { Meta, StoryObj } from '@storybook/sveltekit';
import ArtBoardRuntime from '../components/ArtBoardRuntime.svelte';

const meta = {
	title: 'Lines/Art Board Runtime',
	component: ArtBoardRuntime,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ArtBoardRuntime>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

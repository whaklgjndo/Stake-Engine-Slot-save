import type { Meta, StoryObj } from '@storybook/sveltekit';
import ThemeGalleryStory from './ThemeGalleryStory.svelte';

const meta = {
	title: 'Slot/Theme Gallery',
	component: ThemeGalleryStory,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ThemeGalleryStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/sveltekit';
import ReelGridStory from './ReelGridStory.svelte';

const meta = {
	title: 'Slot/ReelGrid',
	component: ReelGridStory,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		themeId: {
			control: 'select',
			options: ['default', 'fantasy', 'neon', 'classic-fruit'],
		},
		spinning: { control: 'boolean' },
		winVariant: {
			control: 'select',
			options: ['none', 'line', 'win', 'big-win'],
		},
		staggerDelay: { control: { type: 'range', min: 50, max: 160, step: 2 } },
	},
	args: {
		themeId: 'default',
		spinning: false,
		winVariant: 'win',
		staggerDelay: 96,
	},
} satisfies Meta<ReelGridStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Spinning: Story = {
	args: {
		spinning: true,
		winVariant: 'none',
	},
};

export const BigWin: Story = {
	args: {
		themeId: 'fantasy',
		winVariant: 'big-win',
	},
};

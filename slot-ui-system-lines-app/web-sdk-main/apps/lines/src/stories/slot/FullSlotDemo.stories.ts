import type { Meta, StoryObj } from '@storybook/sveltekit';
import FullSlotDemoStory from './FullSlotDemoStory.svelte';

const meta = {
	title: 'Slot/Full Slot Demo',
	component: FullSlotDemoStory,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		themeId: {
			control: 'select',
			options: ['default', 'fantasy', 'neon', 'classic-fruit'],
		},
		staggerDelay: {
			control: { type: 'range', min: 60, max: 150, step: 2 },
		},
		betStep: {
			control: { type: 'range', min: 0.1, max: 0.5, step: 0.1 },
		},
		startingBalance: {
			control: { type: 'range', min: 100, max: 5000, step: 50 },
		},
		forcedTone: {
			control: 'select',
			options: ['random', 'line', 'win', 'big-win', 'scatter'],
		},
	},
	args: {
		themeId: 'default',
		staggerDelay: 96,
		betStep: 0.2,
		startingBalance: 1250,
		forcedTone: 'random',
	},
} satisfies Meta<FullSlotDemoStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playable: Story = {};

export const NeonBigWin: Story = {
	args: {
		themeId: 'neon',
		forcedTone: 'big-win',
		staggerDelay: 86,
	},
};

export const FantasyScatter: Story = {
	args: {
		themeId: 'fantasy',
		forcedTone: 'scatter',
		staggerDelay: 108,
	},
};

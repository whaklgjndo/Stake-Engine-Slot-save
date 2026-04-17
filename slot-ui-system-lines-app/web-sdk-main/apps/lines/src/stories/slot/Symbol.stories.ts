import type { Meta, StoryObj } from '@storybook/sveltekit';
import SymbolStory from './SymbolStory.svelte';

const meta = {
	title: 'Slot/Symbol',
	component: SymbolStory,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		themeId: {
			control: 'select',
			options: ['default', 'fantasy', 'neon', 'classic-fruit'],
		},
		symbolId: {
			control: 'select',
			options: ['low1', 'low2', 'low3', 'low4', 'mid1', 'mid2', 'high1', 'high2', 'wild', 'scatter', 'mult2', 'mult3'],
		},
		winning: { control: 'boolean' },
		landing: { control: 'boolean' },
		scatterBurst: { control: 'boolean' },
		wildTransform: { control: 'boolean' },
	},
	args: {
		themeId: 'default',
		symbolId: 'wild',
		winning: true,
		landing: false,
		scatterBurst: false,
		wildTransform: true,
	},
} satisfies Meta<SymbolStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ScatterBurst: Story = {
	args: {
		themeId: 'neon',
		symbolId: 'scatter',
		winning: true,
		scatterBurst: true,
		wildTransform: false,
	},
};

export const ClassicFruitSeven: Story = {
	args: {
		themeId: 'classic-fruit',
		symbolId: 'high2',
		winning: true,
		wildTransform: false,
	},
};

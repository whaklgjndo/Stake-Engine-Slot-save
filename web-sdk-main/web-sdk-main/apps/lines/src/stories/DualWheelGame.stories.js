import DualWheelGame from './components/DualWheelGame.svelte';

export default {
	title: 'GAME/Dual Wheel Reels',
	parameters: {
		layout: 'fullscreen',
	},
	render: () => ({
		Component: DualWheelGame,
	}),
};

export const Play = {};

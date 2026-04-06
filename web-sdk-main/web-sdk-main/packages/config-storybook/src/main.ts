import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: ['@storybook/addon-svelte-csf', '@storybook/addon-docs'],
	framework: {
		name: '@storybook/sveltekit',
		options: {},
	},
	staticDirs: ['../static'],
	async viteFinal(config) {
		const { mergeConfig } = await import('vite');

		return mergeConfig(config, {
			optimizeDeps: {
				noDiscovery: true,
			},
		});
	},
};

export default config;

import type { StorybookConfig } from '@storybook/sveltekit';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const config: StorybookConfig = {
	stories: ['../src/stories/slot/**/*.stories.@(js|ts)'],
	addons: [getAbsolutePath('@storybook/addon-docs')],
	framework: {
		name: '@storybook/sveltekit',
		options: {},
	},
	staticDirs: ['../static'],
	async viteFinal(baseConfig) {
		const { mergeConfig } = await import('vite');

		return mergeConfig(baseConfig, {
			optimizeDeps: {
				noDiscovery: true,
			},
		});
	},
};

export default config;

function getAbsolutePath(value: string): string {
	return dirname(fileURLToPath(import.meta.resolve(value + '/package.json')));
}

import { createLayout } from 'utils-layout';

export const { stateLayout, stateLayoutDerived } = createLayout({
	backgroundRatio: {
		normal: 2039 / 1000,
		portrait: 1242 / 2208,
	},
	mainSizesMap: {
		desktop: { width: 1600, height: 900 },
		tablet: { width: 1180, height: 1024 },
		landscape: { width: 1600, height: 900 },
		portrait: { width: 900, height: 1600 },
	},
});

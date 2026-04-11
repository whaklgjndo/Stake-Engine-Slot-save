export type EnvironmentAssetStatus = 'scaffolded' | 'code-native' | 'ready';

export type EnvironmentAssetMilestone =
	| 'milestone-1-structural-read'
	| 'milestone-2-cohesive-lighting'
	| 'milestone-3-living-environment'
	| 'milestone-4-reactive-world'
	| 'milestone-5-polish';

export type EnvironmentAssetSpec = {
	key: string;
	group: 'background' | 'midground' | 'board' | 'cells' | 'symbols' | 'fx' | 'audio' | 'post';
	file: string;
	relativePath: string;
	milestone: EnvironmentAssetMilestone;
	role: string;
	status: EnvironmentAssetStatus;
	notes?: string;
};

const spec = (
	key: EnvironmentAssetSpec['key'],
	group: EnvironmentAssetSpec['group'],
	file: string,
	milestone: EnvironmentAssetMilestone,
	role: string,
	status: EnvironmentAssetStatus = 'scaffolded',
	notes?: string,
): EnvironmentAssetSpec => ({
	key,
	group,
	file,
	relativePath: `src/stories/assets/${group}/${file}`,
	milestone,
	role,
	status,
	notes,
});

export const dualWheelEnvironmentAssetPlan: EnvironmentAssetSpec[] = [
	spec(
		'bgFar',
		'background',
		'bg_far.png',
		'milestone-1-structural-read',
		'Painted jungle background with distant trees, cliffs, and sky opening.',
		'ready',
	),
	spec(
		'bgWaterfalls',
		'background',
		'bg_waterfalls.png',
		'milestone-3-living-environment',
		'Separated waterfall layer for slow looping motion.',
		'ready',
	),
	spec(
		'bgFoliageSilhouette',
		'background',
		'bg_foliage_silhouette.png',
		'milestone-1-structural-read',
		'Far foliage silhouettes for depth framing.',
		'ready',
	),
	spec(
		'bgHaze',
		'background',
		'bg_haze.png',
		'milestone-1-structural-read',
		'Background haze pass for aerial perspective.',
		'ready',
	),
	spec(
		'portalCore',
		'midground',
		'portal_core.png',
		'milestone-1-structural-read',
		'Primary portal energy surface.',
		'ready',
	),
	spec(
		'portalGlow',
		'midground',
		'portal_glow.png',
		'milestone-1-structural-read',
		'Portal emissive halo.',
		'ready',
	),
	spec(
		'portalDistortionMask',
		'midground',
		'portal_distortion_mask.png',
		'milestone-3-living-environment',
		'Optional distortion mask for low-frequency shimmer.',
		'ready',
	),
	spec(
		'archFrame',
		'midground',
		'arch_frame.png',
		'milestone-1-structural-read',
		'Temple arch or relic frame behind the slot.',
		'ready',
	),
	spec(
		'lanternLeft',
		'midground',
		'lantern_left.png',
		'milestone-2-cohesive-lighting',
		'Left warm secondary light source.',
		'ready',
	),
	spec(
		'lanternRight',
		'midground',
		'lantern_right.png',
		'milestone-2-cohesive-lighting',
		'Right warm secondary light source.',
		'ready',
	),
	spec(
		'midRocksFoliage',
		'midground',
		'mid_rocks_foliage.png',
		'milestone-1-structural-read',
		'Midground rocks and foliage that ground the altar.',
		'ready',
	),
	spec(
		'boardBase',
		'board',
		'board_base.png',
		'milestone-1-structural-read',
		'Stone altar or relic slab base.',
		'ready',
	),
	spec(
		'boardTrimGold',
		'board',
		'board_trim_gold.png',
		'milestone-1-structural-read',
		'Gold trim overlay for the altar frame.',
		'ready',
	),
	spec(
		'boardCellRecess',
		'board',
		'board_cell_recess.png',
		'milestone-1-structural-read',
		'Carved recess treatment for the reel cells.',
		'ready',
	),
	spec(
		'boardAo',
		'board',
		'board_ao.png',
		'milestone-1-structural-read',
		'Ambient occlusion around recesses and joints.',
		'ready',
	),
	spec(
		'boardContactShadow',
		'board',
		'board_contact_shadow.png',
		'milestone-1-structural-read',
		'Grounding shadow pass under the altar.',
		'ready',
	),
	spec(
		'boardRunes',
		'board',
		'board_runes.png',
		'milestone-4-reactive-world',
		'Optional engraved rune activation layer.',
		'ready',
	),
	spec(
		'boardDamageDetail',
		'board',
		'board_damage_detail.png',
		'milestone-5-polish',
		'Chipped edges, cracks, and weathering.',
		'ready',
	),
	spec(
		'boardMossOverlay',
		'board',
		'board_moss_overlay.png',
		'milestone-5-polish',
		'Moss or vine overlay for environmental wear.',
		'ready',
	),
	spec(
		'cellBase',
		'cells',
		'cell_base.png',
		'milestone-1-structural-read',
		'Inset panel base for each cell.',
		'ready',
	),
	spec(
		'cellInnerShadow',
		'cells',
		'cell_inner_shadow.png',
		'milestone-1-structural-read',
		'Soft shadow pass for carved cell depth.',
		'ready',
	),
	spec(
		'cellWinGlow',
		'cells',
		'cell_win_glow.png',
		'milestone-4-reactive-world',
		'Emissive active/win overlay.',
		'ready',
	),
	spec(
		'fxParticleSoft',
		'fx',
		'fx_particle_soft.png',
		'milestone-3-living-environment',
		'Soft dust or pollen particle sprite.',
		'ready',
	),
	spec(
		'fxParticleMagic',
		'fx',
		'fx_particle_magic.png',
		'milestone-3-living-environment',
		'Brighter magical mote sprite.',
		'ready',
	),
	spec(
		'fxFogStrip',
		'fx',
		'fx_fog_strip.png',
		'milestone-3-living-environment',
		'Layered fog strip for depth and atmosphere.',
		'ready',
	),
	spec(
		'fxLightRay',
		'fx',
		'fx_light_ray.png',
		'milestone-3-living-environment',
		'Light-ray sprite for portal and lantern beams.',
		'ready',
	),
	spec(
		'fxPortalPulse',
		'fx',
		'fx_portal_pulse.png',
		'milestone-4-reactive-world',
		'Portal pulse ring for spins, wins, and bonus triggers.',
	),
	spec(
		'fxEnergyBurst',
		'fx',
		'fx_energy_burst.png',
		'milestone-4-reactive-world',
		'Energy burst for major events.',
	),
	spec(
		'fxWinSparkle',
		'fx',
		'fx_win_sparkle.png',
		'milestone-4-reactive-world',
		'Symbol and line sparkle overlay.',
	),
	spec(
		'fxBonusFlare',
		'fx',
		'fx_bonus_flare.png',
		'milestone-4-reactive-world',
		'Bonus-entry flare for scatters and feature intros.',
	),
	spec(
		'fxHighlightSweep',
		'fx',
		'fx_highlight_sweep.png',
		'milestone-4-reactive-world',
		'Board trim sweep for spin start and transitions.',
	),
	spec(
		'ambWaterfallLoop',
		'audio',
		'amb_waterfall_loop.wav',
		'milestone-3-living-environment',
		'Primary waterfall ambience loop.',
	),
	spec(
		'ambJungleLoop',
		'audio',
		'amb_jungle_loop.wav',
		'milestone-3-living-environment',
		'Jungle ambience bed.',
	),
	spec(
		'ambPortalHumLoop',
		'audio',
		'amb_portal_hum_loop.wav',
		'milestone-3-living-environment',
		'Low portal hum loop.',
	),
	spec(
		'uiSpinStart',
		'audio',
		'ui_spin_start.wav',
		'milestone-4-reactive-world',
		'Relic activation or mechanism start.',
	),
	spec(
		'uiReelStop',
		'audio',
		'ui_reel_stop.wav',
		'milestone-4-reactive-world',
		'Reel stop click or stone-metal stop.',
	),
	spec(
		'uiSymbolLand',
		'audio',
		'ui_symbol_land.wav',
		'milestone-4-reactive-world',
		'Cell landing accent.',
	),
	spec('uiWin', 'audio', 'ui_win.wav', 'milestone-4-reactive-world', 'Standard win accent.'),
	spec(
		'uiBigWin',
		'audio',
		'ui_big_win.wav',
		'milestone-4-reactive-world',
		'Layered big-win swell.',
	),
	spec(
		'uiBonus',
		'audio',
		'ui_bonus.wav',
		'milestone-4-reactive-world',
		'Bonus-trigger signature cue.',
	),
	spec(
		'postVignette',
		'post',
		'post_vignette.png',
		'milestone-5-polish',
		'Post vignette overlay.',
		'ready',
	),
	spec(
		'colorGradeTealGold',
		'post',
		'colorgrade_teal_gold.cube',
		'milestone-5-polish',
		'Color grading LUT for the teal-gold scene.',
	),
	spec(
		'symbolWheelBlue',
		'symbols',
		'blue-wheel-symbol.png',
		'milestone-2-cohesive-lighting',
		'Current live blue wheel tile should eventually migrate into the symbols folder.',
		'ready',
	),
	spec(
		'symbolWheelRed',
		'symbols',
		'red-dual-wheel-symbol.png',
		'milestone-2-cohesive-lighting',
		'Current live red wheel tile should eventually migrate into the symbols folder.',
		'ready',
	),
	spec(
		'symbolScatter',
		'symbols',
		'symbol-scatter.png',
		'milestone-2-cohesive-lighting',
		'Current scatter art is already live but still stored in the legacy flat asset root.',
		'ready',
	),
];

export const environmentMilestones: Array<{
	id: EnvironmentAssetMilestone;
	label: string;
	objective: string;
}> = [
	{
		id: 'milestone-1-structural-read',
		label: 'Milestone 1 - Structural Read',
		objective: 'Portal, altar frame, blurred background, and contact grounding.',
	},
	{
		id: 'milestone-2-cohesive-lighting',
		label: 'Milestone 2 - Cohesive Lighting',
		objective: 'World-driven rim light, warm highlights, and shadow cleanup.',
	},
	{
		id: 'milestone-3-living-environment',
		label: 'Milestone 3 - Living Environment',
		objective: 'Portal pulse, particles, haze, and waterfall motion.',
	},
	{
		id: 'milestone-4-reactive-world',
		label: 'Milestone 4 - Reactive World',
		objective: 'Environmental feedback for spin, win, big win, and bonus events.',
	},
	{
		id: 'milestone-5-polish',
		label: 'Milestone 5 - Polish',
		objective: 'Damage detail, moss, vignette, grading, and effect restraint tuning.',
	},
];

export const currentEnvironmentImplementation = {
	codeNativeNow: [
		'portal pulse and backlight',
		'light shafts',
		'ambient haze',
		'front/back particles',
		'altar tilt and contact shadow',
		'symbol teal rim and warm highlight treatment',
	],
	stillNeedsArt: [
		'painted far background',
		'portal/arch production art',
		'altar bitmap frame passes',
		'FX sprites',
		'ambient and gameplay audio',
		'post-process assets',
	],
} as const;

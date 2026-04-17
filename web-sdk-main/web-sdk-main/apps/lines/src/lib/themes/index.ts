import type { SlotTheme, ThemeId } from '../components/slot/types';
import { classicFruitTheme } from './classic-fruit.theme';
import { defaultTheme } from './default.theme';
import { fantasyTheme } from './fantasy.theme';
import { neonTheme } from './neon.theme';

export const themeRegistry: Record<ThemeId, SlotTheme> = {
	default: defaultTheme,
	fantasy: fantasyTheme,
	neon: neonTheme,
	'classic-fruit': classicFruitTheme,
};

export const themes = Object.values(themeRegistry);

export const getTheme = (themeId: ThemeId | string | undefined): SlotTheme =>
	themeRegistry[(themeId as ThemeId) ?? 'default'] ?? defaultTheme;

export const buildThemeStyle = (theme: SlotTheme): string =>
	[
		`--slot-background:${theme.background}`,
		`--slot-background-accent:${theme.backgroundAccent}`,
		`--slot-reel-bg:${theme.reelBackground}`,
		`--slot-reel-border:${theme.reelBorder}`,
		`--slot-reel-glass:${theme.reelGlass}`,
		`--slot-grid-glow:${theme.gridGlow}`,
		`--slot-panel-bg:${theme.uiColors.panel}`,
		`--slot-panel-border:${theme.uiColors.panelBorder}`,
		`--slot-text:${theme.uiColors.text}`,
		`--slot-text-soft:${theme.uiColors.textSoft}`,
		`--slot-accent:${theme.uiColors.accent}`,
		`--slot-accent-alt:${theme.uiColors.accentAlt}`,
		`--slot-button:${theme.uiColors.button}`,
		`--slot-button-text:${theme.uiColors.buttonText}`,
		`--slot-danger:${theme.uiColors.danger}`,
		`--slot-success:${theme.uiColors.success}`,
	].join(';');

export const themeOptions = themes.map((theme) => ({
	label: theme.name,
	value: theme.id,
}));

export type { SlotTheme } from '../components/slot/types';

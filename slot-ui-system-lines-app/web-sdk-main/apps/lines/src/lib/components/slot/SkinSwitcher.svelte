<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SlotTheme, ThemeId } from './types';

	type Props = {
		themes: SlotTheme[];
		currentThemeId: ThemeId;
	};

	const dispatch = createEventDispatcher<{ select: { themeId: ThemeId } }>();

	let { themes, currentThemeId }: Props = $props();

	function selectTheme(themeId: ThemeId): void {
		dispatch('select', { themeId });
	}
</script>

<div class="skin-switcher">
	{#each themes as theme (theme.id)}
		<button
			class="skin-chip"
			class:is-selected={theme.id === currentThemeId}
			style={`--chip-bg:${theme.thumbnail}; --chip-accent:${theme.backgroundAccent};`}
			on:click={() => selectTheme(theme.id)}
		>
			<span class="chip-preview">
				<span class="chip-mini-grid"></span>
			</span>
			<span class="chip-copy">
				<strong>{theme.name}</strong>
				<small>{theme.description}</small>
			</span>
		</button>
	{/each}
</div>

<style>
	.skin-switcher {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 10px;
	}

	.skin-chip {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr);
		gap: 10px;
		align-items: center;
		padding: 10px;
		border-radius: 18px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background:
			linear-gradient(180deg, rgba(10, 18, 28, 0.84), rgba(6, 11, 18, 0.92));
		color: var(--slot-text, #eef7ff);
		cursor: pointer;
		transition:
			transform 140ms ease,
			border-color 140ms ease,
			box-shadow 140ms ease;
		text-align: left;
	}

	.skin-chip:hover {
		transform: translateY(-1px);
	}

	.skin-chip.is-selected {
		border-color: color-mix(in srgb, var(--chip-accent) 48%, rgba(255, 255, 255, 0.14));
		box-shadow: 0 0 26px color-mix(in srgb, var(--chip-accent) 16%, transparent);
	}

	.chip-preview {
		position: relative;
		block-size: 64px;
		border-radius: 14px;
		background: var(--chip-bg);
		border: 1px solid rgba(255, 255, 255, 0.08);
		overflow: hidden;
	}

	.chip-preview::before {
		content: '';
		position: absolute;
		inset: 8px;
		border-radius: 10px;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03));
	}

	.chip-mini-grid {
		position: absolute;
		inset: 14px 12px;
		border-radius: 10px;
		background:
			repeating-linear-gradient(
				90deg,
				rgba(255, 255, 255, 0.12) 0 10px,
				transparent 10px 20px
			),
			repeating-linear-gradient(
				180deg,
				rgba(255, 255, 255, 0.08) 0 10px,
				transparent 10px 20px
			);
		opacity: 0.82;
	}

	.chip-copy {
		display: grid;
		gap: 4px;
		min-width: 0;
	}

	.chip-copy strong {
		font-size: 0.9rem;
		font-weight: 800;
	}

	.chip-copy small {
		font-size: 0.72rem;
		line-height: 1.4;
		color: var(--slot-text-soft, rgba(226, 240, 255, 0.72));
	}
</style>

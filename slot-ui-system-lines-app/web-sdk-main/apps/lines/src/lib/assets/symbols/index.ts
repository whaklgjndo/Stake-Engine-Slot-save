type IconOptions = {
	primary: string;
	secondary: string;
	accent: string;
	stroke?: string;
	glow?: string;
};

const svgShell = (body: string, glow = 'rgba(255,255,255,0.24)') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="slot-symbol-bg" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="rgba(255,255,255,0.16)" />
			<stop offset="100%" stop-color="rgba(255,255,255,0.03)" />
		</linearGradient>
		<filter id="slot-symbol-shadow" x="-30%" y="-30%" width="160%" height="160%">
			<feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="rgba(0,0,0,0.38)" />
		</filter>
		<filter id="slot-symbol-glow" x="-40%" y="-40%" width="180%" height="180%">
			<feGaussianBlur stdDeviation="4" result="blur" />
			<feMerge>
				<feMergeNode in="blur" />
				<feMergeNode in="SourceGraphic" />
			</feMerge>
		</filter>
	</defs>
	<circle cx="50" cy="50" r="44" fill="url(#slot-symbol-bg)" />
	<circle cx="50" cy="50" r="41" fill="${glow}" opacity="0.12" />
	${body}
</svg>`;

export const makeGemSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M50 14 76 34 66 72 50 86 34 72 24 34 50 14Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/>
		<path d="M50 14 66 34 50 52 34 34 50 14Z" fill="${secondary}" opacity="0.92"/>
		<path d="M34 34 50 52 34 72 24 34 34 34Z" fill="${accent}" opacity="0.82"/>
		<path d="M66 34 76 34 66 72 50 52 66 34Z" fill="${accent}" opacity="0.62"/>
		<path d="M50 52 66 72 50 86 34 72 50 52Z" fill="${secondary}" opacity="0.88"/>
		<path d="M50 22 59 31 50 38 41 31 50 22Z" fill="#ffffff" opacity="0.42"/>
	</g>
`,
		glow,
	);

export const makeCoinSvg = ({ primary, secondary, accent, stroke = '#fff7dd', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<circle cx="50" cy="50" r="28" fill="${primary}" stroke="${stroke}" stroke-width="2.8"/>
		<circle cx="50" cy="50" r="22" fill="${secondary}" stroke="${accent}" stroke-width="2"/>
		<path d="M36 44c4-8 24-8 28 0" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
		<path d="M38 57c6 5 18 5 24 0" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
		<path d="M50 34v32" stroke="${stroke}" stroke-width="3.4" stroke-linecap="round"/>
		<path d="M43 40h14M43 60h14" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round"/>
	</g>
`,
		glow,
	);

export const makeCrownSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M22 69 30 30 49 48 68 26 78 69Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
		<path d="M22 69h56v10H22z" fill="${secondary}" stroke="${stroke}" stroke-width="2.4"/>
		<circle cx="30" cy="28" r="5" fill="${accent}" />
		<circle cx="49" cy="45" r="4.5" fill="${accent}" />
		<circle cx="68" cy="24" r="5" fill="${accent}" />
		<path d="M34 56h31" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
	</g>
`,
		glow,
	);

export const makeStarSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-glow)">
		<path d="M50 17 58 39 82 40 63 55 70 79 50 65 30 79 37 55 18 40 42 39Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4" />
		<path d="M50 28 55 42 70 42 58 51 62 65 50 56 38 65 42 51 30 42 45 42Z" fill="${secondary}" />
		<circle cx="50" cy="50" r="4" fill="${accent}" />
	</g>
`,
		glow,
	);

export const makeBookSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M24 24h24c8 0 14 6 14 14v38H36c-6 0-12 3-12 3V24Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
		<path d="M76 24H52c-8 0-14 6-14 14v38h26c6 0 12 3 12 3V24Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
		<path d="M50 28v44" stroke="${accent}" stroke-width="2.8" />
		<path d="M34 39h10M56 39h10M34 51h10M56 51h10" stroke="${accent}" stroke-width="2.6" stroke-linecap="round"/>
		<circle cx="50" cy="22" r="8" fill="${accent}" />
	</g>
`,
		glow,
	);

export const makeDragonSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M27 69c1-17 12-35 29-38 5-1 11 0 16 4-8 1-13 5-16 11 10 0 18 6 18 15 0 10-8 18-22 18-10 0-18-3-25-10Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
		<path d="M60 32c6-9 10-12 16-12-2 3-3 6-2 9 6 2 9 6 10 12-5-3-10-4-15-2" fill="${secondary}" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>
		<path d="M40 61c8 5 17 3 23-3" stroke="${accent}" stroke-width="3.2" stroke-linecap="round"/>
		<circle cx="58" cy="48" r="3.2" fill="${accent}" />
		<path d="M44 24 38 12 48 18 55 10 55 22" fill="${accent}" opacity="0.8"/>
	</g>
`,
		glow,
	);

export const makePotionSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M42 18h16v10l10 17c8 14-2 31-18 31H50c-16 0-26-17-18-31l10-17V18Z" fill="${secondary}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
		<path d="M37 48h26c9 0 14 8 11 16-3 8-10 12-18 12h-12c-8 0-15-4-18-12-3-8 2-16 11-16Z" fill="${primary}" />
		<path d="M44 18h12" stroke="${accent}" stroke-width="3.4" stroke-linecap="round"/>
		<circle cx="43" cy="58" r="4" fill="${accent}" opacity="0.85"/>
		<circle cx="58" cy="63" r="5" fill="${accent}" opacity="0.72"/>
	</g>
`,
		glow,
	);

export const makeWildSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-glow)">
		<path d="M20 32c0-7 5-12 12-12h36c7 0 12 5 12 12v36c0 7-5 12-12 12H32c-7 0-12-5-12-12V32Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/>
		<path d="M28 28 72 72M72 28 28 72" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
		<path d="M34 40 42 60 50 45 58 60 66 40" fill="none" stroke="${secondary}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
		<path d="M34 60 42 40 50 55 58 40 66 60" fill="none" stroke="${secondary}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
	</g>
`,
		glow,
	);

export const makeScatterSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-glow)">
		<circle cx="50" cy="50" r="30" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
		<circle cx="50" cy="50" r="18" fill="${secondary}" />
		<path d="M50 14v16M50 70v16M14 50h16M70 50h16M24 24l11 11M65 65l11 11M76 24 65 35M35 65 24 76" stroke="${accent}" stroke-width="3.4" stroke-linecap="round"/>
		<circle cx="50" cy="50" r="6" fill="${accent}" />
	</g>
`,
		glow,
	);

export const makeMultiplierSvg = (
	value: '2x' | '3x',
	{ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions,
): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-glow)">
		<path d="M26 28h48c8 0 14 6 14 14v16c0 8-6 14-14 14H26c-8 0-14-6-14-14V42c0-8 6-14 14-14Z" fill="${primary}" stroke="${stroke}" stroke-width="2.6"/>
		<path d="M26 50h48" stroke="${secondary}" stroke-width="2.4" opacity="0.65"/>
		<text x="50" y="61" text-anchor="middle" font-size="28" font-family="Inter, Arial, sans-serif" font-weight="900" fill="${accent}" letter-spacing="1">${value}</text>
	</g>
`,
		glow,
	);

export const makeCherrySvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M48 30c1 11-2 17-9 23" fill="none" stroke="${accent}" stroke-width="3.4" stroke-linecap="round"/>
		<path d="M52 30c-1 11 2 17 9 23" fill="none" stroke="${accent}" stroke-width="3.4" stroke-linecap="round"/>
		<ellipse cx="37" cy="60" rx="13" ry="12" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/>
		<ellipse cx="63" cy="60" rx="13" ry="12" fill="${secondary}" stroke="${stroke}" stroke-width="2.4"/>
		<path d="M50 28c8-8 15-11 22-11" fill="none" stroke="${accent}" stroke-width="3.4" stroke-linecap="round"/>
		<path d="M48 28c-8-8-15-11-22-11" fill="none" stroke="${accent}" stroke-width="3.4" stroke-linecap="round"/>
		<path d="M52 18c8-2 13 0 16 5-8 3-13 4-16-5Z" fill="${accent}"/>
	</g>
`,
		glow,
	);

export const makeLemonSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M24 50c0-15 11-26 26-26 9 0 17 4 22 11 5 6 8 10 8 15 0 16-13 28-30 28S24 66 24 50Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/>
		<path d="M50 30c9 0 17 4 23 11-9 2-18 3-27 3-9 0-17-1-24-3 6-7 16-11 28-11Z" fill="${secondary}" opacity="0.85"/>
		<path d="M24 50h52" stroke="${accent}" stroke-width="2.8" opacity="0.7"/>
		<path d="M48 24c7-9 15-12 23-10-4 5-9 8-15 9" fill="none" stroke="${accent}" stroke-width="3.2" stroke-linecap="round"/>
	</g>
`,
		glow,
	);

export const makePlumSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M51 22c10 0 18 7 18 16 8 1 14 8 14 17 0 15-14 26-33 26S17 70 17 55c0-9 6-16 14-17 0-10 8-16 20-16Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/>
		<path d="M37 40c6-5 20-6 28-1" fill="none" stroke="${secondary}" stroke-width="3" stroke-linecap="round"/>
		<path d="M49 24c6-8 14-11 22-9-5 5-10 8-16 10" fill="none" stroke="${accent}" stroke-width="3.2" stroke-linecap="round"/>
		<circle cx="38" cy="57" r="4" fill="${secondary}" opacity="0.66"/>
	</g>
`,
		glow,
	);

export const makeBellSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M50 22c14 0 24 10 24 24v15l8 7H18l8-7V46c0-14 10-24 24-24Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
		<path d="M34 34c4-3 9-5 16-5 7 0 12 2 16 5" fill="none" stroke="${secondary}" stroke-width="3.2" stroke-linecap="round"/>
		<path d="M30 68h40c-2 7-9 12-20 12s-18-5-20-12Z" fill="${secondary}" />
		<circle cx="50" cy="73" r="4" fill="${accent}" />
	</g>
`,
		glow,
	);

export const makeSevenSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-glow)">
		<path d="M26 28h48v10L48 76H35l23-36H26V28Z" fill="${primary}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
		<path d="M28 32h44" stroke="${secondary}" stroke-width="4.2" stroke-linecap="round"/>
		<path d="M46 52 62 36" stroke="${accent}" stroke-width="4.2" stroke-linecap="round"/>
	</g>
`,
		glow,
	);

export const makeRuneSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-shadow)">
		<path d="M24 24h52v52H24z" fill="${primary}" stroke="${stroke}" stroke-width="2.4" rx="16"/>
		<path d="M38 30v40M38 30h24M38 50h18M56 50l8 20" fill="none" stroke="${secondary}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
		<path d="M30 30 70 70" stroke="${accent}" stroke-width="2.4" opacity="0.6"/>
	</g>
`,
		glow,
	);

export const makeOrbSvg = ({ primary, secondary, accent, stroke = '#ffffff', glow }: IconOptions): string =>
	svgShell(
		`
	<g filter="url(#slot-symbol-glow)">
		<circle cx="50" cy="50" r="28" fill="${primary}" stroke="${stroke}" stroke-width="2.4"/>
		<circle cx="42" cy="40" r="10" fill="${secondary}" opacity="0.75"/>
		<path d="M28 56c10 8 34 8 44 0" fill="none" stroke="${accent}" stroke-width="3.2" stroke-linecap="round"/>
		<circle cx="58" cy="58" r="6" fill="${accent}" opacity="0.85"/>
	</g>
`,
		glow,
	);

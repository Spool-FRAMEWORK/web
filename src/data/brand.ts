export type MarkTone = 'on-light' | 'on-dark';

export const brand = {
	wordmark: 'spool',
	viewBox: '10 -2 56 56',
	spiral: 'M24 24A4 4 0 0 1 32 24A8 8 0 0 1 16 24A12 12 0 0 1 40 24',
	thread: 'M40 24Q40 38 52 38',
	end: { x: 57, y: 38 },
};

export const markColors: Record<MarkTone, { spiral: string; thread: string }> = {
	'on-light': { spiral: '#0D1220', thread: '#1F45C8' },
	'on-dark': { spiral: '#FFFFFF', thread: '#7B96FF' },
};

export const markStroke = { regular: 4, small: 5 };

export const appleTouchIcon = { size: 180, markSize: 124, background: '#FFFFFF' };

export const faviconSizes = [16, 32, 48];

interface MarkOptions {
	tone: MarkTone;
	small?: boolean;
	size?: number;
}

function markShapes(spiral: string, thread: string, stroke: number): string {
	return `<path d="${brand.spiral}" stroke="${spiral}" stroke-width="${stroke}" stroke-linecap="round" fill="none"/><path d="${brand.thread}" stroke="${thread}" stroke-width="${stroke}" stroke-linecap="round" fill="none"/><circle cx="${brand.end.x}" cy="${brand.end.y}" r="${stroke}" fill="${thread}"/>`;
}

export function markSvg({ tone, small = false, size }: MarkOptions): string {
	const colors = markColors[tone];
	const dimensions = size ? ` width="${size}" height="${size}"` : '';
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${brand.viewBox}"${dimensions} aria-hidden="true">${markShapes(colors.spiral, colors.thread, small ? markStroke.small : markStroke.regular)}</svg>`;
}

export function faviconSvg(): string {
	const light = markColors['on-light'];
	const dark = markColors['on-dark'];
	const style = `.spiral{stroke:${light.spiral}}.thread{stroke:${light.thread}}.end{fill:${light.thread}}@media (prefers-color-scheme: dark){.spiral{stroke:${dark.spiral}}.thread{stroke:${dark.thread}}.end{fill:${dark.thread}}}`;
	const stroke = markStroke.small;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${brand.viewBox}"><style>${style}</style><path class="spiral" d="${brand.spiral}" stroke-width="${stroke}" stroke-linecap="round" fill="none"/><path class="thread" d="${brand.thread}" stroke-width="${stroke}" stroke-linecap="round" fill="none"/><circle class="end" cx="${brand.end.x}" cy="${brand.end.y}" r="${stroke}"/></svg>`;
}

export function appleTouchIconSvg(): string {
	const { size, markSize, background } = appleTouchIcon;
	const offset = (size - markSize) / 2;
	const mark = markSvg({ tone: 'on-light', small: true, size: markSize }).replace('<svg ', `<svg x="${offset}" y="${offset}" `);
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${background}"/>${mark}</svg>`;
}

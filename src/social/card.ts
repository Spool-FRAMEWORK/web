import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

export const socialCardSize = { width: 1200, height: 627 };

export interface SocialCard {
	eyebrow: string;
	title: string;
	description: string;
	illustration: string;
}

const palette = {
	paper: '#f4f5f8',
	grid: '#e4e8f1',
	ink: '#0d1220',
	muted: '#4a5368',
	blue: '#1f45c8',
};

const fontsDirectory = join(process.cwd(), 'src', 'assets', 'fonts');
const longTitleLength = 30;
const title = { fontSize: 64, longFontSize: 52 };
const description = { maximumLength: 150, maximumLengthUnderLongTitle: 96 };
const illustrationMargin = 24;

type Node = { type: string; props: Record<string, unknown> };

function element(type: string, style: Record<string, unknown>, children?: unknown, attributes: Record<string, unknown> = {}): Node {
	return { type, props: { style, children, ...attributes } };
}

function svgDataUri(svg: string): string {
	const withNamespace = svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
	return `data:image/svg+xml;base64,${Buffer.from(withNamespace).toString('base64')}`;
}

function gridSvg(): string {
	const step = 48;
	const lines = [];
	for (let x = 0; x <= socialCardSize.width; x += step) lines.push(`<path d="M ${x} 0 L ${x} ${socialCardSize.height}"/>`);
	for (let y = 0; y <= socialCardSize.height; y += step) lines.push(`<path d="M 0 ${y} L ${socialCardSize.width} ${y}"/>`);
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${socialCardSize.width}" height="${socialCardSize.height}"><g stroke="${palette.grid}" stroke-width="1">${lines.join('')}</g></svg>`;
}

function logoSvg(): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 -2 56 56"><path d="M24 24A4 4 0 0 1 32 24A8 8 0 0 1 16 24A12 12 0 0 1 40 24" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M40 24Q40 38 52 38" stroke="${palette.blue}" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="57" cy="38" r="4" fill="${palette.blue}"/></svg>`;
}

function shorten(text: string, maximumLength: number): string {
	if (text.length <= maximumLength) return text;
	const cut = text.slice(0, maximumLength);
	return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function withMargin(illustration: string): string {
	return illustration.replace(/viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/, (_, x, y, width, height) =>
		`viewBox="${Number(x) - illustrationMargin} ${Number(y) - illustrationMargin} ${Number(width) + illustrationMargin * 2} ${Number(height) + illustrationMargin * 2}"`,
	);
}

function layout(card: SocialCard): Node {
	const longTitle = card.title.length > longTitleLength;
	return element(
		'div',
		{ position: 'relative', display: 'flex', width: '100%', height: '100%', background: palette.paper, fontFamily: 'Instrument Sans', color: palette.ink },
		[
			element('img', { position: 'absolute', left: 0, top: 0 }, undefined, { src: svgDataUri(gridSvg()), width: socialCardSize.width, height: socialCardSize.height }),
			element('img', { position: 'absolute', right: 72, bottom: 64 }, undefined, { src: svgDataUri(withMargin(card.illustration)), width: 432, height: 360 }),
			element('div', { position: 'absolute', left: 72, top: 64, display: 'flex', alignItems: 'center', gap: 14 }, [
				element('img', {}, undefined, { src: svgDataUri(logoSvg()), width: 52, height: 52 }),
				element('div', { fontFamily: 'Familjen Grotesk', fontSize: 36, letterSpacing: '-0.01em' }, 'Spool'),
			]),
			element('div', { position: 'absolute', left: 72, top: 176, width: 600, display: 'flex', flexDirection: 'column', gap: 22 }, [
				element('div', { fontFamily: 'IBM Plex Mono', fontSize: 22, color: palette.blue, textTransform: 'uppercase', letterSpacing: '0.08em' }, card.eyebrow),
				element('div', { fontFamily: 'Familjen Grotesk', fontSize: longTitle ? title.longFontSize : title.fontSize, lineHeight: 1.08, letterSpacing: '-0.015em' }, card.title),
				element('div', { fontSize: 26, lineHeight: 1.4, color: palette.muted }, shorten(card.description, longTitle ? description.maximumLengthUnderLongTitle : description.maximumLength)),
			]),
			element('div', { position: 'absolute', left: 72, bottom: 56, fontFamily: 'IBM Plex Mono', fontSize: 22, color: palette.muted }, 'spoolframework.dev'),
		],
	);
}

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 600; style: 'normal' }[]> | undefined;

function loadFonts() {
	fonts ??= Promise.all([
		readFile(join(fontsDirectory, 'FamiljenGrotesk-SemiBold.ttf')).then((data) => ({ name: 'Familjen Grotesk', data, weight: 600 as const, style: 'normal' as const })),
		readFile(join(fontsDirectory, 'InstrumentSans-Medium.ttf')).then((data) => ({ name: 'Instrument Sans', data, weight: 500 as const, style: 'normal' as const })),
		readFile(join(fontsDirectory, 'IBMPlexMono-Medium.ttf')).then((data) => ({ name: 'IBM Plex Mono', data, weight: 500 as const, style: 'normal' as const })),
	]);
	return fonts;
}

export async function renderSocialCard(card: SocialCard): Promise<Uint8Array> {
	const svg = await satori(layout(card) as Parameters<typeof satori>[0], { ...socialCardSize, fonts: await loadFonts() });
	return new Resvg(svg, { fitTo: { mode: 'width', value: socialCardSize.width } }).render().asPng();
}

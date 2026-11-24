import type { APIRoute } from 'astro';
import { faviconSizes, markSvg } from '../data/brand';
import { icoFromPngs, renderPng } from '../icons/icons';

export const GET: APIRoute = () => {
	const svg = markSvg({ tone: 'on-light', small: true });
	const icon = icoFromPngs(faviconSizes.map((size) => ({ size, png: renderPng(svg, size) })));
	return new Response(icon, { headers: { 'Content-Type': 'image/x-icon' } });
};

import type { APIRoute } from 'astro';
import { renderSocialCard } from '../../social/card';
import { landingSocialCard } from '../../social/cards';

export const GET: APIRoute = async () =>
	new Response(await renderSocialCard(landingSocialCard), { headers: { 'Content-Type': 'image/png' } });

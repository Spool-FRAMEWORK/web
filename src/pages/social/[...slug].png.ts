import type { APIRoute, GetStaticPaths } from 'astro';
import { renderSocialCard, type SocialCard } from '../../social/card';
import { docsSocialCards } from '../../social/cards';

export const getStaticPaths: GetStaticPaths = async () =>
	(await docsSocialCards()).map(({ id, card }) => ({ params: { slug: id }, props: { card } }));

export const GET: APIRoute<{ card: SocialCard }> = async ({ props }) =>
	new Response(await renderSocialCard(props.card), { headers: { 'Content-Type': 'image/png' } });

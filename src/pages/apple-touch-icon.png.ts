import type { APIRoute } from 'astro';
import { appleTouchIcon, appleTouchIconSvg } from '../data/brand';
import { renderPng } from '../icons/icons';

export const GET: APIRoute = () => new Response(renderPng(appleTouchIconSvg(), appleTouchIcon.size), { headers: { 'Content-Type': 'image/png' } });

import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { getCollection } from 'astro:content';
import { withBase } from './data/site';
import { docsSocialCardPath, landingSocialCardPath } from './social/cards';
import { socialImageTags } from './social/head';

let documentIds: Promise<Set<string>> | undefined;

function knownDocumentIds(): Promise<Set<string>> {
	documentIds ??= getCollection('docs').then((entries) => new Set(entries.map((entry) => entry.id)));
	return documentIds;
}

export const onRequest = defineRouteMiddleware(async (context) => {
	const route = context.locals.starlightRoute;
	const hasOwnCard = (await knownDocumentIds()).has(route.entry.id);
	const imagePath = hasOwnCard ? docsSocialCardPath(route.entry.id) : landingSocialCardPath;
	const imageUrl = new URL(withBase(imagePath), context.site ?? context.url).href;
	route.head.push(...socialImageTags(imageUrl, route.entry.data.title));
});

import { getCollection } from 'astro:content';
import { docsSections, site } from '../data/site';
import type { SocialCard } from './card';

const illustrations = import.meta.glob('../components/landing/illustrations/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const landingIllustration = 'stop-6';

const sectionIllustrations: Record<string, string> = {
	'getting-started': 'stop-1',
	concepts: 'stop-2',
	modules: 'stop-3',
	dsl: 'stop-1',
	ports: 'stop-4',
	operations: 'stop-7',
	examples: 'stop-0',
	'use-cases': 'stop-8',
};

function illustration(name: string): string {
	return illustrations[`../components/landing/illustrations/${name}.svg`];
}

export const landingSocialCardPath = 'social/index.png';

export function docsSocialCardPath(id: string): string {
	return `social/${id}.png`;
}

export const landingSocialCard: SocialCard = {
	eyebrow: 'Java framework',
	title: site.headline,
	description: site.description,
	illustration: illustration(landingIllustration),
};

export async function docsSocialCards(): Promise<{ id: string; card: SocialCard }[]> {
	const entries = await getCollection('docs');
	return entries.map((entry) => {
		const directory = entry.id.split('/')[0];
		const section = docsSections.find((candidate) => candidate.directory === directory);
		return {
			id: entry.id,
			card: {
				eyebrow: section?.label ?? 'Documentation',
				title: entry.data.title,
				description: entry.data.description ?? site.description,
				illustration: illustration(sectionIllustrations[directory] ?? landingIllustration),
			},
		};
	});
}

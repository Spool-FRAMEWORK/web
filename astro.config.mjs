// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import starlightLinksValidator from 'starlight-links-validator';

const sections = [
	{ label: 'Getting started', directory: 'getting-started' },
	{ label: 'Concepts', directory: 'concepts' },
	{ label: 'Modules', directory: 'modules' },
	{ label: 'DSL reference', directory: 'dsl' },
	{ label: 'Ports and backends', directory: 'ports' },
	{ label: 'Operations', directory: 'operations' },
	{ label: 'Examples', directory: 'examples' },
];

export default defineConfig({
	site: process.env.SITE_URL,
	base: process.env.SITE_BASE_PATH,
	integrations: [
		starlight({
			title: 'Spool',
			description: 'Modular, event-driven Java framework for auditable data pipelines, from source to data mart.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Spool-FRAMEWORK' }],
			plugins: [starlightLinksValidator()],
			sidebar: sections.map(({ label, directory }) => ({
				label,
				items: [{ autogenerate: { directory } }],
			})),
		}),
		react(),
	],
});

// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import starlightLinksValidator from 'starlight-links-validator';
import { site } from './src/data/site.ts';

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
			title: site.name,
			description: site.description,
			social: [{ icon: 'github', label: 'GitHub', href: site.githubUrl }],
			editLink: { baseUrl: `${site.webRepositoryUrl}/edit/develop/` },
			customCss: ['./src/styles/theme.css'],
			components: { Header: './src/components/Header.astro' },
			plugins: [starlightLinksValidator()],
			sidebar: sections.map(({ label, directory }) => ({
				label,
				items: [{ autogenerate: { directory } }],
			})),
		}),
		react(),
	],
});

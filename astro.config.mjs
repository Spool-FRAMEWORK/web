// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import starlightLinksValidator from 'starlight-links-validator';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fontsStylesheetUrl, site } from './src/data/site.ts';
import { rehypeBaseLinks } from './src/plugins/rehype-base-links.mjs';
import { openApiContracts, openApiContractsDirectory } from './src/data/openapi-contracts.mjs';

const sections = [
	{ label: 'Getting started', directory: 'getting-started' },
	{ label: 'Concepts', directory: 'concepts' },
	{ label: 'Modules', directory: 'modules' },
	{ label: 'DSL reference', directory: 'dsl' },
	{ label: 'Ports and backends', directory: 'ports' },
	{ label: 'Operations', directory: 'operations' },
	{ label: 'Examples', directory: 'examples' },
	{ label: 'Use cases', directory: 'use-cases' },
];

const downloadedOpenApiContracts = openApiContracts
	.map((contract) => ({ ...contract, schema: join(openApiContractsDirectory, contract.fileName) }))
	.filter((contract) => existsSync(contract.schema));

const apiReference =
	downloadedOpenApiContracts.length === 0
		? { sidebar: [], plugins: [] }
		: {
				sidebar: [{ label: 'API reference', items: openAPISidebarGroups }],
				plugins: [
					starlightOpenAPI(
						downloadedOpenApiContracts.map(({ basePath, label, schema }) => ({
							base: basePath,
							schema,
							sidebar: { label, operations: { badges: true } },
						})),
					),
				],
			};

export default defineConfig({
	devToolbar: { enabled: false },
	site: process.env.SITE_URL,
	base: process.env.SITE_BASE_PATH,
	markdown: { rehypePlugins: [rehypeBaseLinks(process.env.SITE_BASE_PATH)] },
	integrations: [
		starlight({
			title: site.name,
			logo: { src: './src/assets/logo-on-dark.svg', alt: '' },
			description: site.description,
			social: [{ icon: 'github', label: 'GitHub', href: site.githubUrl }],
			head: [
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
				{ tag: 'link', attrs: { rel: 'stylesheet', href: fontsStylesheetUrl } },
			],
			editLink: { baseUrl: `${site.webRepositoryUrl}/edit/develop/` },
			customCss: ['./src/styles/theme.css'],
			components: {
				Header: './src/components/Header.astro',
				Footer: './src/components/Footer.astro',
			},
			expressiveCode: {
				themes: ['github-dark-default', 'github-light'],
				defaultProps: { frame: 'code' },
				styleOverrides: {
					borderRadius: '0.375rem',
					borderColor: 'var(--spool-border)',
					frames: {
						shadowColor: 'transparent',
						frameBoxShadowCssValue: 'none',
						editorTabBarBackground: 'var(--spool-code-chrome)',
						editorActiveTabBackground: 'var(--spool-code-chrome)',
						editorActiveTabIndicatorTopColor: 'transparent',
						editorActiveTabIndicatorBottomColor: 'var(--sl-color-accent)',
						editorTabBarBorderBottomColor: 'var(--spool-border)',
						terminalTitlebarBackground: 'var(--spool-code-chrome)',
						terminalTitlebarBorderBottomColor: 'var(--spool-border)',
						terminalTitlebarDotsOpacity: '0',
					},
				},
			},
			plugins: [starlightLinksValidator(), ...apiReference.plugins],
			sidebar: [
				...sections.map(({ label, directory }) => ({
					label,
					items: [{ autogenerate: { directory } }],
				})),
				...apiReference.sidebar,
			],
		}),
		react(),
	],
});

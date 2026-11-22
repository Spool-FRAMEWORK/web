// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import starlightLinksValidator from 'starlight-links-validator';
import { fontsStylesheetUrl, site } from './src/data/site.ts';
import { rehypeBaseLinks } from './src/plugins/rehype-base-links.mjs';

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

export default defineConfig({
	devToolbar: { enabled: false },
	site: process.env.SITE_URL,
	base: process.env.SITE_BASE_PATH,
	markdown: { rehypePlugins: [rehypeBaseLinks(process.env.SITE_BASE_PATH)] },
	integrations: [
		starlight({
			title: site.name,
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
			plugins: [starlightLinksValidator()],
			sidebar: sections.map(({ label, directory }) => ({
				label,
				items: [{ autogenerate: { directory } }],
			})),
		}),
		react(),
	],
});

export const site = {
	name: 'Spool',
	headline: 'Build data pipelines you can trace.',
	author: 'Javier Castilla',
	origin: 'final-year project in Computer Engineering at the University of Las Palmas de Gran Canaria',
	license: {
		name: 'GNU Affero General Public License v3.0',
		url: 'https://www.gnu.org/licenses/agpl-3.0.html',
		pagePath: 'license/',
		commercialContactEmail: 'licensing@spoolframework.dev',
	},
	mavenCentralUrl: 'https://central.sonatype.com/namespace/io.github.spool-framework',
	description:
		'Spool is a Java framework for building data pipelines that take data from external sources to a data mart.',
	githubUrl: 'https://github.com/Spool-FRAMEWORK',
	webRepositoryUrl: 'https://github.com/Spool-FRAMEWORK/web',
	examplesUrl: 'https://github.com/Spool-FRAMEWORK-Labs',
	requiredJavaVersion: 21,
};

export const docsSections = [
	{ label: 'Getting started', directory: 'getting-started' },
	{ label: 'Concepts', directory: 'concepts' },
	{ label: 'Modules', directory: 'modules' },
	{ label: 'DSL reference', directory: 'dsl' },
	{ label: 'Ports and backends', directory: 'ports' },
	{ label: 'Operations', directory: 'operations' },
	{ label: 'Examples', directory: 'examples' },
	{ label: 'Use cases', directory: 'use-cases' },
];

export const cliInstallScripts = {
	unix: 'install.sh',
	windows: 'install.ps1',
};

export const fontsStylesheetUrl =
	'https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap';

export const headerLinks = [
	{ label: 'Documentation', path: 'getting-started/' },
	{ label: 'Examples', path: 'examples/' },
];

export function withBase(path: string): string {
	const base = import.meta.env.BASE_URL.endsWith('/')
		? import.meta.env.BASE_URL
		: `${import.meta.env.BASE_URL}/`;
	return `${base}${path}`;
}

export const site = {
	name: 'Spool',
	description:
		'Spool is a Java framework for building data pipelines that take data from external sources to a data mart.',
	githubUrl: 'https://github.com/Spool-FRAMEWORK',
	webRepositoryUrl: 'https://github.com/Spool-FRAMEWORK/web',
	examplesUrl: 'https://github.com/Spool-FRAMEWORK-Labs',
	requiredJavaVersion: 21,
	latestRelease: {
		groupId: 'io.github.spool-framework',
		artifactId: 'runtime',
		version: '1.4.0',
	},
};

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

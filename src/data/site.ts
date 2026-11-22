export const site = {
	name: 'Spool',
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
	latestRelease: {
		groupId: 'io.github.spool-framework',
		artifactId: 'runtime',
		version: '1.4.0',
		includedModules: [
			{ artifactId: 'dsl', version: '1.4.0', role: 'Reads the descriptor and builds the node.' },
			{ artifactId: 'crawler', version: '1.2.1', role: 'Reads sources and stores each record in the inbox.' },
			{ artifactId: 'ingester', version: '1.2.0', role: 'Validates records and writes them to the data lake.' },
			{ artifactId: 'janitor', version: '1.2.1', role: 'Keeps the inbox up to date, retries and cleans it.' },
			{ artifactId: 'validator', version: '1.2.0', role: 'Finds and runs your validation rules.' },
			{ artifactId: 'mounter', version: '1.3.0', role: 'Aggregates data lake partitions into a data mart.' },
			{ artifactId: 'infrastructure', version: '1.3.0', role: 'Adapters for the file system, S3, Kafka and HTTP.' },
			{ artifactId: 'core', version: '1.2.0', role: 'The model, the ports and the event bus shared by all modules.' },
		],
	},
};

export const cliInstallScripts = {
	unix: 'install.sh',
	windows: 'install.ps1',
};

export const fontsStylesheetUrl =
	'https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap';

export const mavenDependency = `<dependency>
  <groupId>${site.latestRelease.groupId}</groupId>
  <artifactId>${site.latestRelease.artifactId}</artifactId>
  <version>${site.latestRelease.version}</version>
</dependency>`;

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

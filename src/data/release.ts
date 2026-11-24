import { releaseSources } from './release-sources.mjs';

export interface ModuleVersion {
	artifactId: string;
	version: string;
}

export interface Change {
	text: string;
	breaking: boolean;
}

export interface ModuleChange extends ModuleVersion {
	previous?: string;
	first?: boolean;
	missing?: boolean;
	notes?: string[];
	features: Change[];
	fixes: Change[];
}

export interface Release {
	version: string;
	date?: string;
	modules: ModuleVersion[];
	changes: ModuleChange[];
}

interface ReleaseData {
	groupId: string;
	artifactId: string;
	latest: string;
	releases: Release[];
}

export const moduleRoles: Record<string, string> = {
	dsl: 'Reads the descriptor and builds the node.',
	crawler: 'Reads sources and stores each record in the inbox.',
	ingester: 'Validates records and writes them to the data lake.',
	janitor: 'Keeps the inbox up to date, retries and cleans it.',
	validator: 'Finds and runs your validation rules.',
	mounter: 'Aggregates data lake partitions into a data mart.',
	infrastructure: 'Adapters for the file system, S3, Kafka and HTTP.',
	core: 'The model, the ports and the event bus shared by all modules.',
};

const offlineRelease: Release = {
	version: '1.4.0',
	modules: [
		{ artifactId: 'runtime', version: '1.4.0' },
		{ artifactId: 'dsl', version: '1.4.0' },
		{ artifactId: 'crawler', version: '1.2.1' },
		{ artifactId: 'ingester', version: '1.2.0' },
		{ artifactId: 'janitor', version: '1.2.1' },
		{ artifactId: 'validator', version: '1.2.0' },
		{ artifactId: 'mounter', version: '1.3.0' },
		{ artifactId: 'infrastructure', version: '1.3.0' },
		{ artifactId: 'core', version: '1.2.0' },
	],
	changes: [],
};

const downloaded = Object.values(import.meta.glob<ReleaseData>('../generated/releases.json', { eager: true, import: 'default' }))[0];

export const releases: Release[] = downloaded?.releases ?? [offlineRelease];

const latest = releases[0];

export const latestRelease = {
	groupId: releaseSources.groupId,
	artifactId: releaseSources.rootArtifactId,
	version: latest.version,
	includedModules: latest.modules
		.filter((module) => module.artifactId !== releaseSources.rootArtifactId)
		.map((module) => ({ ...module, role: moduleRoles[module.artifactId] ?? '' })),
};

export const mavenDependency = `<dependency>
  <groupId>${latestRelease.groupId}</groupId>
  <artifactId>${latestRelease.artifactId}</artifactId>
  <version>${latestRelease.version}</version>
</dependency>`;

export const changelogPath = 'changelog/';

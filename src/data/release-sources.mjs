export const releaseDataFile = 'src/generated/releases.json';

export const releaseSources = {
	groupId: 'io.github.spool-framework',
	rootArtifactId: 'runtime',
	mavenRepositoryUrl: 'https://repo1.maven.org/maven2',
	githubApiUrl: 'https://api.github.com',
	githubOwner: 'Spool-FRAMEWORK',
	tagPrefix: 'v',
};

export const moduleOrder = ['runtime', 'dsl', 'crawler', 'ingester', 'janitor', 'validator', 'mounter', 'infrastructure', 'core'];

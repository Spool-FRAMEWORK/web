import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { moduleOrder, releaseDataFile, releaseSources } from '../src/data/release-sources.mjs';

const { groupId, rootArtifactId, mavenRepositoryUrl, githubApiUrl, githubOwner, tagPrefix } = releaseSources;
const groupPath = groupId.replaceAll('.', '/');
const conventionalCommit = /^(feat|fix)(\([^)]*\))?(!)?: (.+)$/;
const automaticReleaseNote = /\*\*Full Changelog\*\*|## What's Changed/;

function warn(title, message) {
	if (process.env.GITHUB_ACTIONS) process.stdout.write(`::warning title=${title}::${message}\n`);
	else process.stderr.write(`${title}: ${message}\n`);
}

async function fetchText(url, headers = {}) {
	const response = await fetch(url, { headers });
	if (!response.ok) throw new Error(`${url} answered ${response.status}`);
	return response.text();
}

async function fetchGithub(path) {
	const headers = { Accept: 'application/vnd.github+json' };
	if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	return JSON.parse(await fetchText(`${githubApiUrl}${path}`, headers));
}

function tagOf(version) {
	return `${tagPrefix}${version}`;
}

function compareVersions(first, second) {
	const a = first.split('.').map(Number);
	const b = second.split('.').map(Number);
	for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
		const difference = (a[index] ?? 0) - (b[index] ?? 0);
		if (difference !== 0) return difference;
	}
	return 0;
}

async function publishedVersions(artifactId) {
	const metadata = await fetchText(`${mavenRepositoryUrl}/${groupPath}/${artifactId}/maven-metadata.xml`);
	return [...metadata.matchAll(/<version>([^<]+)<\/version>/g)].map((match) => match[1]).filter((version) => !version.includes('SNAPSHOT')).sort(compareVersions);
}

const pomDependencies = new Map();

async function spoolDependencies(artifactId, version) {
	const key = `${artifactId}:${version}`;
	if (!pomDependencies.has(key)) {
		pomDependencies.set(key, (async () => {
			const pom = await fetchText(`${mavenRepositoryUrl}/${groupPath}/${artifactId}/${version}/${artifactId}-${version}.pom`);
			const section = pom.match(/<dependencies>([\s\S]*?)<\/dependencies>/)?.[1] ?? '';
			return [...section.matchAll(/<dependency>([\s\S]*?)<\/dependency>/g)]
				.map((match) => match[1])
				.filter((dependency) => dependency.includes(`<groupId>${groupId}</groupId>`) && !/<scope>test<\/scope>/.test(dependency))
				.map((dependency) => ({ artifactId: dependency.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1], version: dependency.match(/<version>([^<]+)<\/version>/)?.[1] }))
				.filter((dependency) => dependency.artifactId && dependency.version && !dependency.version.startsWith('${'));
		})());
	}
	return pomDependencies.get(key);
}

async function modulesOf(version) {
	const modules = { [rootArtifactId]: version };
	const pending = [[rootArtifactId, version]];
	while (pending.length > 0) {
		const [artifactId, artifactVersion] = pending.shift();
		for (const dependency of await spoolDependencies(artifactId, artifactVersion)) {
			if (modules[dependency.artifactId]) continue;
			modules[dependency.artifactId] = dependency.version;
			pending.push([dependency.artifactId, dependency.version]);
		}
	}
	return modules;
}

const githubReleases = new Map();

async function releasesOf(repository) {
	if (!githubReleases.has(repository)) {
		githubReleases.set(repository, fetchGithub(`/repos/${githubOwner}/${repository}/releases?per_page=100`).then((releases) => new Map(releases.map((release) => [release.tag_name, release]))));
	}
	return githubReleases.get(repository);
}

function sentence(text) {
	const trimmed = text.trim();
	const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
	return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function writtenNotes(body) {
	if (!body || automaticReleaseNote.test(body)) return undefined;
	const items = body.split(/\r?\n/).map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1]).filter(Boolean);
	return items.length > 0 ? items.map(sentence) : undefined;
}

async function changesOf(artifactId, version, previous) {
	const release = (await releasesOf(artifactId)).get(tagOf(version));
	const notes = writtenNotes(release?.body);
	if (notes) return { notes, features: [], fixes: [] };
	if (!previous) return { first: true, features: [], fixes: [] };
	const comparison = await fetchGithub(`/repos/${githubOwner}/${artifactId}/compare/${tagOf(previous)}...${tagOf(version)}`);
	const features = [];
	const fixes = [];
	for (const commit of comparison.commits) {
		const match = commit.commit.message.split('\n')[0].match(conventionalCommit);
		if (!match) continue;
		const change = { text: sentence(match[4]), breaking: Boolean(match[3]) };
		(match[1] === 'feat' ? features : fixes).push(change);
	}
	return { features: features.reverse(), fixes: fixes.reverse() };
}

async function dateOf(version) {
	const release = (await releasesOf(rootArtifactId)).get(tagOf(version));
	return release?.published_at ?? release?.created_at;
}

function ordered(modules) {
	const position = (artifactId) => (moduleOrder.includes(artifactId) ? moduleOrder.indexOf(artifactId) : moduleOrder.length);
	return Object.keys(modules).sort((first, second) => position(first) - position(second) || first.localeCompare(second));
}

async function main() {
	const versions = await publishedVersions(rootArtifactId);
	const trees = await Promise.all(versions.map(modulesOf));
	const releases = [];
	for (const [index, version] of versions.entries()) {
		const modules = trees[index];
		const before = index > 0 ? trees[index - 1] : {};
		const changes = [];
		for (const artifactId of ordered(modules)) {
			if (before[artifactId] === modules[artifactId]) continue;
			try {
				changes.push({ artifactId, version: modules[artifactId], previous: before[artifactId], ...(await changesOf(artifactId, modules[artifactId], before[artifactId])) });
			} catch (error) {
				warn('Release notes missing', `${artifactId} ${modules[artifactId]} has no notes in the changelog: ${error.message}`);
				changes.push({ artifactId, version: modules[artifactId], previous: before[artifactId], missing: true, features: [], fixes: [] });
			}
		}
		releases.push({ version, date: await dateOf(version).catch(() => undefined), modules: ordered(modules).map((artifactId) => ({ artifactId, version: modules[artifactId] })), changes });
	}
	const latest = releases[releases.length - 1];
	await mkdir(dirname(releaseDataFile), { recursive: true });
	await writeFile(releaseDataFile, JSON.stringify({ groupId, artifactId: rootArtifactId, latest: latest.version, releases: releases.reverse() }, null, '\t'));
	process.stdout.write(`Wrote ${releaseDataFile} with ${releases.length} releases, the latest ${latest.version}.\n`);
}

main().catch((error) => warn('Release data missing', `The site is built with the release data it already has: ${error.message}`));

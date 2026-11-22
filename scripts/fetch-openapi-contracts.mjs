import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
	openApiContracts,
	openApiContractsDefaultGitReference,
	openApiContractsDirectory,
	openApiContractsSourceUrl,
} from '../src/data/openapi-contracts.mjs';

const gitReference = process.env.OPENAPI_REF || openApiContractsDefaultGitReference;

function warn(title, message) {
	if (process.env.GITHUB_ACTIONS) {
		process.stdout.write(`::warning title=${title}::${message}\n`);
	} else {
		process.stderr.write(`${title}: ${message}\n`);
	}
}

async function fetchContract(contract) {
	const url = `${openApiContractsSourceUrl}/${contract.repository}/${gitReference}/${contract.repositoryPath}`;
	const destination = join(openApiContractsDirectory, contract.fileName);
	const response = await fetch(url).catch((error) => ({ ok: false, status: error.message }));
	if (!response.ok) {
		await rm(destination, { force: true });
		warn(
			'OpenAPI contract missing',
			`${contract.fileName} could not be downloaded from ${contract.repository} at ${gitReference} (${response.status}), so the site is built without its API reference.`,
		);
		return;
	}
	await writeFile(destination, await response.text());
	process.stdout.write(`Downloaded ${contract.fileName} from ${contract.repository} at ${gitReference}.\n`);
}

await mkdir(openApiContractsDirectory, { recursive: true });
await Promise.all(openApiContracts.map(fetchContract));

export const openApiContractsDirectory = 'src/openapi';

export const openApiContractsSourceUrl = 'https://raw.githubusercontent.com/Spool-FRAMEWORK';

export const openApiContractsDefaultGitReference = 'main';

export const openApiContracts = [
	{
		fileName: 'cluster-api.yaml',
		repository: 'api',
		repositoryPath: 'src/main/resources/openapi/cluster-api.yaml',
		label: 'Cluster API',
		basePath: 'reference/cluster-api',
	},
	{
		fileName: 'quarantine-api.yaml',
		repository: 'janitor',
		repositoryPath: 'src/main/resources/openapi/quarantine-api.yaml',
		label: 'Quarantine API',
		basePath: 'reference/quarantine-api',
	},
];

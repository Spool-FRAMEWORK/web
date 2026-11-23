export type Point = [number, number];
export type Box = [number, number, number, number];
export type RouteKind = 'push' | 'quarantine';
export type Route = [string, string] | [string, string, RouteKind];

export interface Piece {
	illustration: string;
	label: string;
	at: Point;
	quarantine?: boolean;
}

export interface Island {
	id: string;
	box: Box;
	label: string;
}

export interface Badge {
	text: string;
	at: Point;
	tone: 'warn' | 'ink';
}

export interface Chapter {
	when: string;
	title: string;
	event: string;
	answer: string;
	show: string[];
	places?: Record<string, Point>;
	routes: Route[];
	islands: Island[];
	bus: 'memory' | 'kafka';
	cloud?: boolean;
	badges?: Badge[];
	focus: [number, number, number];
	file: string;
	fileNote: string;
	code: string[];
	added: number[];
}

export const stageSize = { width: 1312, height: 640 };

export const act = { x: 5300, y: 2, scale: 1.4, visibleWidth: 920 };

export const pieces: Record<string, Piece> = {
	linear: { illustration: 'stop-0', label: 'Linear', at: [70, 300] },
	webhook: { illustration: 'stop-1', label: 'linear-webhook', at: [230, 150] },
	issues: { illustration: 'stop-1', label: 'linear-issues', at: [230, 300] },
	documents: { illustration: 'stop-1', label: 'linear-documents', at: [230, 450] },
	inbox: { illustration: 'stop-2', label: 'inbox', at: [390, 300] },
	ingesterTop: { illustration: 'stop-3', label: 'ingester', at: [550, 150] },
	ingester: { illustration: 'stop-3', label: 'ingester', at: [550, 300] },
	ingesterBottom: { illustration: 'stop-3', label: 'ingester', at: [550, 450] },
	quarantine: { illustration: 'quarantine', label: 'quarantine', at: [700, 520], quarantine: true },
	bronze: { illustration: 'stop-4', label: 'bronze', at: [710, 300] },
	cleaner: { illustration: 'stop-5', label: 'cleaner', at: [850, 165] },
	silver: { illustration: 'stop-4', label: 'silver', at: [970, 300] },
	knowledge: { illustration: 'stop-5', label: 'knowledge-base', at: [1090, 165] },
	qdrant: { illustration: 'stop-6', label: 'Qdrant, gold', at: [1220, 300] },
	reports: { illustration: 'stop-5', label: 'weekly-report', at: [1060, 470] },
	reportsMart: { illustration: 'stop-6', label: 'reports, gold', at: [1220, 470] },
};

const early: Record<string, Point> = { bronze: [710, 300], knowledge: [880, 300], qdrant: [1050, 300] };
const laptop: Island = { id: 'laptop', box: [140, 64, 1150, 540], label: 'your laptop, one process' };
const base = ['linear', 'issues', 'inbox', 'ingester', 'bronze', 'knowledge', 'qdrant'];
const baseRoutes: Route[] = [['linear', 'issues'], ['issues', 'inbox'], ['inbox', 'ingester'], ['ingester', 'bronze'], ['bronze', 'knowledge'], ['knowledge', 'qdrant']];
const sourceRoutes: Route[] = [['linear', 'webhook', 'push'], ['webhook', 'inbox'], ['linear', 'documents'], ['documents', 'inbox']];
const layered = [...base, 'webhook', 'documents', 'quarantine', 'cleaner', 'silver'];
const layeredRoutes: Route[] = [
	['linear', 'issues'], ['issues', 'inbox'], ['inbox', 'ingester'], ['ingester', 'bronze'], ['ingester', 'quarantine', 'quarantine'],
	['bronze', 'cleaner'], ['cleaner', 'silver'], ['cleaner', 'quarantine', 'quarantine'], ['silver', 'knowledge'], ['knowledge', 'qdrant'],
	...sourceRoutes,
];
const scaled = [...layered, 'ingesterTop', 'ingesterBottom'];
const scaledRoutes: Route[] = [...layeredRoutes, ['inbox', 'ingesterTop'], ['inbox', 'ingesterBottom'], ['ingesterTop', 'bronze'], ['ingesterBottom', 'bronze']];
const nodes: Island[] = [
	{ id: 'capture', box: [158, 62, 144, 470], label: 'node, capture' },
	{ id: 'replicas', box: [472, 62, 156, 470], label: 'three ingester replicas' },
	{ id: 'mounting', box: [768, 70, 404, 150], label: 'node, mounting' },
];

export const islandIds = ['laptop', 'capture', 'replicas', 'mounting', 'reportsNode'];

export const chapters: Chapter[] = [
	{
		when: 'Week 1',
		title: 'A first version',
		focus: [560, 300, 1080],
		event: 'You build the knowledge base on your laptop.',
		answer: 'A crawler polls Linear every fifteen minutes, the ingester validates each issue, and a mounter turns them into chunks with embeddings in Qdrant. Everything runs in one process on an in-memory bus, so a test of the whole path takes seconds.',
		show: base, places: early, routes: baseRoutes, islands: [laptop], bus: 'memory',
		file: 'assistant.spool.yaml', fileNote: 'the first version',
		code: ['infrastructure:', '  eventBus: {type: IN_MEMORY}', '  inbox: {type: FILE_SYSTEM}', '  dataLake: {type: FILE_SYSTEM}', '  dataMart: {type: QDRANT}', 'modules:', '  - crawler: {id: linear-issues, type: POLL}', '  - ingester: {id: linear-ingester}', '  - janitor: {id: linear-janitor}', '  - mounter: {id: knowledge-base}'],
		added: [],
	},
	{
		when: 'Week 3',
		title: 'Changes within seconds',
		focus: [300, 230, 680],
		event: 'People ask about issues edited a minute ago, and the assistant does not know yet.',
		answer: 'Linear can call a webhook on every change. A WEBHOOK crawler receives each delivery on the node, checks its signature against a shared secret and stores it at once. A delivery sent twice is stored once.',
		show: [...base, 'webhook'], places: early, routes: [...baseRoutes, ['linear', 'webhook', 'push'], ['webhook', 'inbox']], islands: [laptop], bus: 'memory',
		file: 'assistant.spool.yaml', fileNote: '7 lines added',
		code: ['  - crawler:', '      id: linear-webhook', '      type: WEBHOOK', '      source:', '        configuration: {path: /spool/webhooks/linear}', '      webhook:', '        authentication: linear-signature'],
		added: [0, 1, 2, 3, 4, 5, 6],
	},
	{
		when: 'Month 2',
		title: 'A second source',
		focus: [300, 330, 680],
		event: 'The team wants the assistant to read the documents as well.',
		answer: 'One more crawler reads the documents every night at two, on a cron expression with its time zone. It writes to the same inbox, and the same ingester validates both sources.',
		show: [...base, 'webhook', 'documents'], places: early, routes: [...baseRoutes, ...sourceRoutes], islands: [laptop], bus: 'memory',
		file: 'assistant.spool.yaml', fileNote: '4 lines added',
		code: ['  - crawler:', '      id: linear-documents', '      type: POLL', '      schedule: {cron: "0 2 * * *", zone: Europe/Madrid}'],
		added: [0, 1, 2, 3],
	},
	{
		when: 'Month 2',
		title: 'A broken record',
		focus: [560, 380, 760],
		event: 'An issue arrives without a title and would confuse the assistant.',
		answer: 'A validation rule rejects it, so the ingester sends it to quarantine with the list of violations and it never reaches Qdrant. The rest of the issues carry on, and the janitor keeps the state of each one.',
		show: [...base, 'webhook', 'documents', 'quarantine'], places: early, routes: [...baseRoutes, ...sourceRoutes, ['ingester', 'quarantine', 'quarantine']], islands: [laptop], bus: 'memory',
		badges: [{ text: 'ENG-140, title is empty', at: [790, 506], tone: 'warn' }],
		file: 'TitleIsPresent.java', fileNote: 'a validation rule',
		code: ['@Validate(value = LinearIssue.class, sourceId = "linear-issues")', 'public class TitleIsPresent implements Validator<LinearIssue> {', '  public boolean validate(LinearIssue issue) {', '    return !issue.title().isBlank();', '  }', '}'],
		added: [0, 2, 3],
	},
	{
		when: 'Month 3',
		title: 'Clean, then serve',
		focus: [880, 330, 960],
		event: 'Chunks of half-written drafts start to show up in answers.',
		answer: 'A first mounter cleans bronze into silver. What it cannot use goes to the same quarantine as the rejects of the ingester, or to a store of its own if the descriptor names another one. The knowledge base now reads silver and only embeds what it has not read yet.',
		show: layered, routes: layeredRoutes, islands: [laptop], bus: 'memory',
		file: 'assistant.spool.yaml', fileNote: '5 lines added',
		code: ['  - mounter:', '      id: cleaner', '      mode: TRANSFORMATION', '      uses: [quarantine]', '  - mounter:', '      id: knowledge-base', '      uses: [knowledge-base-progress]'],
		added: [0, 1, 2, 3, 6],
	},
	{
		when: 'Month 5',
		title: 'The whole company',
		focus: [656, 300, 1330],
		event: 'Every team now asks the assistant, and one ingester falls behind.',
		answer: 'A production profile in the same file moves the bus to Kafka. Capture, validation and mounting run on nodes of their own, and three replicas of the ingester split the stored envelopes between them.',
		show: scaled, routes: scaledRoutes, islands: nodes, bus: 'kafka',
		file: 'assistant.spool.yaml', fileNote: '4 lines added',
		code: ['profiles:', '  production:', '    infrastructure:', '      eventBus: {type: KAFKA}'],
		added: [0, 1, 2, 3],
	},
	{
		when: 'Month 6',
		title: 'Linear says wait',
		focus: [300, 330, 760],
		event: 'Linear answers 429 because the crawlers ask too often.',
		answer: 'The source has a circuit of its own. It stops polling until the time the Retry-After header gives, and the health of the node shows the open circuit and when it closes, so nobody has to dig through logs.',
		show: scaled, routes: scaledRoutes, islands: nodes, bus: 'kafka',
		badges: [{ text: '429, polling again in 60 s', at: [4, 200], tone: 'warn' }, { text: 'node health, UNHEALTHY until 10:42', at: [20, 560], tone: 'ink' }],
		file: 'GET /spool/health', fileNote: 'the capture node',
		code: ['linear-issues', '  source linear-issues  UNHEALTHY', '  circuit open until 10:42:00', '', 'linear-webhook', '  inbox                 HEALTHY'],
		added: [1, 2],
	},
	{
		when: 'Month 7',
		title: 'To production',
		focus: [656, 320, 1330],
		event: 'It is time to leave the laptop and run it for real.',
		answer: 'Provisioning reads the same descriptor and writes the Terraform for AWS, with every piece the profile names. What ran in your tests is what runs in the cloud, because the modules and their rules never changed.',
		show: scaled, routes: scaledRoutes, islands: nodes, bus: 'kafka', cloud: true,
		file: 'Provision.java', fileNote: 'provisioning',
		code: ['TerraformGenerator.fromFileSystem()', '    .generate(Path.of("assistant.spool.yaml"),', '              Optional.of("production"),', '              ProvisioningTarget.AWS)', '    .writeTo(Path.of("infrastructure"));'],
		added: [2, 3],
	},
	{
		when: 'Month 9',
		title: 'Another team',
		focus: [920, 380, 900],
		event: 'The product team wants a weekly report of the issues, not an assistant.',
		answer: 'They do not build a pipeline of their own. A node with a single mounter reads the same silver data every Monday and writes to their own data mart, and your pipeline does not notice.',
		show: [...scaled, 'reports', 'reportsMart'], routes: [...scaledRoutes, ['silver', 'reports'], ['reports', 'reportsMart']],
		islands: [...nodes, { id: 'reportsNode', box: [980, 392, 160, 150], label: 'node, product team' }], bus: 'kafka', cloud: true,
		file: 'reports.spool.yaml', fileNote: 'their own descriptor',
		code: ['modules:', '  - mounter:', '      id: weekly-report', '      mode: AGGREGATION', '      schedule: {cron: "0 7 * * MON", zone: Europe/Madrid}'],
		added: [0, 1, 2, 3, 4],
	},
];

export function placeOf(chapter: Chapter, id: string): Point {
	return chapter.places?.[id] ?? pieces[id].at;
}

export function routePath(from: Point, to: Point): string {
	const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
	if (Math.abs(dx) < 100) {
		const middle = Math.round(from[1] + dy / 2);
		return `M ${from[0]} ${from[1]} C ${from[0]} ${middle}, ${to[0]} ${middle}, ${to[0]} ${to[1]}`;
	}
	const middle = Math.round(from[0] + dx / 2);
	return `M ${from[0]} ${from[1]} C ${middle} ${from[1]}, ${middle} ${to[1]}, ${to[0]} ${to[1]}`;
}

export function chapterCamera(chapter: Chapter): [number, number, number] {
	const [x, y, width] = chapter.focus;
	return [act.x + x * act.scale, act.y + y * act.scale, act.visibleWidth / (width * act.scale)];
}

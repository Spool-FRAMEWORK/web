export type ChipStyle = 'plain' | 'ink' | 'blue' | 'tint' | 'text';
export type NoteIcon = 'refresh' | 'lock' | 'pulse';

export interface Chip {
	text: string;
	style: ChipStyle;
}

export interface Note {
	icon: NoteIcon;
	text: string;
	warning?: boolean;
}

export interface Rule {
	name: string;
	passed: boolean;
}

export interface TraceRow {
	module: string;
	operation: string;
	start: number;
	width: number;
}

type Point = [number, number];

export interface Stop {
	label: string;
	title: string;
	text: string;
	chips: Chip[];
	chipsAreSteps?: boolean;
	rules?: Rule[];
	note?: Note;
	trace?: TraceRow[];
	illustration: string;
	illustrationAt: Point;
	node: Point;
	labelBelow: boolean;
	camera: [number, number, number];
	recordDistance: number;
	traceDistance: number;
}

export const route = {
	worldWidth: 7400,
	worldHeight: 900,
	record: 'M 60 520 L 320 520 C 620 520, 620 330, 920 330 C 1210 330, 1210 560, 1500 560 C 1790 560, 1790 330, 2080 330 C 2380 330, 2380 560, 2680 560 C 2970 560, 2970 330, 3260 330 C 3550 330, 3550 560, 3840 560',
	trace: 'M 60 548 L 320 548 C 620 548, 620 358, 920 358 C 1210 358, 1210 588, 1500 588 C 1790 588, 1790 358, 2080 358 C 2380 358, 2380 588, 2680 588 C 2970 588, 2970 358, 3260 358 C 3550 358, 3550 588, 3840 588 C 4130 588, 4130 330, 4420 330 L 4680 330',
	quarantine: 'M 2080 330 C 2120 530, 2170 760, 2230 760',
	answer: 'M 3840 560 C 4130 560, 4130 760, 4390 760 C 4650 760, 4650 560, 4940 560',
	quarantineIllustrationAt: [2244, 690] as Point,
	quarantineNode: [2230, 760] as Point,
	quarantineStop: 3,
	traceVisibleFrom: 6,
	traceVisibleUntil: 7,
};

export const stops: Stop[] = [
	{
		label: '01  Linear',
		title: 'It starts in Linear.',
		text: 'Two crawlers poll the Linear API on a schedule, one for issues and one for documents. Scroll to follow one issue, stop by stop.',
		chips: [{ text: 'Linear API', style: 'plain' }],
		illustration: 'stop-0',
		illustrationAt: [200, 560],
		node: [320, 520],
		labelBelow: false,
		camera: [440, 610, 1],
		recordDistance: 260,
		traceDistance: 260,
	},
	{
		label: '02  crawler',
		title: 'The crawler captures the issue.',
		text: 'It wraps the issue in an envelope, keyed by a SHA-256 of its source and its content, and announces it on the event bus.',
		chips: [{ text: 'CAPTURED', style: 'ink' }],
		illustration: 'stop-1',
		illustrationAt: [800, 80],
		node: [920, 330],
		labelBelow: true,
		camera: [1040, 240, 1],
		recordDistance: 900,
		traceDistance: 900,
	},
	{
		label: '03  inbox',
		title: 'An unchanged issue is stored only once.',
		text: 'The inbox keeps one envelope per key. An issue that has not changed has the same key and is skipped, and an edited issue gets a new envelope.',
		chips: [
			{ text: 'same key', style: 'ink' },
			{ text: 'skipped', style: 'plain' },
		],
		chipsAreSteps: true,
		note: { icon: 'refresh', text: 'Every 5 seconds the janitor looks for envelopes that have waited more than 3 minutes and publishes them again.' },
		illustration: 'stop-2',
		illustrationAt: [1380, 600],
		node: [1500, 560],
		labelBelow: false,
		camera: [1620, 650, 1],
		recordDistance: 1540,
		traceDistance: 1540,
	},
	{
		label: '04  ingester',
		title: 'Your rules check every record.',
		text: 'Validation rules are plain Java classes that Spool finds at runtime. These three are examples written for this pipeline.',
		chips: [],
		rules: [
			{ name: 'HasTitle', passed: true },
			{ name: 'HasUrl', passed: true },
			{ name: 'KnownTeam', passed: false },
		],
		note: { icon: 'lock', text: 'A record that breaks a rule goes to quarantine with the list of violations, and its envelope stays in the inbox.', warning: true },
		illustration: 'stop-3',
		illustrationAt: [1960, 80],
		node: [2080, 330],
		labelBelow: true,
		camera: [2200, 460, 1],
		recordDistance: 2179,
		traceDistance: 2179,
	},
	{
		label: '05  data lake',
		title: 'Valid issues go to the data lake.',
		text: 'The ingester writes each valid record to a data lake partition of its own record class, and the envelope becomes persisted.',
		chips: [
			{ text: 'PERSISTED', style: 'blue' },
			{ text: 'eventType=LinearIssue', style: 'text' },
		],
		illustration: 'stop-4',
		illustrationAt: [2560, 600],
		node: [2680, 560],
		labelBelow: false,
		camera: [2800, 650, 1],
		recordDistance: 2836,
		traceDistance: 2836,
	},
	{
		label: '06  mounter',
		title: 'The mounter builds the knowledge base.',
		text: 'It reads the data lake partitions, splits each issue into chunks and asks an embedding model for the vector of every chunk.',
		chips: [
			{ text: 'PERSISTED', style: 'ink' },
			{ text: 'chunks', style: 'plain' },
			{ text: 'embeddings', style: 'plain' },
		],
		chipsAreSteps: true,
		illustration: 'stop-5',
		illustrationAt: [3140, 80],
		node: [3260, 330],
		labelBelow: true,
		camera: [3380, 240, 1],
		recordDistance: 3476,
		traceDistance: 3476,
	},
	{
		label: '07  data mart',
		title: 'The knowledge base is ready to search.',
		text: 'The chunks are stored in Qdrant, the gold layer of the data mart, with the source and the correlation identifier of the envelope they came from.',
		chips: [
			{ text: 'Qdrant', style: 'blue' },
			{ text: 'gold', style: 'plain' },
		],
		note: { icon: 'pulse', text: 'The watchdog receives a heartbeat from every module and reports the ones that are degraded.' },
		illustration: 'stop-6',
		illustrationAt: [3720, 600],
		node: [3840, 560],
		labelBelow: false,
		camera: [3960, 650, 1],
		recordDistance: 4115,
		traceDistance: 4115,
	},
	{
		label: '08  observability',
		title: 'Each record becomes one trace.',
		text: 'Every event goes through the event bus instrumented with OpenTelemetry, and the trace identifier comes from the correlation identifier, so the whole journey of the issue arrives as a single trace.',
		chips: [
			{ text: 'traces', style: 'blue' },
			{ text: 'metrics', style: 'tint' },
			{ text: 'logs', style: 'tint' },
		],
		trace: [
			{ module: 'crawler', operation: 'CAPTURED', start: 0, width: 16 },
			{ module: 'ingester', operation: 'validate', start: 14, width: 22 },
			{ module: 'ingester', operation: 'PERSISTED', start: 36, width: 14 },
			{ module: 'mounter', operation: 'chunks', start: 52, width: 40 },
		],
		illustration: 'stop-7',
		illustrationAt: [4300, 80],
		node: [4420, 330],
		labelBelow: true,
		camera: [4540, 240, 1],
		recordDistance: 4115,
		traceDistance: 4768,
	},
	{
		label: '09  assistant',
		title: 'The assistant answers with its sources.',
		text: 'Someone asks a question, and the assistant answers from the closest chunks in Qdrant. Every answer lists the issues it is based on, so anyone can check it.',
		chips: [
			{ text: 'answer', style: 'ink' },
			{ text: 'ENG-128', style: 'tint' },
		],
		chipsAreSteps: true,
		illustration: 'stop-8',
		illustrationAt: [4820, 600],
		node: [4940, 560],
		labelBelow: false,
		camera: [5060, 650, 1],
		recordDistance: 4115,
		traceDistance: 5028,
	},
];

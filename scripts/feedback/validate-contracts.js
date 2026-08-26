#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..', '..');
const typeSource = fs.readFileSync(path.join(root, 'src/types/feedback.ts'), 'utf8');
const openApi = yaml.load(fs.readFileSync(path.join(root, 'specs/070-user-feedback/contracts/openapi.yaml'), 'utf8'));
const githubCommands = fs.readFileSync(path.join(root, 'specs/070-user-feedback/contracts/github-commands.md'), 'utf8');
const webviewMessages = fs.readFileSync(path.join(root, 'specs/070-user-feedback/contracts/webview-messages.md'), 'utf8');
const panelSource = fs.readFileSync(path.join(root, 'src/webview/feedbackPanel.ts'), 'utf8');
const workerIndex = fs.readFileSync(path.join(root, 'workers/feedback/src/index.ts'), 'utf8');
const forbiddenFields = JSON.parse(fs.readFileSync(path.join(root, 'scripts/feedback/fixtures/forbidden-fields.json'), 'utf8'));

function sourceValues(constantName) {
	const pattern = new RegExp(`export const ${constantName} = \\[([\\s\\S]*?)\\] as const;`);
	const match = typeSource.match(pattern);
	if (!match) {
		throw new Error(`Missing ${constantName} in src/types/feedback.ts`);
	}
	return [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1]);
}

function assertSame(label, actual, expected) {
	const normalizedActual = [...actual].sort();
	const normalizedExpected = [...expected].sort();
	if (JSON.stringify(normalizedActual) !== JSON.stringify(normalizedExpected)) {
		throw new Error(`${label} drift: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
	}
}

if (openApi.openapi !== '3.1.0') {
	throw new Error('OpenAPI contract must use version 3.1.0');
}

assertSame('feedback kinds', sourceValues('FEEDBACK_KINDS'), openApi.components.schemas.FeedbackKind.enum);
assertSame('public statuses', sourceValues('FEEDBACK_PUBLIC_STATUSES'), openApi.components.schemas.PublicStatus.enum);
assertSame('decisions', sourceValues('FEEDBACK_DECISIONS'), openApi.components.schemas.Decision.enum);
assertSame(
	'resolutions',
	sourceValues('FEEDBACK_RESOLUTIONS'),
	openApi.components.schemas.Resolution.enum.filter(value => value !== null)
);

for (const command of ['public-reply', 'status', 'decision actionable', 'decision not-actionable', 'approve-public', 'reopen']) {
	if (!githubCommands.includes(`/feedback ${command}`)) {
		throw new Error(`Missing GitHub maintainer command: ${command}`);
	}
}

const requiredPaths = [
	'/api/v1/feedback',
	'/api/v1/feedback/{feedbackId}',
	'/api/v1/feedback/{feedbackId}/messages',
	'/api/v1/reporter',
	'/api/v1/session/exchange',
	'/api/v1/github/webhooks',
	'/admin/attachments/{attachmentId}',
];
for (const route of requiredPaths) {
	if (!openApi.paths[route]) {
		throw new Error(`Missing OpenAPI route: ${route}`);
	}
}

const createOperation = openApi.paths['/api/v1/feedback'].post;
if (JSON.stringify(createOperation.security) !== JSON.stringify([{ reporterSecret: [] }])) {
	throw new Error('Create feedback must accept only the bearer reporter secret');
}
const screenshotSchemas = createOperation.requestBody.content['multipart/form-data'].schema.properties.screenshot.oneOf;
assertSame(
	'feedback screenshot media types',
	(screenshotSchemas ?? []).map(schema => schema.contentMediaType),
	['image/png', 'image/jpeg'],
);
if (!screenshotSchemas?.every(schema => schema.type === 'string' && schema.contentEncoding === 'binary')) {
	throw new Error('Feedback screenshot media schemas must be binary strings');
}

for (const [route, sourceToken] of [
	['/api/v1/feedback', '/api/v1/feedback'],
	['/api/v1/reporter', '/api/v1/reporter'],
	['/api/v1/session/exchange', '/api/v1/session/exchange'],
	['/api/v1/github/webhooks', '/api/v1/github/webhooks'],
	['/admin/attachments/{attachmentId}', 'admin\\/attachments'],
]) {
	if (!workerIndex.includes(sourceToken)) throw new Error(`Worker router drift: ${route}`);
}

const createSchema = openApi.components.schemas.CreateFeedbackInput;
const diagnosticsSchema = openApi.components.schemas.Diagnostics;
if (createSchema.additionalProperties !== false || diagnosticsSchema.additionalProperties !== false) {
	throw new Error('CreateFeedbackInput and Diagnostics must reject additional properties');
}
for (const field of forbiddenFields.diagnostics) {
	if (field in diagnosticsSchema.properties || field in createSchema.properties) {
		throw new Error(`Forbidden feedback field entered the API contract: ${field}`);
	}
}
for (const field of forbiddenFields.screenshot) {
	if (field !== 'path' && !typeSource.includes(`${field}?: never`) && webviewMessages.includes(`${field}:`)) {
		throw new Error(`Screenshot metadata boundary drift: ${field}`);
	}
}

for (const command of [
	'feedback:ready', 'feedback:preview', 'feedback:submit', 'feedback:list', 'feedback:detail',
	'feedback:messages', 'feedback:addMessage', 'feedback:deleteOne', 'feedback:deleteAll', 'feedback:copyRecovery', 'feedback:openPolicy',
]) {
	if (!webviewMessages.includes(`\`${command}\``)) throw new Error(`Webview documentation drift: ${command}`);
	if (!panelSource.includes(`'${command}'`)) throw new Error(`Webview implementation drift: ${command}`);
}
for (const legacyName of ['feedback:copyRecoveryLink', 'feedback:submitResult', 'feedback:busy']) {
	if (webviewMessages.includes(`\`${legacyName}\``)) throw new Error(`Legacy Webview message remains documented: ${legacyName}`);
}
if (webviewMessages.includes('{ type') || !webviewMessages.includes('{ command')) {
	throw new Error('Webview message contract must use the command discriminator');
}

console.log(`Feedback contracts valid: ${requiredPaths.length} routes, ${sourceValues('FEEDBACK_KINDS').length} kinds.`);

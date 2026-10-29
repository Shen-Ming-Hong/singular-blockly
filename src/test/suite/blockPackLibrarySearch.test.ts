/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import {
	getBlockPackLibraryHeaders,
	isValidLibraryName,
	isValidLibraryQuery,
	searchBlockPackLibraries,
} from '../../services/blockPackLibrarySearch';

function registryItem(owner: string, name: string, version: string, description = ''): unknown {
	return { name, owner: { username: owner }, version: { name: version }, description };
}

suite('Block pack library search', () => {
	test('searches ESP32 Arduino libraries by popularity and drops user filter syntax', async () => {
		const urls: string[] = [];
		await searchBlockPackLibraries('DHT platform:atmelavr  sensor', async url => {
			urls.push(url);
			return { items: [] };
		});
		assert.strictEqual(urls.length, 1);
		const url = new URL(urls[0]);
		assert.strictEqual(url.origin + url.pathname, 'https://api.registry.platformio.org/v3/search');
		assert.strictEqual(url.searchParams.get('query'), 'DHT sensor type:library platform:espressif32 framework:arduino');
		assert.strictEqual(url.searchParams.get('sort'), 'popularity');
	});

	test('returns only well-formed libraries as owner/name@^version, at most ten', async () => {
		const items = [
			registryItem('adafruit', 'DHT sensor library', '1.4.7', 'Arduino library for DHT11, DHT22'),
			registryItem('bad owner', 'X', '1.0.0'),
			registryItem('someone', 'https://evil.example', '1.0.0'),
			registryItem('someone', 'Lib', 'latest'),
			{ name: 'NoOwner', version: { name: '1.0.0' } },
			'not an object',
			registryItem('long', 'Desc', '2.0.0', 'x'.repeat(500)),
			...Array.from({ length: 12 }, (_, index) => registryItem('many', `Lib${index}`, '1.0.0')),
		];
		const results = await searchBlockPackLibraries('dht', async () => ({ items }));
		assert.strictEqual(results.length, 10);
		assert.deepStrictEqual(results[0], {
			owner: 'adafruit',
			name: 'DHT sensor library',
			version: '1.4.7',
			description: 'Arduino library for DHT11, DHT22',
			libDep: 'adafruit/DHT sensor library@^1.4.7',
		});
		assert.strictEqual(results[1].description.length, 300);
		assert.ok(results.every(item => !/[:/]{2}/.test(item.name)));
		assert.deepStrictEqual(await searchBlockPackLibraries('dht', async () => ({ unexpected: true })), []);
	});

	test('reads header files for a library and keeps only valid include names', async () => {
		const urls: string[] = [];
		const headers = await getBlockPackLibraryHeaders('adafruit', 'DHT sensor library', async url => {
			urls.push(url);
			return { headers: ['DHT.h', 'DHT_U.h', '../etc/passwd', 42, 'a.h', 'b.h', 'c.h', 'd.h'] };
		});
		assert.strictEqual(urls[0], 'https://api.registry.platformio.org/v3/packages/adafruit/library/DHT%20sensor%20library');
		assert.deepStrictEqual(headers, ['DHT.h', 'DHT_U.h', 'a.h', 'b.h', 'c.h']);
	});

	test('validates queries and library names from the WebView', () => {
		assert.strictEqual(isValidLibraryQuery('Servo'), true);
		assert.strictEqual(isValidLibraryQuery('   '), false);
		assert.strictEqual(isValidLibraryQuery('x'.repeat(81)), false);
		assert.strictEqual(isValidLibraryQuery(5), false);
		assert.strictEqual(isValidLibraryName('adafruit', 'DHT sensor library'), true);
		assert.strictEqual(isValidLibraryName('adafruit/x', 'DHT'), false);
		assert.strictEqual(isValidLibraryName('adafruit', '../DHT'), false);
	});
});

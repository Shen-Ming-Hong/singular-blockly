/**
 * ES2023 語法驗證測試
 * 
 * 目的: 驗證 ESLint ecmaVersion: 2023 設定正確
 * 涵蓋 ES2023 新增方法: toSorted, findLast, toReversed, with, findLastIndex
 */

import * as assert from 'assert';

suite('ES2023 Syntax Validation', () => {
    test('toSorted() method should work', () => {
        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
        assert.deepStrictEqual(sorted, [1, 2, 3]);
        assert.deepStrictEqual(arr, [3, 1, 2]); // Original unchanged
    });

    test('findLast() method should work', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = arr.findLast((x: number) => x > 2);
        assert.strictEqual(result, 5);
    });

    test('toReversed() method should work', () => {
        const arr = [1, 2, 3];
        const reversed = arr.toReversed();
        assert.deepStrictEqual(reversed, [3, 2, 1]);
        assert.deepStrictEqual(arr, [1, 2, 3]); // Original unchanged
    });

    test('with() method should work', () => {
        const arr = ['a', 'b', 'c'];
        const modified = arr.with(1, 'x');
        assert.deepStrictEqual(modified, ['a', 'x', 'c']);
        assert.deepStrictEqual(arr, ['a', 'b', 'c']); // Original unchanged
    });

    test('findLastIndex() method should work', () => {
        const arr = [1, 2, 3, 4, 5];
        const index = arr.findLastIndex((x: number) => x > 2);
        assert.strictEqual(index, 4);
    });
});

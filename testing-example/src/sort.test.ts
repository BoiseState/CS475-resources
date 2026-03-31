import { test, expect } from '@jest/globals';
import fc from 'fast-check';
import { bubbleSort } from './sort.js';

test('should sort numeric elements from the smallest to the largest one', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (data) => {
      const sortedData = bubbleSort(data);
      for (let i = 1; i < data.length; ++i) {
        expect(sortedData[i - 1]).toBeLessThanOrEqual(sortedData[i]!);
      }
    }),
  );
});

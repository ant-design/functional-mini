import { expect, test } from 'vitest';
import { useEffect, useContext, createElement } from '../src/r';

test('rest r', () => {
  expect(useEffect).toBeDefined();
  expect(useContext).toBeDefined();
  expect(createElement).toBeDefined();
});

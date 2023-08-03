import { expect, test } from 'vitest';
import { React } from '../src/r';

test('React', () => {
  const { useEffect, useContext, createElement } = React;
  expect(React).toBeDefined();
  expect(useEffect).toBeDefined();
  expect(useContext).toBeDefined();
  expect(createElement).toBeDefined();
});

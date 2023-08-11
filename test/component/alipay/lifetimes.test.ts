import { expect, it } from 'vitest';
import { alipayComponent, useAttached, useMoved } from '../../../src/component';

it('test lifetimes option', () => {
  const option = alipayComponent(() => {
    useAttached(() => {
      console.log('attached2');
    }, []);

    useMoved(() => {
      console.log('moved');
    }, []);

    return {};
  });

  expect(option.options).toEqual({ lifetimes: true });
  expect(Object.keys(option.lifetimes)).toEqual(['attached', 'moved']);
});

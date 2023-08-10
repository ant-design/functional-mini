import { expect, it } from 'vitest';
import {
  alipayComponent,
  useAttached,
  useCreated,
  useMoved,
} from '../../../src/component';

it('test lifetimes option', () => {
  const option = alipayComponent(() => {
    useCreated(() => {
      console.log('created');
    }, []);

    useAttached(() => {
      console.log('attached2');
    }, []);

    useMoved(() => {
      console.log('moved');
    }, []);

    return {};
  });

  expect(option.options).toEqual({ lifetimes: true });
  expect(Object.keys(option.lifetimes)).toEqual([
    'created',
    'attached',
    'moved',
  ]);
});

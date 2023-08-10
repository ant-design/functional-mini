import { expect, it } from 'vitest';
import {
  useAttached,
  useCreated,
  wechatComponent,
  useEffect,
  useMoved,
} from '../../../src/component.js';

it('test lifetimes option', () => {
  const option = wechatComponent(() => {
    useEffect(() => {
      console.log('init');
      return () => {
        console.log('unmount');
      };
    }, []);
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

  expect(Object.keys(option.lifetimes)).toEqual([
    'created',
    'detached',
    'attached',
    'moved',
  ]);
});

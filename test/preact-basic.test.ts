import { expect, test, vi } from 'vitest';
import { delay } from './utils';
import {
  useEffect,
  useState,
  useLayoutEffect,
  act,
  mountElement,
  serverRender,
  createElement,
  VNode,
} from '../src/r';

const h = createElement;

test('act 里的方法都是同步执行完成的', async () => {
  const onceEffect = vi.fn();
  const syncRegisterFn = vi.fn();

  const C = function (p) {
    // 此处 ts 能自动推导出来 s 的类型
    const [s] = useState('init');

    useEffect(() => {
      onceEffect();
    }, []);

    syncRegisterFn();
    return h('div', {}, s);
  };

  act(() => {
    const element = h(C, { foo: 'propsValue' });
    mountElement(element);
  });
  expect(onceEffect).toHaveBeenCalledTimes(1);
  expect(syncRegisterFn).toHaveBeenCalledTimes(1);
});

test('不用 act 就是异步', async () => {
  const onceEffect = vi.fn();
  const syncRegisterFn = vi.fn();

  const C = function (p) {
    const [s] = useState('init');

    useEffect(() => {
      onceEffect();
    }, []);

    syncRegisterFn();
    return h('div', {}, s);
  };

  const element = h(C, { foo: 'propsValue' });
  mountElement(element);

  expect(syncRegisterFn).toHaveBeenCalledTimes(1);
  expect(onceEffect).toHaveBeenCalledTimes(0);
  await delay(10);
  expect(onceEffect).toHaveBeenCalledTimes(1);
});

test('mount 之后触发的事件', async () => {
  const logs: string[] = [];

  const onceEffect = vi.fn().mockImplementation(() => {
    console.log('onceEffect is calling');
  });
  const effectFn = vi.fn();
  const offFn = vi.fn();
  const syncRegisterFn = vi.fn();
  const delayTriggerEffect = 5;
  const C = function (p) {
    const [s, setS] = useState('init');

    useEffect(() => {
      onceEffect();
      logs.push('b');
      setS('d');

      setTimeout(() => {
        logs.push('e');
        setS('effect');
        effectFn.call(undefined);
        logs.push('c');
      }, delayTriggerEffect);

      return offFn;
    }, []);

    syncRegisterFn();

    useLayoutEffect(() => {
      logs.push('d');
    }, []);
    logs.push(`render-${s}`);
    return h('div', {}, s);
  };

  let unmount;
  act(() => {
    const element = h(C, { foo: 'propsValue' });
    unmount = mountElement(element).unmount;
    logs.push('after act');
  });
  // act 里的操作都是同步的 之后同步注册上
  expect(onceEffect).toHaveBeenCalledTimes(1);
  expect(syncRegisterFn).toHaveBeenCalledTimes(2);

  await delay(delayTriggerEffect + 5);
  expect(onceEffect).toHaveBeenCalledTimes(1);
  expect(effectFn).toHaveBeenCalledTimes(1);
  expect(offFn).toHaveBeenCalledTimes(0);

  expect(logs).toEqual([
    'render-init',
    'd',
    'after act',
    'b',
    'render-d',
    'e',
    'c',
    'render-effect',
  ]);

  unmount();
  await delay(30);
  expect(offFn).toHaveBeenCalledTimes(1);
});

test('server render', async () => {
  const C = function (p) {
    useEffect(() => {
      throw new Error('should not fire this effect');
    });
    return h('div', {}, p?.text);
  };
  const instance = h(C, { text: 'value' }) as VNode;
  const data = serverRender(instance);
  expect(data).toMatchInlineSnapshot('"<div>value</div>"');
});

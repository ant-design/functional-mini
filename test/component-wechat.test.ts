/* eslint-disable no-prototype-builtins */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  alipayComponent,
  useComponent,
  useEvent,
  wechatComponent,
  useAttached,
} from '../src/component';
import { useEffect } from '../src/r';
import { mountWechatComponent, setupWechatEnv } from './utils/common';
import { delay } from './utils/utils';

describe('component - wechat', async () => {
  let off: () => void;
  beforeEach(() => {
    off = setupWechatEnv();
  });

  afterEach(() => {
    off();
  });

  test('basic opt', async () => {
    const C = function () {
      return { foo: 'long-content' };
    };
    const opt = wechatComponent(C, {
      ss: 'ssabc',
      value: 1234,
      bbb: true,
      aaa: ['1', 2, true],
      oo: {},
    });
    const optStr = JSON.stringify(
      opt,
      (key, value) => {
        if (typeof value === 'function') {
          return `[function ${value.name}]`;
        } else {
          return value;
        }
      },
      2,
    );
    expect(optStr).toMatchSnapshot();
  });

  test('invalid props type', async () => {
    const C = function () {
      return { foo: 'long-content' };
    };
    expect(() => {
      wechatComponent(C, {
        ff: () => {},
      });
    }).toThrow(/类型/);
  });

  test('init props 更新是有顺序的', async () => {
    const logProps = vi.fn();
    const C = function (props) {
      logProps(props);
      return { counterX2: props.counter * 2 };
    };
    const opt = wechatComponent(C, { counter: 10 });
    // 初始化 SSR 的数据
    expect(logProps).toBeCalledTimes(1);
    expect(opt.data).toEqual({ counterX2: 20 });

    // 加载之后，先用 initProps，再用真的初始化数据
    const instance = mountWechatComponent(opt, { counter: 100 });
    expect(instance.data).toEqual({ counterX2: 200, counter: 100 });
    expect(logProps).toBeCalledTimes(2);
    expect(logProps.mock.calls[1][0]).toEqual({ counter: 100 });
  });

  test('update props', async () => {
    const C = function (props) {
      return { data: 'aaa' };
    };
    const instance = mountWechatComponent(wechatComponent(C, { foo: 'bar' }));
    expect(instance.data).toEqual({ data: 'aaa', foo: 'bar' });

    instance.updateProps({ foo: 'bar2' });
    expect(instance.data).toEqual({ data: 'aaa', foo: 'bar2' });

    instance.updateProps({ data: 'cccc' }); // 其实不会生效
    expect(instance.data).toEqual({ data: 'aaa', foo: 'bar2' });

    instance.updateProps({ foo: 234 });
    expect(instance.data).toEqual({ data: 'aaa', foo: '' });
  });

  test('lifetimes', async () => {
    const createFn = vi.fn();
    const useAttachedFn = vi.fn();
    const C = function (props) {
      useEffect(createFn, []);
      useAttached(useAttachedFn, []);
      return {};
    };

    const instance = mountWechatComponent(wechatComponent(C, {}));
    expect(createFn).toBeCalledTimes(1);
    expect(useAttachedFn).toBeCalledTimes(1);

    const paramError = new Error('sample_error');
    instance.callLifecycle('error', paramError);
    await delay(5);
  });

  test('event trigger', async () => {
    const onEvt = vi.fn();
    const payload = { a: 1 };
    const evtOpt = { opt: 'aaaa' };
    const C = function (props) {
      const component = useComponent();
      useEvent(
        'clickSomething',
        () => {
          component.triggerEvent('clickSomething', payload, evtOpt);
        },
        [component],
      );

      return {};
    };
    const instance = mountWechatComponent(wechatComponent(C, {}), {}, onEvt);
    await delay(5);
    instance.callMethod('clickSomething');
    expect(onEvt).toBeCalledTimes(1);
    expect(onEvt.mock.calls[0]).toEqual(['clickSomething', payload, evtOpt]);
  });

  test('event trigger', async () => {
    const option = wechatComponent(
      () => {
        return {};
      },
      {
        value: null,
      },
    );
    expect(option.properties.value).toMatchInlineSnapshot(
      `
      {
        "type": null,
        "value": null,
      }
    `,
    );
  });

  test('test component option', async () => {
    const option = wechatComponent(
      () => {
        return {};
      },
      {},
      {
        options: {
          styleIsolation: 'shared',
        },
      },
    );
    expect(option.options).toMatchInlineSnapshot(`
      {
        "styleIsolation": "shared",
      }
    `);

    const alipayOption = alipayComponent(
      () => {
        return {};
      },
      {},
      {
        options: {
          styleIsolation: 'shared',
        },
      },
    );
    expect(alipayOption.options).toMatchInlineSnapshot(`
      {
        "lifetimes": true,
        "styleIsolation": "shared",
      }
    `);
  });
});

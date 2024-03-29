/* eslint-disable no-prototype-builtins */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  alipayComponent,
  useDidMount,
  useEvent,
  usePageShow,
  useReady,
} from '../src/component';
import { useEffect, useState } from '../src/r';
import { EComponent2Status, updateComponent2Status } from '../src/utils';
import { mountAlipayComponent, setupAlipayEnv } from './utils/common';
import { delay } from './utils/utils';
import { IAlipayInstance } from './utils/test-instance';

interface IComponentState {
  stateFoo: string;
  onShowData: boolean;
  stateEffect: string;
  pData: any;
}

interface IComponentProps {
  query: string;
  defaultFoo?: number;
}

describe('component - common and alipay', () => {
  let off: () => void;
  beforeEach(() => {
    off = setupAlipayEnv();
  });

  afterEach(() => {
    off();
  });

  test('functional component', async () => {
    const initFn = vi.fn();
    const unmountFn = vi.fn();
    const defaultProps = { defaultFoo: 123, query: 'aaa' };
    const functionOpt = alipayComponent<IComponentProps>(function (props) {
      useEffect(() => {
        initFn();
        return unmountFn;
      }, []);

      return {
        pData: props,
      };
    }, defaultProps);

    expect(functionOpt.onInit).toBeTruthy();
    expect(functionOpt.didMount).toBeFalsy();
    expect(functionOpt.didUnmount).toBeTruthy();
    expect(functionOpt.props.query).toEqual('aaa');
    expect(functionOpt.props.defaultFoo).toEqual(123);
    expect(functionOpt.data.pData).toEqual(defaultProps);

    // 开始挂载
    expect(initFn).toHaveBeenCalledTimes(0);
    mountAlipayComponent(functionOpt);
    await delay(10);
    expect(initFn).toHaveBeenCalledTimes(1);

    mountAlipayComponent(functionOpt);
    await delay(10);
    expect(initFn).toHaveBeenCalledTimes(2);
  });

  test('init props 更新是有顺序的', async () => {
    const logProps = vi.fn();
    const C = function (props) {
      logProps(props);
      return { counterX2: props.counter * 2 };
    };
    const opt = alipayComponent(C, { counter: 10 });
    // 初始化 SSR 的数据
    expect(logProps).toBeCalledTimes(1);
    expect(opt.data).toEqual({ counterX2: 20 });

    // 加载之后，先用 initProps，再用真的初始化数据
    const instance = mountAlipayComponent(opt, { counter: 100 });
    expect(instance.data).toEqual({ counterX2: 200 });
    expect(logProps).toBeCalledTimes(2);
    expect(logProps.mock.calls[1][0]).toEqual({ counter: 100 });
  });

  test('不允许注册小程序同名 hooks', async () => {
    expect(() => {
      alipayComponent(function (props) {
        useEvent('didUpdate', () => {}, []);
        return {};
      }, {});
    }).toThrow(/useDidUpdate/);
  });

  test('props 和 setData 的 key 不能相同', async () => {
    const keyName = 'keyName';
    const C = function (props) {
      console.log('render C', props);
      return {
        [keyName]: 'foo',
      };
    };

    const opt1 = alipayComponent(C, 'test-child');
    const appxComponentC = mountAlipayComponent(opt1);

    // 不要乱裹 .act ，尤其是里面抛错的场景，preact/test-utils 的 actDepth 计算会有问题
    // 等这个 PR 发掉就好了：https://github.com/preactjs/preact/pull/4051/files
    // act(() => {
    expect(() => {
      appxComponentC.updateProps({ [keyName]: 'bar' });
    }).toThrow();
    // });
  });

  test('返回了非对象', async () => {
    expect(() => {
      alipayComponent<IComponentProps>(function (props) {
        return 0 as any;
      });
    }).toThrowError(/类型/);
  });

  test('一个组件在 derive 的时候抛错，不要影响其他组件', async () => {
    const C1 = function (props) {
      useEffect(() => {
        if (props?.shouldThrow) {
          throw new Error('this_is_an_error');
        }
      }, [props?.shouldThrow]);
      return {
        foo: 'bar',
        p: props,
      };
    };

    const C2 = function (props) {
      return {
        p: props,
      };
    };

    const opt1 = alipayComponent(C1, 'test-c1');
    const opt2 = alipayComponent(C2, 'test-c2');
    const appxComponentC1 = mountAlipayComponent(opt1);
    const appxComponentC2 = mountAlipayComponent(opt2);

    try {
      appxComponentC1.updateProps({ shouldThrow: true });
    } catch (e) {
      /* empty */
    }
    appxComponentC2.updateProps({ data: 'aaa' });
    expect(appxComponentC1.data).toEqual({
      foo: 'bar',
      p: { shouldThrow: true },
    });
    expect(appxComponentC2.data).toEqual({ p: { data: 'aaa' } });
  });

  test('检查 component2 的环境', async () => {
    alipayComponent(function (props) {
      return {};
    });

    updateComponent2Status(EComponent2Status.INVALID);
    expect(() => {
      alipayComponent(function (props) {
        return {};
      });
    }).toThrow(/component2/);

    updateComponent2Status(EComponent2Status.VALID);
    alipayComponent(function (props) {
      return {};
    });
  });

  test('同一个组件随着页面增删重复挂载，$id 不变，但 $page.$viewId 会变', async () => {
    const initStateValue = 'initValue';
    const valueAfterEffect = 'valueAfterEffect';

    const initFn = vi.fn();
    const tapFn = vi.fn();
    const unloadFn = vi.fn();
    const unloadFn2 = vi.fn();

    const functionOpt = alipayComponent<IComponentProps>(function (props) {
      const [stateEffect, setStateEffect] = useState(initStateValue);

      useEffect(() => {
        initFn();
      }, []);

      useEvent(
        'tapItem',
        (q) => {
          tapFn(q);
          return unloadFn2;
        },
        [],
      );

      useEffect(() => {
        setStateEffect(valueAfterEffect);

        return unloadFn;
      }, []);

      return {
        pData: props,
        stateEffect,
        stateFoo: 'componentStateValue',
      };
    });

    expect(functionOpt.onInit).toBeTruthy();
    expect(functionOpt.didMount).toBeFalsy();
    expect(functionOpt.didUnmount).toBeTruthy();
    expect(functionOpt.tapItem).toBeFalsy(); // 事件要放在 methdos 里面
    expect(functionOpt.methods?.tapItem).toBeTruthy();

    // 开始挂载
    const instance = mountAlipayComponent(functionOpt);
    await delay(10);
    expect(instance.data.stateEffect).toEqual(valueAfterEffect);
    expect(instance.data.pData).toEqual(instance.props);

    const tapParam = { foo: 'doing here' };
    instance.callMethod('tapItem', tapParam);
    await delay(10);

    expect(tapFn).toBeCalledTimes(1);
    expect(tapFn.mock.calls[0][0]).toEqual(tapParam);

    instance.unmount();
    await delay(10);
    expect(unloadFn).toBeCalledTimes(1);
    expect(unloadFn2).toBeCalledTimes(1);
  });

  test('组件内部调用 props 方法', async () => {
    const functionOpt = alipayComponent<{ onChange: (number) => void }>(
      function (props) {
        useEffect(() => {
          setTimeout(() => {
            props.onChange(123);
          }, 2);
        }, [props]);

        return {
          p: props,
        };
      },
    );
    const onChangeFn = vi.fn();

    mountAlipayComponent(functionOpt, { onChange: onChangeFn });
    await delay(10);
    expect(onChangeFn).toBeCalledTimes(1);
    expect(onChangeFn.mock.calls[0][0]).toEqual(123);
  });

  // 还没跑过
  test('conitnous call event sync', async () => {
    const opt = alipayComponent<IComponentProps>(function (props) {
      const [counter, setCounter] = useState(0);
      useEvent(
        'onTap',
        () => {
          setCounter((c) => {
            // 不能写同步的，否则会触发不及时
            return c + 1;
          });
        },
        [counter],
      );

      return { counter };
    });

    const instance = mountAlipayComponent(opt);
    expect(instance.data.counter).toEqual(0);

    instance.callMethod('onTap');
    await delay(10);
    expect(instance.data.counter).toEqual(1);

    const loopMax = 10;
    let i = 0;
    while (i++ < loopMax) {
      instance.callMethod('onTap');
    }
    expect(instance.data.counter).toEqual(1);
    await delay(10);
    expect(instance.data.counter).toEqual(1 + loopMax);
  });

  test(
    'heavy update',
    async () => {
      const initStateValue = 'initValue';

      const opt = alipayComponent<IComponentProps>(function (props) {
        const [stateEffect, setStateEffect] = useState(initStateValue);
        const [stateFoo2, setFoo2] = useState('componentStateValue2');

        useEvent(
          'tapItem',
          (q) => {
            setStateEffect(q);
          },
          [],
        );

        useEffect(() => {
          setFoo2(`foo2=${stateEffect}`);
        }, [stateEffect]);

        return {
          p: props,
          stateEffect,
          stateFoo2,
        };
      });

      expect(opt.onInit).toBeTruthy();
      expect(opt.didMount).toBeFalsy();
      expect(opt.didUnmount).toBeTruthy();
      expect(opt.methods?.tapItem).toBeTruthy();

      const setDataLog: Array<Partial<IComponentState>> = [];

      // 模拟触发 onInit
      let counter = 0;
      while (counter-- >= 0) {
        const mockInstance = {
          $id: `component-${counter}`,
          setData() {
            // heavy op
            const startTs = Date.now();
            while (Date.now() - startTs <= 3) {
              /* empty */
            }

            setDataLog.push(arguments[0]);
          },
          props: { propsKey: 'mockProps' },
        };
        opt.onInit.call(mockInstance);
        opt.deriveDataFromProps.call(mockInstance, {
          propsKey: 'mockProps',
          index: counter,
        });
        opt.methods?.tapItem.call(mockInstance, 'tapItem');
        await delay(10);
      }

      expect(setDataLog.length).toBeLessThanOrEqual(5);
    },
    20 * 1000,
  );

  test('test set data order', async () => {
    const res: string[] = [];
    const opt = alipayComponent<IComponentProps>(function (props) {
      const [state, setState] = useState(false);
      useEvent(
        'toggle',
        () => {
          setState((s) => !s);
        },
        [],
      );
      res.push(`render-${state}`);
      useEffect(() => {
        res.push(`effect-${state}`);
      }, [state]);

      return {
        state,
      };
    });
    const appxComponentC = mountAlipayComponent(opt, {}, (data) => {
      res.push(`setData-callback-${data.state}`);
    });
    await delay(20);
    appxComponentC.callMethod('toggle');
    res.push(`will-trigger-toggle`);
    await delay(20);
    //
    expect(res).toMatchInlineSnapshot(`
      [
        "render-false",
        "render-false",
        "setData-callback-false",
        "effect-false",
        "will-trigger-toggle",
        "render-true",
        "setData-callback-true",
        "effect-true",
      ]
    `);
  });

  test('multiple component instance', async () => {
    const fn = vi.fn();
    const fnOff = vi.fn();
    const mountFn = vi.fn();
    const unloadFn = vi.fn();

    const opt = alipayComponent<IComponentProps>(function (props) {
      useEffect(() => {
        mountFn();
        return fnOff;
      });

      useEvent(
        'tapItem',
        () => {
          console.log('h1');
          fn();
          return unloadFn;
        },
        [],
      );
      return {};
    });
    expect(mountFn).toBeCalledTimes(0);
    expect(fnOff).toBeCalledTimes(0);

    // 初始化两个组件
    const mockInstanceA = {
      $id: 'component-A',
      setData() {},
    };
    opt.onInit.call(mockInstanceA);
    expect(mountFn).toBeCalledTimes(1); // 实例化一次
    expect(fnOff).toBeCalledTimes(0);

    const mockInstanceB = {
      $id: 'component-B',
      setData() {},
    };
    opt.onInit.call(mockInstanceB);
    expect(fnOff).toBeCalledTimes(0);

    // 两个组件都初始化了
    expect(mountFn).toBeCalledTimes(2); // 实例化两次

    // 点击事件不能串
    opt.methods?.tapItem.call(mockInstanceA);
    expect(fn).toBeCalledTimes(1);

    // 陆续卸载
    opt.didUnmount.call(mockInstanceA);
    opt.didUnmount.call(mockInstanceB);
  });

  test('derive props 和 setData 不要死循环', async () => {
    let renderCounter = 0;
    const delaySetMs = 10;
    const C = function (props) {
      ++renderCounter;
      const [name, setName] = useState('init');
      useEffect(() => {
        setTimeout(() => {
          setName(`${Math.random()}`);
        }, delaySetMs);
      }, []);

      return {
        foo: Math.random(), // 这个会导致 setData，不判断 props 的话就进入死循环
        queryData: props.query,
        name,
      };
    };
    const opt1 = alipayComponent(C, 'test-child');
    expect(renderCounter).toEqual(1);

    const appxComponentC = mountAlipayComponent(opt1);
    expect(renderCounter).toEqual(2);

    await delay(delaySetMs + 20);
    expect(renderCounter).toEqual(3);

    expect(appxComponentC.data?.queryData).toBeUndefined();
    const queryValue = 'queryValue';
    appxComponentC.updateProps({ query: queryValue });
    expect(renderCounter).toEqual(4);
    expect(appxComponentC.data?.queryData).toEqual(queryValue);
  });

  test('父子组件 derive props', async () => {
    // 内部组件
    const C = function (props) {
      const [name, setName] = useState('init');
      useEffect(() => {
        setName(props.query || 'empty');
      }, [props.query]);
      return { name };
    };
    const opt1 = alipayComponent(C, 'test-child');
    const appxComponentC = mountAlipayComponent(opt1);
    expect(appxComponentC.data?.name).toEqual('empty'); // 第一次 useEffect

    // 父页面
    const Parent = function () {
      const [parentState, setParentState] = useState('parent-init');
      useEvent(
        'userSet',
        (q) => {
          setParentState(q);
        },
        [],
      );

      return { parentState };
    };

    const opt2 = alipayComponent(Parent);
    expect(appxComponentC.data?.name).toEqual('empty');

    const parentComponent = mountAlipayComponent(opt2, {}, (q) => {
      // 同步到子组件
      appxComponentC.updateProps({ query: q.parentState });
    });
    // 挂载父组件，并且立即触发一个方法
    expect(parentComponent.data.parentState).toEqual('parent-init');
    opt2.methods?.userSet.call(parentComponent, 'something2');

    await delay(10);
    expect(parentComponent.data.parentState).toEqual('something2');
    expect(appxComponentC.data?.name).toEqual('something2');
  });

  test('在一个组件 useEffect 的时候去新建另一个', async () => {
    const NewElement = () => {
      const [logs, setLogs] = useState(['init']);
      useDidMount(() => {
        setLogs([...logs, 'useDidMount']);
      }, []);
      return { logs };
    };
    const newElementOpt = alipayComponent(NewElement);

    // 动态新建了一个组件，实际生产中可能是通过 setData 触发的
    const mountNewElement = async () => {
      const instance = mountAlipayComponent(newElementOpt);

      await newElementOpt.didMount.call(instance);
      await delay(10);
      expect(instance.data?.logs).toEqual(['init', 'useDidMount']);
    };

    const Element = () => {
      useEvent(
        'addComponent',
        () => {
          mountNewElement();
        },
        [],
      );
      return {};
    };

    const opt = alipayComponent(Element);
    const appxInstance = mountAlipayComponent(opt);

    await opt.methods?.addComponent.call(appxInstance, '');
    await delay(10);
  });

  test('remove some keys', async () => {
    const liteData = {
      keyA: 'aaa',
    };
    const fullData = Object.assign({}, liteData, {
      keyB: 'bbb',
    });
    const C = function (props: { removeFlag: boolean }) {
      if (props?.removeFlag) {
        return liteData;
      } else {
        return fullData;
      }
    };
    const opt = alipayComponent(C);
    const instance = mountAlipayComponent(opt);
    expect(instance.data).toEqual(fullData);
    instance.updateProps({ removeFlag: true });
    await delay(10);
    expect(instance.data).toEqual({ ...liteData, keyB: null });
  });

  test('danger zone: bypass function call', async () => {
    const C = function () {
      return { foo: 'long-content' };
    };
    const opt = alipayComponent(C);
    const instance = mountAlipayComponent(opt);
    const dangerData = {
      dangerData: '12345',
    };
    instance.updateProps({
      DANGER_ZONE_BYPASS_FUNCTION_CALL_WITH_DATA: dangerData,
    });
    expect(instance.data).toEqual({ ...dangerData, foo: null });
  });

  test('忽略掉不受控的 data', async () => {
    const C = function () {
      const [count, setCount] = useState(0);
      useEvent(
        'add',
        () => {
          setCount(count + 1);
        },
        [count],
      );
      return { foo: 'long-content' + String(count) };
    };
    const opt = alipayComponent(C);
    opt.data.bar = 'bar';
    const instance = mountAlipayComponent(opt);
    expect(instance.data).toEqual({ foo: 'long-content0', bar: 'bar' });
    instance.callMethod('add');
    await delay(10);
    expect(instance.data).toEqual({ foo: 'long-content1', bar: 'bar' });
  });

  test('danger zone: bypass function call, support encoded json string', async () => {
    const C = function () {
      return { foo: 'long-content' };
    };
    const opt = alipayComponent(C);
    const instance = mountAlipayComponent(opt);
    const dangerData = {
      dangerData: '12345',
    };
    const dangerDataStr = encodeURIComponent(JSON.stringify(dangerData));
    instance.updateProps({
      DANGER_ZONE_BYPASS_FUNCTION_CALL_WITH_DATA: dangerDataStr,
    });
    expect(instance.data).toEqual({ ...dangerData, foo: null });
  });

  test('一些属性是不允许注册的', async () => {
    expect(() => {
      alipayComponent(() => {
        useEvent('methods', () => {}, []);
        return {};
      });
    }).toThrow(/不允许注册/);
  });

  test('useEvent 的依赖应该是没有用的', async () => {
    const C = function () {
      const [count, setCount] = useState(0);
      useEvent(
        'getCount',
        () => {
          return count;
        },
        [],
      );
      useEvent(
        'updateCount',
        (v) => {
          setCount(v);
        },
        [],
      );
      return { foo: String(count) };
    };
    const instance = mountAlipayComponent(alipayComponent(C));
    expect(instance.data).toEqual({ foo: '0' });
    instance.callMethod('updateCount', 3);
    await delay(10);
    expect(instance.data).toEqual({ foo: '3' });
    expect(instance.callMethod('getCount')).toEqual(3);
  });

  test('忽略 props 里 $slots 的更新', async () => {
    const C = function (props) {
      const [count, setCount] = useState(0);
      useEffect(() => {
        setCount((o) => o + 1);
      }, [props]);
      return { foo: String(count) };
    };
    const instance = mountAlipayComponent(alipayComponent(C));
    expect(instance.data).toEqual({ foo: '1' });
    instance.updateProps({
      $slots: 1,
    });
    await delay(10);
    expect(instance.data).toEqual({ foo: '2' });
    instance.updateProps({
      $slots: 2,
    });
    expect(instance.data).toEqual({ foo: '2' });
  });

  test('测试 handleResult', async () => {
    const C = function (props) {
      const [counter, setCounter] = useState(0);
      useEvent(
        'one',
        () => {
          return {
            counter,
            props: props,
          };
        },
        { handleResult: true },
      );
      useEvent('updateCount', (v) => {
        setCounter(v);
      });
      return { two: '2', props, counter };
    };
    const componentOptions = alipayComponent(C);
    expect(typeof componentOptions.methods.updateCount).toBe('function');
    expect(typeof componentOptions.methods.one).toBe('function');
    const instance = mountAlipayComponent(componentOptions, { foo: 'bar' });
    expect(typeof instance.data.one).toEqual('undefined');
    await delay(10);
    expect(instance.data).toEqual({
      counter: 0,
      props: {
        foo: 'bar',
      },
      two: '2',
    });
    instance.updateProps({ foo: '2' });
    await instance.callMethod('updateCount', 3);
    await delay(10);
    expect(instance.callMethod('one')).toEqual({
      counter: 3,
      props: {
        foo: '2',
      },
    });
    expect(instance.data.props).toEqual({
      foo: '2',
    });
  });

  test('支付宝测试 callPageLifecycle', async () => {
    const C = function () {
      usePageShow(() => {
        return 'pageshow';
      });
      return {};
    };
    const componentOptions = alipayComponent(C);
    const instance = mountAlipayComponent(componentOptions);
    expect(instance.callPageLifecycle('onShow')).toEqual('pageshow');
  });

  test('新增性能消耗测试', async () => {
    const C = function () {
      return {};
    };
    const componentOptions = alipayComponent(C);
    const instanceList: IAlipayInstance[] = [];

    const mountOneStart = process.hrtime.bigint();
    const instance = mountAlipayComponent(componentOptions);
    instance.unmount();
    const mountOneTime = process.hrtime.bigint() - mountOneStart;

    let start = process.hrtime.bigint();
    for (let i = 0; i < 1000; i++) {
      const instance = mountAlipayComponent(componentOptions);
      instanceList.push(instance);
    }
    instanceList.forEach((e) => e.unmount());
    const mountComponent = process.hrtime.bigint() - start;
    // 这个在 ci 的时候会变慢，所以改成 10000
    // 如果是之前的实现，其实根本无法执行 10000 次
    expect(Number(mountComponent / mountOneTime) < 10000).toBeTruthy();
  });
});

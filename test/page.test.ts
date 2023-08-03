/* eslint-disable no-prototype-builtins */
import {
  assert,
  describe,
  expect,
  test,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { React } from '../src/r';
import { mountAlipayPage, setupAlipayEnv, setupWechatEnv } from './common';
import {
  alipayPage,
  useOnShareAppMessage,
  useOnTitleClick,
  wechatPage,
  useEvent,
  useOnLoad,
  useOnShow,
} from '../src/page';
import { TElementFunction, functionalMiniElement } from '../src/element';
import { EElementType, ETargetPlatform } from '../src/types';

function functionalPage<TProps>(
  element: TElementFunction<TProps>,
  displayName = '',
  targetPlatform?: ETargetPlatform,
) {
  return functionalMiniElement(
    element,
    displayName,
    EElementType.page,
    {} as TProps,
    targetPlatform,
  );
}

const { useEffect, useState, useMemo } = React;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('page - common and alipay', () => {
  let off: () => void;
  beforeEach(() => {
    off = setupAlipayEnv();
  });

  afterEach(() => {
    off();
  });

  test('minium get appx options', async () => {
    const fn = vi.fn();
    const fnOff = vi.fn();
    const fnLifeCycle = vi.fn();
    const C = function () {
      useOnLoad(fnLifeCycle, []);
      const [d] = useState('d-initValue');
      useEffect(fn, []);
      useEffect(() => fnOff, []);
      return {
        foo: 'aa',
        d,
      };
    };

    const options = functionalPage(C, 'test-page-name');
    expect(options.data).toMatchSnapshot();
    expect(fn).toBeCalledTimes(0);
    expect(fnOff).toBeCalledTimes(0);
    expect(fnLifeCycle).toBeCalledTimes(0);
  });

  test('throw if return illegal value', async () => {
    const c = function () {
      return function () {};
    };
    expect(() => {
      functionalPage(c, 'test-page-name');
    }).toThrowError();
  });

  interface IPageState {
    stateFoo: string;
    stateEffect: string;
    onShowData: boolean;
  }

  test('functional page 预渲染', async () => {
    const initStateValue = 'initValue';
    const callFn = vi.fn();
    const unloadFn = vi.fn();
    const unloadInOnLoad = vi.fn();

    const pageOption = functionalPage(function (props: any) {
      expect(props.hasOwnProperty('minifishHooks')).toBeFalsy();

      const [stateFoo] = useState(initStateValue);
      useEvent(
        'foo',
        (event) => {
          console.log('this is page handler');
        },
        [],
      );

      useEffect(() => {
        callFn();
        return unloadFn;
      }, []);

      useOnLoad((q) => {
        return unloadInOnLoad;
      }, []);

      useEvent('onTap', () => {}, []);
      return {
        stateFoo,
      };
    }, 'test-page-name');

    // 挂载前暂存数据
    expect(pageOption.data.stateFoo).toEqual(initStateValue);
    expect(pageOption.hasOwnProperty('foo')).toBeTruthy();
    expect(pageOption.hasOwnProperty('onTap')).toBeTruthy();
    expect(!pageOption.hasOwnProperty('methods')).toBeTruthy();
    expect(callFn).toBeCalledTimes(0);
    expect(unloadFn).toBeCalledTimes(0);
    expect(unloadInOnLoad).toBeCalledTimes(0);
  });

  test('functional page', async () => {
    const initStateValue = 'initValue';
    const valueAfterEffect = 'valueAfterEffect';
    const valueAfterLoad = 'valueAfterLoad';
    const valueAfterTap = 'valueAfterTap';
    const queryValue = 'queryValue';
    const callFn = vi.fn();
    const unloadFn = vi.fn();
    const unloadFn2 = vi.fn();
    const unloadFn3 = vi.fn();
    const unloadInOnLoad = vi.fn();
    const loadFn = vi.fn();

    const pageOption = functionalPage(function (props: any) {
      expect(props.hasOwnProperty('minifishHooks')).toBeFalsy();
      useEvent(
        'foo',
        (event) => {
          console.log('this is page handler');
        },
        [],
      );

      const [stateFoo, setFooState] = useState(initStateValue);
      const [stateEffect, setStateEffect] = useState(initStateValue);
      const [onShowData, setOnShowData] = useState(false);

      useEffect(() => {
        setStateEffect(valueAfterEffect);
        callFn();
        return unloadFn;
      }, []);

      useOnLoad((q) => {
        assert(q.query === queryValue);
        setFooState(valueAfterLoad);
        loadFn();

        return unloadInOnLoad;
      }, []);

      useOnShow(() => {
        setOnShowData(true);

        return unloadFn2;
      }, []);

      useEvent(
        'onTap',
        () => {
          if (onShowData) {
            setFooState(valueAfterTap);
          }
          return unloadFn3;
        },
        [onShowData],
      );

      return { stateFoo, stateEffect, onShowData };
    }, 'test-page-name');

    // 确保前面的事情都已经结束
    await delay(10);

    // 开始挂载页面
    let pageData: Partial<IPageState> = {};
    const mockAppxPage = async (opt) => {
      const mockInstance = {
        $id: 'aa',
        setData() {
          pageData = { ...pageData, ...arguments[0] };
        },
      };

      // 模拟触发 onLoad
      const task = opt.onLoad.call(mockInstance, { query: 'queryValue' });
      await task;
      await delay(20); // 实际生效是异步的，值越大，报错概率越低 （看运气，偶现挂掉）
      expect(callFn).toBeCalledTimes(1);
      expect(loadFn).toBeCalledTimes(1);
      expect(unloadInOnLoad).toBeCalledTimes(0);
      expect(pageData.stateFoo).toEqual(valueAfterLoad);

      opt.onShow.call(mockInstance);
      await delay(10);
      expect(pageData.onShowData).toEqual(true);

      expect(unloadInOnLoad).toBeCalledTimes(0);

      opt.onTap.call(mockInstance);
      await delay(20); // 实际生效是异步的
      expect(pageData.stateFoo).toEqual(valueAfterTap);

      opt.onUnload.call(mockInstance);
      await delay(10);

      expect(unloadFn).toBeCalledTimes(callFn.mock.calls.length);
      expect(unloadFn).toBeCalledTimes(1);
      expect(unloadFn2).toBeCalledTimes(1);
      expect(unloadFn3).toBeCalledTimes(1);
      expect(unloadInOnLoad).toBeCalledTimes(1);
    };

    await mockAppxPage(pageOption);

    // 重新拉起来，应该是个新的组件
    let pageData2: Partial<IPageState> = {};
    const mockAppxPage2 = async (opt) => {
      const mockInstance = {
        $id: '22',
        setData() {
          pageData2 = { ...pageData2, ...arguments[0] };
        },
      };
      opt.onLoad.call(mockInstance, { query: 'queryValue' });
      await delay(10);
    };

    await mockAppxPage2(pageOption);
    expect(pageData2.stateEffect).toEqual(valueAfterEffect);
    expect(pageData2.onShowData).toEqual(false);
  });

  test('minium functional page lifecycle', async () => {
    const unloadInOnLoad = vi.fn();
    const unloadFn2 = vi.fn();

    const pageOption = functionalPage(function (props) {
      const [, setCounter] = useState(0);
      const [onShowData, setOnShowData] = useState(false);

      useOnLoad((q) => {
        setCounter(1);
        return unloadInOnLoad;
      }, []);

      useOnShow(() => {
        setOnShowData(true);
        return unloadFn2;
      }, []);

      return { onShowData };
    }, 'test-page-name');
    expect(unloadInOnLoad).toBeCalledTimes(0);
    expect(pageOption.onShow).toBeDefined();

    // 开始挂载页面
    let pageData: Partial<IPageState> = {};
    const mockAppxPage = async (opt) => {
      const mockInstance = {
        $id: 'aa',
        setData() {
          pageData = { ...pageData, ...arguments[0] };
        },
      };

      // 模拟框架触发各种事件。注意框架是不会 await 这些调用的
      opt.onLoad.call(mockInstance, { query: 'queryValue' });
      opt.onShow.call(mockInstance);
      opt.onUnload.call(mockInstance);

      await delay(10);
      expect(unloadFn2).toBeCalledTimes(1);
      expect(unloadInOnLoad).toBeCalledTimes(1);
    };

    await mockAppxPage(pageOption);
    await delay(10);
  });

  test('onShareAppMessage 只允许监听一次', async () => {
    expect(() => {
      const opt = functionalPage(function (props) {
        useOnShareAppMessage(() => {}, []);
        useOnShareAppMessage(() => {}, []);

        return {};
      });
      mountAlipayPage(opt);
    }).toThrowError(/不能再新增/);
  });

  test('在返回值里提交数据', async () => {
    const pageOption = functionalPage(function (props) {
      const [s, setS] = useState('foo');
      const [h, setH] = useState('hhh');
      const value = `value-${s}`;

      const heavyValue = useMemo(() => {
        return `heavy-${h}`;
      }, [h]);

      useOnLoad(() => {
        setS('bar');
      }, []);

      useEvent(
        'onTap',
        () => {
          setH(`tap-heavy`);
        },
        [],
      );

      return {
        value,
        heavyValue,
      };
    }, 'return-page');
    expect(pageOption.data).toEqual({
      value: 'value-foo',
      heavyValue: 'heavy-hhh',
    });
    const page = mountAlipayPage(pageOption);

    await delay(20);
    expect(page.setDataRecord).toEqual([{ value: 'value-bar' }]);

    pageOption.onTap.call(page);
    await delay(20);
    expect(page.setDataRecord).toEqual([
      { value: 'value-bar' },
      { heavyValue: 'heavy-tap-heavy' },
    ]);
  });

  test('函数初始化，期望抛错', async () => {
    const C = function (props) {
      throw new Error('init error');
    };

    const pageName = 'test-page-name';

    expect(() => {
      functionalPage(C, pageName);
    }).toThrowError(new RegExp(pageName));
  });

  test('不传入 PageName，组件也能正常使用', async () => {
    expect(() => {
      functionalPage(function (props) {
        throw new Error('init error');
      });
    }).toThrowError(/出错/);
  });

  test('不用 useMemo，会触发不必要的更新', async () => {
    const pageOption = functionalPage<{ s: string }>(function (props) {
      const [s, setS] = useState('foo');
      const [bar, setBar] = useState('bar');
      const longList = [props.s, s];

      useEvent(
        'onTap',
        () => {
          setS('bar');
        },
        [],
      );

      useEvent(
        'onTap2',
        () => {
          setBar('tap2');
        },
        [],
      );

      return {
        list: longList,
        bar,
      };
    }, 'return-page');

    const page = mountAlipayPage(pageOption);
    await delay(20);
    pageOption.onTap.call(page);
    await delay(20);
    pageOption.onTap2.call(page);
    await delay(20);
    const initSet = { list: [undefined, 'foo'] };
    const secondSet = { list: [undefined, 'bar'] };
    expect(page.setDataRecord).toEqual([
      initSet,
      secondSet,
      { bar: 'tap2', ...secondSet },
    ]); // 最后一次只更新 barh
  });

  test('使用 useMemo 控制大数据的更新率', async () => {
    const pageOption = functionalPage<{ s: string }>(function (props) {
      const [s, setS] = useState('foo');
      const [bar, setBar] = useState('bar');
      const longList = useMemo(() => {
        return [props.s, s];
      }, [props.s, s]);

      useEvent(
        'onTap',
        () => {
          setS('bar');
        },
        [],
      );

      useEvent(
        'onTap2',
        () => {
          setBar('tap2');
        },
        [],
      );

      return {
        list: longList,
        bar,
      };
    }, 'return-page');

    const page = mountAlipayPage(pageOption);
    await delay(20);
    pageOption.onTap.call(page);
    await delay(20);
    pageOption.onTap2.call(page);
    await delay(20);
    const initSet = { list: [undefined, 'foo'] };
    const secondSet = { list: [undefined, 'bar'] };
    expect(page.setDataRecord).toEqual([initSet, secondSet, { bar: 'tap2' }]); // 最后一次只更新 barh
  });

  test('一些属性是不允许注册的', async () => {
    expect(() => {
      functionalPage(() => {
        useEvent('mixins', () => {}, []);
        return {};
      }, 'foo');
    }).toThrow(/不允许注册/);
  });

  test('支付宝端特有的生命周期', async () => {
    const C = function (props) {
      useOnTitleClick(() => {}, []);
      return {};
    };
    alipayPage(C);
    expect(() => {
      wechatPage(C);
    }).toThrow(/平台配置/);
  });
});

describe('component - wechat', async () => {
  let off: () => void;
  beforeEach(() => {
    off = setupWechatEnv();
  });

  afterEach(() => {
    off();
  });

  test('wechat page', async () => {
    const C = function () {
      const [s] = useState('foo');
      return {
        s,
      };
    };
    const instance = wechatPage(C);
    expect(instance.data).toEqual({ s: 'foo' });
  });
});

const wewe = () => {
  useEffect(() => {
    document.addEventListener('click', () => {});
  }, []);

  return {
    name: 'w',
  };
};

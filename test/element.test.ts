/*
基本的功能测试，组件相关的都靠 Page 和 Component 来保障
*/
import { afterEach, describe, expect, test, vi } from 'vitest';
import { IInstanceMap, flushReactTree } from '../src/element';
import { IElementContext } from '../src/hooks';
import {
  useEffect,
  useState,
  act,
  mountElement,
  createElement,
} from '../src/r';

import { delay } from './utils';

describe('element', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  test('test unmount', async () => {
    const off = vi.fn();
    const Component = function (props: { foo: string }) {
      const [, setCounter] = useState(0);

      useEffect(() => {
        setCounter(2);
        setTimeout(() => {
          setCounter(10);
        }, 10);
        return off;
      }, []);

      return createElement('span', {}, 'Title');
    };

    let fakeRoot;
    act(() => {
      const reactEl = createElement(Component, { foo: 'test' });
      fakeRoot = mountElement(reactEl);
    });
    const rootString = fakeRoot.toString();
    expect(rootString).toMatchSnapshot();

    act(() => {
      fakeRoot.unmount();
    });

    expect(off).toHaveBeenCalledTimes(1);
  });

  test('basic render content', async () => {
    const C = function (props: { name: string }) {
      const [counterToShow] = useState(0);

      return createElement('div', {}, counterToShow);
    };

    let fakeRoot;
    act(() => {
      const reactEl = createElement(C, { name: 'test' });
      fakeRoot = mountElement(reactEl);
    });

    expect(fakeRoot.toString()).toMatchSnapshot();
  });

  test('test async action with .act', async () => {
    let internalSet;
    const C = function (props: { name: string }) {
      const [counter, setCounter] = useState(0);
      const [counterToShow, setCounterToShow] = useState('');

      useEffect(() => {
        internalSet = setCounter;
      }, []);

      useEffect(() => {
        setCounterToShow(`show-${counter}`);
      }, [counter]);

      return createElement('div', {}, counterToShow);
    };

    let fakeRoot;
    act(() => {
      const reactEl = createElement(C, { name: 'test' });
      fakeRoot = mountElement(reactEl);
    });
    setTimeout(() => {
      internalSet(2);
    }, 1);

    await delay(20);

    expect(fakeRoot.toString()).toMatchSnapshot();
  });

  test('basic react render', async () => {
    const initName = 'initName';
    const newName = 'newName';
    const C = function (props: { name: string }) {
      const [counter, setCounter] = useState(0);

      useEffect(() => {
        setCounter(counter + 1);
      }, [props?.name]);

      return createElement('div', {}, counter);
    };

    // 同一个组件，更新 props
    let fakeRoot;
    act(() => {
      const reactEl = createElement(C, {
        name: initName,
      });
      fakeRoot = mountElement(reactEl);
    });
    expect(fakeRoot.toString()).toMatchSnapshot();

    await delay(50);

    act(() => {
      const reactEl = createElement(C, {
        name: newName,
      });
      fakeRoot.update(reactEl);
    });
    expect(fakeRoot.toString()).toMatchSnapshot();

    // 用新的 root ，一定是新对象
    let newRoot;
    act(() => {
      const reactEl = createElement(C, {
        name: newName,
      });
      newRoot = mountElement(reactEl);
    });
    expect(newRoot.toString()).toMatchSnapshot();
  });

  test('component 交叉更新，会出错', async () => {
    // 父页面
    let parentSetState;
    let outerFn;
    const Parent = function () {
      const [s, setS] = useState('init');
      useEffect(() => {
        parentSetState = setS;
      }, [setS]);

      useEffect(() => {
        outerFn && outerFn();
      }, [s]);
      return createElement('div', {}, s);
    };

    // .create 需要在 .act 里面触发
    act(() => {
      const parentEl = createElement(Parent, {});
      mountElement(parentEl);
    });

    // 内部组件
    let childInternalSetName;
    const C = function (props) {
      const [name, setName] = useState('init');
      const [childName, setChildName] = useState('init');
      useEffect(() => {
        childInternalSetName = setChildName;
      });
      useEffect(() => {
        setName(props.query || 'empty');
      }, [props.query]);

      return createElement('div', {}, name + props.foo + childName);
    };

    let childRoot;
    act(() => {
      const reactEl = createElement(C, {
        foo: '1',
      });
      childRoot = mountElement(reactEl);
    });

    childInternalSetName('newName1');
    await delay(5);
    expect(childRoot.toString()).toMatchSnapshot();

    outerFn = () => {
      console.log('calling childInternalSetName');
      childInternalSetName('newName2');
    };

    parentSetState('2');
    await delay(20);
    expect(childRoot.toString()).toMatchSnapshot();
  });

  // 暴力刷一下，防止概率性失败
  let counter = 20;
  while (counter-- > 0) {
    test(`nested component ${counter}`, async () => {
      // 父页面
      let internalSet;
      let outerFn;
      const Parent = function () {
        const [s, setS] = useState('init');
        internalSet = setS;

        useEffect(() => {
          outerFn && outerFn();
        }, [s]);
        return createElement('div', {}, s);
      };

      // .create 需要在 .act 里面触发
      act(() => {
        const parentEl = createElement(Parent, {});
        mountElement(parentEl);
      });

      // 内部组件
      let childInternalSetName;
      const C = function (props) {
        const [name, setName] = useState('init');
        const [childName, setChildName] = useState('init');
        childInternalSetName = setChildName;

        useEffect(() => {
          setName(props.query || 'empty');
        }, [props.query]);

        return createElement('div', {}, name + props.foo + childName);
      };

      let childRoot;
      act(() => {
        const reactEl = createElement(C, {
          foo: '1',
        });
        childRoot = mountElement(reactEl);
      });

      childInternalSetName('newName1');
      await delay(5);
      expect(childRoot.toString()).toMatchSnapshot();

      outerFn = () => {
        childInternalSetName('newName2');
      };

      internalSet('2');
      await delay(50); // 这里如果写10，有可能会失败

      expect(childRoot.toString()).toEqual('<div>empty1newName2</div>');
    });
  }

  test('basic react update', async () => {
    const fn = vi.fn();
    const off = vi.fn();
    const Element = () => {
      useEffect(() => {
        fn();
        return off;
      });
      return createElement('div', {});
    };

    const props = { key: 'a' };
    let testRenderer;
    act(() => {
      const el = createElement(Element, props);
      testRenderer = mountElement(el);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(off).toHaveBeenCalledTimes(0);

    act(() => {
      // 多创建一次就是多跑一次函数，除非复用 element
      const el = createElement(Element, props);
      testRenderer.update(el);
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(off).toHaveBeenCalledTimes(1);
  });

  test('component 都挂在一棵树上', async () => {
    // 父页面
    let internalSet;
    let outerFn;
    const A = function () {
      const [s, setS] = useState('init');
      useEffect(() => {
        internalSet = setS;
      }, []);

      useEffect(() => {
        outerFn && outerFn();
      }, [s]);
      return createElement('div', {}, s);
    };

    // 内部组件
    let childInternalSetName;
    const B = function (props) {
      const [name, setName] = useState('init');
      const [childName, setChildName] = useState('init');
      useEffect(() => {
        childInternalSetName = setChildName;
      });
      useEffect(() => {
        setName(props.query || 'empty');
      }, [props.query]);

      return createElement('div', {}, name + props.foo + childName);
    };

    let root;
    act(() => {
      const a = createElement(A, { key: 'a' });
      const b = createElement(B, { foo: 1, key: 'b' });
      const reactEl = createElement('div', {}, [a, b]);
      root = mountElement(reactEl);
    });

    childInternalSetName('newNameAA');
    await delay(5);
    expect(root.toString()).toMatchSnapshot();

    outerFn = () => {
      childInternalSetName('newName2');
    };

    internalSet('2');
    await delay(5);
    expect(root.toString()).toMatchSnapshot('empty1newName2');
  });

  test('basic element compose', async () => {
    const mockContext: IElementContext = {
      instance: {
        $id: 'aa',
        hanldersControllerts: null,
      },
    };

    const fn = vi.fn();
    const E = () => {
      useEffect(() => {
        fn();
      });
    };
    const elementMap: IInstanceMap = {
      aa: {
        appxContext: mockContext,
        appxId: 'aa',
        elementFn: E,
        pendingProps: {},
        unmounted: false,
      },
    };

    let testRenderer;
    act(() => {
      const parent = flushReactTree(elementMap);
      testRenderer = mountElement(parent);
    });
    await delay(5);
    expect(fn).toHaveBeenCalledTimes(1);

    // 应该不会重复渲染
    act(() => {
      const parent = flushReactTree(elementMap);
      testRenderer.update(parent);
    });
    await delay(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('catch render error', async () => {
    const C = function () {
      throw new Error('test error');
    };

    expect(() => {
      mountElement(createElement(C, { shouldThrow: false }));
    }).toThrow();
  });

  test('mount element and act error', async () => {
    const C = function (props?: { shouldThrow: boolean }) {
      useEffect(() => {
        if (props?.shouldThrow) {
          throw new Error('test error');
        }
      });
      useEffect(() => {}, []);
      return createElement('div', {}, 'hello');
    };

    expect(() => {
      const instance = mountElement(createElement(C, { shouldThrow: false }));
      let newInstance;
      act(() => {
        newInstance = createElement(C, { shouldThrow: true });
        instance.update(newInstance);
      });
    }).toThrow();
  });
});

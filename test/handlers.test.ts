import { expect, test, vi } from 'vitest';
import HandlersController from '../src/handlers';

test('addHandler', async () => {
  const controller = new HandlersController();
  const mockContext = {};
  const off = controller.addHandler('testOff', mockContext, () => {});
  controller.addHandler('foo', mockContext, () => {});
  expect(() => {
    controller.addHandler('foo', mockContext, () => {}, true);
  }).toThrow();
  controller.addHandler('test', mockContext, () => {});
  controller.addHandler('test', mockContext, () => {});
  expect(controller.getHandlersByName('foo', mockContext).length).toBe(1);
  expect(controller.getHandlersByName('test', mockContext).length).toBe(2);
  off();
  expect(controller.getHandlersByName('testOff', mockContext).length).toBe(0);

  // lock 之前，不能获取代理函数
  expect(() => {
    controller.getHandlersImplProxy();
  }).toThrowError();

  // lock 之后，不允许新增名称
  controller.lockHandlerNames();
  controller.addHandler('foo', mockContext, () => {});
  expect(controller.getHandlersByName('foo', mockContext).length).toBe(2);
  expect(() =>
    controller.addHandler('bar', mockContext, () => {}),
  ).toThrowError();

  // 可以 reset 、增删实现
  controller.resetAllImpl();
  const newImpl = vi.fn();
  controller.addHandler('foo', mockContext, newImpl);
  expect(controller.getHandlersByName('foo', mockContext).length).toBe(1);
  await controller.callHandlers('foo', mockContext, []);
  expect(newImpl).toHaveBeenCalledTimes(1);
});

test('handler of different context', async () => {
  const controller = new HandlersController();
  const impl = vi.fn();
  controller.addHandler(
    'off2',
    () => {
      return true;
    },
    impl,
  );

  // lock 之后，不允许新增名称
  controller.lockHandlerNames();
  await controller.callHandlers('off2', {}, []);
  expect(impl).toHaveBeenCalledTimes(1); // 不校验 context，能跑起来
});

test('off function', async () => {
  const controller = new HandlersController('off-tester');
  const mockContext = {};
  const mockContext2 = {};

  const actionFn = vi.fn();
  const offFn = vi.fn();
  const action = (q) => {
    actionFn(q);
    return offFn;
  };

  const off = controller.addHandler('testOff', mockContext, action);
  const off2 = controller.addHandler('testOff', mockContext2, action);
  controller.lockHandlerNames();
  const options = controller.getHandlersImplProxy();
  await options.testOff.call(mockContext); // 事件跑起来之后，对应的 off 要能自动注册上
  expect(actionFn.mock.calls.length).equal(1);
  await options.testOff.call(mockContext2, 'param2'); // 事件跑起来之后，对应的 off 要能自动注册上
  expect(actionFn.mock.calls.length).equal(2);
  expect(actionFn.mock.calls[actionFn.mock.calls.length - 1][0]).equal(
    'param2',
  );

  // 注销一个实现
  off();
  await options.testOff.call(mockContext2, 'param3'); // 事件跑起来之后，对应的 off 要能自动注册上
  expect(actionFn.mock.calls.length).equal(3);
  expect(actionFn.mock.calls[actionFn.mock.calls.length - 1][0]).equal(
    'param3',
  );
  expect(offFn).toBeCalledTimes(1);

  // 注第二个实现
  off2();
  expect(offFn).toBeCalledTimes(2);
  await options.testOff.call(mockContext2, 'param3'); // 事件跑起来之后，对应的 off 要能自动注册上
  expect(actionFn.mock.calls.length).equal(3);
});

test('context filter with function', () => {
  const controller = new HandlersController();
  const mockContext = {};

  const offFn = vi.fn();
  const action = () => {
    return offFn;
  };
  controller.addHandler('testOff', () => true, action);
  controller.addHandler('testOff', mockContext, action);

  const r = controller.getHandlersByName('testOff', {});
  expect(r.length).toEqual(1); // 拿到一个通配的
  const r2 = controller.getHandlersByName('testOff', mockContext);
  expect(r2.length).toEqual(2);
});

test('test proxy with one impl', async () => {
  const controller = new HandlersController();
  const testName = 'foo';
  const mockContext = { mockThis: 'this is mock This' };

  const testImpl = function (paramA, paramB) {
    return {
      thisRef: this,
      paramA,
      paramB,
    };
  };

  controller.addHandler(testName, mockContext, testImpl);
  controller.lockHandlerNames();
  const proxy = controller.getHandlersImplProxy();
  const implProxy = proxy[testName];
  const returnValue = await implProxy.call(mockContext, 1, 2);

  expect(returnValue.paramA).toEqual(1);
  expect(returnValue.paramB).toEqual(2);
  expect(returnValue.thisRef).toEqual(mockContext);
});

test('只有一个 async 实现时，可以收集到一个 promise 化的返回值', async () => {
  const controller = new HandlersController();
  const mockContext = {};
  const mockReturnValue = 'mockReturnValue';

  controller.addHandler('foo', {}, () => {}); // 不同的 context
  controller.addHandler('foo', mockContext, async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockReturnValue);
      }, 1);
    });
  });
  controller.addHandler('foo', {}, () => {}); // 不同的 context

  controller.lockHandlerNames();
  const proxy = controller.getHandlersImplProxy();

  const r = proxy.foo.call(mockContext);
  expect(r.then).toBeDefined();
});

test('多个实现，只收集第一个返回值，并且支持异步', async () => {
  const controller = new HandlersController();
  const testKeyName = 'testKey';
  const mockContext = {};
  const testReturnValue = 'testReturnValue';

  const implA = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(testReturnValue);
      }, 1);
    });
  };
  const implB = vi.fn();

  controller.addHandler(testKeyName, mockContext, implA);
  controller.addHandler(testKeyName, mockContext, implB);

  controller.lockHandlerNames();
  const proxy = controller.getHandlersImplProxy();

  const ret = proxy[testKeyName].call(mockContext);
  expect(ret.then).toBeDefined();
  const t = await ret;
  expect(t).toEqual(testReturnValue);
});

test('多个实现，中间有报错', async () => {
  const controller = new HandlersController();
  const testName = 'bar';
  const testNameE = 'barE';
  const mockContext = {};

  const implA = vi.fn();
  const implB = vi.fn();
  const implC = () => {
    throw new Error('implC error');
  };
  const implD = vi.fn();
  const implE = vi.fn();

  controller.addHandler(testName, mockContext, implA);
  controller.addHandler(testName, mockContext, implB);
  controller.addHandler(testName, mockContext, implC); // 这个会执行出错，阻塞下一个执行
  controller.addHandler(testName, mockContext, implD);
  controller.addHandler(testNameE, mockContext, implE);

  controller.lockHandlerNames();
  const proxy = controller.getHandlersImplProxy();

  // 即使前面报错，后续的方法会继续执行
  expect(() => {
    proxy[testName].call(mockContext);
  }).toThrow(/implC/);
  expect(implA).toBeCalledTimes(1);
  expect(implB).toBeCalledTimes(1);
  expect(implD).toBeCalledTimes(0);

  proxy[testNameE].call(mockContext);
  expect(implE).toBeCalledTimes(1); // 其他方法可以正常执行
});

test('执行过程中增加更多实现', async () => {
  const controller = new HandlersController();
  const mockContext = {};
  const bFn = vi.fn();

  controller.addHandler('A', mockContext, () => {
    controller.addHandler('B', mockContext, bFn);
  });

  controller.addHandler('B', mockContext, () => {});

  controller.lockHandlerNames();
  const proxy = controller.getHandlersImplProxy();

  // 同步触发，其实是排队执行的
  proxy.A.call(mockContext);
  // await delay(10);
  proxy.B.call(mockContext);
  expect(bFn).toBeCalledTimes(1);
  //
});

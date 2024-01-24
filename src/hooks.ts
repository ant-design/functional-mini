import {
  useEffect,
  createContext,
  useContext,
  useRef,
  useCallback,
} from './r.js';
import HandlersController from './handlers.js';
import { instanceKeyPropNames } from './utils.js';
import {
  IPlatformConstants,
  checkIfPlatformIsLoadCorrectly,
} from './platform.js';
import { ETargetPlatform } from './types.js';

export type THooksFn = (handler: Function, deps?: any[]) => void;

//@ts-expect-error
function generateEventHookName(eventName) {
  return `use${eventName[0].toUpperCase()}${eventName.slice(1)}`;
}

export const reactContext = createContext<IElementContext | null>(null);

export interface IElementContext {
  instance: any;
  handlersController: HandlersController;
  ifServerRender?: boolean;
  debugLog?: (...args: any[]) => void;
  platformConfig: IPlatformConstants;
}

// --------------------------
function useAppxContext(): IElementContext {
  const appxInstanceContext = useContext<IElementContext | null>(reactContext);
  if (!appxInstanceContext) {
    throw new Error('请不要在组件内调用 hooks');
  }
  return appxInstanceContext;
}

function useEventCall(
  name: string,
  handler: Function,
  disableMultiImpl: boolean,
) {
  const realHandler = useStableCallback(handler);

  const appxInstanceContext = useAppxContext();

  console.log('---------', name, appxInstanceContext.ifServerRender);
  if (appxInstanceContext.ifServerRender) {
    // 虚拟渲染时，注册空实现
    appxInstanceContext.handlersController.addHandler(
      name,
      {},
      () => {},
      false,
    );
  }

  useEffect(() => {
    const off = appxInstanceContext.handlersController.addHandler(
      name,
      appxInstanceContext.instance,
      //@ts-expect-error
      function (this, ...args) {
        return realHandler.apply(undefined, args);
      },
      disableMultiImpl,
    );

    return off;
  }, []);
}

export function useStableCallback<T extends Function>(callback: T): T {
  const fnRef = useRef<any>();
  fnRef.current = callback;

  const memoFn = useCallback<T>(
    ((...args: any) => fnRef.current?.(...args)) as any,
    [],
  );

  return memoFn;
}

type DepsOrOptions =
  | {
      /**
       * 是否需要消费 event 的返回结果
       */
      handleResult?: boolean;
    }
  | any[];

// 注册和更新 handler，注意只能更新第一次注册过的 handler 实现，不允许变更数量和 key
export function useEvent(
  name: string,
  handler: Function,
  /**
   *
   */
  depsOrOptions?: DepsOrOptions,
) {
  const appxInstanceContext = useAppxContext();
  const { platformConfig, instance } = appxInstanceContext;
  const { pageEvents, componentEvents, blockedProperty } = platformConfig;
  if (pageEvents.indexOf(name) >= 0 || componentEvents.indexOf(name) >= 0) {
    throw new Error(
      `小程序 ${name} 是生命周期相关的保留方法，不允许使用此种方法注册，请使用对应的 hooks: ${generateEventHookName(
        name,
      )}`,
    );
  } else if (blockedProperty.indexOf(name) >= 0) {
    throw new Error(
      `不允许注册名为 ${name} 的事件处理函数，这是小程序的保留属性，请换一个名称`,
    );
  }
  if (Array.isArray(depsOrOptions)) {
    console.warn(`useEventCall ${name}: hooks 的 deps 已废弃，无需填写。`);
  }

  const putMethodOnData =
    !Array.isArray(depsOrOptions) &&
    depsOrOptions?.handleResult &&
    !platformConfig.supportHandleEventResult;

  // 对于同一个 name ,此变量永久不变，所以可以用 if else 写 hooks
  if (putMethodOnData) {
    const stableHandler = useStableCallback(handler);
    useEffect(() => {
      if (
        instance.properties &&
        typeof instance.properties[name] !== 'undefined'
      ) {
        throw new Error(
          `事件 ${name} 注册失败，在 handleResult 开启后，事件不能同时在 properties 与 useEvent 中定义。`,
        );
      }
      instance.setData({
        [name]: stableHandler,
      });
    }, []);
  } else {
    useEventCall(name, handler, true);
  }
}

export function getLifeCycleHooks(
  eventName: string,
  disableMultiImpl = false,
  specifyPlatform?: ETargetPlatform,
): THooksFn {
  return (
    handler,
    /**
     * @deprecated 无需填写依赖
     */
    deps?: any[],
  ) => {
    const appxInstanceContext = useAppxContext();
    if (specifyPlatform) {
      const { platformConfig } = appxInstanceContext;
      checkIfPlatformIsLoadCorrectly(platformConfig, specifyPlatform);
    }

    useEventCall(eventName, handler, disableMultiImpl);
  };
}

export function useSyncMiniData(data = {}) {
  const appxInstanceContext = useAppxContext();
  // const propKeys = appxInstanceContext
  if (!appxInstanceContext.instance) {
    throw new Error('cannot get appx instance, failed to set data');
  }
  const lastDataRef = useRef<unknown>();
  if (appxInstanceContext.ifServerRender) {
    appxInstanceContext.instance.setData(data);
  }

  const debugLog = appxInstanceContext.debugLog || function () {};

  if (typeof data !== 'object')
    throw new Error(`函数返回的数据必须是一个对象，收到了 ${typeof data}`);

  // 这里是一个每次都要跑的 passive effect
  const { instance } = appxInstanceContext;
  const propNames = instance[instanceKeyPropNames] || []; // 微信的 data 里包含了 props，要手动踢掉
  const pendingData = {};
  const previousData = instance.data || {};

  // 比对一下，只 set 不同的部分
  for (const key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    //@ts-expect-error
    if (typeof data[key] === 'function')
      throw new Error(`${key} - 不允许传入函数类型的数据`); // 暂不支持，有需求再说

    //@ts-expect-error
    if (!previousData[key] || previousData[key] !== data[key]) {
      //@ts-expect-error
      pendingData[key] = data[key];
    }

    if (typeof previousData[key] === 'function') {
      throw new Error(`${key} - 禁止修改 data 上已经存在的函数`);
    }
  }

  // 如果之前同步过 data，但是这次没有传入，就把之前的值设置成 null
  // 这里用的是 lastDataRef 而不是 previousData，是因为 previousData 里可能有用户通过 this.data[key] 直接修改的值
  if (lastDataRef.current) {
    // 缺少某些 key，就设置成 null
    for (const key of Object.keys(lastDataRef.current)) {
      if (propNames.indexOf(key) >= 0) continue;
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        //@ts-expect-error
        pendingData[key] = null;
      }
    }
  }

  if (Object.keys(pendingData).length > 0) {
    debugLog('calling setData', pendingData);
    instance.setData(pendingData);
  }
  lastDataRef.current = data;
}

function useMiniInstance<T = any>(): T {
  const appxInstanceContext = useAppxContext();
  return appxInstanceContext.instance;
}

export const usePage = useMiniInstance;

export const useComponent = useMiniInstance;

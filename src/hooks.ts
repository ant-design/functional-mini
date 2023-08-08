import { useEffect, createContext, useContext } from './r.js';
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
  deps: any[],
  disableMultiImpl: boolean,
) {
  if (!deps)
    console.warn(
      `useEventCall ${name}: hooks 的 deps 参数为空，可能会导致性能问题`,
    );

  const appxInstanceContext = useAppxContext();
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
        return handler.apply(undefined, args);
      },
      disableMultiImpl,
    );

    return off;
  }, deps);
}

// 注册和更新 handler，注意只能更新第一次注册过的 handler 实现，不允许变更数量和 key
export function useEvent(name: string, handler: Function, deps: any[]) {
  const appxInstanceContext = useAppxContext();
  const { platformConfig } = appxInstanceContext;
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

  useEventCall(name, handler, deps, true);
}

export function getLifeCycleHooks(
  eventName: string,
  disableMultiImpl = false,
  specifyPlatform?: ETargetPlatform,
): THooksFn {
  return (handler, deps?: any[]) => {
    const appxInstanceContext = useAppxContext();
    if (specifyPlatform) {
      const { platformConfig } = appxInstanceContext;
      checkIfPlatformIsLoadCorrectly(platformConfig, specifyPlatform);
    }

    useEventCall(eventName, handler, deps ?? [], disableMultiImpl);
  };
}

export function useSyncMiniData(data = {}) {
  const appxInstanceContext = useAppxContext();
  // const propKeys = appxInstanceContext
  if (!appxInstanceContext.instance) {
    throw new Error('cannot get appx instance, failed to set data');
  }
  if (appxInstanceContext.ifServerRender) {
    appxInstanceContext.instance.setData(data);
  }

  const debugLog = appxInstanceContext.debugLog || function () {};
  if (typeof data !== 'object')
    throw new Error(`函数返回的数据必须是一个对象，收到了 ${typeof data}`);
  // 这里是一个每次都要跑的 passive effect
  useEffect(() => {
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
    }

    // 缺少某些 key，就设置成 null
    for (const key of Object.keys(previousData)) {
      if (propNames.indexOf(key) >= 0) continue;
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        //@ts-expect-error
        pendingData[key] = null;
      }
    }

    if (Object.keys(pendingData).length > 0) {
      debugLog('calling setData', pendingData);
      instance.setData(pendingData);
    }
  }, undefined as any);
}

export function useWechatTriggerEvent() {
  const appxInstanceContext = useAppxContext();
  const { platformConfig } = appxInstanceContext;
  checkIfPlatformIsLoadCorrectly(platformConfig, ETargetPlatform.wechat);
  const ifSSr = appxInstanceContext.ifServerRender;
  const fn = appxInstanceContext.instance?.triggerEvent;
  if (!ifSSr && !fn) {
    throw new Error('cannot get triggerEvent function from instance');
  }
  return fn;
}

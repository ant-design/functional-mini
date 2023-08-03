import { React, VNode, act, mountElement, serverRender } from './r.js';
import {
  log as globalLog,
  error as globalError,
  EComponent2Status,
  getComponent2Status,
  updateComponent2Status,
  getIdFromAppxInstance,
  instanceKeyPropNames,
} from './utils.js';

import HandlersController from './handlers.js';
import { IElementContext, reactContext, useSyncMiniData } from './hooks.js';
import { ETargetPlatform, EElementType } from './types.js';
import { platformConfig } from './platform.js';

const FUNCTIONAL_MINI_PAGE_DOM_PLACEHOLDER = 'MINIFISH_PAGE_DOM_PLACEHOLDER';
const DANGER_ZONE_BYPASS_FUNCTION_CALL_WITH_DATA =
  'DANGER_ZONE_BYPASS_FUNCTION_CALL_WITH_DATA'; // 绕过所有函数方法，直接返回 data。不要在生产环境使用！

export interface IAppxOptions {
  data: Record<string, any>;
  options: Record<string, string>;
  methods?: Record<string, (args?) => void>;
  [handlerName: string]: any;
}

export type TElementFunction<TProps> = (props: TProps) => {
  [axmlKey: string]: any;
};

export interface IInstanceMap {
  [id: string]: {
    appxContext: IElementContext;
    appxId: string;
    elementFn: any;
    elementInstance?: any;
    pendingProps: any;
    unmounted: boolean;
    propKeys: string[];
  };
}

function compositeElementWithContext(
  id,
  elementFn,
  appxContext: IElementContext,
  pendingProps,
) {
  const el = React.createElement(elementFn, pendingProps);
  // eslint-disable-next-line react/no-children-prop
  return React.createElement(
    reactContext.Provider,
    { value: appxContext, key: id, children: [el] },
    el,
  ) as VNode;
}

export function flushReactTree(elementMap: IInstanceMap) {
  const children: VNode[] = [];
  for (const id in elementMap) {
    if (!Object.prototype.hasOwnProperty.call(elementMap, id)) continue;

    const item = elementMap[id];
    if (item.unmounted) {
      continue;
    }
    if (item.elementInstance && !item.pendingProps) {
      children.push(item.elementInstance);
      continue;
    }

    const contextElement = compositeElementWithContext(
      id,
      item.elementFn,
      item.appxContext,
      item.pendingProps,
    );
    children.push(contextElement);
    item.elementInstance = contextElement;
    item.pendingProps = null;
  }

  const parent = React.createElement('div', {}, children);
  return parent;
}

export function functionalMiniElement<TProps>(
  element: TElementFunction<TProps>,
  displayName = '' /* 用于问题排查，和小程序 axml 无关 */,
  elementType: EElementType,
  defaultProps?: TProps,
  _targetPlatform?: ETargetPlatform,
) {
  let targetPlatform: ETargetPlatform =
    _targetPlatform ?? ETargetPlatform.alipay;

  // 配置客户端环境
  const {
    pageEvents,
    componentEvents,
    buildOptions,
    componentLifeCycleToMount,
    componentLifeCycleToUnmount,
    pageLifeCycleToMount,
    pageLifeCycleToUnmount,
    getPropsFromInstance,
  } = platformConfig[targetPlatform];

  displayName = displayName || element.name;
  if (!displayName) {
    console.warn(
      '为了方便问题排查，请传入组件的 displayName 参数，或不要使用匿名函数组件 https://medium.com/@stevemao/do-not-use-anonymous-functions-to-construct-react-functional-components-c5408ec8f4c7',
    );
  }

  const nameTag = `[${elementType}/${displayName || '(unnamed)'}]`;
  const log = (...args) => {
    globalLog(nameTag, ...args);
  };
  const logErrorAndThrow = (err: Error) => {
    if (!err) return;
    err.message = `${nameTag} ${err.message}`;
    globalError(err);
    throw err;
  };

  if (elementType === 'component') {
    if (getComponent2Status() === EComponent2Status.UNKNOWN) {
      updateComponent2Status();
    }
    if (getComponent2Status() === EComponent2Status.INVALID) {
      // 如果还是 Unknown，就先不管了
      throw new Error(
        `无法注册 ${nameTag} 组件，因为当前小程序环境未开启 component2。配置入口在 mini.project.json : { "compileOptions": { "component2": true } }，或在 IDE 详情>项目配置中勾选`,
      );
    }
  }

  const platformExposedEvents: string[] =
    elementType === 'page' ? pageEvents : componentEvents;

  const defaultPropKeys = Object.keys(defaultProps || {});
  let observers = {};
  const elementMap: IInstanceMap = {};
  let commonTestRenderer;
  function updateReactTree() {
    act(() => {
      const parent = flushReactTree(elementMap);
      if (!commonTestRenderer) {
        commonTestRenderer = mountElement(parent);
      } else {
        commonTestRenderer.update(parent);
      }
    });
  }

  const WrappedElementFn = function (props: any) {
    let miniData: any;
    if (props && props[DANGER_ZONE_BYPASS_FUNCTION_CALL_WITH_DATA]) {
      miniData = props[DANGER_ZONE_BYPASS_FUNCTION_CALL_WITH_DATA];
      if (typeof miniData === 'string' && miniData.indexOf('%7B') === 0) {
        miniData = JSON.parse(decodeURIComponent(miniData));
      }
    } else {
      try {
        miniData = element.call(undefined, props);
      } catch (e) {
        e.message = `渲染出错 ${e.message}`;
        return logErrorAndThrow(e);
      }
    }
    if (typeof miniData === 'undefined') {
      log('函数组件没有返回渲染数据，请检查代码逻辑');
      miniData = {};
    } else if (typeof miniData !== 'object') {
      const e = new Error(
        `函数组件返回的渲染数据不合法，收到的类型为 ${typeof miniData}`,
      );
      return logErrorAndThrow(e);
    }
    // 不允许和 props 里的 key 重复
    const conflictKeys: string[] = [];
    const dataKeys = Object.keys(miniData) || [];
    for (const key in props) {
      if (dataKeys.indexOf(key) >= 0) {
        conflictKeys.push(key);
      }
    }
    if (conflictKeys.length > 0) {
      const e = new Error(
        `小程序自定义组件返回的渲染数据和 props 里的 key 重复：${conflictKeys.join(
          ', ',
        )}`,
      );
      return logErrorAndThrow(e);
    }

    // 上面的 early-return 都是检查和抛错，忽略 hooks 规则
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSyncMiniData(miniData || {});
    return React.createElement('div', {}, FUNCTIONAL_MINI_PAGE_DOM_PLACEHOLDER);
  };

  // 在 onload 的时候，正式创建一个 react 组件
  function hookLoadToMountReactComponent(this: any, ...args: any[]) {
    const appxInstance = this;
    const id = getIdFromAppxInstance(appxInstance);
    if (elementMap[id])
      throw new Error(
        `duplicate id of appx instance, this might be a bug of minifish hooks. id: ${id}`,
      );
    const context = generateInstanceContext(appxInstance, false);
    appxInstance[instanceKeyPropNames] = defaultPropKeys;
    log('will mount react component');
    let initProps = {};
    // 微信和支付宝的行为是有所不同的：微信这时候还是 defaultProps 的内容，支付宝已经是真的数据了
    if (elementType === 'component') {
      initProps = getPropsFromInstance(appxInstance, defaultPropKeys);
    }

    elementMap[id] = {
      appxContext: context,
      appxId: id,
      elementFn: WrappedElementFn,
      pendingProps: initProps,
      unmounted: false,
      propKeys: defaultPropKeys,
    };
    updateReactTree();

    // 触发 onLoad
    if (elementType === 'page') {
      log('React 页面（Page）已经 Mount，开始触发 onLoad');
      return context.handlersController.callHandlers(
        pageLifeCycleToMount,
        appxInstance,
        args,
      ); // 直接调用controller 内部的方法，插队执行 onLoad
    } else {
      log(
        `React 组件（Component）已经 Mount，开始触发 ${componentLifeCycleToMount}`,
      );
      return context.handlersController.callHandlers(
        componentLifeCycleToMount,
        appxInstance,
        args,
      );
    }
  }

  function dispatchNewProps(appxInstance, nextProps) {
    const id = getIdFromAppxInstance(appxInstance);
    const instance = elementMap[id];
    instance.pendingProps = nextProps;
    updateReactTree();
  }

  function hookUnloadToUnmount(this: any) {
    const appxInstance = this;
    const id = getIdFromAppxInstance(appxInstance);
    log(`will unmount react element of ${id}`);
    if (!elementMap[id]) {
      log(
        `找不到 id 为 ${id} 的实例，请检查是否开启了 component2 。这也可能是 Minifish 的 bug。`,
      );
    }
    elementMap[id].unmounted = true;
    updateReactTree();
    // TODO: 清理 appx context
  }

  const handlersController = new HandlersController(nameTag);
  const anyUnknownContext = (ctx) => {
    if (!ctx) throw new Error('ctx is required');
    const id = getIdFromAppxInstance(ctx);
    return !elementMap[id];
  };
  const anyContext = () => true;
  if (elementType === 'page') {
    handlersController.addHandler(
      pageLifeCycleToMount,
      anyUnknownContext,
      hookLoadToMountReactComponent,
    );
    handlersController.addHandler(
      pageLifeCycleToUnmount,
      anyContext,
      hookUnloadToUnmount,
    );
  } else {
    // 组件的关键生命周期
    handlersController.addHandler(
      componentLifeCycleToMount,
      anyUnknownContext,
      hookLoadToMountReactComponent,
    );
    handlersController.addHandler(
      componentLifeCycleToUnmount,
      anyContext,
      hookUnloadToUnmount,
    );
    // 把 props 变更分发到对应的组件里
    if (targetPlatform === ETargetPlatform.alipay) {
      handlersController.addHandler(
        'deriveDataFromProps',
        anyContext,
        function hookDeriveDataFromProps(this: any, nextProps) {
          if (this.props && this.props === nextProps) return; // 可能是setData触发的，不要死循环了
          return dispatchNewProps(this, nextProps);
        },
      );
    } else if (targetPlatform === ETargetPlatform.wechat) {
      const props = defaultPropKeys.join(', ');
      log(`将注册以下 key 的 props 更新：${props}`);
      observers = {
        // 忽略函数参数，直接从 this 里面找
        // 搞不懂小程序的设计逻辑，为什么非要在 props 里夹着 data
        [props](this: any, ...args) {
          log('observer is being called', args);
          const newProps = getPropsFromInstance(this, defaultPropKeys);
          return dispatchNewProps(this, newProps);
          //
        },
        ...observers,
        // []
      };
    }
  }

  // 做一次预渲染，获取所有 appx 需要的属性
  const generateInstanceContext = (
    instance,
    ifServerRender: boolean,
  ): IElementContext => {
    return {
      instance,
      handlersController,
      ifServerRender,
      debugLog: log,
      platformConfig: platformConfig[targetPlatform],
    };
  };

  // 收集 initData
  let initData = {};
  const fakeAppxInstance = {
    $id: `_minifish_hooks_pre_render_${Math.random()}`,
    setData(data) {
      initData = {
        ...(initData || {}),
        ...data,
      };
    },
  };
  const fakeCtx = generateInstanceContext(fakeAppxInstance, true);
  const serverEl = compositeElementWithContext(
    fakeAppxInstance.$id,
    WrappedElementFn,
    fakeCtx,
    defaultProps || {},
  );
  serverRender(serverEl);
  log('serverRendered with initData', initData);

  // 拼装对象，喂给 appx。产出的配置应该只能喂一次，喂多了 appx 不认。
  handlersController.lockHandlerNames();

  // 把生命周期和一般事件处理分开归类，因为组件的事件处理要多裹一层
  const lifeCycleHandlers = {};
  const userEventHandlers = {};
  const handlers = handlersController.getHandlersImplProxy();
  for (const name in handlers) {
    if (platformExposedEvents.indexOf(name) >= 0) {
      lifeCycleHandlers[name] = handlers[name];
    } else {
      userEventHandlers[name] = handlers[name];
    }
  }

  const finalOptions = buildOptions(
    elementType,
    defaultProps,
    initData,
    lifeCycleHandlers,
    userEventHandlers,
    null,
    observers,
  );
  log('element options', finalOptions);
  return finalOptions;
}

export function tellIfFunctionalMiniContent(elementJson) {
  return elementJson?.children[0] === FUNCTIONAL_MINI_PAGE_DOM_PLACEHOLDER;
}

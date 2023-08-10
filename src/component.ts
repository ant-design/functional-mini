import { functionalMiniElement, TElementFunction } from './element.js';
import { EElementType, ETargetPlatform } from './types.js';
import { getLifeCycleHooks, useWechatTriggerEvent } from './hooks.js';
import {
  alipayComponentEvents,
  commonComponentEvents,
  wechatComponentEvents,
} from './platform.js';

export function alipayComponent<TProps extends Record<string, any>>(
  element: TElementFunction<TProps>,
  defaultProps?: TProps,
) {
  return functionalMiniElement(
    element,
    '',
    EElementType.component,
    defaultProps,
    ETargetPlatform.alipay,
  );
}

export function wechatComponent<TProps extends Record<string, any>>(
  element: TElementFunction<TProps>,
  defaultProps?: TProps,
) {
  return functionalMiniElement(
    element,
    '',
    EElementType.component,
    defaultProps,
    ETargetPlatform.wechat,
  );
}

export const useCreated = getLifeCycleHooks(commonComponentEvents.created);
export const useAttached = getLifeCycleHooks(commonComponentEvents.attached);
export const useReady = getLifeCycleHooks(commonComponentEvents.ready);
export const useMoved = getLifeCycleHooks(commonComponentEvents.moved);
export const useDetached = getLifeCycleHooks(commonComponentEvents.detached);

export const useDidMount = getLifeCycleHooks(
  alipayComponentEvents.didMount,
  undefined,
  ETargetPlatform.alipay,
);

// onInit, deriveDataFromProps、 didUnmount、didUpdate 是不开放 Hooks 的，请使用 react 生命周期方法

// 生命周期 - 微信端特有
export const useError = getLifeCycleHooks(
  wechatComponentEvents.error,
  undefined,
  ETargetPlatform.wechat,
);

// 事件触发 - 微信端
export { useWechatTriggerEvent };

export * from './export-hooks.js';

export { useComponent } from './hooks.js';

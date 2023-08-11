import { functionalMiniElement, TElementFunction } from './element.js';
import { getLifeCycleHooks } from './hooks.js';
import { alipayComponentEvents, commonComponentEvents } from './platform.js';
import { EElementType, ETargetPlatform } from './types.js';

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

export const useAttached = getLifeCycleHooks(commonComponentEvents.attached);
export const useReady = getLifeCycleHooks(commonComponentEvents.ready);
export const useMoved = getLifeCycleHooks(commonComponentEvents.moved);
export const useDetached = getLifeCycleHooks(commonComponentEvents.detached);

export const useDidMount = getLifeCycleHooks(
  alipayComponentEvents.didMount,
  undefined,
  ETargetPlatform.alipay,
);

// onInit, deriveDataFromProps, didUnmount, didUpdate 是不开放 Hooks 的，请使用 React 生命周期方法

export * from './export-hooks.js';

export { useComponent } from './hooks.js';

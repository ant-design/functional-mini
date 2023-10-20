import { functionalMiniElement, TElementFunction } from './element.js';
import { getLifeCycleHooks } from './hooks.js';
import { alipayComponentEvents, commonComponentEvents } from './platform.js';
import { EElementType, ETargetPlatform } from './types.js';

export interface ComponentOption {
  options?: any;
}

export function alipayComponent<TProps extends Record<string, any>>(
  element: TElementFunction<TProps>,
  defaultProps?: TProps,
  componentOption?: ComponentOption,
) {
  return functionalMiniElement(
    element,
    '',
    EElementType.component,
    defaultProps,
    ETargetPlatform.alipay,
    componentOption,
  );
}

export function wechatComponent<TProps extends Record<string, any>>(
  element: TElementFunction<TProps>,
  defaultProps?: TProps,
  componentOption?: ComponentOption,
) {
  return functionalMiniElement(
    element,
    '',
    EElementType.component,
    defaultProps,
    ETargetPlatform.wechat,
    componentOption,
  );
}

export const useAttached = getLifeCycleHooks(commonComponentEvents.attached);
export const useReady = getLifeCycleHooks(commonComponentEvents.ready);
export const useMoved = getLifeCycleHooks(commonComponentEvents.moved);

export const useDidMount = getLifeCycleHooks(
  alipayComponentEvents.didMount,
  undefined,
  ETargetPlatform.alipay,
);

export * from './export-hooks.js';

export { useComponent } from './hooks.js';

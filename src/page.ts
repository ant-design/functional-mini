import { functionalMiniElement, TElementFunction } from './element.js';
import { ETargetPlatform, EElementType } from './types.js';
import { getLifeCycleHooks } from './hooks.js';
import { alipayPageEvents } from './platform.js';

export function alipayPage<TProps>(element: TElementFunction<TProps>) {
  return functionalMiniElement(
    element,
    '',
    EElementType.page,
    {} as TProps,
    ETargetPlatform.alipay,
  );
}

export function wechatPage<TProps>(element: TElementFunction<TProps>) {
  return functionalMiniElement(
    element,
    '',
    EElementType.page,
    {} as TProps,
    ETargetPlatform.wechat,
  );
}

// 公共生命周期

/**
 * 不暴露 useOnLoad , 使用 useEffect 代替
 */
export const useOnShow = getLifeCycleHooks('onShow');
export const useOnReady = getLifeCycleHooks('onReady');
export const useOnHide = getLifeCycleHooks('onHide');
export const useOnPullDownRefresh = getLifeCycleHooks('onPullDownRefresh');
export const useOnReachBottom = getLifeCycleHooks('onReachBottom');
export const useOnShareAppMessage = getLifeCycleHooks(
  'onShareAppMessage',
  true,
);
export const useOnPageScroll = getLifeCycleHooks('onPageScroll');
export const useOnTabItemTap = getLifeCycleHooks('onTabItemTap');
export const useOnResize = getLifeCycleHooks('onResize');

// 支付宝端特有
export const useOnTitleClick = getLifeCycleHooks(
  alipayPageEvents.onTitleClick,
  undefined,
  ETargetPlatform.alipay,
);
export const useOnOptionMenuClick = getLifeCycleHooks(
  alipayPageEvents.onOptionMenuClick,
  undefined,
  ETargetPlatform.alipay,
);
export const useBeforeTabItemTap = getLifeCycleHooks(
  alipayPageEvents.beforeTabItemTap,
  undefined,
  ETargetPlatform.alipay,
);
export const useOnKeyboardHeight = getLifeCycleHooks(
  alipayPageEvents.onKeyboardHeight,
  undefined,
  ETargetPlatform.alipay,
);

export const useOnBack = getLifeCycleHooks(
  alipayPageEvents.onBack,
  undefined,
  ETargetPlatform.alipay,
);
export const useOnSelectedTabItemTap = getLifeCycleHooks(
  alipayPageEvents.onSelectedTabItemTap,
  undefined,
  ETargetPlatform.alipay,
);
export const useBeforeReload = getLifeCycleHooks(
  alipayPageEvents.beforeReload,
  undefined,
  ETargetPlatform.alipay,
);

export * from './export-hooks.js';

export { usePage } from './hooks.js';

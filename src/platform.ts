import { ETargetPlatform, EElementType } from './types.js';
import { mergeObjectKeys } from './utils.js';

export interface IPlatformConstants {
  name: ETargetPlatform;
  tellIfInThisPlatform: () => boolean;
  pageEvents: string[]; // 平台的页面生命周期方法
  pageLifeCycleToMount: string;
  pageLifeCycleToUnmount: string;
  componentEvents: string[]; // 平台的组件生命周期方法
  componentPageEvents: string[]; //平台的组件监听页面的生命周期方法
  blockedProperty: string[]; // 不允许开发者注册使用的属性
  componentLifeCycleToMount: string; // 触发加载 react 组件的生命周期方法
  componentLifeCycleToUnmount: string;
  getPropsFromInstance: (
    instance: any,
    propNames: string[],
  ) => Record<string, any>;
  buildOptions: (
    // 构建喂给小程序框架的 options
    elementType: EElementType,
    //@ts-expect-error
    props,
    //@ts-expect-error
    data,
    //@ts-expect-error
    lifeCycleHandlers,
    //@ts-expect-error
    userEventHandlers,
    //@ts-expect-error
    options,
    //@ts-expect-error
    observers,

    //@ts-expect-error
    componentPageLifeCycleHandlers,
  ) => Record<string, any>;

  supportHandleEventResult: boolean;
}

export interface IWechatProperty {
  [name: string]: {
    type: any;
    value: any;
  };
}

const ifInAlipay = () => {
  //@ts-expect-error
  return typeof my !== 'undefined';
};

const ifInWeChat = () => {
  //@ts-expect-error
  return typeof wx !== 'undefined';
};

export const checkIfPlatformIsLoadCorrectly = function (
  config: IPlatformConstants,
  target: ETargetPlatform,
) {
  if (config.name !== target) {
    const errMsg = `期望的运行平台为 ${target}，但是当前平台配置为 ${config.name}，请检查是否加载了正确的平台配置`;
    throw new Error(errMsg);

    // 这里的判断方法可能不准，有反馈了再改
  } else if (!config.tellIfInThisPlatform()) {
    const errMsg = `期望的运行平台为 ${target}，但是当前运行时环境不是 ${target}，请检查是否加载了正确的平台配置`;
    throw new Error(errMsg);
  }
  return true;
};

// 方便 ts 类型推导
export const commonPageEvents = {
  onLoad: 'onLoad',
  onShow: 'onShow',
  onReady: 'onReady',
  onHide: 'onHide',
  onPullDownRefresh: 'onPullDownRefresh',
  onReachBottom: 'onReachBottom',
  onShareAppMessage: 'onShareAppMessage',
  onPageScroll: 'onPageScroll',
  onTabItemTap: 'onTabItemTap',
  onResize: 'onResize',
  onUnload: 'onUnload',
};

export const alipayPageEvents = {
  onTitleClick: 'onTitleClick',
  onOptionMenuClick: 'onOptionMenuClick',
  beforeTabItemTap: 'beforeTabItemTap',
  onKeyboardHeight: 'onKeyboardHeight',
  onBack: 'onBack',
  onSelectedTabItemTap: 'onSelectedTabItemTap',
  beforeReload: 'beforeReload',
};

export const commonComponentPageEvents = {
  'page:show': 'page:show',
  'page:hide': 'page:hide',
};

export type ComponentPageEvents = keyof typeof commonComponentPageEvents;

/**
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/lifetimes.html
 */
export const wechatComponentPageEvents: Record<ComponentPageEvents, string> = {
  'page:hide': 'hide',
  'page:show': 'show',
};

/**

 * @see https://opendocs.alipay.com/mini/framework/page-detail#events
 */
export const alipayComponentPageEvents: Record<ComponentPageEvents, string> = {
  'page:hide': 'onHide',
  'page:show': 'onShow',
};

export const commonComponentEvents: Record<string, string> = {
  created: 'created',
  attached: 'attached',
  ready: 'ready',
  moved: 'moved',
  detached: 'detached',
};

export const alipayComponentEvents = {
  onInit: 'onInit',
  didMount: 'didMount',
  didUpdate: 'didUpdate',
  deriveDataFromProps: 'deriveDataFromProps',
  didUnmount: 'didUnmount',
};

export const wechatComponentEvents = {
  error: 'error',
};

// 保留字，不允许开发者注册使用
export const blockedProperty = ['mixins', 'methods', 'observers', 'pageEvents'];

export const platformConfig: Record<ETargetPlatform, IPlatformConstants> = {
  [ETargetPlatform.alipay]: {
    name: ETargetPlatform.alipay,
    supportHandleEventResult: true,
    tellIfInThisPlatform: ifInAlipay,
    pageEvents: mergeObjectKeys(commonPageEvents, alipayPageEvents),
    pageLifeCycleToMount: commonPageEvents.onLoad,
    pageLifeCycleToUnmount: commonPageEvents.onUnload,
    componentEvents: mergeObjectKeys(
      commonComponentEvents,
      alipayComponentEvents,
    ),
    componentPageEvents: Object.keys(commonComponentPageEvents),
    componentLifeCycleToMount: alipayComponentEvents.onInit,
    componentLifeCycleToUnmount: alipayComponentEvents.didUnmount,
    blockedProperty,
    getPropsFromInstance(instance) {
      return instance.props;
    },
    buildOptions: (
      elementType,
      props,
      data,
      lifeCycleHandlers,
      userEventHandlers,
      options = null,
      _observers,
      componentPageLifeCycleHandlers,
    ) => {
      if (elementType === EElementType.page) {
        return Object.assign(
          {
            data,
            options,
          },
          lifeCycleHandlers,
          userEventHandlers,
        );
      } else {
        /**
         * 参考这里
         * https://opendocs.alipay.com/mini/framework/component-lifecycle
         */

        const alipayLifeCycle: Record<string, unknown> = {};
        const commonLifetime: Record<string, unknown> = {};
        (Object.keys(lifeCycleHandlers) as string[]).forEach((key) => {
          if (commonComponentEvents[key]) {
            commonLifetime[key] = lifeCycleHandlers[key];
          } else {
            alipayLifeCycle[key] = lifeCycleHandlers[key];
          }
        });

        const pageEvents: Record<string, any> = {};
        Object.keys(componentPageLifeCycleHandlers).map((p) => {
          pageEvents[alipayComponentPageEvents[p as ComponentPageEvents]] =
            componentPageLifeCycleHandlers[p];
        });
        return Object.assign(
          {
            pageEvents,
            props, // 支付宝端：直接传入 props
            data,
            options: Object.assign(
              {
                lifetimes: true,
              },
              options || {},
            ),
            lifetimes: commonLifetime,
          },
          alipayLifeCycle,
          { methods: userEventHandlers },
        );
      }
    },
  },
  [ETargetPlatform.wechat]: {
    name: ETargetPlatform.wechat,
    componentPageEvents: Object.keys(commonComponentPageEvents),
    tellIfInThisPlatform: ifInWeChat,
    supportHandleEventResult: false,
    pageEvents: Object.keys(commonPageEvents),
    pageLifeCycleToMount: commonPageEvents.onLoad,
    pageLifeCycleToUnmount: commonPageEvents.onUnload,
    componentEvents: mergeObjectKeys(
      commonComponentEvents,
      wechatComponentEvents,
    ),
    componentLifeCycleToMount: commonComponentEvents.attached,
    componentLifeCycleToUnmount: commonComponentEvents.detached,
    blockedProperty,
    getPropsFromInstance(instance, propNames) {
      const newProps = {};
      for (const propName of propNames) {
        //@ts-expect-error
        newProps[propName] = instance.data[propName];
      }
      return newProps;
    },
    buildOptions: (
      elementType,
      props,
      data,
      lifeCycleHandlers,
      userEventHandlers,
      options = {},
      observers,
      componentPageLifeCycleHandlers,
    ) => {
      if (elementType === EElementType.page) {
        return Object.assign(
          {
            data,
            options,
          },
          lifeCycleHandlers,
          userEventHandlers,
        );
      } else {
        const defaultProps = props || {};
        const properties: IWechatProperty = {};
        for (const key in defaultProps) {
          if (!Object.prototype.hasOwnProperty.call(defaultProps, key))
            continue;

          const value = defaultProps[key];
          let targetType;
          if (typeof value === 'string') {
            targetType = String;
          } else if (typeof value === 'number') {
            targetType = Number;
          } else if (typeof value === 'boolean') {
            targetType = Boolean;
          } else if (Array.isArray(value)) {
            targetType = Array;
          } else if (typeof value === 'object') {
            if (value === null) {
              targetType = null;
            } else {
              targetType = Object;
            }
          } else {
            throw new Error(
              `不支持的 properties 类型: ${key} - ${typeof value}`,
            );
          }
          properties[key] = {
            type: targetType,
            value,
          };
        }

        const pageLifetimes: Record<string, any> = {};
        Object.keys(componentPageLifeCycleHandlers).map((p) => {
          pageLifetimes[wechatComponentPageEvents[p as ComponentPageEvents]] =
            componentPageLifeCycleHandlers[p];
        });
        return {
          pageLifetimes,
          properties,
          data,
          options,
          observers,
          lifetimes: lifeCycleHandlers || {},
          methods: userEventHandlers || {},
        };
      }
    },
  },
};

import { IWechatInstance } from './test-instance';
import { IWechatProperty } from '../../src/platform.js';

export function mountWechatComponent(
  option,
  props = {},
  onEvent?: (name, payload, option) => void,
): IWechatInstance {
  const propsConfig: IWechatProperty = option.properties || {};
  // 只保留匹配 propsConfig 的 props 值
  const checkPropsMeetDefinition = (
    nextProps = {},
    config: IWechatProperty = {},
  ) => {
    const newProps = {};
    for (const key in nextProps) {
      if (!Object.prototype.hasOwnProperty.call(nextProps, key)) continue;
      const presetConfig = config[key];
      if (!presetConfig) {
        console.warn(
          `[mockWechatComponent] 找不到 key=${key} 的 props 配置，已忽略此字段`,
        );
        continue;
      } else if (nextProps[key]?.constructor === presetConfig.type) {
        newProps[key] = nextProps[key];
      } else {
        const newValue = presetConfig.type.prototype.constructor();
        console.warn(
          `[mockWechatComponent] ${key} 的类型与预设声明不匹配，此次值为 ${nextProps[key]}, 声明类型为 ${presetConfig.type.prototype.constructor.name}。这里将使用 ${newValue} 作为值`,
        );
        newProps[key] = newValue;
      }
    }
    return newProps;
  };

  const initProps = {};
  const properties = option.properties || {};
  for (const key in properties) {
    if (!Object.prototype.hasOwnProperty.call(properties, key)) continue;
    initProps[key] = properties[key].value;
  }

  const triggerObserver = function (instance, observers, updatedKeys) {
    for (const obKey in observers) {
      if (!Object.prototype.hasOwnProperty.call(observers, obKey)) continue;
      for (const updatedKey of updatedKeys) {
        if (obKey.indexOf(updatedKey) >= 0 || obKey === '**') {
          observers[obKey].call(instance, '这里的参数未适配');
          break;
        }
      }
    }
  };
  const mockInstance: IWechatInstance = {
    _data: option?.data || {},
    _props: checkPropsMeetDefinition(initProps, propsConfig),

    setData(data = {}) {
      mockInstance._data = {
        ...(mockInstance._data || {}),
        ...data,
      };

      const observers = option.observers || {};
      triggerObserver(mockInstance, observers, Object.keys(data));
    },
    // 一些控制方法
    updateProps(nextProps) {
      const newProps = checkPropsMeetDefinition(nextProps, propsConfig);

      const updatedKeys: string[] = [];
      for (const key in newProps) {
        if (newProps[key] !== mockInstance._props[key]) {
          updatedKeys.push(key);
        }
      }
      if (!updatedKeys.length) return;

      mockInstance._props = newProps;
      // 触发 observer
      const observers = option.observers || {};
      triggerObserver(mockInstance, observers, updatedKeys);
    },
    callMethod(methodName, ...args) {
      return option.methods[methodName]?.call(mockInstance, ...args);
    },
    callLifecycle(lifecycleName, ...args) {
      return option.lifetimes[lifecycleName]?.call(mockInstance, ...args);
    },
    unmount() {
      return option.detached?.call(mockInstance);
    },
    triggerEvent(eventName, payload, options) {
      onEvent?.(eventName, payload, options);
    },
    get data() {
      return {
        ...mockInstance._data,
        ...mockInstance._props,
      };
    },
    get properties() {
      return {
        ...mockInstance._data,
        ...mockInstance._props,
      };
    },
  };

  mockInstance.callLifecycle('created');

  mockInstance.updateProps(props); // 这时候再 dispatch 真正的 props
  return mockInstance;
}

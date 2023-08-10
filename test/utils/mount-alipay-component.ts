import { shallowCompare } from '../../src/utils';
import { IAlipayInstance } from './test-instance';

export function mountAlipayComponent(
  option,
  props = {},
  onSetData?: (any) => void,
): IAlipayInstance {
  const mockInstance = {
    $id: `component-C-${Math.random()}`,
    data: option?.data || {},
    props,
    setData(data = {}) {
      mockInstance.data = {
        ...(mockInstance.data || {}),
        ...data,
      };
      option.deriveDataFromProps.call(mockInstance, mockInstance.props);
      onSetData?.(data);
    },
    // 一些控制方法
    updateProps(nextProps) {
      if (shallowCompare(nextProps, mockInstance.props)) return;
      option.deriveDataFromProps.call(mockInstance, nextProps);
      mockInstance.props = nextProps;
    },
    callMethod(methodName, ...args) {
      return option.methods[methodName]?.call(mockInstance, ...args);
    },
    callLifecycle(lifecycleName, ...args) {
      if (!option.options?.lifetimes) {
        return;
      }
      return option.lifetimes?.[lifecycleName]?.call(mockInstance, ...args);
    },
    unmount() {
      return option.didUnmount?.call(mockInstance);
    },
  };

  if (option.onInit) {
    option.onInit.call(mockInstance);
  }
  mockInstance.callLifecycle('created');
  return mockInstance;
}

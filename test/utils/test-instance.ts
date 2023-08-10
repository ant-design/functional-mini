export interface ITestInstance {
  setData: (data?: Record<string, any>) => void;
  updateProps: (props: Record<string, any>) => void;
  callMethod: (methodName: string, ...args) => any;
  callLifecycle: (lifecycleName: string, ...args) => any;
  unmount: () => void;
  data: Record<string, any>;
  triggerEvent?: (
    eventName: string,
    payload: any,
    option: Record<string, any>,
  ) => void;
}

export interface IWechatInstance extends ITestInstance {
  properties: Record<string, any>;
  _data: Record<string, any>;
  _props: Record<string, any>;
}

export interface IAlipayInstance extends ITestInstance {
  $id: string;
  props: Record<string, any>;
}

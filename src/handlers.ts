import { log, error, time, timeEnd } from './utils.js';

export type TFunctionImpl = (...args: any[]) => any;

interface IImplInfo {
  fn: TFunctionImpl;
  bindContext: any;
  off?: () => void; // 对应的反注册方法
}

/*
管理所有事件处理函数，并生成一个代理函数，允许用户替换其中的某些实现
受制于小程序的运行时机制，在 locked 之后，不允许变更 handlerNames
*/
export default class HandlersController {
  elementTag = ''; // 主要是 debug 使用
  locked = false; // 是否已经锁定，锁定之后不允许新增 handler
  executionInProgress = false;
  executionQueue: Array<() => void> = [];
  handlerNames: string[] = [];
  handlerImpl: Record<string, IImplInfo[]> = {};

  constructor(elementTag = '') {
    this.elementTag = elementTag;
  }

  addHandler(
    name: string,
    bindContext?: any,
    impl?: TFunctionImpl,
    disableMultiImpl?: boolean,
  ): () => void {
    if (this.locked && this.handlerNames.indexOf(name) < 0) {
      throw new Error(`不允许动态新增 handler: ${name}`);
    }

    if (impl && !bindContext) {
      throw new Error(`bindContext 不能为空，运行时需要用到它`);
    }

    if (bindContext && !impl) {
      throw new Error('missing impl');
    }

    if (typeof name !== 'string') {
      throw new Error(
        `name 的类型不合法（${typeof name}），它应该是一个字符串`,
      );
    } else if (typeof impl !== 'function' && typeof impl !== 'undefined') {
      throw new Error(`impl 的类型不合法（${typeof impl}），它应该是一个函数`);
    }

    if (this.handlerNames.indexOf(name) < 0) {
      this.handlerNames.push(name);
    }
    this.handlerImpl[name] = this.handlerImpl[name] || [];

    const self = this;
    if (!impl) {
      return () => {};
    }

    if (
      disableMultiImpl &&
      this.getHandlersByName(name, bindContext).length > 0
    ) {
      throw new Error(`${name} 已经注册了一个实现，不能再新增`);
    }
    const implInfo: IImplInfo = {
      // 裹一层，把 off 方法收集下来
      fn(this: any, ...args) {
        if (!this)
          throw new Error('missing context, cannot find matching handler');
        const ctx = self.filterContext(bindContext, this);
        // context 不匹配，不处理
        if (!ctx) throw new Error('handler context mismatch, refuse executing');
        try {
          const ret = impl.apply(this, args);
          if (typeof ret === 'function') {
            implInfo.off = ret; // 这个 off 其实已经不用了
          } else {
            return ret; // 如果不是 function，认为这个返回值有用，不是 off
          }
        } catch (e) {
          error(
            `${self.elementTag} ${name} 执行出错，错误信息：${
              (e as Error).message
            }`,
          );
          throw e;
        }
      },
      bindContext,
    };

    this.handlerImpl[name].push(implInfo);

    return () => {
      log(`off ${name} - ${this.elementTag}`);
      const handlers = this.handlerImpl[name]; // 这里闭包里有明确的 implInfo, 不需要根据 context 过滤

      if (!handlers) {
        const msg = `没有找到 ${name} 对应的实现，是否已经被 reset 了 ？请检查生命周期流程`;
        error(msg);
        throw new Error(msg);
      }
      const index = handlers.indexOf(implInfo);
      const offFunction = handlers[index].off;
      if (offFunction) {
        try {
          offFunction.call(undefined);
        } catch (e) {
          error(`执行 ${name} 的反注册方法时出错：`);
          error(e);
          throw e;
        }
      }
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    };
  }

  lockHandlerNames() {
    this.locked = true;
  }

  resetAllImpl() {
    this.handlerImpl = {};
  }

  getHandlersByName(name: string, context: any): IImplInfo[] {
    if (!context) throw new Error('context is required');
    return this.handlerImpl[name].filter((handler) => {
      return this.filterContext(handler.bindContext, context);
    });
  }

  callHandlers(name: string, context: any, args: any[]) {
    const controller = this;
    const handlers = (controller.handlerImpl[name] || []).filter((handler) => {
      const targetCtx = controller.filterContext(handler?.bindContext, context);
      return !!targetCtx;
    }); // 过滤并复制出来，防止执行过程中有人往里面塞东西造成乱序
    const callId = `${controller.elementTag}-handlerCalled-${name}-${Math.floor(
      Math.random() * 1000,
    )}`;

    const tipText = `${callId} - handlers count ${handlers.length}`;
    log(Date.now(), tipText);
    let returnValue: any;
    for (let i = 0; i < handlers.length; i++) {
      log(Date.now(), `${tipText} - executing ${i + 1}/${handlers.length}`);
      time(callId);
      const handler = handlers[i];
      const ret = handler.fn.apply(context, args);
      if (i === 0) {
        // 只返回第一个
        returnValue = ret;
      }
      timeEnd(callId);
    }

    return returnValue;
  }

  // 返回给 appx 的可能是一个 Promise，无论 appx 等不等，这里都会串行执行
  getHandlersImplProxy() {
    if (!this.locked) {
      throw new Error('please lock the handler names first');
    }

    const handlers = this.handlerNames.reduce((acc, handlerName) => {
      const controller = this;
      //@ts-expect-error
      acc[handlerName] = function (this: any, ...args) {
        // 这里要保留调用方的 this
        const appxCaller = this;
        if (!appxCaller) {
          console.warn('cannot find appx caller instance');
        }
        // deriveData 的时候，异步可能会有问题，直接改同步看看疗效
        let err;
        let ret;
        try {
          ret = controller.callHandlers(handlerName, appxCaller, args);
        } catch (e) {
          err = e;
        }

        // await unlock();
        // 防止后续所有事情被死锁
        if (err) throw err;

        // setTimeout(() => {
        // unlock();
        // }, 0);

        return ret;
        // return Promise.resolve(
        //   (async () => {

        //   })(),
        // );
      };
      return acc;
    }, {});

    return handlers;
  }

  //@ts-expect-error
  private filterContext(bindContext, nowContext) {
    if (typeof bindContext === 'function') {
      if (!bindContext(nowContext)) {
        return false;
      }
    } else if (bindContext !== nowContext) {
      return false;
    }
    return nowContext;
  }
}

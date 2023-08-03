import { preactHooks, preact, serverRender } from './3rd-party/preact.js';
import { virtualDocument } from './3rd-party/virtual-document.js';
export { act } from './3rd-party/preact-test-utils.js';

export { serverRender };

const { createContext, h, render, options } = preact;

export { preactHooks };

export type VNode = preact.VNode;

export const React = {
  createElement: h,
  h: h,
  createContext,
  render,
  ...preactHooks,
};

options.requestAnimationFrame = (cb) => {
  return setTimeout(cb);
};

options.debounceRendering = (cb) => {
  return setTimeout(cb);
};

export const mountElement = function (element: any) {
  const entryDom = virtualDocument.createElement('div') as any;
  render(element, entryDom);

  return {
    unmount() {
      render(h('div', {}, 'unmounted'), entryDom);
    },

    //@ts-expect-error
    update(newElement) {
      render(newElement, entryDom);
    },

    toString() {
      return entryDom.innerHTML;
    },

    dom: entryDom,
  };
};

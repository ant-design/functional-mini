import { preactHooks, preact, serverRender } from './3rd-party/preact.js';
import { virtualDocument } from './3rd-party/virtual-document.js';
import { act } from './3rd-party/preact-test-utils.js';

const { createContext, h, render, options } = preact;
const {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
  useLayoutEffect,
  useDebugValue,
} = preactHooks;

const createElement = h;

options.requestAnimationFrame = (cb) => {
  return setTimeout(cb);
};

options.debounceRendering = (cb) => {
  return setTimeout(cb);
};

export {
  act,
  createElement,
  createContext,
  serverRender,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
  useLayoutEffect,
  useDebugValue,
};

export type VNode = preact.VNode;

export const mountElement = function (element: any) {
  const entryDom = virtualDocument.createElement('div') as unknown as Element;
  render(element, entryDom);
  return {
    unmount(): void {
      render(h('div', {}, 'unmounted'), entryDom);
    },

    update(newElement: Element): void {
      render(newElement, entryDom);
    },

    toString(): string {
      return entryDom.innerHTML;
    },
    dom: entryDom,
  };
};

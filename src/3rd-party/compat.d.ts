import * as preactCompat from 'preact/compat';

export default preactCompat;

export {
  Children,
  PureComponent,
  StrictMode,
  Suspense,
  SuspenseList,
  cloneElement,
  createFactory,
  createPortal,
  findDOMNode,
  forwardRef,
  hydrate,
  isValidElement,
  lazy,
  memo,
  render,
  startTransition,
  unmountComponentAtNode,
  unstable_batchedUpdates,
  useDeferredValue,
  useInsertionEffect,
  useSyncExternalStore,
  useTransition,
  version,
} from 'preact/compat';

export * from 'preact';
export {
  useCallback,
  useContext,
  useDebugValue,
  useEffect,
  useErrorBoundary,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'preact/hooks';

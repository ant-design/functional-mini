let logSwitch = true;

export const setLogSwitch = (on: boolean) => {
  logSwitch = on;
};

//@ts-expect-error
export const log = (...args) => {
  if (!logSwitch) return;

  console.log.apply(console, args);
};

//@ts-expect-error
export const error = (...args) => {
  console.error.apply(console, args);
};

export const time = (label?: string) => {
  if (!logSwitch) return;

  console.time(label);
};

export const timeEnd = (label?: string) => {
  if (!logSwitch) return;
  console.timeEnd(label);
};

//@ts-expect-error
export const shallowCompare = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  if (obj1 === null || obj2 === null) return false;
  if (Array.isArray(obj1) || Array.isArray(obj2)) return false;
  if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;
  for (const key in obj1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
};

// 这么做是为了测试方便，隔离一些全局变量
export enum EComponent2Status {
  VALID = 'VALID',
  INVALID = 'INVALID',
  UNKNOWN = 'UNKNOWN',
}

let component2Status = EComponent2Status.UNKNOWN;
export const getComponent2Status = () => {
  return component2Status;
};

export const updateComponent2Status = (status?: EComponent2Status) => {
  if (status) {
    component2Status = status;
    //@ts-expect-error
  } else if (typeof my !== 'undefined') {
    //@ts-expect-error
    component2Status = my.canIUse('component2')
      ? EComponent2Status.VALID
      : EComponent2Status.INVALID;
  }
};

let incrementalId = 0;
const instanceKeyId = '_functional_instance_id_';

//@ts-expect-error
export function getIdFromAppxInstance(appxInstance) {
  if (!appxInstance) throw new Error('appxInstance param is falsy');
  let id;
  // 支付宝端
  if (appxInstance.$id) {
    id = `${appxInstance.$id}-${appxInstance.$page?.$viewId || ''}-${
      appxInstance.is || 'page'
    }`; /* 页面 */
  } else if (appxInstance[instanceKeyId]) {
    id = appxInstance[instanceKeyId];
  } else {
    id = `instance-${incrementalId++}`;
    appxInstance[instanceKeyId] = id;
  }
  if (!id) throw new Error('failed to identify appxInstance.$id');
  return id;
}

export const instanceKeyPropNames = '_functional_instance_prop_names_';

export function mergeObjectKeys(
  ...objects: Record<string, unknown>[]
): string[] {
  let res: string[] = [];
  for (const iterator of objects) {
    res = res.concat(Object.keys(iterator));
  }
  return res;
}

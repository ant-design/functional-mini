import { describe, expect, test } from 'vitest';
import { getIdFromAppxInstance, mergeKeys } from '../src/utils';

describe('utils', () => {
  test('test mergeKeys', () => {
    expect(mergeKeys({ a: 1 }, { b: 2 })).toEqual(['a', 'b']);
  });
  test('instance id', async () => {
    const mockInstance = {
      $id: 'aa',
    };
    expect(getIdFromAppxInstance(mockInstance)).toEqual('aa--page');

    const mockComponent = {
      $id: 'bb',
      $page: {
        $viewId: 'cc',
      },
      is: '/component/aa',
    };
    expect(getIdFromAppxInstance(mockComponent)).toEqual('bb-cc-/component/aa');

    const mockInstanceE = {};
    expect(getIdFromAppxInstance(mockInstanceE)).toEqual('instance-0');
    expect(getIdFromAppxInstance(mockInstanceE)).toEqual('instance-0');

    const mockInstanceF = {};
    expect(getIdFromAppxInstance(mockInstanceF)).toEqual('instance-1');
  });
});

import { expect, test } from 'vitest';
import { vi } from 'vitest';
import { mountWechatComponent } from './common';
import { delay } from '../utils/utils';

test('测试 mountWechatComponent', async () => {
  const c = vi.fn();
  const ob1 = vi.fn();
  const ob2 = vi.fn();
  const ob3 = vi.fn();
  const ob4 = vi.fn();
  const ob5 = vi.fn();

  const opt = {
    properties: {
      foo: {
        type: String,
        value: 'abc',
      },
      bar: {
        type: Number,
        value: null,
      },
      bbloon: {
        type: Boolean,
        value: false,
      },
    },
    data: {
      ddd: 'aaa',
    },
    lifetimes: {
      attached() {
        c();
        const self = this;
        setTimeout(() => {
          self.setData({ ddd: '2222' });
        }, 1);
      },
    },
    observers: {
      '**': ob1,
      'foo, bbloon': ob2,
      'bar, bbloon': ob3,
      not_exits: ob4,
      ddd: ob5,
    },
  };
  expect(c).toBeCalledTimes(0);
  const instance = mountWechatComponent(opt);
  expect(c).toBeCalledTimes(1);
  expect(instance.data).toEqual(instance.properties);
  expect(instance.data).toMatchSnapshot();

  // 各种 observers
  // 没变
  instance.updateProps({
    foo: 'abc',
    bar: 0,
    bbloon: false,
  });

  expect(ob1).toBeCalledTimes(0);
  expect(ob2).toBeCalledTimes(0);
  expect(ob3).toBeCalledTimes(0);
  expect(ob4).toBeCalledTimes(0);

  instance.updateProps({
    foo: 'abc',
    bar: 123,
    bbloon: false,
  });

  expect(ob1).toBeCalledTimes(1);
  expect(ob2).toBeCalledTimes(0);
  expect(ob3).toBeCalledTimes(1);
  expect(ob4).toBeCalledTimes(0);
  expect(instance.data).toMatchSnapshot();

  expect(ob5).toBeCalledTimes(0);
  await delay(5);
  expect(instance.data).toMatchSnapshot();
  expect(ob5).toBeCalledTimes(1);
});

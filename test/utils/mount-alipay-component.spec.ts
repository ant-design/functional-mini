import { describe, expect, it, vi } from 'vitest';
import { mountAlipayComponent } from './mount-alipay-component';

describe('test mountAlipayComponent', () => {
  it('test lifetimes call', () => {
    const createdLogic = vi.fn();
    const lifetimes = {
      created() {
        createdLogic();
      },
    };

    // 如果没有配置 options, 则不会调用 lifetimes
    mountAlipayComponent({
      lifetimes,
    });
    expect(createdLogic).toBeCalledTimes(0);

    mountAlipayComponent({
      ...lifetimes,
    });
    expect(createdLogic).toBeCalledTimes(0);

    // 如果配置 options, 则不会调用 lifetimes
    mountAlipayComponent({
      options: {
        lifetimes: true,
      },
      lifetimes,
    });
    expect(createdLogic).toBeCalledTimes(1);
  });
});

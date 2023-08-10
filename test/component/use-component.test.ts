import { describe } from 'node:test';
import { expect, it } from 'vitest';
import {
  alipayComponent,
  useComponent,
  wechatComponent,
} from '../../src/component.js';
import { mountAlipayComponent, mountWechatComponent } from '../utils/common';

describe('test useComponent', () => {
  it('wechat', () => {
    let flag;
    const option = mountWechatComponent(
      wechatComponent(() => {
        flag = useComponent();
        return {};
      }),
    );
    expect(flag === option).toBe(true);
  });

  it('alipay', () => {
    let flag;
    const option = mountAlipayComponent(
      alipayComponent(() => {
        flag = useComponent();
        return {};
      }),
    );
    expect(flag === option).toBe(true);
  });
});

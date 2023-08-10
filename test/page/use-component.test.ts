import { describe } from 'node:test';
import { expect, it } from 'vitest';
import { alipayPage, wechatPage, usePage } from '../../src/page.js';
import { mountAlipayPage } from '../utils/common.js';

describe('test usePage', () => {
  it('wechat', () => {
    let flag;
    const option = mountAlipayPage(
      wechatPage(() => {
        flag = usePage();
        return {};
      }),
    );
    expect(flag === option).toBe(true);
  });

  it('alipay', () => {
    let flag;
    const option = mountAlipayPage(
      alipayPage(() => {
        flag = usePage();
        return {};
      }),
    );
    expect(flag === option).toBe(true);
  });
});

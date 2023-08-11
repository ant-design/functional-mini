# functional-mini

![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/ant-design/functional-mini/check.yml)
![npm](https://img.shields.io/npm/v/functional-mini) [![codecov](https://codecov.io/gh/ant-design/functional-mini/branch/main/graph/badge.svg?token=DPV84U7YP8)](https://codecov.io/gh/ant-design/functional-mini) ![npm](https://img.shields.io/npm/dw/functional-mini)

## 快速开始

我们以最简单的计数器页面为例。

### step 1. 安装依赖

执行 `npm i functional-mini --save`

### step 2. 编写页面的逻辑

使用 Hooks 编写逻辑，然后利用 `alipayPage`, `wechatPage` 生成对应平台的 option 传递给 Page。

```javascript
import {
  useState,
  useEvent,
  alipayPage,
  wechatPage,
} from 'functional-mini/page'; // 从 functional-mini/page 引入 hooks

// 编写页面逻辑
const Counter = ({ query }) => {
  //通过 props 获取 query
  const [count, setCount] = useState(0);
  // 绑定视图层的 add 事件
  useEvent(
    'add',
    () => {
      setCount(value + 1);
    },
    [],
  );

  // 将这些值提交到视图层
  return {
    count,
    isOdd: count / 2 === 1,
  };
};

// 生成配置，并返回给小程序框架的构造函数
Page(alipayPage(Counter)); // 支付宝小程序使用 alipayPage
// 或
Page(wechatPage(Counter)); // 微信小程序使用 wechatPage
```

### step 3. 视图层代码保持不变

视图层代码和各端原生规范一致，没有任何变化。<br />这里是把 `{counter: number, isOdd: boolean}`渲染到视图层、并绑定 `add`事件的示意代码。

```html
<!-- 支付宝 -->
<button onTap="add">
  <text>{{count}}</text>
  <text>isOdd: {{isOdd}}</text>
</button>

<!-- 微信 -->
<button bind:tap="add">
  <text>{{count}}</text>
  <text>isOdd: {{isOdd}}</text>
</button>
```

至此，一个简单的计数器页面就实现完成了！

详细的使用文档可以看 [这里](./doc.md)

## License

Copyright (c) 2023-present, Ant Group

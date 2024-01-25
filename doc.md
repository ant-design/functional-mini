# functional-mini 使用文档

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
  useEvent('add', () => {
    setCount(count + 1);
  });

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

### 和普通 React 组件的异同

1. `functional-mini`运行在小程序的逻辑层，它的返回结果是一个 JSON , 等价于 Page 和 Component 的 data。逻辑层不能写 JSX。
2. 使用`useEvent`注册视图层的事件监听
3. 逻辑层没有 DOM，所以无法使用 `useContext`
4. React 组件的生命周期与组件 props 更新、销毁一致。如 onLoad 对应函数组件 mount、onUnload 对应 unmount、props 更新会触发函数重新运行。其他更多事件可以使用 hooks 订阅

```javascript
const Counter = () => {
  const [count, setCount] = useState(0);

  useOnShow(() => {
    console.log(count);
  });
};
```

## 常见用法

### 注册页面生命周期

下面是页面生命周期与 hooks 对应关系，详细参数可以看 [支付宝小程序](https://opendocs.alipay.com/mini/framework/page-detail) 与 [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html) 文档。

<table>
  <tr>
    <th>小程序页面生命周期</th>
    <th><code>import { hook } from 'functional-mini/page'<code></th>
  </tr>
  <tr>
    <td>onLoad<br />onUnload</td>
    <td>
      <pre><code>useEffect(() => {
  // 相当于 onLoad。query 参数在函数 Props 中获取
  return () => {
    // 相当于 onUnload
  };
}, []);</code></pre>
    </td>
  </tr>
  <tr>
    <td>onShow</td>
    <td>useOnShow</td>
  </tr>
  <tr>
    <td>onReady</td>
    <td>useOnReady</td>
  </tr>
  <tr>
    <td>onHide</td>
    <td>useOnHide</td>
  </tr>
</table>

### 注册页面事件

下面是页面生命周期与事件处理的 hooks，详细参数可以看 [支付宝小程序](https://opendocs.alipay.com/mini/framework/page-detail) 与 [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html) 文档。

#### 微信小程序

| 微信小程序页面事件 | `import { hook } from 'functional-mini/page'` |
| ------------------ | --------------------------------------------- |
| onPullDownRefresh  | useOnPullDownRefresh                          |
| onReachBottom      | useOnReachBottom                              |
| onShareAppMessage  | useOnShareAppMessage                          |
| onPageScroll       | useOnPageScroll                               |
| onTabItemTap       | useOnTabItemTap                               |
| onResize           | useOnResize                                   |

#### 支付宝小程序

| 支付宝小程序页面事件 | `import { hook } from 'functional-mini/page'` |
| -------------------- | --------------------------------------------- |
| onPullDownRefresh    | useOnPullDownRefresh                          |
| onReachBottom        | useOnReachBottom                              |
| onShareAppMessage    | useOnShareAppMessage                          |
| onPageScroll         | useOnPageScroll                               |
| onTabItemTap         | useOnTabItemTap                               |
| onTitleClick         | useOnTitleClick                               |
| onOptionMenuClick    | useOnOptionMenuClick                          |
| beforeTabItemTap     | useBeforeTabItemTap                           |
| onKeyboardHeight     | useOnKeyboardHeight                           |
| onBack               | useOnBack                                     |
| onSelectedTabItemTap | useOnSelectedTabItemTap                       |
| beforeReload         | useBeforeReload                               |

### 注册组件生命周期

下面是小程序自定义组件生命周期和 hooks 对应关系。详细参数可以看 [支付宝小程序](https://opendocs.alipay.com/mini/framework/component-lifecycle?pathHash=9b628e01) 与 [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html) 文档。

#### 微信小程序

<table>
  <tr>
    <th>微信小程序</th>
    <th><code>import { hook } from 'functional-mini/component'</code></th>
  </tr>
  <tr>
    <td>created<br />detached</td>
    <td>
      <pre><code>useEffect(() => {
  // 相当于 created
  return () => {
    // 相当于 detached
  };
}, []);</code></pre>
    </td>
  </tr>
  <tr>
    <td>attached</td>
    <td>useAttached</td>
  </tr>
  <tr>
    <td>ready</td>
    <td>useReady</td>
  </tr>
  <tr>
    <td>moved</td>
    <td>useMoved</td>
  </tr>
</table>

#### 支付宝小程序

<table>
  <tr>
    <th>支付宝小程序</th>
    <th><code>import { hook } from 'functional-mini/component'</code></th>
  </tr>
  <tr>
    <td>onInit<br />didUnmount</td>
    <td>
      <pre><code>useEffect(() => {
  // 相当于 onInit
  return () => {
    // 相当于 didUnmount
  };
}, []);</code></pre>
    </td>
  </tr>
  <tr>
    <td>created<br />detached</td>
    <td>没有对应，可以使用 onInit 与 didUnmount 代替。</td>
  </tr>
  <tr>
    <td>attached</td>
    <td>useAttached</td>
  </tr>
    <tr>
    <td>didMount</td>
    <td>useDidMount</td>
  </tr>
  <tr>
    <td>ready</td>
    <td>useReady</td>
  </tr>
    <tr>
    <td>deriveDataFromProps</td>
    <td>我们可以在<strong>渲染过程中更新 state</strong>，以达到实现 deriveDataFromProps 的目的。</td>
  </tr>
  <tr>
    <td>didUpdate</td>
    <td>
      <pre><code>useEffect(() => {
  // 相当于 didUpdate
}, [deps]);</code></pre>
    </td>
  </tr>
  <tr>
    <td>moved</td>
    <td>useMoved</td>
  </tr>
</table>

### 设置页面的初始 data

在组件真正运行前，functional 会在小程序里执行一次预渲染（理解为 server-side-render / SSR） ，收集返回值，这里的数据会作为页面初始化的 data。<br />预渲染时，所有的 useEffect 、生命周期 hooks 都不会被触发。

```javascript
const Counter = function () {
  const [counter, setCounter] = useState(0);
  useOnLoad(() => console.log('Load'), []);
  useEffect(() => {
    setCounter(1); // 不会在预渲染时触发
  }, []);

  return {
    // 会被收集
    foo: 'aa',
    counter,
  };
};

/*
Page({
  data: { // <---- 收集到的是这个数据
    foo: 'aa',
    counter: 0,
  }
});
*/
```

### 注册视图层事件

我们可以使用 `useEvent` 这个 hook 来注册事件。

```html
<!-- 支付宝注册点击事件 -->
<button onTap="clickButton">Click</button>

<!-- 微信注册点击事件 -->
<button bind:tap="clickButton">Click</button>
```

下面是在 useCounter 这个自定义的 hooks 注册 `clickButton` 的例子。

```typescript
import { useEvent } from 'functional-mini/page'; // 在小程序页面
import { useEvent } from 'functional-mini/component'; // 在小程序组件里

const useCounter = () => {
  const [value, setValue] = useState(0);
  useEvent('clickButton', () => {
    setValue(value + 1);
  });
  return value;
};
```

### 精细控制 setData 频次

函数式组件返回 JSON 后，`functional-mini`会对每个 key 做浅比较，如果和小程序实例上的数据不一致，就自动触发 setData 完成同步。<br />如果有场景需要减小 setData 的性能损耗，可以使用 `useMemo` 把不变化的数据固定下来。<br />这里是一个使用案例：

```diff
import { useMemo } from 'functional-mini/page';

const MyPage = function(props) {
  const maxCount = props.query.max;

- // 每次都创建新的 longList 对象，会对最终的 setData 性能有损耗
- const longList = [];
- for(let i = 0; i <= maxCount; i++) {
-   longList.push('big content');
- }

+ // 固定依赖项，减少更新次数
+	const longList = useMemo(() => {
+   const longList = [];
+   for(let i = 0; i <= maxCount; i++) {
+     longList.push('big content');
+   }
+   return longList;
+ }, [maxCount])

	return {
    ...data, // 其他数据
    longList,
  };
}
```

### 组件间通信与事件

我们以受控的 Counter 组件为例，介绍 functional 如何开发一个组件。

```html
<!-- 下面是父组件调用 counter 的代码 -->

<!-- 微信 -->
<counter value="{{counterValue}}" bind:onChange="handleChange" />

<!-- 支付宝 -->
<counter value="{{counterValue}}" onChange="handleChange" />

<!-- 下面是 counter 视图层的实现 -->

<!-- 微信 -->
<button class="counter" bind:tap="onClickCounter">{{value}}</button>

<!-- 支付宝 -->
<button class="counter" onTap="onClickCounter">{{value}}</button>
```

#### 在自定义组件里监听页面生命周期方法

我们可以使用 `usePageShow` , `usePageHide` 这两个 hooks 监听页面的 show 与 hide 事件。

```typescript
import { usePageShow } from 'functional-mini/component';

const useCounter = () => {
  const [value, setValue] = useState(0);
  usePageShow(() => {
    // 会在页面 show 的时候触发
    console.log('page show');
  });
  return value;
};
```

#### 获取父组件传递的参数

我们可以通过 props 获取父组件的传入的 props。 和 page 不同，我们需要通过 `alipayComponent`, `wechatComponent` 的第二个参数定义 props 的类型。

```javascript
import {
  wechatComponent,
  alipayComponent,
} from 'functional-mini/component';


function Counter = (props) => {
  console.log(props.value) // 通过 props 获取
}

const defaultProps = {
  value: 1
}

Component(
  alipayComponent(Counter, defaultProps),
);

Component(
  wechatComponent(Counter, defaultProps),
);

```

#### 将函数传递给子组件

有时我们需要把函数传递给子组件，用来定制组件的内部功能。比如在 Antd Mini 的表单组件中，常常需要外部业务传入 `onFormat` 方法，用来指定文案的展示形式。

- 在微信端，我们需要使用 `useEvent` 注册函数并设置 `{ handleResult: true }`, 然后我们就可以在子组件的 props 里获取到父组件传递的函数。在 handleResult 开启后，事件函数会挂载到组件实例的 data 上，所以 useEvent 不能使用 properties 存在的事件名。
- 在支付宝端，我们只需要使用 `useEvent` 注册函数即可。

```xml
<!-- 微信小程序 -->
<child onFormat="{{ onFormat }}" />
<!-- 支付宝小程序 -->
<child onFormat="onFormat" />
<!-- 兼容两个平台 -->
<child onFormat="{{ onFormat? onFormat : 'onFormat'}}" />
```

```javascript
import { useEvent } from 'functional-mini/component';

// 父组件
const Counter = (props) => {
  useEvent(
    'onFormat',
    () => {
      return 'value';
    },
    {
      // 因为支付宝小程序原生支持传递函数
      // 所以此变量只在微信小程序生效
      handleResult: true,
    },
  );
  return {};
};

// 子组件
const CounterChild = (props) => {
  let formatText;
  if (props.onFormat) {
    formatText = props.onFormat();
  }
  return { formatText };
};
```

#### 子组件向父组件传递数据

- 在微信端，我们通过 useComponent 获取组件实例 ， 然后通过 `component.triggerEvent('eventname', value)`的方式向父组件传递数据。
- 为支付宝端，我们通过 `props.eventname(value)` 向父组件传递数据。

```javascript
import { wechatComponent, useComponent } from 'functional-mini/component';

const Counter = (props) => {
  const { triggerEvent } = useComponent();

  useEvent('onClickCounter', () => {
    triggerEvent('handleChange', props.value + 1);
  });

  return {};
};
```

```javascript
import { wechatComponent } from 'functional-mini/component';

const Counter = (props) => {
  useEvent('onClickCounter', () => {
    props.handleChange(props.value + 1);
  });

  return {};
};
```

#### 获取页面、组件实例

在页面里可以通过 usePage 获取页面实例。 相当于小程序 Page 和 Component 的 `this`。<br />⚠️ 不要使用页面、组件实例调用 data , setData 可能会发生不可预期的事情。

```typescript
import { usePage } from 'functional-mini/page';

const MyPage = (props) => {
  const component = usePage();

  return {};
};
```

在组件里可以通过 useComponent 获取组件实例

```typescript
import { useComponent } from 'functional-mini/component';

const MyComponent = (props) => {
  const component = useComponent();
  return {};
};
```

## FAQ

### 为何无法使用 JSX？

小程序采用的是渲染与逻辑隔离的双线程架构。为了降低项目的复杂度，我们选择正视它的存在，探索适合双线程环境的新技术解决方案，而不是试图向开发者隐藏这些限制。<br />JSX 语法的一个主要特性就是视图和逻辑的混写，这与我们的设计理念显然是冲突的，因此我们决定在这个项目中剔除 JSX。<br />当然，我们也不排除在未来重新引入 JSX 的可能性，但前提是它能带来更显著的优势，比如更好的 IDE 支持和 TSX 类型等。然而，即便如此，JSX 仍将受到一些限制，比如视图必须是独立的文件，并不能像在普通的 React 项目中那样与逻辑代码混写。

### 关于 React 运行时环境

`function-mini` 使用了 [preact](https://preactjs.com/) 作为 React 运行时基础。由于运行时的特殊性，我们做了一些环境适配工作（如替换了几个 document 的接口实现），并将适配后的 preact 内置在了库中。<br />适配过程主要体现在 rollup 的构建插件中，如果感兴趣，你可以在 [这里](https://github.com/ant-design/functional-mini/blob/main/scripts/rollup-plugins/virtual-document.ts)看到细节。

### `functional-mini` 尚不是一个跨端开发的库

`functional-mini`目前分别适配了支付宝和微信端的运行环境，但它尚不能帮你实现“一次开发多端运行”。<br />主要原因有：

1. 各端视图层编写语法不同
2. 各端生命周期的触发顺序、参数细节、事件方法都有差异
3. 我们没有提供抹平各端 JSAPI 的库

如有跨端需求，你可以尝试自行实现必要的上层封装。<br />也欢迎大家在 issue 中分享自己的实践方案，共同讨论交流。

## API 列表

### page

page 相关的 API 统一从 `functional-mini/page` 导入。

#### 页面构造函数

- alipayPage(pageHook)

  在支付宝小程序中使用，构造传递给 Page 的 option

- wechatPage(pageHook)

  在微信小程序中使用，构造传递给 Page 的 option

#### functional hooks

- usePage()
  获取页面实例

#### React hooks

下面是 React 内置的hooks, 详细用法可以看 [React](https://react.dev/reference/react) 官方文档。

- useState
- useReducer
- useEffect
- useRef
- useCallback
- useMemo

#### 生命周期与页面事件 hooks

详细参数可以看 [支付宝小程序](https://opendocs.alipay.com/mini/framework/page-detail) 与 [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html) 文档。

- useOnShow
- useOnReady
- useOnHide
- useOnPullDownRefresh
- useOnReachBottom
- useOnShareAppMessage
- useOnPageScroll
- useOnTabItemTap
- useOnResize
- useOnTitleClick
- useOnOptionMenuClick
- useBeforeTabItemTap
- useOnKeyboardHeight
- useOnBack
- useOnSelectedTabItemTap
- useBeforeReload

### Component

component 相关的 API 统一从 `functional-mini/component` 导入。

#### 组件构造函数

- alipayComponent(componentHook, defaultProps)

  在支付宝小程序中使用，构造传递给 Component 的 option

- wechatComponent(componentHook, defaultProps)

  在微信小程序中使用，构造传递给 Component 的 option

  ```typescript
  const functionOption = wechatComponent(Counter, {
    label: 'button', // 我们会根据 defaultProps 的类型生成组件的 properties
  });
  ```

#### functional hooks

- useComponent

  获取组件实例

#### React hooks

下面是 React 内置的hooks, 详细用法可以看 [React](https://react.dev/reference/react) 官方文档。

- useState
- useReducer
- useEffect
- useRef
- useCallback
- useMemo

#### 生命周期与页面事件 hooks

详细参数可以看 [支付宝小程序](https://opendocs.alipay.com/mini/framework/component-lifecycle?pathHash=9b628e01) 与 [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html) 文档。

- useAttached
- useDidMount
- useReady
- useMoved

详细参数可以看 [支付宝小程序](https://opendocs.alipay.com/mini/framework/page-detail#events) 与 [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/lifetimes.html) 文档。

- usePageShow
- usePageHide

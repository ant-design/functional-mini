import { wechatPage, useEvent, useState } from 'functional-mini/page';

const app = getApp();

const AddTodo = () => {
  const [inputValue, setInputValue] = useState('');

  useEvent(
    'onBlur',
    (e) => {
      setInputValue(e.detail.value);
    },
    [],
  );

  useEvent(
    'add',
    (e) => {
      console.log("click time: ", e.detail.time)
      if (!inputValue) {
        return;
      }
      app.todos = app.todos.concat([
        {
          text: inputValue,
          compeleted: false,
        },
      ]);

      wx.navigateBack();
    },
    [inputValue],
  );

  return { inputValue };
};
Page(wechatPage(AddTodo));

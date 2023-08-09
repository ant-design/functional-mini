import { alipayPage, useEvent, useState } from 'functional-mini/page';

const app = getApp();

const AddTodo = () => {
  const [inputValue, setInputValue] = useState('');

  useEvent('onBlur', (e) => {
    setInputValue(e.detail.value);
  },[]);
  
  useEvent(
    'add',
    () => {
      app.todos = app.todos.concat([
        {
          text: inputValue,
          compeleted: false,
        },
      ]);

      my.navigateBack();
    },
    [inputValue],
  );

  return { inputValue };
};
Page(alipayPage(AddTodo));

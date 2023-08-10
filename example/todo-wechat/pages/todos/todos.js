import {
  wechatPage,
  useEvent,
  useOnShow,
  useState,
} from 'functional-mini/page';

const app = getApp();

const TodoPage = () => {
  const [todos, setTodos] = useState([]);

  useOnShow(() => {
    setTodos(app.todos);
  }, []);

  useEvent('onTodoChanged', (e) => {
    const checkedTodos = e.detail.value;
    app.todos = app.todos.map((todo) => ({
      ...todo,
      completed: checkedTodos.indexOf(todo.text) > -1,
    }));
    setTodos(app.todos);
  },[]);

  useEvent('addTodo', () => {
    wx.navigateTo({
      url: '../add-todo/add-todo',
    });
  },[]);

  return {
    todos,
  };
};
Page(wechatPage(TodoPage));

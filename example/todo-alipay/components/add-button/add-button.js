import { alipayComponent, useEvent } from 'functional-mini/component';

const AddButton = (props) => {
  useEvent('onClickMe', () => {
    props.onClickMe();
  },[]);
  return {}
};

Component(
  alipayComponent(AddButton, {
    text: 'Button',
    onClickMe: () => {},
  }),
);

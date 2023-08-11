import {
  wechatComponent,
  useEvent,
  useComponent,
} from 'functional-mini/component';

const AddButton = () => {
  const component = useComponent();
  useEvent(
    'onClickMe',
    () => {
      component.triggerEvent('onClickMe', {
        time: Date.now(),
      });
    },
    [],
  );
  return {};
};

Component(
  wechatComponent(AddButton, {
    text: 'Button',
  }),
);

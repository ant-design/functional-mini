import { wechatComponent, useEvent ,useWechatTriggerEvent } from 'functional-mini/component';

const AddButton = () => {
  const tragger = useWechatTriggerEvent()
  useEvent('onClickMe', () => {
    console.log(11)
    tragger('onClickMe')
  },[]);
  return {}
};

Component(
  wechatComponent(AddButton, {
    text: 'Button',
  }),
);

# mvc

## ctrl

- 页面的组织 像线一样将各个部分连接在一起

- map --> unit [move|fixed]
- game -> team -> player -> bullet + summond ...

- 每次添加 player 就在 map 添加 move unit, 这样 player 同时存在 map 和 team 下面

  - 或者直接 player move_com 添加到 map 中
  - 如何还要碰撞检测 就 body_com + move_com

- @ques 能不能将 model 也变成 component

## view

- 所有对 ui 的控制

- node

- initNode

- initEvent

- ....

## model

# note

## 2018-08-24 08:56:07

- 吐槽交流会

  - 获得每一个人真实的看法很重要

- model 的结构

  - 游戏的基本逻辑
  - ctrl 的组织...

- model --> ctrl 的双向交互...

  - observer
  - return

- 测试代码分离

  - 单独 test 文件夹

- ts 重构代码

- @ques model ctrl 联系过于紧密

  - 将 ctrl 中 view 控制的部分全部独立出来
  - ctrl 只用来组织页面逻辑 + 联系 view + model...
    - 监听 model 改变, 调用 view 的方法...
    - 封装独立-model+view 封装联系-ctrl
    - ctrl 像线一样将所有的东西串联起来
      - model socket ...

- component..

  - 将可以抽离出来的东西从继承树中分离变成 component...

- 工程化代码

  - 非入侵添加功能

## 2018-08-22 09:06:28

- prettier markdown config

- @ques 如何把这个方便的给别人用同时给自己用

  - npm 只发布所有的 js
    - .npmignore ts..
  - 本地 tsc 所有的 ts ...

- lodash/isArray

- CryptoJS

- Primus

- Laya

## 2018-08-01 09:37:39

- 如果我可以直接将 component 绑定到属性上 也可以实现功能 那为什么我还要 component 呢??

- react 最后实现一个简单的控制 ui 的方式, 如果我无法实现一个简单的控制 ui 的方式一切都没有意义

## 2018-07-31 08:41:29

- @ques 有没有可能将这上升到基础框架的层度 和前端代码都没有关系

  - 这是 面向组件的设计模式 的一种实现方式...
  - 前端代码只是这的一次应用...

- @ques 能不能做到 甚至外面的代码也无需继承 ComponentWrap

  - comManager

- @ques 提供接口 容许别人扩展 这个方式...

- @note 将原来的通过继承的框架 转化成 component

  - 实现所有功能
  - 最深继承不超过 3 层
  - ....
  - 不改变原有的功能

- @ques ResCom 资源加载的方式也在上面去处理..

  - 是不是显示进度条...

  - onProgress onLoaded...

- @ques primus 挂在节点上是不是不太好...

  - 有更好的方法吗
  - app.getPrimusByUrl...

- event timeout_list...

- 能不能 component 很干净 不需要依赖 wrap

- BaseComponent 上面的 addChild | emit 这些能不能拆成 component

## 2018-07-30 09:52:07

- 弹出层
  - show+hide + 新显示在最上面 +

## 2018-07-30 09:43:00

- 能明显区分的独立的各个功能

- 主干

  - 方便 自己的 component 组织在一起
  - 方便 让 各个 component 合集 相互的联系在一起

- component

  - component 保持自己 最精简的功能..
  - 相同类型的 component 只能保持一个
  - 可以将

- 做一个 demo 展示, 什么样功能的 demo 呢???

  - 需要许多功能组合成一个功能
  - 每一个功能可能有多层

  ***

  - 简单+清楚展示功能 精简的核心功能
  - 操作杆 英雄移动??
  - 牌

    - 自己的牌 + 其他人的牌 + 已经出的牌 + TheFuture 中牌 + 牌堆里的牌...

  - 弹出层
    - 弹出层的出现

- 组件 相对 继承的好处

  - 不需要继承不需要的代码
  - 更方便的组织代码...

- @ques 能不能形成每一个 ctrl 对应一个 model, 同时所有的 model 又成一个整体...

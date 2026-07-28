# 仙途劫 · Xianxia Roguelike

基于 Cocos Creator 3.8.8 的竖屏闯关制动作 Roguelike 原型。

## 当前可玩闭环

- 主菜单 → 第一章
- WASD / 方向键移动；移动端在屏幕下半区拖动
- 飞剑自动攻击最近的敌人
- 击杀获得修为，境界提升时三选一强化
- 四波敌人，最后一波含首领
- 通关 / 失败后可重新开始

## 打开与运行

1. 启动 Cocos Dashboard。
2. 导入本目录，使用 Cocos Creator **3.8.8** 打开。
3. 打开 `assets/scenes/Main.scene`。
4. 点击编辑器顶部的预览按钮。

项目第一次打开时，Creator 会生成 `library/`、`temp/`、`local/` 等缓存目录。

## 目录

```text
assets/
  scenes/                 启动场景
  scripts/
    config/GameConfig.ts  关卡、波次、强化配置
    GameBootstrap.ts      状态机、战斗循环和程序化 UI
  resources/art/relics/   从 ai-asset-pipeline 导入的透明图
docs/
  GAME_DESIGN.md          MVP 玩法与后续拆分建议
```

## 素材约定

本项目只消费最终素材，不包含生成与切图逻辑。新增素材先在
`ai-asset-pipeline` 中质检，通过后复制到 `assets/resources/art/`。

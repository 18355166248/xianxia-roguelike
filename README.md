# 仙途劫 · Xianxia Roguelike

基于 Cocos Creator 3.8.8 的竖屏闯关制动作 Roguelike 原型。

## 当前可玩闭环

- 主菜单 → 第一章
- WASD / 方向键移动；移动端使用左侧摇杆，快速滑动摇杆可触发已解锁的踏云
- 御剑一阶自动索敌；二阶可拖动御剑按钮定向齐射；三阶可长按释放蓄力斩
- 击杀获得修为，境界提升时三选一强化，主动功法优先解锁
- 踏云、周天剑阵、天劫剑意均可升至三阶，按钮、冷却与特效同步成长
- 桌面端可用空格释放踏云、Q 释放剑阵、长按 E 引动天劫
- 四波敌人，最后一波含首领
- 山精直追、狐妖迂回、僵尸扑进，山魈会预警震地
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
    config/ArenaConfig.ts  场景尺寸与可行走道路轮廓
    config/GameConfig.ts  关卡、波次、强化配置
    runtime/              战斗实体与 UI 运行时共享类型
    systems/SkillRuntime.ts 功法等级、冷却、蓄力与数值规则
    systems/PlayerActionRuntime.ts 输入手势判定与角色动作状态机
    ui/SkillHudRenderer.ts 主动功法 HUD 绘制
    GameBootstrap.ts      场景状态机、战斗循环和节点编排
  resources/art/relics/   从 ai-asset-pipeline 导入的透明图
docs/
  GAME_DESIGN.md          MVP 玩法与后续拆分建议
  ASSET_CONTRACT.md       竖切版资源目录、尺寸与验收规则
  design/                 已确认的界面与控制设计参考
```

## 素材约定

本项目保存最终素材和生成提示词；批量切图、去背与 contact sheet 仍由
`ai-asset-pipeline` 执行，通过质检后再复制到 `assets/resources/art/`。

当前竖切素材固定由 `assets/scripts/config/AssetCatalog.ts` 统一管理路径和显示尺寸。
新电脑首次打开项目后，Creator 会重新生成 `temp/` 类型声明；随后可执行：

```bash
node /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/Resources/resources/3d/engine/node_modules/typescript/bin/tsc \
  -p tsconfig.check.json
```

功法规则不依赖 Cocos 节点，可单独执行回归测试：

```bash
npm run test:skills
```

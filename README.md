# 仙途劫 · Xianxia Roguelike

基于 Cocos Creator 3.8.8 的竖屏闯关制动作 Roguelike 原型。

## 当前可玩闭环

- 主菜单 → 第一章
- 首次入境提供三步新手指引；局内可暂停、重开或安全返回试炼图
- 音效、震动与减少动态设置会持久保存，切到后台时自动暂停战斗
- 设备旋成横屏时自动冻结战斗并提示恢复竖屏，旋回后继续当前进度
- 菜单与三章使用独立环境声底，御剑、命中、首领转相和胜负拥有分级声音事件
- WASD / 方向键移动；移动端使用左侧摇杆，快速滑动摇杆可触发已解锁的踏云
- 御剑一阶自动索敌；二阶可拖动御剑按钮定向齐射；三阶可长按释放蓄力斩
- 击杀获得修为，境界提升时三选一强化，主动功法优先解锁
- 进化确认后免费显化一次对应能力，万剑 / 天雷 / 护体会立刻在战场兑现
- 每次进化触发限时“破境余势”：锋芒加快御剑、玄术加速功法、守元持续回盾
- 升级牌区分凡/灵/地/天品，可观星重掷或炼化回气；连斩剑势与道藏记录把局内成长延续到战报
- 踏云、周天剑阵、天劫剑意均可升至三阶，按钮、冷却与特效同步成长
- 桌面端可用空格释放踏云、Q 释放剑阵、长按 E 引动天劫
- 四波敌人，最后一波含首领
- 山精直追、狐妖迂回、僵尸扑进，山魈会预警震地
- 通关 / 失败后可重新开始
- 三章首次通关后开启“三境归一”终卷，汇总渡劫、道途、真形与最高连斩

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

本项目保存最终素材规格和生成提示词；批量切图、去背与 contact sheet 仍由
`ai-asset-pipeline` 执行。通过质检后，小图复制到 `assets/resources/art/`，大图压缩上传 CDN
并更新 `assets/scripts/config/RemoteAssetCatalog.ts`，避免重新进入 Web 首包。

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

提交试玩版本前执行完整规则校验与一键正式构建：

```bash
npm run verify
npm run build:web
```

`build:web` 会校验本次新生成的 Creator 日志；当前 macOS Creator 3.8.8 即使构建成功也可能
返回退出码 36，脚本只有在日志同时出现 `build Task (web-mobile) Finished` 时才判定通过。

本地地址追加 `?qaBalance=1` 可在主菜单打开“三境实战样本”，查看每章样本量、胜率、通关
中位时长、平均承伤、路线与构筑覆盖；正式对局会保留最近 60 局用于 P3 数值验收，并可从
报告页复制带设备环境和逐局唯一标识的 JSON 样本包。完整真机流程见
[`docs/P3_DEVICE_QA.md`](docs/P3_DEVICE_QA.md)。

多位测试者的样本可直接合并汇总；追加 `--strict` 后，任一章节未达到首轮健康区间都会返回
非零状态：

```bash
npm run balance:report -- samples/*.json
npm run balance:report -- --strict samples/*.json
```

## 图片与 CDN 约束

- 文档设计稿和 QA 截图必须先压缩并上传 CDN，地址登记到 `docs/REMOTE_IMAGE_MANIFEST.json`，仓库不保留本地位图。
- 游戏运行时图片保留压缩后的离线副本，同时登记到 `RemoteAssetCatalog` 优先走 CDN；单图不得超过 700 KiB，总图片预算不得超过 1.25 MiB。
- `npm run test:skills` 会先执行图片体积门禁，防止大图或未迁移的文档截图进入后续提交。

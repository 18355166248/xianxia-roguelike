# Design QA — 三章首境动作与第一波走位

## 结论

- P0：0
- P1：0
- P2：0
- P3：0
- 范围：章节入境交权后的前 10–15 秒；不新增页面，不改变奇遇路线选择，不调整敌人数和
  基础伤害。

## 参考与当前问题

- `204-hades2-steam-combat-reference.jpg`：Hades II 官方 Steam 实机中的高对比地面行动圈。
- `205-dead-cells-steam-biome-reference.jpg`：Dead Cells 官方 Steam 实机中的发光通行符文
  与清晰通路轮廓。
- `197-opening-wave-menu-current.jpg` 至 `200-frost-opening-wave-current.jpg`：当前菜单
  与三章旧首波。青石有剑脉但缺少即时动作，竹林只报告竹障数量，寒潭只报告寒潮倒计时。
- 本轮只吸收“场内真实目标 + 明确来敌方向”的信息原则，不复制参考游戏的美术或规则。

## 实现与实机证据

- `OpeningObjectiveRuntime` 为三章提供独立动作、完成 / 失误判定、最长 14 秒目标时限、
  约 1.6 秒结果反馈和第一波确定性出怪方向。
- `206-qingshi-opening-objective.jpg`：金色剑碑目标圈与“驻足剑脉”进度；首敌从正面扇形
  压入。
- `207-bamboo-opening-objective.jpg`：初版竹影标记被障碍压住，记录为 P2 基线。
- `208-bamboo-opening-objective-final.jpg`：提高标记层级、直径和不透明度后，目标与下段
  竹障同位可读；首敌从左右夹道进入。
- `209-frost-opening-objective.jpg`：左侧青色封脉圈、首潮倒计时和上方来敌形成纵向走位。
- `211-frost-opening-recovery-final.jpg`：未避过首潮时明确提示“首潮已过 · 下次提前入圈”。
- `212-opening-objective-source-implementation.jpg`：两项官方视觉原则、旧版和新版实机的
  1280×1080 同输入审查。
- `213-opening-objective-three-stage-before-after.jpg`：三章旧 / 新首境的 1280×1440
  六格对照。
- `214-opening-objective-release.jpg`：最终非调试 Web Mobile 构建中的寒潭首境动作，
  封脉圈、首潮倒计时、上方来敌和完整底部操作区同时可读。

## 视口、状态与交互

- 原始实机均为 1280×720，CSS 视口 1280×720，device scale factor 1。
- 标准流程先播放 1.9 秒 `stage-entry`，再交权给首境动作；青石持续到占领剑脉，竹林持续
  到击破一处竹障，寒潭覆盖首个 7.2 秒潮汐周期。成功、恢复或超时后返回普通波次 HUD。
- 验证三章选择 / 入境、确定性首敌方向、剑脉驻足进度、竹障击破进度、寒潭临时避潮与
  失误恢复；第一波结束后运行时清空，后续波次与奇遇路线不受影响。
- 目标标记优先消费本章真实四帧资源；资源不可用时仅降级为 HUD 与真实规则，不伪造位置。
  `prefers-reduced-motion` 下固定峰值帧，不播放逐帧与呼吸动画。

## 视觉与文案验收

- 顶部目标沿用 548×38 目标条和 18px 字号，三章最长动作 / 进度文案均保持单行，无裁切。
- 青石金、竹林绿、寒潭青沿用既有章节色；标记位于真实剑脉、竹障或封脉圈，不侵占底部
  摇杆、攻击键与技能簇。
- 文案结构统一为“章节动作 · 动词目标 · 进度 / 目的”，不再用对象数量代替玩家动作。
- 初版 `207` 的竹林遮挡是本轮唯一 P2；`208` 修复后与 `206`、`209`、`211` 以原始分辨率
  复核，未发现新增 P1/P2。

## 验证

- Cocos TypeScript 检查：`tsconfig.skill-tests.json` 通过；`tsconfig.json` 仍受引擎声明兼容性限制失败，
  与本次收口逻辑无关。
- 19 组（首境）+1 组（二境）规则测试累计通过，包含三章动作完成 / 恢复、临时避潮结束和不同首敌方向，
  覆盖 `EliteEncounterRuntime` 二境联动。
- `git diff --check` 通过。
- 最终非调试 Web Mobile 构建通过，浏览器 error / warning / warn 为 0。

## 2026-07-31 三章第二境机关-敌人联动收口

- 设计目标：三章 `?qaElite=1` 二境玩法可复现、可完成、且与 HUD 保持一致；
  青石目标为“引灵后击杀推进”，竹林目标为“镇守冲锋撞击竹障”，寒潭目标为“寒潮截断冻尸”。
- 功能状态：`EliteEncounterRuntime` 已覆盖三章二波目标分发与完成回路，且不改动奇遇、首波或路线
  决定主时序；完成反馈保留可识别场内实体（竹林残障、寒潭潮带与青石目标节奏）；
- 规则验证：`npm run test:skills`（20 组）通过，`EliteEncounterRuntime`、`OpeningObjectiveRuntime`
  与 `StageProgressRuntime` 联动覆盖本次收口点。
- 文档与证据：见 `docs/GAME_DESIGN.md` 的“三章第二境目标（qaElite=1）”，
  `docs/design/roguelike-reference-notes.md` 的 2026-07-31 本轮收口说明，以及
  `docs/qa/current-audit/README.md` 新增“2026-07-31 三章第二境联动验收收口”区。
- 产物与发布：正式构建使用 `build Task (web-mobile) Finished` 判定，退出码为 36；
  非调试构建已去除 profiler。
- 风险：`tsconfig.json` 全量类型检查受 Cocos 3.8.8 引擎声明版本与 TS lib 配置不兼容影响，
  非本轮联动逻辑问题，当前不阻断交付。

## 2026-07-31 菜单宽屏背景一体化

### 对照基准

- Source visual truth：
  `/var/folders/7w/hsspqlq52mj2vrwmmpdjptsh0000gn/T/codex-clipboard-7895f743-3467-4fe8-aeed-fcd3fa41cc35.png`
- Implementation：
  `docs/qa/current-audit/235-menu-background-cohesive-release.png`
- Full-view comparison：
  `docs/qa/current-audit/236-menu-background-before-after-release.png`
- 浏览器 CSS 视口：`830×1170`，与来源图 `1062×1498` 保持相同比例；两者 density 均按 1×
  处理，正式构建截图归一化至 `1062×1498` 后并排比较。
- 状态：章节菜单、青石山道、`qaProgress=1`；另以 `231`、`232` 检查竹林与寒潭切换状态。

### Comparison history

1. 初始来源图存在 P2：`SHOW_ALL` 在宽屏暴露额外横向世界坐标，但菜单遮罩与氛围暗幕仍固定
   为 750 设计宽，左右形成两条硬边和亮度不同的“侧地图”。
2. 第一轮修复将背景底色、暗幕、横向规则线和菜单遮罩统一覆盖真实可视宽度，并让菜单背景
   单独按 cover 铺满；战斗恢复关卡标定尺寸，避免地形与碰撞坐标漂移。
3. 第一轮实机发现 `view.getFrameSize()` 产生弃用 warning；改为 `screen.windowSize` 后重新构建。
4. 正式非调试构建 `235` 与来源图组成 `236`，左右硬边已消失，三章均呈现为单张连续场景，
   浏览器 error / warning / warn 为 0。

### Required fidelity surfaces

- 字体与层级：标题、章节节点、关卡卡片字号和原有层级未改动。
- 间距与布局：750 宽交互内容保持居中，仅背景与暗幕扩展到真实宽屏可视区。
- 色彩与 token：沿用章节色和原背景色，不添加新的侧栏颜色或独立遮罩色块。
- 图像质量：复用三张正式地图资源；青石、竹林原图无需缩放，寒潭仅在菜单层等比 cover，
  未拉伸图片，也未更改战斗地图采样。
- 文案与内容：所有入口、目标、记录、奖励文案保持不变。
- Focused comparison：问题覆盖整幅背景及左右边界，`236` 全画面对照已能清楚判断；`231`、`232`
  单章截图用于确认不同宽高比地图没有新增裁切断层，因此不再另做局部裁图。

### Findings

- 无剩余 P0 / P1 / P2。
- P3：极宽横屏会裁掉寒潭背景更多上下内容，但菜单信息区仍完整；这是 cover 的预期行为，
  不影响当前竖屏交付。

### 交互与工程验证

- 点击第一、第二、第三章后，背景、缩略图、章节色和关卡卡片同步切换。
- 调试构建在 `GameBootstrap.onLoad` 主动关闭引擎 profiler；`237` 确认左下角无统计面板。
- Cocos TypeScript 检查、`git diff --check` 通过。
- 非调试 Web Mobile 构建日志包含 `build Task (web-mobile) Finished`；退出码 36 为现有 Creator
  命令行行为，不代表构建失败。

final result: passed

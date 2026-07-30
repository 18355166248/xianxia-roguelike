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

- Cocos TypeScript 检查通过。
- 19 组规则测试通过，包含三章动作完成 / 恢复、临时避潮结束和不同首敌方向。
- `git diff --check` 通过。
- 最终非调试 Web Mobile 构建通过，浏览器 error / warning / warn 为 0。

final result: passed

# 战场悟法 Design QA

- 目标稿：`selected-battlefield-cultivation.webp`（853×1844）
- 最终实机：`implementation-battlefield-cultivation-final.webp`（1280×720，内嵌 393×679 游戏视口）
- 首悟道种：`implementation-seed-choice-final.webp`
- 同屏比较：`battlefield-cultivation-comparison-final.webp`
- 验收状态：`qaCultivation=1` 与 `qaUpgrade=1`

## 对照结论

- P0：无。选择、确认、关闭和战斗恢复链路正常。
- P1：无。三张选择卡、真实法宝投影、路线色、进度变化和即时收益在 393px 宽视口均可读；面板没有遮满战场。
- P2：已修复。卡片标题与图标原有轻微挤压已重新分栏；底部操作区上移并保留手势安全余量；首悟道种移除无意义的重掷/炼化入口，防止跳过构筑起点。

## 交互核验

- 首次突破固定展示锋芒、玄术、守元三道种，必须三选一。
- 后续悟法展示主修深化、旁系联动、通用破局三类槽位。
- 选择后面板收起，左下角“道基显化”立即刷新路线、层数、关键属性与护体值。
- 常规悟法保留一次“观星”重掷与“炼化·回气”；首悟和关前成诀不显示跳过型操作。
- 模态出现时技能 HUD 坐标不移动，战场上半部保持可见。

## 验证

- `npm run test:skills`：20 个系统测试通过。
- `npx tsc -p tsconfig.check.json --noEmit`：通过。
- iPhone 14 Pro 模拟视口：无卡片重叠、按钮穿透或底部裁切。

final result: passed

## 左下角加成明细优化（2026-08-02）

- 原来的“剑伤 / 间隔 / 护体”开发数据改成了玩家语义：飞剑数量、单剑伤害、总伤害增幅、每轮出手间隔、攻速增幅、护体上限、实时气血与气血增量。
- 标题直接显示主修路线、当前重数、共鸣状态以及距离下一次成诀还差多少重。
- 新增“生效来源”，明确当前数值由道种和最近获得的功法共同产生。
- 三条路线统一显示“锋芒 / 玄术 / 守元 N重”，不再展示缺少单位的裸数字。
- iPhone 14 Pro 实机截图：`hud-bonus-detail-final.webp`。

final result: passed

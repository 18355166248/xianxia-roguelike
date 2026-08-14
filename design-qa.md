# 游戏内弹窗设计 QA

## 对比目标

- 参考视觉：用户提供的进化选择、奇遇抉择、进化确认、暂停菜单、普通/危险波次截图。
- 实现截图：
  - `/private/tmp/xianxia-popup-upgrade.png`
  - `/private/tmp/xianxia-popup-event.png`
  - `/private/tmp/xianxia-popup-commit.png`
  - `/private/tmp/xianxia-popup-pause.png`
  - `/private/tmp/xianxia-popup-wave-elite.png`
- 同屏对比证据：`/private/tmp/xianxia-popup-design-qa.png`
- 实现视口：354 × 745 CSS px，deviceScaleFactor 1。
- 实现截图像素：均为 354 × 745。
- 参考截图像素：进化选择 454 × 467、奇遇 487 × 437、进化确认 456 × 429、暂停 460 × 678、危险波次 499 × 249。
- 密度归一：参考图为组件/局部截图，未强制拉伸到整屏；同屏对比中按等宽容器等比缩放，重点比较弹窗本体的层级、密度、纹样和文案完整性。
- 状态：青石山道；进化三选一、残碑问剑、御剑诀 2 阶确认、暂停菜单、第二波危险横幅。

## 全视图与局部对比

- 全视图：五组状态均在同一 354 × 745 竖屏实现中检查，弹窗未超出安全区，战场背景仍能提供情境但不会抢夺焦点。
- 局部：同屏对比图逐组并排放置参考组件与实现全屏；标题、图标、动态数值、操作按钮均足够清晰，因此不再额外放大裁切。

## 必检表面

- 字体与排版：标题、眉题、正文和结果色形成四级层次；354px 窄屏下没有截断或换行破坏。字体沿用项目现有中文字体，字重比参考稿略轻，但不影响辨识。
- 间距与布局：暂停按钮间距、奇遇双选项、进化三列和波次横幅均保持独立触控区域；没有组件互相覆盖。
- 色彩与视觉令牌：墨玉、暖金、青绿三色与现有首页/道法谱一致；危险波次用暖金标题，普通信息保留青绿语义。
- 图片质量与切图：主面板、信息行、主按钮均使用项目真实 PNG；主面板与长条通过九宫格保持角纹和描边，不再整体纵向压缩。法宝与奇遇图标沿用现有资源，无占位图、代码绘图或 SVG 替代。
- 文案与内容：参考稿中的动态标题、收益、风险、路线及暂停说明均保留；没有把运行时文案烘焙进切图。
- 交互：验证了进化卡点击并出现确认浮层、奇遇选项可点击区域、暂停入口与按钮、危险波次自动出现；浏览器控制台无 error/warning。
- 可访问性：主要按钮高度 58–76 设计像素，竖屏缩放后仍保持可点击；遮罩对战场降噪，文字对比度充足。键盘语义不属于 Cocos Canvas 当前输入模型，本轮未扩展。

## Findings

- 无 P0/P1/P2 问题。
- P3：进化卡底部的预测说明在 354px 宽屏上较密，可在后续数值文案继续增长时改为单行省略或缩短描述。

## 对比历史

- 第 1 轮：将五组参考图与浏览器实现放入 `/private/tmp/xianxia-popup-design-qa.png` 同屏检查。未发现需要修复的 P0/P1/P2；本轮未因对比结果继续修改视觉。

## Implementation Checklist

- [x] 墨玉主板使用九宫格切片。
- [x] 金线信息行使用九宫格切片。
- [x] 金色主按钮与墨玉次按钮区分层级。
- [x] 动态图标与文案保持运行时渲染。
- [x] 354 × 745 竖屏五个关键状态完成截图。
- [x] 类型检查、Cocos Web Mobile 构建、交互与控制台检查通过。

## Follow-up Polish

- 若后续升级描述变长，为三选一卡片增加最大字符数约束。

## 全浮层扩展验收

- 新增参考证据：`/private/tmp/xianxia-audit-before-victory.png`、`/private/tmp/xianxia-audit-before-cultivation.png`。
- 新增实现证据：`/private/tmp/xianxia-audit-after-victory.png`、`/private/tmp/xianxia-audit-after-defeat.png`、`/private/tmp/xianxia-audit-after-cultivation.png`、`/private/tmp/xianxia-audit-after-event-prelude.png`、`/private/tmp/xianxia-audit-after-route-replay.png`、`/private/tmp/xianxia-audit-after-journey.png`。
- 新增同屏对比：`/private/tmp/xianxia-all-popup-audit.png`。
- 对比历史第 2 轮：胜负战报、修行卷、路线回放、终局回响、事件前奏均在 354 × 745 视口检查；容器四角保持比例，主按钮可辨，动态文本无截断。无新增 P0/P1/P2。
- 交互验证：打开战报、打开路线回放、触发事件前奏、进入修行卷与终局回响；控制台无 error/warning。

final result: passed

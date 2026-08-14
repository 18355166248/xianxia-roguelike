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

---

# 当前游戏收口 QA（2026-08-14）

## 对比目标与证据

- 视觉真值：用户提供的进化选择截图 `/var/folders/7w/hsspqlq52mj2vrwmmpdjptsh0000gn/T/codex-clipboard-f582f942-7d87-4c61-9301-76c178271aac.png`，以及调整前结算截图 `/private/tmp/xianxia-current-audit-07-victory.png`。
- 调整后实现：`/private/tmp/xianxia-optimized-upgrade-final.png`、`/private/tmp/xianxia-optimized-wave-active.png`、`/private/tmp/xianxia-optimized-victory-final.png`。
- CDN/压缩回归：`/private/tmp/xianxia-post-cdn-menu.png`、`/private/tmp/xianxia-post-cdn-settings.png`、`/private/tmp/xianxia-post-cdn-codex.png`、`/private/tmp/xianxia-post-cdn-upgrade.png`。
- 同屏对比：`/private/tmp/xianxia-design-qa-comparison.png`；上排为进化参考/实现，下排为结算调整前/后。
- 视口与密度：实现为 354 × 745 CSS px，deviceScaleFactor 1，对应 354 × 745 像素；进化参考为 454 × 467 像素的组件截图。同屏图按等大槽位等比缩放、不拉伸，布局判断以实现原始截图为准。
- 状态：后续破境三选一、第二波精英战、青石山道胜利战报。

## 全视图与局部对比

- 全视图：354 × 745 下进化面板、战斗 HUD 与胜利战报均处于安全区；固定操作按钮未被裁切。
- 局部：同屏对比聚焦进化卡底沿和结算“道基归途”区。进化卡由“效果 + 重复预测”收敛为单一效果行；结算构筑区删除重复技能摘要，只保留主修路线与三路等级。

## 必检表面

- 字体与排版：标题、眉题、数值与正文层级未改变；卡片和结算区没有新增截断、异常换行或过密小字。
- 间距与布局：开波横幅存续期间目标条和道途条暂避，横幅退出后自动恢复；三层信息不再竞争同一顶部区域。
- 色彩与视觉令牌：继续使用墨玉、暖金、青绿和米白；单位脚下暖金低透明描边仅用于战场辨识，与既有金线令牌一致。
- 图片质量与切图：现有面板、按钮和角色 PNG 均保持原比例；本轮未用 SVG、占位图或代码装饰替换现有美术。脚下描边属于实时战斗指示，不替代角色资产。
- 文案与内容：升级本次效果、主修路线、地图功绩和下一目标均保留；删掉的仅是同屏重复信息。
- 图标：升级、角色、技能和地图图标均为既有真实资源，清晰度与裁切正常。
- 状态与交互：正式 Web Mobile 构建通过；完整 `npm run verify` 通过；浏览器标题为“仙途劫”，压缩后的首页、设置、道法谱和进化弹窗控制台 error/warning 均为空。
- 可访问性：信息隐藏只发生在短暂开波横幅存续期，横幅本身承载当前波次目标；关键按钮面积与对比度保持不变。真机触控与读屏仍需独立设备验收。

## 对比历史

- 第 1 轮：发现开波横幅与两条常驻 HUD 竞争、升级卡底部重复预测、深色单位与石板地面融合、结算构筑区重复小字过密；结论为 blocked。
- 修正：加入横幅时序门控和防旧定时器串扰；升级卡仅保留等级/名称/本次效果；单位阴影增加低透明暖边；结算构筑区移除重复技能摘要。
- 第 2 轮：同屏对比 `/private/tmp/xianxia-design-qa-comparison.png` 与三个 354 × 745 实现状态复查，无剩余 P0/P1/P2；浏览器日志无 error/warning。

## Findings

- 无 P0/P1/P2 问题。
- P3：Cocos Canvas 仍缺标准 DOM 语义；真机触控、读屏以及每章真人数值样本不属于截图 QA，需要在发布验收中补齐。

## Implementation Checklist

- [x] 开波横幅与目标/道途 HUD 错峰显示。
- [x] 进化卡重复预测文案移除。
- [x] 深色单位落点辨识增强。
- [x] 胜利战报构筑摘要降密度。
- [x] 网页标题、分享摘要、主题色与 favicon 进入正式构建脚本。
- [x] 354 × 745 浏览器截图、正式构建、运行时测试和控制台检查通过。

## Follow-up Polish

- 真机矩阵与真人平衡样本完成后，再决定是否继续拆分 `GameBootstrap.ts` 的展示层；避免在手感基线未冻结前做大规模结构迁移。

final result: passed

---

# 全局样式统一 QA（2026-08-14）

## 对比目标与证据

- 视觉真值：现有首页水墨山河、墨玉金边九宫格面板、金色纸签主按钮，以及调整前运行截图 `/private/tmp/xianxia-style-audit-02-menu.png`、`/private/tmp/xianxia-style-audit-03-settings.png`、`/private/tmp/xianxia-style-audit-05-hud.png`。
- 调整后实现：`/private/tmp/xianxia-style-final-startup.png`、`/private/tmp/xianxia-style-final-loading.png`、`/private/tmp/xianxia-style-final-settings.png`、`/private/tmp/xianxia-style-final-hud.png`、`/private/tmp/xianxia-style-final-boss.png`。
- 同屏对比：`/private/tmp/xianxia-style-final-comparison.png`。
- 弹窗回归：`/private/tmp/xianxia-style-final-regression.png`，覆盖进化选择、奇遇选择、胜利战报与修行卷。
- 视口与密度：354 × 745 CSS px，deviceScaleFactor 1；上述实现截图均为 354 × 745 像素，无额外缩放。对比图仅按原始 1:1 截图拼接。
- 状态：启动 15%、加载 100%、设置页、普通/连斩 HUD、首领 HUD、进化选择、奇遇选择、胜利战报、修行卷。

## 全视图与局部对比

- 全视图：设置、HUD 和加载视觉系统均放入同一张对比图检查。设置页旧青色按钮已消失；战斗顶部旧黑色胶囊已换成金边墨玉切图；加载页直接复用首页背景与题字，不再出现 Cocos 标识页。
- 局部：354px 截图中的按钮文字、HUD 目标、连斩文案和进度数值均可直接辨认，因此未再制作放大裁切。首领血条另以 `/private/tmp/xianxia-style-final-boss.png` 单独检查，未发生裁切或信息重叠。

## 必检表面

- 字体与排版：继续沿用项目现有中文字体层级；加载眉题、正文、进度文字和 HUD 状态文字层级清楚。所有被检查状态均无截断、异常换行或字距变形。
- 间距与布局：HUD 三条顶部信息按头像区、目标区、路线区排列；首领血条与波次提示不互相遮挡。设置页回放按钮触控区为 142 × 54 设计像素。
- 色彩与视觉令牌：全局稳定为墨玉、暖金、青绿、米白四档。红色生命与危险提示、青绿色修为与完成状态属于功能语义，作为刻意保留的例外。
- 图片质量与切图：加载、HUD、设置和全部弹窗复用真实 PNG；长条使用九宫格，角纹没有压扁。未新增 SVG、占位图或代码绘制的装饰资产。
- 文案与内容：加载百分比、目标、路线、连斩、首领阶段、升级和结算文案均继续动态渲染，内容完整。
- 图标：头像、波次徽记、技能、法宝和设置开关保持同一资源体系，尺寸与朝向正常。
- 状态与交互：实测设置入口与回放按钮、开始关卡、进化选择、奇遇选择、胜利战报、修行卷和首领战。浏览器日志只有场景加载记录，无 error/warning。
- 可访问性：关键触控目标保持可点击面积和高对比；危险/失败不只依赖颜色。Cocos Canvas 没有标准 DOM 语义，本轮截图不能证明读屏与键盘访问能力。

## 对比历史

- 第 1 轮：发现战斗 HUD 使用通用黑色圆角块、设置页回放按钮使用旧青色组件、游戏加载页与首页视觉割裂，并且默认 Cocos 启动画面会先于游戏视觉出现；结论为 blocked。
- 修正：HUD 容器、暂停、连斩、构筑提示、阵眼状态和首领血条统一改用现有墨玉/金边九宫格；回放和平衡入口改用切图按钮；加载页复用首页水墨背景与题字；Web 构建关闭默认 Cocos splash，并以墨色作为画布接管前的底色。
- 第 2 轮：在 350ms 启动帧已直接显示项目水墨加载页；设置、普通/连斩 HUD、首领 HUD 和四类既有弹窗均通过截图回归。未发现新的 P0/P1/P2。

## Findings

- 无 P0/P1/P2 问题。
- 可接受差异：生命条、修为条、敌方血条、技能冷却、伤害数字和战场目标环继续使用高对比程序绘制。这些是实时功能反馈，不作为装饰面板处理。

## Implementation Checklist

- [x] 启动阶段不再显示第三方默认标识。
- [x] 游戏加载页与首页使用同一水墨视觉系统。
- [x] 设置页遗留按钮完成切图替换。
- [x] 普通、精英、连斩和首领 HUD 完成九宫格统一。
- [x] 既有弹窗完成回归，无样式退化。
- [x] TypeScript、正式 Web Mobile 构建、交互和浏览器控制台检查通过。

## Follow-up Polish

- 无阻断项；功能性战斗指示保持当前高对比方案。

final result: passed

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
  `docs/qa/current-audit/235-menu-background-cohesive-release.webp`
- Full-view comparison：
  `docs/qa/current-audit/236-menu-background-before-after-release.webp`
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

## 2026-08-12 首页设置图章等比修复

### 本轮问题与修正

- P1：顶部图章源图包含透明吊绳，导入后存在裁边区域；旧实现使用 `CUSTOM 86×186` 强制铺满，把裁切后的可见区域横向拉伸，右侧设置圆章因此呈椭圆。
- 首轮仅改为 `RAW` 原始帧后仍未解决：实测透明源图内的圆章主体本身已被横向压扁，而且整体尺寸比目标稿小约 30%。
- 最终修正：道法与设置入口增加独立视觉层，横向比例校正为 `0.78`、视觉高度提升至 292；触控层继续保持 86×186，不随吊绳和视觉比例变化。
- 左右两枚图章使用完全相同的视觉校正与触控规格，按压反馈和入口功能不变。

### 视觉与交互证据

- 最终比例校正首页：`docs/design/audit-2026-08-12/14-settings-medallion-final.png`。
- 目标设计稿 / 最终顶部同视口并排：`docs/design/audit-2026-08-12/15-settings-medallion-final-comparison.png`。
- 同视口下，道法与设置图章大小对称，设置圆章恢复目标稿的纵向椭圆轮廓，吊线与流苏长度接近设计稿。
- 点击设置入口可正常打开设置面板，点击完成可返回首页。

### 工程验证

- Web Mobile 正式构建通过。
- 浏览器运行日志：0 error / 0 warning。
- 无剩余 P0 / P1 / P2。

final result: passed

## 2026-08-12 首页三枚章节机制图标可读性优化

### 本轮问题与修正

- P1：原首领图标直接使用带大面积透明边缘的战斗立绘，按原始画布缩放后可见主体不足圆章直径的一半；现改为与前两项一致的法宝徽记体系，并为三章分别配置青石兽纹、竹心灵印和寒潭冰晶。
- P1：原坐标 `[-78, 64, 203] × -88` 是按视觉估值落位，较底板真实圆心统一偏右上；现按 1000×820 原始面板中三枚圆环圆心换算为 `[-90, 49, 190] × -95`。
- P2：原图标高度仅 46 / 50 设计像素，缩至手机后难以辨认；现三枚徽记统一为 58 设计像素，保留足够圆环留白并提高主体辨识度。
- P2：标签统一使用 17 号宋体、暖白色、132×28 居中文字框，并与按钮保留独立间距；三项不再出现偏色、偏移或文字压住按钮的情况。

### 同视口视觉证据

- 用户问题截图：`/var/folders/7w/hsspqlq52mj2vrwmmpdjptsh0000gn/T/codex-clipboard-18359c2b-a44e-4343-bda2-2507b36bd913.png`。
- 第一章：`docs/design/audit-2026-08-12/05-feature-icons-chapter1.png`。
- 第二章：`docs/design/audit-2026-08-12/06-feature-icons-chapter2.png`。
- 第三章：`docs/design/audit-2026-08-12/07-feature-icons-chapter3.png`。
- 第三章问题态 / 修复态并排：`docs/design/audit-2026-08-12/08-feature-icons-comparison.png`。
- 430×860 竖屏下，三章共九枚图标均位于底板圆环中心，标签无截断、无重叠，主按钮文字保持居中。

### 工程与交互验证

- `npx tsc -p tsconfig.check.json --noEmit`：通过。
- Web Mobile 正式构建通过，日志包含 `build Task (web-mobile) Finished`。
- 浏览器依次切换第一、二、三章，图标、标签、关卡说明和主按钮均正确更新。
- 浏览器运行日志：0 error / 0 warning。
- 无剩余 P0 / P1 / P2。

final result: passed

## 2026-08-11 首页重构（仙途劫 · 青石山道）

### Source visual truth 与实现证据

- 目标设计稿：`/Users/xmly/.codex/generated_images/019ff0ce-c640-76b1-afa0-e07ae65b7c51/exec-9f02706a-12b6-4b4b-840f-8243dfdb5ef8.png`，852×1846。
- 最终实机：`/private/tmp/xianxia-home-qa/implementation-390x844.png`，390×844，device scale factor 1。
- 全屏同图比较：`/private/tmp/xianxia-home-qa/compare-390x844.png`；目标稿等比归一为 390×844 后与实机并排。
- 聚焦比较：`/private/tmp/xianxia-home-qa/compare-focused-title-panel.png`，覆盖标题区、章节路线和任务面板。
- 用户标注视口修复实机：`/private/tmp/xianxia-home-qa/implementation-347x606-final.png`，347×606，device scale factor 1。
- 验收状态：默认首页、第一章选中、进度 0/6、真形 0/3、渡劫 0。

### Comparison history

1. 第一轮实现存在 P1：标题使用普通 Label，书法笔触、横向张力与目标稿差异明显；改为独立透明书法标题切图后重新构建。
2. 第一轮存在 P2：顶部道法 / 设置图章带矩形底色；重新提取透明图章资源后消除边缘接缝。
3. 第一轮存在 P2：章节圆章可见矩形裁切边界且第一章选中态偏弱；加入椭圆 Mask 和独立金色选中光环后修复。
4. 最终 390×844 同图比较中，标题、人物、三章路径、第一章选中态和底部任务面板的主要视觉重心一致；未发现剩余 P0 / P1 / P2。
5. 用户在 347×606 宽比例视口发现 P2：章节节点仍沿用标准竖屏固定坐标，第一章切图自带菱形与选中光环重复，CTA 文字按图片几何中心而非金色按钮视觉中心定位。
6. 修复后章节节点统一使用 852×1846 原画坐标和背景 cover 缩放矩阵；章节圆章在椭圆 Mask 内重新取圆心，只保留光环的选中标记；CTA 触控区与文字共同上移到金色按钮视觉中心。347×606 复测无重叠或偏心，未发现剩余 P0 / P1 / P2。

### Required fidelity surfaces

- 字体与层级：主标题使用真实书法切图；副标题、进度、章节名、目标和 CTA 保持清晰层级，没有截断或互相覆盖。
- 间距与布局：顶部双入口和底部任务面板按 750×1625 逻辑设计坐标布局；三章纵向路径跟随背景原画坐标与 cover 矩阵缩放，宽比例屏幕不再与山路脱节，同时不改变交互关系。
- 色彩与视觉令牌：沿用目标稿的宣纸灰、墨青、旧金与暖白；选中态只使用金色光环强调，没有增加新的高饱和色。
- 图像质量与资产：背景、标题、任务面板、章节圆章、选中光环和顶部入口均为独立位图资源；没有把整张设计稿直接作为不可交互页面，也没有字符图标或代码绘图占位。
- 文案与内容：青石山道、山门初试、试炼目标、三项机制与 CTA 均为运行时节点，随章节状态动态更新。

### 响应式、交互与工程验证

- 冷启动检查 347×606、360×780、390×844、430×780 四档竖屏：背景保持 cover，核心内容居中，面板和按钮无裁切、溢出或横向硬边。
- 已验证第二章切换、路线预览、道法入口、设置入口和“踏入青石山道”主 CTA；这些控件使用独立触控节点，不依赖整图热区。
- 浏览器控制台：0 error / 0 warning。
- `npx tsc -p tsconfig.check.json --noEmit`：通过。
- `node scripts/run-skill-tests.cjs`：通过。
- Web Mobile 正式构建通过，构建日志包含 `build Task (web-mobile) Finished`。
- 本地视觉与功能验收完成；仓库图片预算 / CDN 登记仍需用户明确授权将本轮首页切图上传至喜马拉雅 CDN 后收口。

final result: passed

## 2026-08-03 修行卷方案 3（设计稿保真落地）

### Source visual truth 与验收状态

- 目标设计稿：`docs/design/casual-upgrade-v1/selected-cultivation-sheet-option-3.png`，1268×1241。
- 游戏运行态：`docs/qa/casual-upgrade-v1/cultivation-sheet-option3-v19-panel.png`，537×552。
- 同图比较：`docs/qa/casual-upgrade-v1/cultivation-sheet-option3-v19-comparison.png`。
- 状态：`qaCultivationHistory=1`，玄术构筑，本局累计 3 项进化。
- 密度归一化：运行态由 360×370 CSS px 面板区域按约 1.492 DPR 截取；设计稿与运行态均以 contain 归一到 537×552 后并排比较。
- 完整视图即聚焦视图：截取区域覆盖整张修行卷，所有标题、图标、效果说明、标签与底部属性均可在原始截图中辨认，无需额外局部裁图。

### Comparison history

1. V15 完成结构首版，但图标和说明字号偏小，飞剑仍是弱占位图标，外框也缺少方案 3 的古卷质感。
2. V16 放大图标与核心字号，效果说明改为精确短句，并加入根基 / 联动 / 爆发标签和正式飞剑图标。
3. V17 首次接入外框资源时，旧的 `localhost` Creator 预览未收录新资源；浏览器告警定位后补齐 Cocos `.meta`，改用静态构建地址核验实际产物。
4. V18 正式纳入水墨青玉金边框资源，同时保留全部实时文字与数值节点。
5. V19 完成最终字体层级、底部属性分隔线和整体留白校准。

### Required fidelity surfaces

- 字体与层级：标题、法宝名、章节名、道法名、效果说明和属性数值形成清晰的六级层次；关键名词使用暖金，构筑等级和类别使用青色。
- 间距与布局：头部、法宝摘要、悟道列表、底部属性四区与目标稿一致；三条道法共用列表底板，图标、文本和右侧标签纵向对齐。
- 色彩与视觉令牌：深青墨底、旧金边框、青色流派标识和暖白正文均由方案 3 延续到实际游戏。
- 图像质量与资产：外框、法宝、道法与飞剑均使用正式图片资源；没有把整张设计图作为不可交互背景，也没有字符或代码图形占位。
- 文案与内容：只保留法宝、重数、已悟道法、三项真实效果和三项战斗属性；内容随当前构筑实时更新。

### Interaction 与工程验证

- 点击“收起”后修行卷正常关闭，战斗继续运行。
- 当前 `127.0.0.1` 静态构建页面控制台：0 error / 0 warning。
- Cocos Web Mobile 构建完成；构建日志明确显示 `build Task (web-mobile) Finished`。
- 剩余仅为 P3：实际游戏字体未替换为完全一致的书法字库，设计稿中的少量手绘内纹作了简化，以确保动态文本不会失真或被压扁。
- 无剩余 P0 / P1 / P2。

final result: passed

## 2026-08-02 道基飞剑残影（路线特效重设计）

### 目标与实现

- 用户选定目标稿：`docs/design/upgrade-rework/selected-sword-phantom-aura-small.webp`。
- 393px 手机预览：`docs/design/upgrade-rework/implementation-sword-phantom-aura-small.webp`。
- 同图聚焦比较：`docs/design/upgrade-rework/sword-phantom-aura-comparison.webp`。
- 原先的圆点、完整灵纹环已被替换为真实法宝飞剑残影；一重道基对应一柄剑影，最多显示三柄。
- 按用户反馈将轨道收至 40 设计像素，剑身 34 设计像素；短轨迹不闭合，避免误读为敌方范围预警。

### Required fidelity surfaces

- 视觉语言：保留目标稿的“真实飞剑 + 短弧残光”，不使用圆点、字符或占位图形。
- 尺寸：实机占地明显小于目标概念稿，符合“整体再小一点”的反馈，同时剑身仍能与角色轮廓区分。
- 状态语义：路线颜色由锋芒、玄术、守元数据驱动；无升级时不显示，升级后即时刷新。
- 交互与玩法：仅替换玩家子节点的渲染表现，没有修改升级数值、攻击碰撞、移动或状态机。

### 验证

- iPhone 14 Pro 393px 预览：稳定态无技能遮挡、触控穿透或敌方预警误读。
- `npm run test:skills`：20 个系统测试通过。
- `npx tsc -p tsconfig.check.json --noEmit`：通过。
- 无剩余 P0 / P1 / P2。

final result: passed

## 2026-08-02 “克制高级仙侠”UI 系统升级（第九轮）

### 视觉真值与实现证据

- 视觉真值：`docs/design/selected-hud-redesign-v1.webp`（941×1672）以及本轮方案中指定的章节、破境、奇遇、结算结构；现状基线分别为 `54-menu-layout-final-v16.webp`、`51-upgrade-spacing-focused-final-v14.webp`、`45-event-spacing-after-v9.webp`、`50-result-spacing-after-v12.webp`（均为 1280×720 浏览器截图，其中游戏画布为 393×679）。
- 浏览器实现：Cocos Creator 3.8.8 本地预览，1280×720 浏览器视口，Apple iPhone 14 Pro 模式；从浏览器截图裁取 393×679 游戏画布，deviceScaleFactor 1，无二次密度缩放。
- 最终状态：`58-ui-system-menu-final.webp`、`59-ui-system-upgrade-final.webp`、`60-ui-system-event-final.webp`、`61-ui-system-victory-final.webp`、`62-ui-system-hud-final.webp`、`63-ui-system-defeat-final.webp`。
- 同尺寸比较：`65-compare-menu-before-after.webp`、`66-compare-upgrade-before-after.webp`、`67-compare-event-before-after.webp`、`68-compare-result-before-after.webp`、`69-compare-hud-target-after.webp`。

### 全屏与重点区域比较

- 章节页：主操作已从卡片底部移到目标之后；三个等权道途小卡改为连续路线轴；记录与奖励降为安静双栏摘要。
- 破境与奇遇：左右窄卡改为两张纵向宽卡，图标、名称、即时收益、下一境代价/品阶形成固定扫读顺序；整卡为触控目标。
- 结算：四项数据合并为统计带，首破奖励保持唯一高亮，主次按钮进入同一横向操作区。
- HUD：技能圆环中心保持稳定间距且无视觉相交；模态覆盖时 HUD 仅降权、不发生坐标位移。
- 未单独生成放大裁切：选择卡与结算操作区在 393×679 原始像素截图中分别占据约 35%–55% 的画布高度，文字、图标边界和触控区已能直接辨认；比较板保留了原始像素密度。

### Required fidelity surfaces

- 字体与层级：沿用现有项目字体，不引入未确认字体资源；标题、正文、角色/风险标签和说明形成四级层次。无截断、错误换行或文字互相覆盖。
- 间距与布局：章节 CTA、纵向选择卡、统计带和横向操作区均使用稳定间距；普通卡没有双重描边，选择面板保留超过 45% 的战场上下文。
- 色彩与令牌：统一使用 `#061416`、`#0B2427`、`#103238`、`#6FCAB1`、`#B7D8CB`、`#D9B86C`、`#F3E7C8`、`#9CB8AE`、`#C56E5A`，章节色仅作为细边/短标签强调。
- 图像质量：角色、地图、法宝、技能和奖励继续使用项目正式资源；未新增 emoji、字符图标、临时 SVG、CSS 图案或占位资产。
- 文案与内容：章节目标、路线承诺、实际收益、代价、统计、构筑和奖励信息完整保留；删除了“选择后弹窗关闭”类解释性文案。

### 比较历史与修正

1. 首次同尺寸检查发现 P1：破境与奇遇宽卡的文本框仍从图标列左侧起排，真实图标与标题/收益出现局部相撞。
2. 修正：重新划分选择卡左右栏，将标题、定位、地势与收益文本统一右移并收窄，保持右侧品阶/风险区独立。
3. 修正后证据：`59-ui-system-upgrade-final.webp` 与 `60-ui-system-event-final.webp`；图标、正文和右侧状态三列均无重叠。无剩余 P0 / P1 / P2。

### 交互、响应式与工程验证

- 已验证：进入章节、破境整卡选择并关闭、奇遇选择后显示“道途已定”并恢复战斗、胜利结算返回试炼图。
- 393×679 游戏画布无截断、触控穿透或技能重叠；750×1334 为项目逻辑设计分辨率，布局由同一套固定设计坐标生成。Cocos 设备预览器不提供 750×1334 设备项，因此设计尺寸以逻辑画布和 TypeScript 构建坐标核验，实机尺寸以浏览器截图核验。
- 浏览器控制台：0 error。
- `npm run test:skills`：20/20 通过。
- `npx tsc -p tsconfig.check.json --noEmit`：通过。

final result: passed

## 2026-08-01 战斗 HUD 与奇遇浮层视觉改版（第一轮）

### 视觉目标

- 选定参考：`docs/design/selected-hud-redesign-v1.webp`。
- 保留现有水墨战场、角色与技能素材，降低顶部和底部大面积暗色蒙层的不透明度。
- 左下摇杆移除方向刻度与额外提示，只保留圆形底座和拇指圆点。
- 御剑、踏云、剑阵、天劫固定在右下操作区；天劫由底部横条改为圆形长按技能键。
- 奇遇选择由接近全屏的面板改为局部双选浮层；选择后沿用原状态机立即清除，出现与消失均不移动战斗按钮。

### 工程验证

- `npm run test:skills`：20 组规则测试通过。
- TypeScript 语法转译检查：`GameBootstrap.ts`、`SkillHudRenderer.ts` 通过。
- `git diff --check`：通过。
- 未修改奇遇结算、技能冷却、伤害、波次或路线效果规则。

### 当前阻塞

- 当前 Windows 环境只安装了 Cocos Dashboard，没有 Creator 3.8.8 编辑器，也没有可复用的 Web Mobile 构建。
- `temp/tsconfig.cocos.json` 尚未由 Creator 生成，因此无法完成 Cocos 全量类型检查、正式构建、同视口截图和参考图对照。
- 本轮不能据静态代码宣称视觉验收通过；需在 Creator 3.8.8 打开项目并生成预览后继续截图对照。

final result: blocked

## 2026-08-01 战斗 HUD 与选定设计稿对照（第二轮）

### 对照基准

- Source visual truth：`docs/design/selected-hud-redesign-v1.webp`（942×1676）。
- Implementation：`docs/design/audit-2026-08-01/07-final-combat.webp`（1280×720 浏览器截图）。
- Full-view comparison：`docs/design/audit-2026-08-01/08-reference-vs-final.webp`。
- 目标设备：Apple iPhone 14 Pro，CSS 设备宽度 393；Cocos 游戏画布实测 393×679，device scale factor 1。
- 归一化：从浏览器截图裁取 393×679 游戏画布，等比 contain 到 942×1676 后与参考图并排；未把浏览器工具栏或左右黑边计入差异。
- 状态：第二境战斗，敌人、血条、顶部目标和右下技能簇同时可见；升级双选状态另见 `05-updated-upgrade.webp`。

### Comparison history

1. 第一轮 `04-reference-vs-current.webp` 发现 P1：敌人/血条存在感弱、顶部状态重复、三项升级卡片覆盖大部分战场、技能锁定态接近不可见。
2. 第二轮修复：角色与普通敌人显示尺寸提高；普通敌人血条加宽并按真实视觉高度上移；未选择路线时隐藏重复路线状态条；调试数值条从正式 HUD 隐藏。
3. 第二轮修复：升级界面改为战场下方 620×330 局部面板，只显示两项并排选择；选择后沿用状态机立即清除。
4. 第二轮修复：摇杆去除方向刻度并扩大触控底座；右下技能簇保持固定，锁定态图标和名称提高可见度。
5. Post-fix evidence：`05-updated-upgrade.webp`、`06-updated-combat.webp`、`07-final-combat.webp`、`08-reference-vs-final.webp`。

### Required fidelity surfaces

- 字体与层级：中文标题和技能名已减少冗余，但参考图的书法展示字、头像标题组合和大号波次章纹尚未还原，P2。
- 间距与布局：升级双选面板、技能簇和顶部单目标条已接近参考结构；现有顶部 HUD 仍比参考更扁、更密，P2。
- 色彩与 token：深青、赤金、青绿和红色血条语义保持一致；青石关卡的暖灰绿色战场与参考冰蓝场景属于章节资源差异，作为当前关卡约束保留。
- 图像质量：当前角色、狐妖、背景均使用正式 PNG 资源，无占位图、代码绘图或伪造资产；但参考图的圆形头像、波次章纹、冰境装饰和高精度敌人没有对应正式资源，P1。
- 文案与内容：升级改为两项且明确“选择后消失”；目标文案仍偏长，P2。
- Focused comparison：升级界面单独使用 `05-updated-upgrade.webp` 检查；其余差异在 `08-reference-vs-final.webp` 已可读。

### Findings

- [P1] 参考图关键美术资源未落地：圆形头像、波次章纹、战场装饰和敌人精度仍明显不同。需要单独生成/制作并导入正式资源，而不是继续靠 Graphics 调参。
- [P2] 顶部信息仍偏密：目标句较长、波次和余敌未形成参考图的独立视觉章纹。下一轮应合并文案并减少一层底板。
- [P2] Canvas 语义与焦点状态缺失：浏览器 DOM 只能读取预览工具栏，无法读取游戏卡片和技能；需补充可见焦点/按压态并专项验证键盘和辅助技术。

### 工程与交互验证

- `npm run test:skills`：20/20 通过。
- `tsc -p tsconfig.check.json --noEmit`：通过。
- `git diff --check`：通过。
- 浏览器：60 FPS；error / warning 为 0。
- 已验证章节进入、升级双选、选择后浮层消失、战斗继续、敌人血条和右下技能区显示。

final result: blocked

## 2026-08-01 战斗 HUD 与选定设计稿对照（第三轮）

### 对照基准

- Source visual truth：`docs/design/selected-hud-redesign-v1.webp`（941×1672）。
- Implementation：`docs/design/audit-2026-08-01/13-frozen-hud-upgrade.webp`。
- Full-view comparison：`docs/design/audit-2026-08-01/14-reference-vs-frozen-final.webp`。
- Interaction comparison：`docs/design/audit-2026-08-01/17-upgrade-before-after.webp`。
- 目标设备：Apple iPhone 14 Pro；游戏画布 393×679，归一化到 942×1676 后并排比较。
- 对照状态：寒渊遗迹第二波、顶部状态完整、升级双选面板显示、右下技能区固定。

### Comparison history

1. 导入独立的青岚圆形 HUD 头像，替换顶部小尺寸全身像；保留深青底色并使用玉石/铜金边框。
2. 导入透明波次章纹，移除原矩形波次底板；波次与余敌合并为独立右上状态组。
3. 顶部目标合并为单行局部底板，未选择路线时不再显示重复状态层。
4. 使用与参考稿同属冰蓝遗迹语汇的正式 `frozen-ruins` 章节资源复核，排除青石章节色调造成的误判。
5. 升级面板保持局部双选，右下技能簇不因浮层出现而移动；选中后沿用原状态机立即消失。
6. 最终交互复核新增 `15-frozen-upgrade-before-choice.webp` 与 `16-frozen-upgrade-after-choice.webp`；同画布裁剪并排见 `17-upgrade-before-after.webp`，证明选项消失、战斗恢复且技能簇未位移。

### Required fidelity surfaces

- 字体与层级：标题、生命/修为、波次和目标已形成与参考稿一致的四级层级；小字号仍受 393px 画布抗锯齿限制，但无遮挡或截断。
- 间距与布局：头像和状态位于顶部两端，目标条单独居中；升级面板位于战场下半区，技能固定右下。
- 色彩与 token：寒渊背景、玉青章纹、赤色血条与金色标题统一；大面积纯黑蒙层已移除。
- 图像质量：头像、波次章纹、寒渊背景、角色和技能均为正式 PNG 资源；未使用占位框、emoji、CSS/Graphics 伪造关键美术。
- 文案与内容：升级仅显示两个可选项并明确“选择后消失”；波次和余敌合并显示，目标保持一条。
- Focused comparison：战斗态见 `12-frozen-hud-combat.webp`，升级态见 `13-frozen-hud-upgrade.webp`，完整并排见 `14-reference-vs-frozen-final.webp`。
- Focused interaction comparison：`17-upgrade-before-after.webp` 只比较 393×679 游戏画布；升级前后右下技能中心点和间距保持一致，左下无常驻摇杆。

### Findings

- 无剩余 P0 / P1 / P2 视觉或核心触控流程问题。
- P3：参考稿人物和敌人是高精度静帧概念图，实机采用可播放的现有角色/敌人资源，轮廓细节不完全一致，但尺寸、站位和血条可读性已经对齐。
- P3：移动摇杆按用户要求不再常驻显示；移动时仍按触控状态出现，不影响右下技能区固定布局。

### 工程与交互验证

- `npm run test:skills`：20/20 通过。
- `tsc -p tsconfig.check.json --noEmit --pretty false`：通过。
- `git diff --check`：通过。
- Cocos Creator 3.8.8 已导入新资源并生成 `.meta`。
- 浏览器预览保持 60 FPS；游戏日志 error / warning 为 0。
- 已验证章节切换、青石/寒渊战斗、升级双选、选中后浮层消失和右下技能固定布局。
- 最终点击复核：选择左侧升级项后 1 秒内浮层清除、敌人继续生成；浏览器游戏日志仍为 0 error / 0 warning。
- 自动攻击回归复核：修复第二波直达预览把攻击计时器设为 `Infinity` 的问题；`18`—`20` 可见自动飞剑与冷却计时，`21` 显示自动击杀后自然触发升级，`22` 证明选择升级后自动飞剑继续发射。

final result: passed

## 2026-08-01 首页、头像、技能区与升级弹窗视觉收口（第四轮）

### 对照与实机证据

- 用户当前首页截图：`C:/Users/Administrator/AppData/Local/Temp/codex-clipboard-ae0fd18e-73dc-484e-bc14-57980b748a09.png`。
- 战斗 HUD 视觉基准：`docs/design/selected-hud-redesign-v1.webp`。
- 首页实机：`docs/design/audit-2026-08-01/30-menu-final-v3.webp`。
- 升级双选实机：`docs/design/audit-2026-08-01/31-upgrade-final-v3.webp`。
- 选择后战斗实机：`docs/design/audit-2026-08-01/32-hud-final-v3.webp`。
- 同画布对照：`docs/design/audit-2026-08-01/33-reference-vs-ui-redesign-v3.webp`。

### 本轮调整

1. 首页重新分配纵向层级：标题、主角、三境路线与章节详情各自成区；章节详情增加局部内容面，压缩大面积深色蒙层，并强化主按钮。
2. 左上头像改为带真实 Alpha 的圆形 PNG，彻底移除正方形黑色角底；头像内部、圆形边框和人物细节保持不变。
3. 右下技能改为主攻击大环 + 三个辅助技能环，扩大图标与可点击面积；名称移到环外，减少内部拥挤，取消底部横条式天劫入口。
4. 升级选择面板缩为 500×290 的低位局部浮层，两张 214×132 卡片并排；标题、分隔线、图标环、说明和稀有度条按参考稿重新分层。
5. 点击任一升级项后面板立即消失，右下技能组位置不变，战斗继续；第二波 QA 直达仍保持自动攻击。

### Required fidelity surfaces

- 字体与层级：标题、境界提示、卡片名称、说明和“选择后消失”形成清晰五级层级，无截断。
- 间距与布局：首页详情卡不再吞占大半屏；升级面板与右下技能组保持安全间距，技能组不因浮层开关位移。
- 色彩与蒙层：保留深青、玉绿和赤金体系；首页与战斗顶栏大面积黑底均显著降不透明度，头像外角为全透明。
- 图像质量：头像使用正式透明 PNG；背景、人物和技能均沿用正式资源，无占位图或 emoji。
- 文案与内容：升级固定二选一，并明确选择后消失；章节目标、道途和奖励分区显示。
- 交互：章节选择、进入关卡、升级选择、浮层关闭、自动攻击和右下技能显示均已实机复核。

### 工程验证

- `npm run test:skills`：20/20 通过。
- `npx tsc -p tsconfig.check.json --noEmit --pretty false`：通过。
- `git diff --check`：通过（仅现有 LF/CRLF 提示）。
- Cocos Creator 3.8.8 浏览器预览正常；日志无 error / warning。
- Apple iPhone 14 Pro 预览中完成首页、升级前后与战斗态截图复核。
- 无剩余 P0 / P1 / P2 视觉或核心交互问题。

final result: passed

## 2026-08-01 移动端文字可读性与升级弹窗重做（第五轮）

### 用户反馈

- 393px 手机画布中升级弹窗与参考稿差距明显，卡片类型、效果说明及底部提示字号过小。
- 需要同步检查项目其余主要界面，把在手机上难以辨认的小字号统一放大。

### 本轮修复

1. 建立移动端字号下限：通用 Label 最低使用 20 设计像素，避免缩放到 393px 后出现约 5—8px 的不可读文字。
2. 升级面板扩大至 640×380，标题 42、状态提示 22、底部反馈 20；面板保持在战场下半区，不遮住顶部状态。
3. 两张升级卡扩大至 286×202；图标环、标题、功法/心法类型、效果说明和阶段条全部重新排版。
4. 顶部生命、修为、战斗目标、路线状态和右下技能名称单独提升字号与内容框高度。
5. 首页三境节点、风险标签、试炼目标、道途卡片、机制、通关记录和奖励文字同步放大；重新拉开记录、奖励与主按钮间距，消除重叠。

### 对照证据

- 首页最终态：`docs/design/audit-2026-08-01/38-readable-menu-final-v7.webp`。
- 升级弹窗最终态：`docs/design/audit-2026-08-01/39-readable-upgrade-final-v7.webp`。
- 设计稿并排对照：`docs/design/audit-2026-08-01/40-reference-vs-readable-final-v7.webp`。
- 选择升级后的战斗态：`docs/design/audit-2026-08-01/41-readable-hud-final-v7.webp`。

### 结果

- 升级弹窗与参考稿均为低位标题区 + 双卡选择 + 底部反馈的结构，文字层级清晰。
- 首页、顶部 HUD、目标条、技能名和升级说明无难以辨认的微小字号。
- 首页奖励与入口按钮、弹窗卡片内容、右下技能标签均无遮挡或截断。
- 点击升级后弹窗正常关闭，战斗与自动攻击继续。
- `npm run test:skills`：20/20 通过。
- `npx tsc -p tsconfig.check.json --noEmit --pretty false`：通过。
- `git diff --check`：通过（仅现有换行符提示）。
- 浏览器游戏日志：0 error / 0 warning。

final result: passed

## 2026-08-02 移动端排版密度与遮挡修复（第六轮）

### 用户反馈

- 字号放大后，部分标签、说明和状态文字被相邻内容遮挡，整体显得拥挤。
- 需要保留可读性，同时恢复标题、正文、标签和辅助说明之间的字号层级。

### 本轮修复

1. 通用字号下限由 20 调整为 18；主要标题、正文、HUD 和升级卡仍保留单独的大字号，不再让所有辅助标签强制等大。
2. 战斗奇遇面板扩大为 626×332，卡片高度从 142 增至 178；标题、效果和代价分成三层，并增加底部反馈间距。
3. 首页路线简报删除重复的“落点/承诺/结果”多行堆叠，改为角色、标题、结果摘要和落点四层；收起按钮和标题重新配宽。
4. 路线简报底部与主按钮争抢空间的说明文字已移除，主操作区保持干净。
5. 保留上一轮首页记录、奖励、主按钮间距和升级双卡大字布局。

### 实机证据

- 调整前战斗奇遇：`docs/design/audit-2026-08-02/43-event-crowded-before.webp`。
- 调整后战斗奇遇：`docs/design/audit-2026-08-02/45-event-spacing-after-v9.webp`。
- 升级双选复核：`docs/design/audit-2026-08-02/46-upgrade-spacing-after-v9.webp`。
- 首页常规态：`docs/design/audit-2026-08-02/47-menu-spacing-after-v10.webp`。
- 首页路线简报最终态：`docs/design/audit-2026-08-02/49-route-brief-spacing-final-v11.webp`。
- 结算页复核：`docs/design/audit-2026-08-02/50-result-spacing-after-v12.webp`。

### 结果

- 首页、路线简报、升级双选、战斗奇遇、顶部 HUD、技能区和结算页无文字相互遮挡。
- 大标题和关键数值保持醒目，标签与辅助说明恢复次级层级。
- 选择卡片、关闭浮层、进入关卡和返回按钮等核心交互保持正常。
- `npm run test:skills`：20/20 通过。
- `npx tsc -p tsconfig.check.json --noEmit --pretty false`：通过。
- `git diff --check`：通过（仅现有换行符提示）。
- 浏览器游戏日志：0 error / 0 warning。

final result: passed

## 2026-08-02 升级弹窗局部留白修复（第七轮）

### 用户标注

- 升级弹窗主标题、境界提示、卡片顶部信息与底部提示纵向距离过近，虽然没有完全重叠，但视觉上仍然拥挤。

### 修复

1. 面板高度由 380 增至 420，并微调面板中心，给顶部和底部留出安全边距。
2. 主标题固定 500×60 文字框，境界提示固定 520×32，避免默认大文字框占用范围不明确。
3. 标题、分隔线和副标题分别上移并拉开；副标题精简为“境界 N 重 · 二选一”。
4. 两张升级卡整体下移 13 像素，副标题与卡片顶部形成明确空隙。
5. 底部反馈下移并固定 520×30 文字框，与卡片底部保持独立间距。

### 证据与验证

- 最终弹窗：`docs/design/audit-2026-08-02/51-upgrade-spacing-focused-final-v14.webp`。
- 与设计稿并排：`docs/design/audit-2026-08-02/52-reference-vs-upgrade-spacing-v14.webp`。
- 选择后状态：`docs/design/audit-2026-08-02/53-upgrade-selected-after-v14.webp`。
- 标题、副标题、卡片和底部反馈无重叠或贴边。
- 选择升级后弹窗正常关闭，战斗继续。
- 20/20 规则测试、TypeScript 检查和 `git diff --check` 通过。
- 浏览器游戏日志：0 error / 0 warning。

final result: passed

## 2026-08-02 首页关卡层级与信息密度修复（第八轮）

### 用户标注

- 首页上方章节节点偏小，章节名称与状态标签不够醒目。
- 关卡详情底部把道途、机制、记录、奖励和主按钮连续堆叠，文字拥挤且层级不清。

### 修复

1. “三境试炼”标题由 19 提升至 24；选中章节节点由 112×112 放大为 126×126，普通节点由 88×88 放大为 106×106，章节名称同步提升至 20/18。
2. 详情卡高度由 530 增至 590，头图、关卡标题、目标、道途和主按钮重新分配纵向空间。
3. 三张道途卡高度增至 100，并把角色标签与关卡名称分开，保留中央“路线奇遇 · 预览”的交互提示。
4. 通关记录和首通奖励不再使用两条连续文本，改为并列双栏信息卡；标题、数值、奖励图标分别占位。
5. 主按钮下移到独立操作区，与记录/奖励卡保持明确间隔；路线预演打开后仍保持完整可点击。

### 视觉对照

- 问题截图：`C:/Users/Administrator/AppData/Local/Temp/codex-clipboard-8cf855dd-b4ad-4975-94af-ece94c349521.png`，457×503，用户标注的首页关卡区域。
- 浏览器完整实现：`docs/design/audit-2026-08-02/54-menu-layout-final-v16.webp`，1280×720，Apple iPhone 14 Pro 预览，CSS 画布约 393×679，设备像素比 1。
- 路线预演交互态：`docs/design/audit-2026-08-02/55-menu-route-brief-final-v16.webp`，1280×720。
- 聚焦实现：`docs/design/audit-2026-08-02/56-menu-layout-focused-v16.webp`，457×543；对浏览器中的关卡区域做等宽归一化。
- 同图比较：`docs/design/audit-2026-08-02/57-menu-layout-comparison-v16.webp`。左侧为问题参考，右侧为修复后的同区域。
- 本轮来源是用户指出问题的现状截图，不是要求逐像素复刻的设计稿；对照重点为字号、信息层级、间距和可读性。

### Required fidelity surfaces

- 字体与层级：章节标题、章节名称、详情标题、道途名称、记录/奖励标题形成明确层级；无截断或互相覆盖。
- 间距与布局：章节路线与详情卡之间留有稳定空隙；详情卡内部由头部、目标、道途、机制、双栏摘要和主操作区组成连续节奏。
- 色彩与视觉令牌：沿用现有深青底、玉绿描边、赤金重点色，不新增不一致的蒙层或装饰资产。
- 图像质量：章节缩略图、关卡背景和奖励图标继续使用项目正式资源，放大后无拉伸占位或透明边缘问题。
- 文案与内容：关卡目标、路线类型、机关/奇遇/首领、试炼记录和首通奖励完整保留；路线预演文案仍可理解。

### 交互与工程验证

- 浏览器中点击“路线奇遇 · 预览”后正常切换到路线简报，主按钮仍可见、无布局跳变。
- 浏览器控制台：0 error。
- `npm run test:skills`：20/20 通过。
- `npx tsc -p tsconfig.check.json --noEmit --pretty false`：通过。
- `git diff --check`：通过（仅现有 LF/CRLF 提示）。
- 无剩余 P0 / P1 / P2；仅保留状态标签进一步精修的 P3 可能性。

final result: passed

## 2026-08-02 道基飞剑残影 V2（设计稿保真重做）

### Source visual truth 与验收状态

- 目标稿：`docs/design/upgrade-rework/selected-sword-phantom-aura-small.webp`，853×1844。
- 旧实现：`docs/design/upgrade-rework/implementation-sword-phantom-aura-small.webp`。
- V2 手机实机：`docs/design/upgrade-rework/implementation-sword-phantom-aura-v2-mobile.webp`，393×679 CSS px，deviceScaleFactor 1。
- 聚焦同屏比较：`docs/design/upgrade-rework/sword-phantom-aura-comparison-v2.webp`。
- 改前 / 目标 / 改后：`docs/design/upgrade-rework/sword-phantom-aura-comparison-history-v2.webp`。
- 状态：`qaCultivation=1`，完成一次锋芒升级并等待“道基共鸣”揭示动画结束后的战斗稳定态。
- 密度归一化：目标稿裁取 503×503 角色特效区域；实机裁取 172×172 原生区域并放大到 503×503，仅用于观察轮廓与层级，不以插值锐度判断资源质量。

### Comparison history

1. V1 P1：实际使用 34 设计像素的通用法宝图标，手机端只有十几 CSS px，无法形成设计稿中的三柄剑气主体。
2. V1 P1：没有独立旧金、冰青、玉绿剑气资产；同一图标染色无法还原材质、剑形和能量尾迹。
3. V1 P2：代码绘制的黑色圆弧接近完整圆环，容易被看成范围提示，并遮蔽剑影。
4. V2 修复：新增三张正式透明 PNG 剑气资源；三柄剑固定显化，路线等级控制主次亮度。
5. V2 修复：轨迹改为 52×36 椭圆，剑身沿切线转向；前半圈进入角色前层，后半圈进入角色后层。
6. V2 修复：每柄剑使用资源自身尾迹，并叠加两级低透明残影；删除所有代码圆环与黑色轨迹。
7. Post-fix evidence：V2 同屏图中三柄剑轮廓、三色材质、相对角色比例和前后穿插均可识别；覆盖范围约为目标稿的 84%，符合用户“整体小一点点”的要求。

### Required fidelity surfaces

- 字体与排版：本特效不含文字；战斗 HUD、角色标签和左下道基面板没有因特效改动发生字号、换行或位置变化。
- 间距与布局：三剑中心沿 52×36 椭圆分布，不与技能按钮或左下信息面板相交；角色主体仍是第一视觉焦点。
- 颜色与 token：锋芒使用旧金、玄术使用冰青、守元使用淡玉；非主修路线降级透明度而不消失。
- 图像质量与资产保真：使用三张独立透明光效 PNG，不再用字符、代码图形、通用图标或染色占位；原生 393px 画面边缘清晰，无洋红去背残边。
- 文案与内容：无新增特效文案；升级数据和左下角实时加成内容保持不变。

### Interaction 与工程验证

- 三柄剑在椭圆轨迹持续移动，切换前后层时不推动角色、HUD 或技能触控节点。
- 减少动态模式停止绕行，但保留三柄剑和路线明暗，静态仍能识别强化状态。
- 浏览器运行日志：0 error / 0 warning。
- `npm run test:skills`：20 个系统测试通过。
- `npx tsc -p tsconfig.check.json --noEmit`：通过。
- `git diff --check`：通过（仅仓库既有 LF/CRLF 提示）。
- 无剩余 P0 / P1 / P2。

final result: passed

## 2026-08-12 首页章节选中态与底部信息区优化（当前）

### 本轮问题与修正

- P1：选中章节曾把同一张金环切图叠加两次，形成明显的双圆圈和局部错位；现删除重复光晕层，仅保留一层真实金环资源，并用尺寸、明度和章名字号区分选中态。
- P1：底部三枚图标实际是“机关 / 奇遇 / 首领”的章节情报，却被实现成首页路线选择器，导致点击反馈与信息语义不一致；现恢复为静态机制预告，真正路线抉择仍保留在入境后的奇遇流程。
- P2：底部中间项遗留“可选”和单项暖金高亮，仍会制造可点击错觉；现移除“可选”后缀，三项统一文案颜色与展示层级。
- 三个章节节点均保留完整触控区、按压缩放和切换确认音效；切换只更新当前章节、关卡说明、机制预告与主按钮文案，不会直接开战。

### 同视口视觉证据

- 用户问题截图：`/var/folders/7w/hsspqlq52mj2vrwmmpdjptsh0000gn/T/codex-clipboard-fb0d7e38-9c8f-43bf-8cd1-6d86b2ef3123.png`。
- 第一章选中：`docs/design/audit-2026-08-12/01-chapter1-selected.png`。
- 第二章选中：`docs/design/audit-2026-08-12/02-chapter2-selected.png`。
- 第三章选中：`docs/design/audit-2026-08-12/03-chapter3-selected.png`。
- 用户反馈与最终实现并排：`docs/design/audit-2026-08-12/04-feedback-comparison.png`。
- 三个选中态均只出现一套金环切图；未选章节降权稳定，章名保持居中。
- 底部三枚机制图标在三个章节中均无选中态、无“可选”标识，主按钮文字保持水平与垂直居中。

### 工程与交互验证

- `npx tsc -p tsconfig.check.json --noEmit`：通过。
- `node scripts/run-skill-tests.cjs`：全部通过。
- Web Mobile 正式构建通过，日志包含 `build Task (web-mobile) Finished`。
- 430×860 竖屏视口中依次点击第一、二、三章，章节详情和按钮文案均正确更新。
- 浏览器运行日志：0 error / 0 warning。
- `git diff --check`：通过。
- 无剩余 P0 / P1 / P2。

final result: passed

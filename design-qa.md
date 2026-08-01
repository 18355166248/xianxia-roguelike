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

## 2026-08-01 战斗 HUD 与奇遇浮层视觉改版（第一轮）

### 视觉目标

- 选定参考：`docs/design/selected-hud-redesign-v1.png`。
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

- Source visual truth：`docs/design/selected-hud-redesign-v1.png`（942×1676）。
- Implementation：`docs/design/audit-2026-08-01/07-final-combat.png`（1280×720 浏览器截图）。
- Full-view comparison：`docs/design/audit-2026-08-01/08-reference-vs-final.png`。
- 目标设备：Apple iPhone 14 Pro，CSS 设备宽度 393；Cocos 游戏画布实测 393×679，device scale factor 1。
- 归一化：从浏览器截图裁取 393×679 游戏画布，等比 contain 到 942×1676 后与参考图并排；未把浏览器工具栏或左右黑边计入差异。
- 状态：第二境战斗，敌人、血条、顶部目标和右下技能簇同时可见；升级双选状态另见 `05-updated-upgrade.png`。

### Comparison history

1. 第一轮 `04-reference-vs-current.png` 发现 P1：敌人/血条存在感弱、顶部状态重复、三项升级卡片覆盖大部分战场、技能锁定态接近不可见。
2. 第二轮修复：角色与普通敌人显示尺寸提高；普通敌人血条加宽并按真实视觉高度上移；未选择路线时隐藏重复路线状态条；调试数值条从正式 HUD 隐藏。
3. 第二轮修复：升级界面改为战场下方 620×330 局部面板，只显示两项并排选择；选择后沿用状态机立即清除。
4. 第二轮修复：摇杆去除方向刻度并扩大触控底座；右下技能簇保持固定，锁定态图标和名称提高可见度。
5. Post-fix evidence：`05-updated-upgrade.png`、`06-updated-combat.png`、`07-final-combat.png`、`08-reference-vs-final.png`。

### Required fidelity surfaces

- 字体与层级：中文标题和技能名已减少冗余，但参考图的书法展示字、头像标题组合和大号波次章纹尚未还原，P2。
- 间距与布局：升级双选面板、技能簇和顶部单目标条已接近参考结构；现有顶部 HUD 仍比参考更扁、更密，P2。
- 色彩与 token：深青、赤金、青绿和红色血条语义保持一致；青石关卡的暖灰绿色战场与参考冰蓝场景属于章节资源差异，作为当前关卡约束保留。
- 图像质量：当前角色、狐妖、背景均使用正式 PNG 资源，无占位图、代码绘图或伪造资产；但参考图的圆形头像、波次章纹、冰境装饰和高精度敌人没有对应正式资源，P1。
- 文案与内容：升级改为两项且明确“选择后消失”；目标文案仍偏长，P2。
- Focused comparison：升级界面单独使用 `05-updated-upgrade.png` 检查；其余差异在 `08-reference-vs-final.png` 已可读。

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

- Source visual truth：`docs/design/selected-hud-redesign-v1.png`（941×1672）。
- Implementation：`docs/design/audit-2026-08-01/13-frozen-hud-upgrade.png`。
- Full-view comparison：`docs/design/audit-2026-08-01/14-reference-vs-frozen-final.png`。
- Interaction comparison：`docs/design/audit-2026-08-01/17-upgrade-before-after.png`。
- 目标设备：Apple iPhone 14 Pro；游戏画布 393×679，归一化到 942×1676 后并排比较。
- 对照状态：寒渊遗迹第二波、顶部状态完整、升级双选面板显示、右下技能区固定。

### Comparison history

1. 导入独立的青岚圆形 HUD 头像，替换顶部小尺寸全身像；保留深青底色并使用玉石/铜金边框。
2. 导入透明波次章纹，移除原矩形波次底板；波次与余敌合并为独立右上状态组。
3. 顶部目标合并为单行局部底板，未选择路线时不再显示重复状态层。
4. 使用与参考稿同属冰蓝遗迹语汇的正式 `frozen-ruins` 章节资源复核，排除青石章节色调造成的误判。
5. 升级面板保持局部双选，右下技能簇不因浮层出现而移动；选中后沿用原状态机立即消失。
6. 最终交互复核新增 `15-frozen-upgrade-before-choice.png` 与 `16-frozen-upgrade-after-choice.png`；同画布裁剪并排见 `17-upgrade-before-after.png`，证明选项消失、战斗恢复且技能簇未位移。

### Required fidelity surfaces

- 字体与层级：标题、生命/修为、波次和目标已形成与参考稿一致的四级层级；小字号仍受 393px 画布抗锯齿限制，但无遮挡或截断。
- 间距与布局：头像和状态位于顶部两端，目标条单独居中；升级面板位于战场下半区，技能固定右下。
- 色彩与 token：寒渊背景、玉青章纹、赤色血条与金色标题统一；大面积纯黑蒙层已移除。
- 图像质量：头像、波次章纹、寒渊背景、角色和技能均为正式 PNG 资源；未使用占位框、emoji、CSS/Graphics 伪造关键美术。
- 文案与内容：升级仅显示两个可选项并明确“选择后消失”；波次和余敌合并显示，目标保持一条。
- Focused comparison：战斗态见 `12-frozen-hud-combat.png`，升级态见 `13-frozen-hud-upgrade.png`，完整并排见 `14-reference-vs-frozen-final.png`。
- Focused interaction comparison：`17-upgrade-before-after.png` 只比较 393×679 游戏画布；升级前后右下技能中心点和间距保持一致，左下无常驻摇杆。

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
- 战斗 HUD 视觉基准：`docs/design/selected-hud-redesign-v1.png`。
- 首页实机：`docs/design/audit-2026-08-01/30-menu-final-v3.png`。
- 升级双选实机：`docs/design/audit-2026-08-01/31-upgrade-final-v3.png`。
- 选择后战斗实机：`docs/design/audit-2026-08-01/32-hud-final-v3.png`。
- 同画布对照：`docs/design/audit-2026-08-01/33-reference-vs-ui-redesign-v3.png`。

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

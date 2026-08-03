# 2026-08-01 战斗 HUD 视觉审查

## 审查范围

- 产品表面：Cocos Creator Web Mobile 竖屏预览。
- 用户目标：从章节选择进入战斗，识别敌人、战斗目标和固定技能区，并在升级时完成一次选择后立即回到战斗。
- 参考真值：[../selected-hud-redesign-v1.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/f8ae-audiotest/E1/77/GAqSpGcORfOZAAYBNAACEFsB.webp)。

## 流程证据

1. [01-chapter-select.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/37bd-audiotest/8C/07/GAqSoUUORfObAACzygACEFsU.webp)：章节选择。入口可发现，主按钮清晰；当前章节缩略图和说明区仍偏暗、信息密度较高。
2. [02-combat-hud.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/cce6-audiotest/BD/63/GAqSoUUORfOeAAEG3gACEFsp.webp)：改动前战斗 HUD。敌人和血条存在感弱，顶部重复状态条占据过多纵向空间，技能锁定态接近不可见。
3. [03-level-up-choice.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/d823-audiotest/47/55/GAqSpGcORfObAACKMgACEFsN.webp)：改动前升级选择。三张横向大卡片和全屏暗幕遮挡战场，偏离参考图的局部双选面板。
4. [04-after-choice.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/70be-audiotest/12/C5/GAqSpGcORfObAAEBSgACEFsP.webp)：选择后浮层正确消失，战斗继续，技能状态被应用。
5. [05-updated-upgrade.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/3fb0-audiotest/80/F1/GAqSoUUORfOdAAD1KgACEFsg.webp)：改动后升级选择。已改为战场下方局部双选面板，两个选项并排，选择后消失。
6. [07-final-combat.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/155b-audiotest/36/BA/GAqSpGcORfOdAAEISAACEFsl.webp)：改动后战斗 HUD。敌人与血条增强，顶部重复路线条在未选择时隐藏，右下技能簇保持固定且锁定态可识别。
7. [08-reference-vs-final.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/1d72-audiotest/47/1B/GAqSpGcORfObAAh1IgACEFsR.webp)：参考设计与最终实机同输入对照。
8. [09-asset-hud-combat.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/b9d4-audiotest/02/74/GAqSoUUORfOaAAERpAACEFsG.webp)：导入圆形角色头像和波次章纹后的青石战斗态。
9. [10-asset-hud-upgrade.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/95ce-audiotest/6E/17/GAqSpGcORfOcAAD6eAACEFsf.webp)：新资源下的青石升级双选态。
10. [11-reference-vs-asset-hud.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/d08b-audiotest/AD/20/GAqSoUUORfOeAAjfZgACEFsv.webp)：参考稿与青石战斗态并排，用于识别章节色调差异。
11. [12-frozen-hud-combat.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/8c01-audiotest/1D/EE/GAqSpGcORfOaAAFIPAACEFsJ.webp)：寒渊遗迹战斗态，使用与参考稿同语汇的冰蓝正式背景。
12. [13-frozen-hud-upgrade.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/5452-audiotest/1B/6F/GAqSpGcORfOcAAEhBAACEFsd.webp)：寒渊遗迹升级双选态。
13. [14-reference-vs-frozen-final.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/cab8-audiotest/05/78/GAqSpGcORfOcAAkDBgACEFsX.webp)：参考稿与寒渊最终实机同视口并排对照。
14. [15-frozen-upgrade-before-choice.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/8a20-audiotest/CA/FF/GAqSoUUORfOaAAEgLAACEFsI.webp)：最终交互复核的升级选择前状态。
15. [16-frozen-upgrade-after-choice.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/5403-audiotest/C2/DE/GAqSoUUORfObAAFDsAACEFsS.webp)：点击左侧升级项后，浮层消失并恢复战斗。
16. [17-upgrade-before-after.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/6c68-audiotest/0B/F1/GAqSoUUORfOaAAJ7ggACEFsK.webp)：仅裁取 393×679 游戏画布的前后并排图，用于确认技能区不位移、左下无常驻摇杆。
17. [18-auto-attack-restored-a.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/8913-audiotest/D3/C8/GAqSpGcORfOcAAFCcAACEFsb.webp)—[20-auto-attack-restored-c.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/5227-audiotest/2A/AB/GAqSpGcORfOeAAE5RAACEFsq.webp)：第二波直达状态的连续帧，可见飞剑生成和御剑冷却变化。
18. [21-auto-attack-restored-live-enemies.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/8d83-audiotest/6C/CE/GAqSoUUORfOcAAEpSAACEFse.webp)：自动击杀敌人后自然触发升级，证明攻击链路已恢复。
19. [22-auto-attack-after-upgrade-choice.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/3ca6-audiotest/E0/6F/GAqSoUUORfOcAAFMLAACEFsc.webp)：选择升级后浮层消失，飞剑继续自动发射。

## 最终结论

- 核心流程完整：升级选择会消失，右下技能簇固定，移动控件不常驻占位，预览保持 60 FPS，浏览器无游戏 error/warning。
- 顶部已补齐正式圆形头像和透明波次章纹，生命/修为、波次/余敌和目标形成独立层级。
- 寒渊实机状态与参考稿在背景语汇、顶部结构、局部双选面板和右下技能布局上完成对齐。
- Canvas 语义树仍无法表达游戏控件，这是当前 Cocos 触控画布架构的已知限制，不属于本轮视觉与核心触控流程阻塞项。

## 剩余非阻塞项

1. P3：后续若补充桌面键盘模式，再为 Canvas 控件增加对应焦点语义与键盘导航。
2. P3：若获得商业书法字体授权，可继续优化金色标题字形和小字号抗锯齿。

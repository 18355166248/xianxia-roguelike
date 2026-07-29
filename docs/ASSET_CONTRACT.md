# 竖切版素材契约

## 运行时目录

```text
assets/resources/art/
  characters/qinglan.png
  enemies/mountain-spirit.png
  enemies/fox-spirit.png
  enemies/jiangshi.png
  bosses/shanxiao.png
  backgrounds/qingshi-road.png
  relics/xianxia-relics_*.png
```

代码只通过 `assets/scripts/config/AssetCatalog.ts` 引用资源路径。替换图片时保留文件名，
无需修改战斗状态机。

## 角色与敌人

- 源文件为透明 PNG，四角 alpha 必须为 0。
- 普通单位源图长边 192px，游戏内显示高度 76–104px。
- Boss 源图长边至少 256px，游戏内显示高度约 164px。
- 同一批次固定三分之四视角、左上光源、黑色墨线和矿物色上色。
- 缩到 96px 后必须还能从轮廓区分主角、山精、狐妖、僵尸和 Boss。
- 不允许投影、地面、文字、水印或贴边裁切。

## 场景

- 竖屏 9:16，战斗中心 70% 保持低细节、无遮挡。
- 边缘可以放竹林、山石和雾，但不能干扰角色与红色危险圈。
- 当前设计分辨率为 750×1334；700×950 场景图按比例放大到全屏高度，
  由竖屏视口裁切左右边缘，不做非等比拉伸。
- 顶部约 150px 与底部约 190px 会覆盖半透明 HUD，关键道路与首领预警不要只放在这些区域。

## Cocos 导入

- 图片与 `.meta` 必须一起提交，避免换电脑后 UUID 变化。
- 运行时资源都放在 `assets/resources/` 下，并以 `/spriteFrame` 路径加载。
- `library/`、`temp/`、`local/` 和构建目录都是缓存，不进入 Git。

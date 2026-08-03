# 竖切版素材契约

## 运行时资源分层

```text
assets/resources/art/
  characters/qinglan.png
  enemies/mountain-spirit.png
  enemies/fox-spirit.png
  enemies/jiangshi.png
  bosses/shanxiao.png
  relics/已被配置引用的小图标.png
```

16 张大图（三章背景、角色/首领动作表、路线特效、竹障与精英等）不进入首包，
由 `assets/scripts/config/RemoteAssetCatalog.ts` 保存不可变 HTTPS CDN URL，
`assets/scripts/runtime/SpriteAssetLoader.ts` 按原 resources 路径统一加载。替换大图时需重新压缩上传并更新 URL；
业务配置与战斗状态机不需修改。

## 角色与敌人

- 源文件为透明 PNG，四角 alpha 必须为 0。
- 普通单位源图长边 192px，游戏内显示高度 76–104px。
- Boss 源图长边至少 256px，游戏内显示高度约 164px。
- 同一批次固定三分之四视角、左上光源、黑色墨线和矿物色上色。
- 缩到 96px 后必须还能从轮廓区分主角、山精、狐妖、僵尸和 Boss。
- 不允许投影、地面、文字、水印或贴边裁切。
- `qinglan-actions.png` 为严格 4×4 序列帧：每格 256×384px，四行依次为待机、奔跑、挥剑、受击。
- `shanxiao-actions.png` 为严格 4×4 正方形序列帧：四行依次为待机、追击、震地施法、
  受击/狂化；当前源图 1256×1256px，每格 314×314px。
- `hanyuan-shanxiao-actions.png` 使用相同 4×4 帧协议，但轮廓、冰甲、符文重棒和狂化碎晶均为
  寒潭专属表现；不能退化为普通山魈的运行时染色。
- `hanyuan-frost-impact.png` 为严格 2×2 地面特效表，四帧依次为裂纹预兆、主裂扩散、
  碎晶爆发和余霜消散；当前源图 1256×1256px，每格 628×628px。
- 六张 `*-commit.png` 均为严格 2×2、1256×1256px 的透明地面特效表，每格 628×628px；
  高风险路线分别用于青石落阵、竹障焚尽与寒潭聚潮，稳健路线分别用于灵泉回气、竹影敛息
  与封脉结界。四格必须保持同一俯视角、圆心和占地尺度，禁止混入角色、文字或跨格碎片。
- 路线卷轴的章节缩略图复用 `qingshi-spring-commit.png`、`bamboo-shadow-commit.png` 与
  `frost-seal-commit.png` 做一次性预演；不得从整张动作表直接缩放显示，必须使用运行时切出的
  单格 SpriteFrame，显示直径固定约 124px，并保留透明边缘。
- `bamboo-warden.png` 是竹林第二波专属精英，不与山精复用外观；武器、琥珀核心与竹甲轮廓
  在 112px 显示高度下仍需清晰可辨。
- 运行时从整图动态切帧，因此替换动画表时必须保持列数、行数、人物脚底基线与透明留白一致。

## 场景

- 竖屏 9:16，战斗中心 70% 保持低细节、无遮挡。
- 边缘可以放竹林、山石和雾，但不能干扰角色与红色危险圈。
- 当前设计分辨率为 750×1334；700×950 场景图按比例放大到全屏高度，
  由竖屏视口裁切左右边缘，不做非等比拉伸。
- `bamboo-ambush.png` 保留纵向窄路和上段圆形竹心空地；`bamboo-barricade.png` 为透明 RGBA，
  四周不得残留色键或不透明底色。
- `frozen-ruins.png` 为 750×1334px 竖屏底图，中段两块亮冰面与上段圆形祭坛必须和
  `FROST_ICE_ZONES`、首领封界位置保持一致；中央寒潮预警带区域不能放高遮挡物。
- 顶部约 150px 与底部约 190px 会覆盖半透明 HUD，关键道路与首领预警不要只放在这些区域。
- 运行时会按石板路轮廓限制角色和敌人移动；替换地图时需要重新标定道路中心偏移与半宽采样点。

## Cocos 导入

- 本地小图与 `.meta` 必须一起提交，避免换电脑后 UUID 变化。
- 远程大图不放入 `assets/resources/`；逻辑 key 仍保留 `/spriteFrame` 后缀，由加载适配层转换为 CDN 请求。
- 启动会预加载所有必要美术并显示进度；单项失败时使用程序化占位，不阻断进入游戏。
- `library/`、`temp/`、`local/` 和构建目录都是缓存，不进入 Git。

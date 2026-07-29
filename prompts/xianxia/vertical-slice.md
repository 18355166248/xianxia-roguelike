# 仙途劫竖切版素材记录

用途：第一章「青石山道」可玩竖切版。此文件随游戏仓库保存，换电脑后不依赖旧素材仓库也能复刻视觉方向。

## 统一风格

```text
Polished hand-painted Chinese fantasy mobile-game sprite, crisp expressive black
ink outlines, restrained mineral-pigment washes, soft upper-left light, clear
high-contrast silhouette readable at 80–96 px. Match the existing xianxia relic
icons' line weight, saturation, edge crispness, and production polish.

Exactly one full-body subject, side three-quarter view, centered with generous
padding. Perfectly flat solid #FF00FF chroma-key background. Opaque crisp edges.
No cast shadow, ground plane, scenery, text, border, watermark, translucent edge
effects, or motion blur. Do not use #FF00FF in the subject.
```

## 角色与敌人

- `qinglan.png`：青年男剑修，青蓝道袍、玉簪高髻、眉心朱砂、直剑，冷静备战姿势。
- `mountain-spirit.png`：苔藓山石构成的矮壮山精，双重石臂，胸口单枚玉色灵核眼。
- `fox-spirit.png`：赤褐色一尾狐妖，乳白胸毛、深色灵纹、颈挂小玉符，前扑姿势。
- `jiangshi.png`：靛蓝旧官袍僵尸，黑官帽、灰蓝皮肤、双臂平伸、额贴黄符。
- `shanxiao.png`：黑毛山魈首领，赭石鬼面、断角、红绳、苔石护甲、铁木重棒。

普通单位源图长边缩到 192px；Boss 缩到 256px。正式导入前用 chroma-key 去背，
再统一缩到 96px contact sheet 检查轮廓辨识度。

## 场景

```text
Portrait 9:16 high three-quarter top-down Qing Stone Mountain Road battle arena.
A weathered blue-gray flagstone path fills the clear central 70%; dark teal earth,
mossy rocks, sparse bamboo and faint edge mist frame the sides. Polished
hand-painted Chinese fantasy environment, slate blue / dark teal / moss palette,
soft overcast dawn. Environment only. No characters, UI, text, central obstacles,
strong cast shadows, or busy center detail.
```

最终裁切为 700×950，对应游戏战斗区域，不在运行时拉伸。

## 验收结果

- 五个单位缩到 96px 后仍可从轮廓直接区分。
- PNG 四角 alpha 为 0，无明显品红边。
- 青岚、山精、狐妖、僵尸、山魈在 Cocos Web Mobile 构建中加载正常。
- 场景中央保持低细节，角色、血条、飞剑和 Boss 红色预警圈具备足够对比度。

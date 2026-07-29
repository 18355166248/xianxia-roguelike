# 青岚角色动画表

状态：等待图片生成服务恢复后执行。先只验收玩家动画，合格后再复用同一规格生成敌人。

参考图：`assets/resources/art/characters/qinglan.png`

```text
Use case: stylized-concept
Asset type: production-ready 4 columns × 4 rows sprite animation sheet for a
portrait mobile Cocos roguelike.

Use the supplied Qinglan protagonist as the strict identity and style reference.
Preserve the exact same face, long black half-up hairstyle, blue-white flowing
xianxia robes, teal ornaments, boots, proportions, black ink contours, mineral
coloring, and straight sword in every frame.

Row 1: four subtle sequential idle-breathing poses.
Row 2: four sequential running poses moving toward screen-right.
Row 3: four sequential sword-slash poses: anticipation, swing, impact, recovery.
Row 4: four sequential hit-reaction and recovery poses.

Exactly 16 full-body figures, one per equal cell, strict invisible 4×4 grid.
Keep identical scale, three-quarter camera angle, feet baseline, proportions,
costume, sword and upper-left lighting. Center each figure with generous padding.
Motion and silhouette must remain readable at 96px. Do not crop sword, sleeves,
hair or feet.

Use one perfectly flat uniform solid #FF00FF chroma-key background over the whole
canvas. No gradients, texture, floor, shadows, reflection, scenery, particles or
lighting variation. Never use #FF00FF on the character. No visible grid, borders,
labels, text, watermark, extra weapons, duplicated limbs, new accessories,
perspective drift or cell overlap.
```

## 质量门槛

1. 16 格必须是同一张脸、同一套服装与同一把剑。
2. 每一行缩到单格 96px 后，动作顺序仍可读。
3. 四角透明，发丝、衣袖和剑刃无明显品红边。
4. 玩家动画通过后，才生成山精、狐妖、僵尸和山魈，避免整批返工。

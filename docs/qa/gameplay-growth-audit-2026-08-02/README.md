# 战斗成长循环审计（2026-08-02）

审计视口：393×679，入口 `qaCultivation=1`。证据截图均来自本地实机预览。

## 1. 入场与常驻信息

- 证据：[01-current-state.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/4f8c-audiotest/64/DB/GAqSpGcORfOfAACj4gACEFs1.webp)
- 健康度：需重构。
- 结论：菜单没有建立本局装备期待；战斗左下角只呈现技术数值，不能回答“我装备了什么、目前是什么形态、下一次进化还差多少”。

## 2. 破境选择

- 证据：[02-upgrade-choice.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/59c1-audiotest/97/38/GAqSoUUORfOfAADe8AACEFsz.webp)
- 健康度：一般。
- 结论：三张卡已能区分锋芒、玄术、守元，但升级的装备归属、流派联动与战斗形态变化埋在小字里。玩家能读到收益，不能快速想象选择后的打法。

## 3. 升级确认

- 证据：[03-upgrade-commit.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/ddfb-audiotest/F7/53/GAqSoUUORfOfAADYgAACEFs0.webp)
- 健康度：较差。
- 结论：确认层只重复图标、名称和描述，没有“升级前 → 升级后”、本命法宝阶位、共鸣里程碑和下一轮攻击预告。反馈与角色和敌人脱节。

## 4. 升级后战斗

- 证据：[04-post-upgrade-combat.webp](https://audiopaytest.cos.tx.xmcdn.com/storages/0508-audiotest/69/DD/GAqSpGcORfOeAADjAgACEFsy.webp)
- 健康度：较差。
- 结论：规则层已有回旋剑、雷印、护盾反震和真诀，但常驻 HUD、飞剑颜色、弹道体量与命中反馈没有形成一致的流派身份，因此变化看起来仍像隐藏数值。

## 关键问题

1. 成长循环是“选择文字 → 短提示 → 隐藏规则变化”，缺少持续身份。
2. 道种、功法、路线加成没有收束为一件可理解的核心装备。
3. 三重、五重等里程碑没有形成视觉与玩法的明确跃迁。
4. 升级确认没有比较信息，玩家无法验证选择是否真正生效。
5. 小字号和高信息密度降低了移动端两秒扫读能力；部分路线差异过度依赖颜色。

## 改造方向

- 以三枚道种分别觉醒“太初剑匣、九霄雷篆、青木剑心”三件本命法宝。
- 统一三段装备状态：初醒（2重）、共鸣（3重）、真形（5重）。
- 选择卡与确认层都显示路线重数变化、装备进化和实际战斗变化。
- 战斗 HUD 常驻显示法宝、形态、三阶点和下一里程碑，并保留最近一次升级提示。
- 飞剑体量、流光、拖尾、命中色随本命路线与阶位同步变化。

## 证据限制

静态截图不能单独证明动效节奏、触控手感和三至五分钟构筑节奏；这些项目必须在完成实现后通过完整实机流程继续验证。


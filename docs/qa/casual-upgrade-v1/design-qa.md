# Design QA：休闲破境方案 2

## 视觉真值与运行证据

- 设计真值：[selected-option-2.png](https://audiopaytest.cos.tx.xmcdn.com/storages/36fb-audiotest/67/7D/GAqSoUUORnIrAAuBuwACEGay.png)（853 × 1844）。
- 设计规范：`docs/design/casual-upgrade-v1/README.md`。
- 实机构建截图：[implementation-final-389x843.png](https://audiopaytest.cos.tx.xmcdn.com/storages/b04e-audiotest/B1/2E/GAqSpGcORnIzAAHidAACEGbF.png)（Cocos Web Mobile，389 × 843）。
- 并排对照：[source-vs-implementation.png](https://audiopaytest.cos.tx.xmcdn.com/storages/14e4-audiotest/F6/8E/GAqSpGcORnIuAASJhQACEGa3.png)。
- 验收入口：`http://localhost:8770/?qaCultivation=1`，只对本地 QA 地址生效，不改变正式开局流程。

## 对照结论

- 通过：顶栏只保留头像、气血数值与居中波次，取消经验、目标、操作与流派说明的首屏竞争。
- 通过：升级层保持“战场可见 + 下半屏深色面板 + 三张纵向卡”的方案 2 构图。
- 通过：三张卡初始同权，无默认选中；点击任意卡片直接生效，无二次确认。
- 通过：三张卡只展示“万剑 / 飞剑 ×3”“天雷 / 连锁 4 敌”“护体 / 护盾反震”，信息层级足够短。
- 通过：QA 画面保留三只真实波次敌人，特效作用对象明确；设计稿中的群敌压迫感在实机中有对应层次。
- 接受差异：设计稿使用概念级高密度粒子和写实角色构图，实机沿用项目现有角色、敌人、法宝资源，确保不是无法运行的静态贴图还原。

## 交互与功能验证

- 初始选择：无。
- 单击进化：点击卡片后恢复战斗并应用真实道种；万剑立即获得三把飞剑，天雷首次触发即可连锁四敌，护体立即获得护盾反震。
- 浏览器控制台：最终直达版本未发现运行错误。
- 自动化测试：21 个技能/战斗运行时测试套件全部通过。
- 构建：Cocos Creator 3.8.8 Web Mobile Debug 构建成功。

## 最终状态

通过。设计结构、信息密度、无默认选择、单击生效和实际战斗收益均已在真实 Cocos 构建中复核。

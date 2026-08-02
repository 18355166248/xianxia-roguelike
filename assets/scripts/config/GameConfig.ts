export type EnemyKind = 'mountainSpirit' | 'bambooWarden' | 'foxSpirit' | 'jiangshi' | 'shanxiao';
export type EnemyBehavior = 'chaser' | 'guardian' | 'weaver' | 'lunger' | 'boss';
export type SpiritVeinKind = 'sword' | 'vitality';
export type StageMapId = 'qingshi-road' | 'bamboo-ambush' | 'frozen-ruins';
export type WaveDanger = 'normal' | 'elite' | 'boss';

export interface WaveConfig {
    enemyKind: EnemyKind;
    behavior: EnemyBehavior;
    title: string;
    objective: string;
    spiritVein: SpiritVeinKind;
    count: number;
    hp: number;
    speed: number;
    damage: number;
    radius: number;
    xp: number;
    spawnInterval: number;
    elite?: boolean;
    danger?: WaveDanger;
    arena?: 'road' | 'boss-clearing';
    abilityInterval?: number;
    abilityDamage?: number;
}

export interface StageConfig {
    id: number;
    chapter: string;
    stageName: string;
    mapId: StageMapId;
    tagline: string;
    goal: string;
    accent: string;
    riskLabel: string;
    featureTags: readonly [string, string];
    routePreview: {
        mechanic: string;
        encounter: string;
        boss: string;
    };
    waves: WaveConfig[];
}

export type UpgradeId =
    | 'sword'
    | 'dash'
    | 'formation'
    | 'tribulation'
    | 'damage'
    | 'haste'
    | 'guard'
    | 'heal'
    | 'seed-edge'
    | 'seed-mystic'
    | 'seed-vitality'
    | 'returning-sword'
    | 'sword-mark'
    | 'split-sword'
    | 'piercing-sword'
    | 'thunder-seal'
    | 'cycle-breath'
    | 'relay-seal'
    | 'spell-sword'
    | 'overflow-shield'
    | 'shield-burst'
    | 'wither-cycle'
    | 'endless-life'
    | 'thunder-swords'
    | 'blood-sword-return'
    | 'heavenly-cycle'
    | 'myriad-swords'
    | 'ninefold-tribulation'
    | 'undying-sword-body'
    | 'cloud-step'
    | 'clear-mind'
    | 'breath-return';

export type UpgradePath = 'edge' | 'mystic' | 'vitality';
export type UpgradeOfferKind = 'hidden' | 'seed' | 'regular' | 'synergy' | 'ultimate' | 'common';

export interface UpgradeConfig {
    id: UpgradeId;
    title: string;
    path: UpgradePath;
    role: string;
    descriptions: readonly string[];
    maxLevel: number;
    accent: string;
    iconResourcePath: string;
    offerKind?: UpgradeOfferKind;
    routeContribution?: number;
    combatRead?: string;
}

// 闯关数据保持纯配置：后续加关卡时不改战斗状态机，只追加一条配置。
export const STAGES: StageConfig[] = [
    {
        id: 1,
        chapter: '第一章',
        stageName: '青石山道',
        mapId: 'qingshi-road',
        tagline: '山门初试 · 路阔妖杂',
        goal: '引动灵脉，击败镇关山魈',
        accent: '#E6C071',
        riskLabel: '初试',
        featureTags: ['宽道周旋', '双脉试炼'],
        routePreview: {
            mechanic: '灵脉争夺',
            encounter: '残碑问剑',
            boss: '镇关山魈',
        },
        waves: [
            {
                enemyKind: 'mountainSpirit',
                behavior: 'chaser',
                title: '山精来袭',
                objective: '抢占剑脉 · 正面迎敌',
                spiritVein: 'sword',
                count: 6,
                hp: 28,
                speed: 60,
                damage: 8,
                radius: 29,
                xp: 12,
                spawnInterval: 0.6,
            },
            {
                enemyKind: 'foxSpirit',
                behavior: 'weaver',
                title: '狐影迷踪',
                objective: '引狐入剑脉 · 圈内破围',
                spiritVein: 'sword',
                count: 9,
                hp: 32,
                speed: 92,
                damage: 9,
                radius: 25,
                xp: 13,
                spawnInterval: 0.48,
            },
            {
                enemyKind: 'jiangshi',
                behavior: 'lunger',
                title: '尸潮压境',
                objective: '抢占剑冢 · 截断尸潮',
                spiritVein: 'sword',
                count: 10,
                hp: 58,
                speed: 56,
                damage: 13,
                radius: 30,
                xp: 16,
                spawnInterval: 0.52,
            },
            {
                enemyKind: 'shanxiao',
                behavior: 'boss',
                title: '山魈镇关',
                objective: '守住灵泉 · 迎战山魈',
                spiritVein: 'vitality',
                count: 1,
                hp: 2400,
                speed: 45,
                damage: 18,
                radius: 58,
                xp: 120,
                spawnInterval: 0.1,
                elite: true,
                danger: 'boss',
                abilityInterval: 3.8,
                abilityDamage: 24,
            },
        ],
    },
    {
        id: 2,
        chapter: '第二章',
        stageName: '竹林伏击',
        mapId: 'bamboo-ambush',
        tagline: '破竹寻隙 · 伏敌骤起',
        goal: '斩断竹障，穿过精怪埋伏',
        accent: '#85CDA5',
        riskLabel: '险境',
        featureTags: ['破障得灵', '精英封界'],
        routePreview: {
            mechanic: '破竹开径',
            encounter: '竹火分径',
            boss: '竹心魇兽',
        },
        waves: [
            {
                enemyKind: 'foxSpirit',
                behavior: 'weaver',
                title: '竹影狐踪',
                objective: '击破下段竹障 · 打开正面',
                spiritVein: 'sword',
                count: 8,
                hp: 36,
                speed: 96,
                damage: 9,
                radius: 25,
                xp: 14,
                spawnInterval: 0.46,
            },
            {
                enemyKind: 'bambooWarden',
                behavior: 'guardian',
                title: '伏兵合围',
                objective: '借竹障截锋 · 破镇守阵',
                spiritVein: 'vitality',
                count: 4,
                hp: 260,
                speed: 58,
                damage: 17,
                radius: 43,
                xp: 44,
                spawnInterval: 1.15,
                danger: 'elite',
            },
            {
                enemyKind: 'jiangshi',
                behavior: 'lunger',
                title: '尸符封径',
                objective: '清除残障 · 冲入竹心',
                spiritVein: 'sword',
                count: 12,
                hp: 68,
                speed: 62,
                damage: 14,
                radius: 30,
                xp: 19,
                spawnInterval: 0.44,
            },
            {
                enemyKind: 'shanxiao',
                behavior: 'boss',
                title: '竹魇守心',
                objective: '封锁退路 · 决战竹心魇兽',
                spiritVein: 'vitality',
                count: 1,
                hp: 3100,
                speed: 50,
                damage: 21,
                radius: 60,
                xp: 150,
                spawnInterval: 0.1,
                elite: true,
                danger: 'boss',
                arena: 'boss-clearing',
                abilityInterval: 3.2,
                abilityDamage: 28,
            },
        ],
    },
    {
        id: 3,
        chapter: '第三章',
        stageName: '寒潭遗迹',
        mapId: 'frozen-ruins',
        tagline: '踏冰借潮 · 祭坛夺灵',
        goal: '稳住冰面身法，穿越往复寒潮',
        accent: '#83D9E3',
        riskLabel: '凶险',
        featureTags: ['冰面滑移', '往复寒潮'],
        routePreview: {
            mechanic: '冰面寒潮',
            encounter: '祭坛逆潮',
            boss: '寒渊山魈',
        },
        waves: [
            {
                enemyKind: 'mountainSpirit',
                behavior: 'chaser',
                title: '冻土苏醒',
                objective: '进入封脉圈 · 避过首潮',
                spiritVein: 'vitality',
                count: 8,
                hp: 44,
                speed: 66,
                damage: 10,
                radius: 29,
                xp: 15,
                spawnInterval: 0.54,
            },
            {
                enemyKind: 'jiangshi',
                behavior: 'lunger',
                title: '冰尸横渡',
                objective: '借寒潮断冲 · 截断尸阵',
                spiritVein: 'sword',
                count: 10,
                hp: 72,
                speed: 60,
                damage: 15,
                radius: 30,
                xp: 20,
                spawnInterval: 0.5,
            },
            {
                enemyKind: 'foxSpirit',
                behavior: 'weaver',
                title: '寒魄迷阵',
                objective: '精怪踏冰 · 守住祭坛',
                spiritVein: 'vitality',
                count: 5,
                hp: 170,
                speed: 104,
                damage: 17,
                radius: 28,
                xp: 42,
                spawnInterval: 0.9,
                danger: 'elite',
            },
            {
                enemyKind: 'shanxiao',
                behavior: 'boss',
                title: '寒渊镇祭',
                objective: '潮汐逆转 · 决战寒渊山魈',
                spiritVein: 'sword',
                count: 1,
                hp: 3400,
                speed: 52,
                damage: 22,
                radius: 60,
                xp: 165,
                spawnInterval: 0.1,
                elite: true,
                danger: 'boss',
                arena: 'boss-clearing',
                abilityInterval: 3,
                abilityDamage: 30,
            },
        ],
    },
];

export const UPGRADES: UpgradeConfig[] = [
    {
        id: 'sword',
        title: '御剑诀',
        path: 'edge',
        role: '飞剑增殖',
        descriptions: ['觉醒自动御剑', '飞剑数量 +1，灵光增强', '飞剑数量 +1，御剑圆满'],
        maxLevel: 3,
        accent: '#7DD3FC',
        iconResourcePath: 'art/relics/xianxia-relics_00/spriteFrame',
        offerKind: 'hidden',
    },
    {
        id: 'dash',
        title: '踏云步',
        path: 'mystic',
        role: '机动免伤',
        descriptions: ['解锁踏云闪身与短暂无敌', '闪身距离与无敌时间提升', '沿途斩击敌人，冷却缩短'],
        maxLevel: 3,
        accent: '#86EFAC',
        iconResourcePath: 'art/relics/xianxia-relics_23/spriteFrame',
        offerKind: 'hidden',
    },
    {
        id: 'formation',
        title: '周天剑阵',
        path: 'mystic',
        role: '范围控场',
        descriptions: ['解锁环形剑阵', '剑阵范围扩大，灵剑增至七柄', '九剑齐出，伤害与范围圆满'],
        maxLevel: 3,
        accent: '#67E8F9',
        iconResourcePath: 'art/relics/xianxia-relics_05/spriteFrame',
        offerKind: 'hidden',
    },
    {
        id: 'tribulation',
        title: '天劫剑意',
        path: 'mystic',
        role: '蓄力爆发',
        descriptions: ['解锁蓄力天劫', '天劫降下两重剑光', '三重天劫，充能与威力圆满'],
        maxLevel: 3,
        accent: '#FDE68A',
        iconResourcePath: 'art/relics/xianxia-relics_11/spriteFrame',
        offerKind: 'hidden',
    },
    {
        id: 'damage',
        title: '剑心通明',
        path: 'edge',
        role: '单击强化',
        descriptions: ['飞剑伤害 +30%', '飞剑伤害再 +30%', '飞剑伤害再 +35%'],
        maxLevel: 3,
        accent: '#FDE68A',
        iconResourcePath: 'art/relics/xianxia-relics_06/spriteFrame',
        offerKind: 'hidden',
    },
    {
        id: 'haste',
        title: '御剑如风',
        path: 'edge',
        role: '攻速强化',
        descriptions: ['攻击间隔 -15%', '攻击间隔再 -15%', '攻击间隔再 -18%'],
        maxLevel: 3,
        accent: '#C4B5FD',
        iconResourcePath: 'art/relics/xianxia-relics_05/spriteFrame',
        offerKind: 'hidden',
    },
    {
        id: 'guard',
        title: '护体罡气',
        path: 'vitality',
        role: '气血上限',
        descriptions: ['生命上限 +25 并回复', '生命上限再 +30 并回复', '生命上限再 +35 并回复'],
        maxLevel: 3,
        accent: '#93C5FD',
        iconResourcePath: 'art/relics/xianxia-relics_04/spriteFrame',
        offerKind: 'hidden',
    },
    {
        id: 'heal',
        title: '枯木逢春',
        path: 'vitality',
        role: '即时续航',
        descriptions: ['立即回复 35% 生命', '立即回复 45% 生命', '回满生命并获得短暂无敌'],
        maxLevel: 3,
        accent: '#6EE7B7',
        iconResourcePath: 'art/relics/xianxia-relics_19/spriteFrame',
        offerKind: 'hidden',
    },
    {
        id: 'seed-edge', title: '万剑道种', path: 'edge', role: '道种 · 飞剑追击',
        descriptions: ['飞剑伤害 +15%，锋芒道基由 2 重起步'], maxLevel: 1,
        accent: '#72DDE8', iconResourcePath: 'art/relics/xianxia-relics_00/spriteFrame',
        offerKind: 'seed', routeContribution: 2, combatRead: '稳定御剑 · 追击成潮',
    },
    {
        id: 'seed-mystic', title: '雷篆道种', path: 'mystic', role: '道种 · 功法循环',
        descriptions: ['参悟周天剑阵，玄术道基由 2 重起步'], maxLevel: 1,
        accent: '#9B8BE5', iconResourcePath: 'art/relics/xianxia-relics_11/spriteFrame',
        offerKind: 'seed', routeContribution: 2, combatRead: '刻印引雷 · 功法连携',
    },
    {
        id: 'seed-vitality', title: '青木道种', path: 'vitality', role: '道种 · 护体续战',
        descriptions: ['气血上限 +25 并回复，守元道基由 2 重起步'], maxLevel: 1,
        accent: '#82D7AC', iconResourcePath: 'art/relics/xianxia-relics_19/spriteFrame',
        offerKind: 'seed', routeContribution: 2, combatRead: '回复化盾 · 破盾反击',
    },
    {
        id: 'returning-sword', title: '回风剑印', path: 'edge', role: '法印 · 追击回旋',
        descriptions: ['飞剑命中后折返追击另一目标'], maxLevel: 1,
        accent: '#72DDE8', iconResourcePath: 'art/relics/xianxia-relics_00/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '单体追击增强 · 对群略增',
    },
    {
        id: 'sword-mark', title: '破甲剑痕', path: 'edge', role: '法印 · 叠痕破甲',
        descriptions: ['飞剑刻下剑痕，后续飞剑对其伤害 +25%'], maxLevel: 1,
        accent: '#72DDE8', iconResourcePath: 'art/relics/xianxia-relics_06/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '集中火力 · 克制精英',
    },
    {
        id: 'split-sword', title: '分光剑影', path: 'edge', role: '法印 · 击杀分光',
        descriptions: ['飞剑击杀后追加两柄弱化追击剑'], maxLevel: 1,
        accent: '#72DDE8', iconResourcePath: 'art/relics/xianxia-relics_05/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '由点及面 · 清潮强化',
    },
    {
        id: 'piercing-sword', title: '贯日剑锋', path: 'edge', role: '法印 · 穿透取舍',
        descriptions: ['飞剑额外穿透 1 名敌人，但攻击间隔 +8%'], maxLevel: 1,
        accent: '#72DDE8', iconResourcePath: 'art/relics/xianxia-relics_02/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '强敌潮 · 弱单体频率',
    },
    {
        id: 'thunder-seal', title: '雷篆天引', path: 'mystic', role: '法印 · 功法刻印',
        descriptions: ['剑阵与天劫命中时刻下雷印'], maxLevel: 1,
        accent: '#9B8BE5', iconResourcePath: 'art/relics/xianxia-relics_11/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '建立雷印 · 等待引爆',
    },
    {
        id: 'cycle-breath', title: '周天引气', path: 'mystic', role: '法印 · 冷却循环',
        descriptions: ['飞剑命中雷印目标时，功法冷却缩短 0.35 秒'], maxLevel: 1,
        accent: '#9B8BE5', iconResourcePath: 'art/relics/xianxia-relics_05/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '御剑供能 · 功法提速',
    },
    {
        id: 'relay-seal', title: '劫火传薪', path: 'mystic', role: '法印 · 雷印扩散',
        descriptions: ['雷印目标死亡时向附近一名敌人传递雷印'], maxLevel: 1,
        accent: '#9B8BE5', iconResourcePath: 'art/relics/xianxia-relics_15/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '连锁扩散 · 敌潮强化',
    },
    {
        id: 'spell-sword', title: '借法还真', path: 'mystic', role: '法印 · 术后剑势',
        descriptions: ['释放功法后，下一轮飞剑伤害 +50%'], maxLevel: 1,
        accent: '#9B8BE5', iconResourcePath: 'art/relics/xianxia-relics_20/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '主动起手 · 御剑收束',
    },
    {
        id: 'overflow-shield', title: '青木护生', path: 'vitality', role: '命格 · 回复化盾',
        descriptions: ['击杀回复溢出时转化为护体值'], maxLevel: 1,
        accent: '#82D7AC', iconResourcePath: 'art/relics/xianxia-relics_19/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '满血仍有收益',
    },
    {
        id: 'shield-burst', title: '罡气反震', path: 'vitality', role: '命格 · 破盾反击',
        descriptions: ['护体值耗尽时释放环形剑气'], maxLevel: 1,
        accent: '#82D7AC', iconResourcePath: 'art/relics/xianxia-relics_04/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '承伤转攻 · 近身解围',
    },
    {
        id: 'wither-cycle', title: '枯荣轮转', path: 'vitality', role: '命格 · 血线转换',
        descriptions: ['气血低于 45% 时攻速 +22%，高于 80% 时缓慢回复'], maxLevel: 1,
        accent: '#82D7AC', iconResourcePath: 'art/relics/xianxia-relics_21/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '低血抢攻 · 高血养息',
    },
    {
        id: 'endless-life', title: '生生不息', path: 'vitality', role: '命格 · 击杀续航',
        descriptions: ['击杀普通敌人回复 2 点气血'], maxLevel: 1,
        accent: '#82D7AC', iconResourcePath: 'art/relics/xianxia-relics_18/spriteFrame',
        offerKind: 'regular', routeContribution: 1, combatRead: '持续敌潮 · 稳定续航',
    },
    {
        id: 'thunder-swords', title: '雷引万剑', path: 'mystic', role: '天机 · 锋玄合流',
        descriptions: ['飞剑命中雷印目标时触发连锁雷光'], maxLevel: 1,
        accent: '#B6A2FF', iconResourcePath: 'art/relics/xianxia-relics_11/spriteFrame',
        offerKind: 'synergy', routeContribution: 0, combatRead: '锋芒 3 + 玄术 2',
    },
    {
        id: 'blood-sword-return', title: '血剑归元', path: 'edge', role: '天机 · 锋守合流',
        descriptions: ['飞剑击杀返还护体值，破盾时生成追击剑'], maxLevel: 1,
        accent: '#E6B879', iconResourcePath: 'art/relics/xianxia-relics_17/spriteFrame',
        offerKind: 'synergy', routeContribution: 0, combatRead: '锋芒 3 + 守元 2',
    },
    {
        id: 'heavenly-cycle', title: '周天生息', path: 'vitality', role: '天机 · 玄守合流',
        descriptions: ['释放功法时回复气血，溢出回复转为劫力'], maxLevel: 1,
        accent: '#7FD8C6', iconResourcePath: 'art/relics/xianxia-relics_20/spriteFrame',
        offerKind: 'synergy', routeContribution: 0, combatRead: '玄术 3 + 守元 2',
    },
    {
        id: 'myriad-swords', title: '万剑归宗', path: 'edge', role: '真诀 · 聚剑齐射',
        descriptions: ['周期性召出五柄飞剑齐射，聚剑后短暂延长普攻间隔'], maxLevel: 1,
        accent: '#F0C879', iconResourcePath: 'art/relics/xianxia-relics_00/spriteFrame',
        offerKind: 'ultimate', routeContribution: 0, combatRead: '锋芒 5 · 御剑成潮',
    },
    {
        id: 'ninefold-tribulation', title: '九霄劫阵', path: 'mystic', role: '真诀 · 阵落天雷',
        descriptions: ['剑阵结束时追加一道天雷，剑阵冷却略增'], maxLevel: 1,
        accent: '#F0C879', iconResourcePath: 'art/relics/xianxia-relics_11/spriteFrame',
        offerKind: 'ultimate', routeContribution: 0, combatRead: '玄术 5 · 阵劫相生',
    },
    {
        id: 'undying-sword-body', title: '不灭剑体', path: 'vitality', role: '真诀 · 抵命化剑',
        descriptions: ['每波首次致命伤转为护体值并爆发剑气'], maxLevel: 1,
        accent: '#F0C879', iconResourcePath: 'art/relics/xianxia-relics_04/spriteFrame',
        offerKind: 'ultimate', routeContribution: 0, combatRead: '守元 5 · 每波一次',
    },
    {
        id: 'cloud-step', title: '踏云无痕', path: 'mystic', role: '通用 · 移动容错',
        descriptions: ['点地移动起步时获得 0.28 秒无碰撞'], maxLevel: 1,
        accent: '#B7D8CB', iconResourcePath: 'art/relics/xianxia-relics_23/spriteFrame',
        offerKind: 'common', routeContribution: 0, combatRead: '不增加新按钮',
    },
    {
        id: 'clear-mind', title: '灵台澄明', path: 'mystic', role: '通用 · 随机管理',
        descriptions: ['观星次数 +1，下一次更易出现联动牌'], maxLevel: 1,
        accent: '#B7D8CB', iconResourcePath: 'art/relics/xianxia-relics_12/spriteFrame',
        offerKind: 'common', routeContribution: 0, combatRead: '多一次重观命盘',
    },
    {
        id: 'breath-return', title: '养气归元', path: 'vitality', role: '通用 · 可靠补足',
        descriptions: ['气血上限 +30 并立即回复 30 点'], maxLevel: 1,
        accent: '#B7D8CB', iconResourcePath: 'art/relics/xianxia-relics_19/spriteFrame',
        offerKind: 'common', routeContribution: 0, combatRead: '无前置 · 即时生效',
    },
];

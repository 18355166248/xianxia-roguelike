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
    | 'heal';

export type UpgradePath = 'edge' | 'mystic' | 'vitality';

export interface UpgradeConfig {
    id: UpgradeId;
    title: string;
    path: UpgradePath;
    role: string;
    descriptions: readonly [string, string, string];
    maxLevel: number;
    accent: string;
    iconResourcePath: string;
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
    },
];

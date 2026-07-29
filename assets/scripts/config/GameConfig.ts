export type EnemyKind = 'mountainSpirit' | 'foxSpirit' | 'jiangshi' | 'shanxiao';
export type EnemyBehavior = 'chaser' | 'weaver' | 'lunger' | 'boss';

export interface WaveConfig {
    enemyKind: EnemyKind;
    behavior: EnemyBehavior;
    count: number;
    hp: number;
    speed: number;
    damage: number;
    radius: number;
    xp: number;
    spawnInterval: number;
    elite?: boolean;
    abilityInterval?: number;
    abilityDamage?: number;
}

export interface StageConfig {
    id: number;
    chapter: string;
    stageName: string;
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

export interface UpgradeConfig {
    id: UpgradeId;
    title: string;
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
        waves: [
            {
                enemyKind: 'mountainSpirit',
                behavior: 'chaser',
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
                count: 1,
                hp: 2400,
                speed: 45,
                damage: 18,
                radius: 58,
                xp: 120,
                spawnInterval: 0.1,
                elite: true,
                abilityInterval: 3.8,
                abilityDamage: 24,
            },
        ],
    },
];

export const UPGRADES: UpgradeConfig[] = [
    {
        id: 'sword',
        title: '御剑诀',
        descriptions: ['觉醒自动御剑', '飞剑数量 +1，灵光增强', '飞剑数量 +1，御剑圆满'],
        maxLevel: 3,
        accent: '#7DD3FC',
        iconResourcePath: 'art/relics/xianxia-relics_00/spriteFrame',
    },
    {
        id: 'dash',
        title: '踏云步',
        descriptions: ['解锁踏云闪身与短暂无敌', '闪身距离与无敌时间提升', '沿途斩击敌人，冷却缩短'],
        maxLevel: 3,
        accent: '#86EFAC',
        iconResourcePath: 'art/relics/xianxia-relics_23/spriteFrame',
    },
    {
        id: 'formation',
        title: '周天剑阵',
        descriptions: ['解锁环形剑阵', '剑阵范围扩大，灵剑增至七柄', '九剑齐出，伤害与范围圆满'],
        maxLevel: 3,
        accent: '#67E8F9',
        iconResourcePath: 'art/relics/xianxia-relics_05/spriteFrame',
    },
    {
        id: 'tribulation',
        title: '天劫剑意',
        descriptions: ['解锁蓄力天劫', '天劫降下两重剑光', '三重天劫，充能与威力圆满'],
        maxLevel: 3,
        accent: '#FDE68A',
        iconResourcePath: 'art/relics/xianxia-relics_11/spriteFrame',
    },
    {
        id: 'damage',
        title: '剑心通明',
        descriptions: ['飞剑伤害 +30%', '飞剑伤害再 +30%', '飞剑伤害再 +35%'],
        maxLevel: 3,
        accent: '#FDE68A',
        iconResourcePath: 'art/relics/xianxia-relics_06/spriteFrame',
    },
    {
        id: 'haste',
        title: '御剑如风',
        descriptions: ['攻击间隔 -15%', '攻击间隔再 -15%', '攻击间隔再 -18%'],
        maxLevel: 3,
        accent: '#C4B5FD',
        iconResourcePath: 'art/relics/xianxia-relics_05/spriteFrame',
    },
    {
        id: 'guard',
        title: '护体罡气',
        descriptions: ['生命上限 +25 并回复', '生命上限再 +30 并回复', '生命上限再 +35 并回复'],
        maxLevel: 3,
        accent: '#93C5FD',
        iconResourcePath: 'art/relics/xianxia-relics_04/spriteFrame',
    },
    {
        id: 'heal',
        title: '枯木逢春',
        descriptions: ['立即回复 35% 生命', '立即回复 45% 生命', '回满生命并获得短暂无敌'],
        maxLevel: 3,
        accent: '#6EE7B7',
        iconResourcePath: 'art/relics/xianxia-relics_19/spriteFrame',
    },
];

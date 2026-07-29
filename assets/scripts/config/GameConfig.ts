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

export type UpgradeId = 'sword' | 'damage' | 'haste' | 'speed' | 'guard' | 'heal';

export interface UpgradeConfig {
    id: UpgradeId;
    title: string;
    description: string;
    accent: string;
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
    { id: 'sword', title: '万剑归宗', description: '飞剑数量 +1', accent: '#7DD3FC' },
    { id: 'damage', title: '剑心通明', description: '飞剑伤害 +35%', accent: '#FDE68A' },
    { id: 'haste', title: '御剑如风', description: '攻击间隔 -18%', accent: '#C4B5FD' },
    { id: 'speed', title: '踏云步', description: '移动速度 +15%', accent: '#86EFAC' },
    { id: 'guard', title: '护体罡气', description: '回复并提升生命上限', accent: '#93C5FD' },
    { id: 'heal', title: '枯木逢春', description: '立即回复 35% 生命', accent: '#6EE7B7' },
];

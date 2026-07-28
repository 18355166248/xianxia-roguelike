export interface WaveConfig {
    count: number;
    hp: number;
    speed: number;
    damage: number;
    spawnInterval: number;
    elite?: boolean;
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
            { count: 6, hp: 24, speed: 62, damage: 8, spawnInterval: 0.55 },
            { count: 9, hp: 34, speed: 72, damage: 9, spawnInterval: 0.45 },
            { count: 12, hp: 44, speed: 80, damage: 11, spawnInterval: 0.38 },
            { count: 1, hp: 520, speed: 48, damage: 18, spawnInterval: 0.1, elite: true },
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

export interface RoadProfilePoint {
    y: number;
    centerX: number;
    halfWidth: number;
}

export const DESIGN_SIZE = {
    width: 750,
    height: 1334,
} as const;

export const ARENA_BOUNDS = {
    left: -365,
    right: 365,
    bottom: -620,
    top: 525,
} as const;

// 这里描述的是背景图中的实际石板路，不是通用碰撞框；换场景时必须随底图一起替换。
export const QINGSHI_ROAD_PROFILE: ReadonlyArray<RoadProfilePoint> = [
    { y: -620, centerX: 15, halfWidth: 160 },
    { y: -500, centerX: 0, halfWidth: 195 },
    { y: -360, centerX: -10, halfWidth: 235 },
    { y: -220, centerX: 0, halfWidth: 210 },
    { y: -80, centerX: 0, halfWidth: 230 },
    { y: 80, centerX: 20, halfWidth: 205 },
    { y: 220, centerX: 15, halfWidth: 235 },
    { y: 360, centerX: 5, halfWidth: 240 },
    { y: 500, centerX: 10, halfWidth: 270 },
    { y: 525, centerX: 8, halfWidth: 250 },
];

// 竹林中段更窄、上段突然展开为首领空地，形成“穿隙—入场”的地图节奏。
export const BAMBOO_AMBUSH_PROFILE: ReadonlyArray<RoadProfilePoint> = [
    { y: -620, centerX: 4, halfWidth: 145 },
    { y: -500, centerX: 8, halfWidth: 168 },
    { y: -360, centerX: -12, halfWidth: 178 },
    { y: -220, centerX: -8, halfWidth: 182 },
    { y: -80, centerX: 14, halfWidth: 175 },
    { y: 80, centerX: 2, halfWidth: 182 },
    { y: 190, centerX: 0, halfWidth: 224 },
    { y: 300, centerX: 0, halfWidth: 276 },
    { y: 420, centerX: 0, halfWidth: 268 },
    { y: 525, centerX: 0, halfWidth: 232 },
];

// 寒潭中段由两块宽冰台连接，侧边深水不可进入，上段祭坛重新展开为圆形决战区。
export const FROZEN_RUINS_PROFILE: ReadonlyArray<RoadProfilePoint> = [
    { y: -620, centerX: 0, halfWidth: 150 },
    { y: -500, centerX: -4, halfWidth: 180 },
    { y: -380, centerX: 0, halfWidth: 292 },
    { y: -240, centerX: 6, halfWidth: 300 },
    { y: -110, centerX: 0, halfWidth: 190 },
    { y: 30, centerX: -4, halfWidth: 260 },
    { y: 170, centerX: 0, halfWidth: 250 },
    { y: 285, centerX: 0, halfWidth: 292 },
    { y: 420, centerX: 0, halfWidth: 286 },
    { y: 525, centerX: 0, halfWidth: 230 },
];

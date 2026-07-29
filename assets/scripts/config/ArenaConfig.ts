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

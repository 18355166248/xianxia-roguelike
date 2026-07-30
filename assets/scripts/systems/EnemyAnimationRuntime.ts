export const ENEMY_ANIMATION_COLUMNS = 4;
export const ENEMY_ANIMATION_ROWS = 4;

export interface EnemyAnimationFrame {
    row: number;
    column: number;
}

export interface BossAnimationInput {
    age: number;
    moving: boolean;
    castTimer: number;
    hitTimer: number;
    enrageTimer: number;
}

function loopingColumn(time: number, fps: number): number {
    return Math.floor(Math.max(0, time) * fps) % ENEMY_ANIMATION_COLUMNS;
}

export function resolveBossAnimationFrame(input: BossAnimationInput): EnemyAnimationFrame {
    // 状态优先级保证受击与转阶段不会被移动覆盖，施法行则严格跟随震地前摇。
    if (input.enrageTimer > 0) {
        const progress = 1 - Math.min(1, input.enrageTimer / 1.05);
        return { row: 3, column: progress < 0.38 ? 2 : 3 };
    }
    if (input.hitTimer > 0) {
        return { row: 3, column: Math.floor(input.hitTimer * 18) % 2 };
    }
    if (input.castTimer > 0) {
        const progress = 1 - Math.min(1, input.castTimer / 0.85);
        return { row: 2, column: Math.min(3, Math.floor(progress * 4)) };
    }
    if (input.moving) return { row: 1, column: loopingColumn(input.age, 6) };
    return { row: 0, column: loopingColumn(input.age, 3.2) };
}

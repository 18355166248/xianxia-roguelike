export type PlayerAction =
    | 'idle'
    | 'move'
    | 'autoAttack'
    | 'aimedVolley'
    | 'dash'
    | 'formation'
    | 'tribulation'
    | 'hit'
    | 'defeat';

const ACTION_PRIORITY: Record<PlayerAction, number> = {
    idle: 0,
    move: 0,
    autoAttack: 1,
    aimedVolley: 3,
    dash: 5,
    formation: 5,
    tribulation: 6,
    hit: 7,
    defeat: 9,
};

export function shouldConfirmTapMove(holdSeconds: number, dragDistance: number): boolean {
    return holdSeconds <= 0.65 && dragDistance <= 26;
}

export function resolveTapMovePoint(
    ui: Readonly<{ x: number; y: number }>,
    visibleWidth: number,
    designHeight: number,
    worldOffset: Readonly<{ x: number; y: number }> = { x: 0, y: 0 },
): { x: number; y: number } {
    return {
        x: ui.x - visibleWidth / 2 - worldOffset.x,
        y: ui.y - designHeight / 2 - worldOffset.y,
    };
}

export interface TapMoveStep {
    arrived: boolean;
    distance: number;
    x: number;
    y: number;
}

export function resolveTapMoveStep(
    current: Readonly<{ x: number; y: number }>,
    target: Readonly<{ x: number; y: number }>,
    arrivalRadius = 16,
): TapMoveStep {
    const dx = target.x - current.x;
    const dy = target.y - current.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= Math.max(0, arrivalRadius)) {
        return { arrived: true, distance, x: 0, y: 0 };
    }
    return {
        arrived: false,
        distance,
        x: dx / distance,
        y: dy / distance,
    };
}

/**
 * 角色表现只允许一个主动作占用身体姿态；高优先级动作可以打断低优先级动作，
 * 避免受击、身法和蓄力同时修改缩放与旋转造成抖动。
 */
export class PlayerActionRuntime {
    public current: PlayerAction = 'idle';
    public elapsed = 0;
    public duration = 0;

    public reset(): void {
        this.current = 'idle';
        this.elapsed = 0;
        this.duration = 0;
    }

    public enter(action: PlayerAction, duration: number, force = false): boolean {
        if (!force && this.duration > 0 && ACTION_PRIORITY[action] < ACTION_PRIORITY[this.current]) {
            return false;
        }
        this.current = action;
        this.elapsed = 0;
        this.duration = Math.max(0, duration);
        return true;
    }

    public tick(dt: number, moving: boolean): void {
        if (this.duration > 0) {
            this.elapsed += dt;
            this.duration = Math.max(0, this.duration - dt);
        }
        if (this.duration > 0 || this.current === 'defeat') return;
        this.current = moving ? 'move' : 'idle';
        this.elapsed = 0;
    }

    public progress(): number {
        const total = this.elapsed + this.duration;
        return total <= 0 ? 1 : Math.max(0, Math.min(1, this.elapsed / total));
    }

    public is(...actions: PlayerAction[]): boolean {
        return actions.includes(this.current);
    }
}

export interface MapObstacleSpec {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hp: number;
}

export interface MapObstacleState extends MapObstacleSpec {
    maxHp: number;
    destroyed: boolean;
}

export interface ObstacleDamageResult {
    hit: boolean;
    destroyed: boolean;
    remainingHp: number;
}

export interface Point2D {
    x: number;
    y: number;
}

export class MapObstacleRuntime {
    private states: MapObstacleState[] = [];

    public begin(specs: ReadonlyArray<MapObstacleSpec>): void {
        // 每局复制关卡配置，避免障碍血量回写到静态配置，重开时能可靠恢复。
        this.states = specs.map((spec) => ({
            ...spec,
            maxHp: spec.hp,
            destroyed: false,
        }));
    }

    public reset(): void {
        this.states = [];
    }

    public list(): ReadonlyArray<MapObstacleState> {
        return this.states;
    }

    public activeCount(): number {
        return this.states.filter((state) => !state.destroyed).length;
    }

    public damage(id: string, amount: number): ObstacleDamageResult {
        const state = this.states.find((candidate) => candidate.id === id);
        if (!state || state.destroyed || amount <= 0) {
            return { hit: false, destroyed: false, remainingHp: state?.hp ?? 0 };
        }
        state.hp = Math.max(0, state.hp - amount);
        const destroyed = state.hp <= 0;
        state.destroyed = destroyed;
        return { hit: true, destroyed, remainingHp: state.hp };
    }

    public findSegmentHit(start: Point2D, end: Point2D, radius = 0): MapObstacleState | undefined {
        let nearest: MapObstacleState | undefined;
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (const state of this.states) {
            if (state.destroyed) continue;
            if (!this.segmentIntersectsExpandedRect(start, end, state, radius)) continue;
            const distance = Math.hypot(state.x - start.x, state.y - start.y);
            if (distance >= nearestDistance) continue;
            nearest = state;
            nearestDistance = distance;
        }
        return nearest;
    }

    public resolveCircle(position: Point2D, radius: number): Point2D {
        let x = position.x;
        let y = position.y;
        for (const state of this.states) {
            if (state.destroyed) continue;
            const halfWidth = state.width / 2 + radius;
            const halfHeight = state.height / 2 + radius;
            const dx = x - state.x;
            const dy = y - state.y;
            if (Math.abs(dx) >= halfWidth || Math.abs(dy) >= halfHeight) continue;

            const pushX = halfWidth - Math.abs(dx);
            const pushY = halfHeight - Math.abs(dy);
            if (pushX < pushY) x = state.x + (dx >= 0 ? halfWidth : -halfWidth);
            else y = state.y + (dy >= 0 ? halfHeight : -halfHeight);
        }
        return { x, y };
    }

    private segmentIntersectsExpandedRect(
        start: Point2D,
        end: Point2D,
        state: MapObstacleState,
        radius: number,
    ): boolean {
        const minX = state.x - state.width / 2 - radius;
        const maxX = state.x + state.width / 2 + radius;
        const minY = state.y - state.height / 2 - radius;
        const maxY = state.y + state.height / 2 + radius;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        let near = 0;
        let far = 1;

        // 线段与扩张 AABB 的 slab 检测同时覆盖飞剑轨迹和冲刺路径。
        for (const [origin, delta, min, max] of [
            [start.x, dx, minX, maxX],
            [start.y, dy, minY, maxY],
        ] as const) {
            if (Math.abs(delta) < 1e-8) {
                if (origin < min || origin > max) return false;
                continue;
            }
            const inverse = 1 / delta;
            let t1 = (min - origin) * inverse;
            let t2 = (max - origin) * inverse;
            if (t1 > t2) [t1, t2] = [t2, t1];
            near = Math.max(near, t1);
            far = Math.min(far, t2);
            if (near > far) return false;
        }
        return true;
    }
}

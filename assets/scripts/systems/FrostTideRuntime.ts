export interface Point2D {
    x: number;
    y: number;
}

export interface FrostVelocity {
    x: number;
    y: number;
}

export type FrostTidePhase = 'calm' | 'warning' | 'surge';

export interface FrostTideSnapshot {
    phase: FrostTidePhase;
    cycle: number;
    direction: 1 | -1;
    progress: number;
    bandY: number;
    secondsToSurge: number;
}

export interface IceZone {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export const FROST_ICE_ZONES: ReadonlyArray<IceZone> = [
    { minX: -270, maxX: 270, minY: -390, maxY: -128 },
    { minX: -235, maxX: 235, minY: -92, maxY: 212 },
];

export function resolveFrostImpactFrame(progress: number): number {
    const normalized = Math.min(1, Math.max(0, progress));
    return Math.min(3, Math.floor(normalized * 4));
}

const CYCLE_SECONDS = 7.2;
const WARNING_START = 4.8;
const SURGE_START = 5.8;
const SURGE_SECONDS = CYCLE_SECONDS - SURGE_START;
const TIDE_BOTTOM = -570;
const TIDE_TOP = 480;

export function isOnFrostIce(position: Point2D): boolean {
    return FROST_ICE_ZONES.some((zone) => (
        position.x >= zone.minX
        && position.x <= zone.maxX
        && position.y >= zone.minY
        && position.y <= zone.maxY
    ));
}

export function resolveFrostVelocity(
    current: FrostVelocity,
    input: Point2D,
    speed: number,
    dt: number,
    onIce: boolean,
): FrostVelocity {
    if (!onIce) return { x: input.x * speed, y: input.y * speed };
    const inputAmount = Math.min(1, Math.hypot(input.x, input.y));
    const response = inputAmount > 0.04 ? 3.2 : 0.72;
    const blend = Math.min(1, Math.max(0, dt) * response);
    const targetX = input.x * speed;
    const targetY = input.y * speed;
    return {
        x: current.x + (targetX - current.x) * blend,
        y: current.y + (targetY - current.y) * blend,
    };
}

export class FrostTideRuntime {
    private elapsed = 0;

    public reset(): void {
        this.elapsed = 0;
    }

    public tick(dt: number): FrostTideSnapshot {
        this.elapsed += Math.max(0, dt);
        return this.snapshot();
    }

    public triggerWarning(): FrostTideSnapshot {
        const cycle = Math.floor(this.elapsed / CYCLE_SECONDS);
        const cycleStart = cycle * CYCLE_SECONDS;
        const cycleTime = this.elapsed - cycleStart;
        // 首领转阶段只把平静期推进到预警起点；已经进入预警或横渡时不回拨环境时钟。
        if (cycleTime < WARNING_START) this.elapsed = cycleStart + WARNING_START;
        return this.snapshot();
    }

    public snapshot(): FrostTideSnapshot {
        const cycle = Math.floor(this.elapsed / CYCLE_SECONDS);
        const cycleTime = this.elapsed - cycle * CYCLE_SECONDS;
        const direction: 1 | -1 = cycle % 2 === 0 ? 1 : -1;
        if (cycleTime < WARNING_START) {
            return {
                phase: 'calm',
                cycle,
                direction,
                progress: 0,
                bandY: direction > 0 ? TIDE_BOTTOM : TIDE_TOP,
                secondsToSurge: SURGE_START - cycleTime,
            };
        }
        if (cycleTime < SURGE_START) {
            return {
                phase: 'warning',
                cycle,
                direction,
                progress: (cycleTime - WARNING_START) / (SURGE_START - WARNING_START),
                bandY: direction > 0 ? TIDE_BOTTOM : TIDE_TOP,
                secondsToSurge: SURGE_START - cycleTime,
            };
        }
        const progress = Math.min(1, (cycleTime - SURGE_START) / SURGE_SECONDS);
        return {
            phase: 'surge',
            cycle,
            direction,
            progress,
            bandY: direction > 0
                ? TIDE_BOTTOM + (TIDE_TOP - TIDE_BOTTOM) * progress
                : TIDE_TOP - (TIDE_TOP - TIDE_BOTTOM) * progress,
            secondsToSurge: 0,
        };
    }

    public isInWaveBand(y: number, threshold = 58): boolean {
        const state = this.snapshot();
        return state.phase === 'surge' && Math.abs(y - state.bandY) <= threshold;
    }
}

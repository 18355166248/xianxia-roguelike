export type VfxPriority = 'ambient' | 'combat' | 'critical';
export type VfxDensity = 'low' | 'balanced' | 'high';

export interface VfxAdmission {
    id: number;
    priority: VfxPriority;
    detailScale: number;
}

export interface VfxBudgetSnapshot {
    active: number;
    frameTimeMs: number;
    qualityScale: number;
    admitted: number;
    dropped: number;
}

const PRIORITY_COST: Readonly<Record<VfxPriority, number>> = {
    ambient: 1,
    combat: 2,
    critical: 3,
};

/**
 * Controls transient combat presentation independently from combat rules. The budget deliberately
 * sheds ambient rewards and ordinary numbers before it touches hit confirmation or finishers.
 */
export class CombatPresentationRuntime {
    private readonly active = new Map<number, VfxPriority>();
    private nextId = 1;
    private smoothedFrameTime = 1 / 60;
    private qualityScale = 1;
    private admitted = 0;
    private dropped = 0;

    public updateFrameTime(dt: number): void {
        if (!Number.isFinite(dt) || dt <= 0 || dt > 0.25) return;
        this.smoothedFrameTime += (dt - this.smoothedFrameTime) * 0.08;
        const target = this.smoothedFrameTime >= 1 / 38
            ? 0.55
            : this.smoothedFrameTime >= 1 / 50
                ? 0.76
                : 1;
        // Degrade quickly under load, recover gradually so quality does not flicker every frame.
        const response = target < this.qualityScale ? 0.18 : 0.035;
        this.qualityScale += (target - this.qualityScale) * response;
    }

    public request(
        priority: VfxPriority,
        reducedMotion = false,
        density: VfxDensity = 'balanced',
    ): VfxAdmission | undefined {
        const densityScale = density === 'low' ? 0.66 : density === 'high' ? 1.22 : 1;
        const softLimit = reducedMotion ? 15 : Math.round(30 * this.qualityScale * densityScale);
        const hardLimit = reducedMotion ? 22 : Math.round(42 * this.qualityScale * densityScale);
        const weightedLoad = [...this.active.values()]
            .reduce((sum, activePriority) => sum + PRIORITY_COST[activePriority], 0);
        const load = weightedLoad / Math.max(softLimit * 2, 1);
        const shouldDrop = this.active.size >= hardLimit
            || (priority === 'ambient' && load >= 0.48)
            || (priority === 'combat' && load >= 0.92);
        if (shouldDrop) {
            this.dropped += 1;
            return undefined;
        }

        const id = this.nextId++;
        this.active.set(id, priority);
        this.admitted += 1;
        const loadScale = load >= 0.72 ? 0.58 : load >= 0.42 ? 0.76 : 1;
        return {
            id,
            priority,
            detailScale: Math.max(0.4, Math.min(1, this.qualityScale * loadScale
                * (reducedMotion ? 0.58 : density === 'low' ? 0.72 : 1))),
        };
    }

    public release(admission: Pick<VfxAdmission, 'id'> | undefined): void {
        if (admission) this.active.delete(admission.id);
    }

    public reset(): void {
        this.active.clear();
        this.smoothedFrameTime = 1 / 60;
        this.qualityScale = 1;
    }

    public snapshot(): VfxBudgetSnapshot {
        return {
            active: this.active.size,
            frameTimeMs: this.smoothedFrameTime * 1000,
            qualityScale: this.qualityScale,
            admitted: this.admitted,
            dropped: this.dropped,
        };
    }
}

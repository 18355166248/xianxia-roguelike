export type SpiritVeinKind = 'sword' | 'vitality';

export interface SpiritVeinTickResult {
    claimed: boolean;
    expired: boolean;
}

const CAPTURE_SECONDS = 1.25;
const BUFF_SECONDS = 10;

/**
 * 阵眼规则与场景节点解耦：驻足积累、离开衰减，成功后开启限时增益。
 * 每一波重新布置阵眼，避免上一波的进度或增益错误泄漏到下一波。
 */
export class SpiritVeinRuntime {
    public kind: SpiritVeinKind = 'sword';
    public captureProgress = 0;
    public buffTimer = 0;
    public claimed = false;

    public reset(): void {
        this.kind = 'sword';
        this.captureProgress = 0;
        this.buffTimer = 0;
        this.claimed = false;
    }

    public begin(kind: SpiritVeinKind): void {
        this.kind = kind;
        this.captureProgress = 0;
        this.buffTimer = 0;
        this.claimed = false;
    }

    public tick(dt: number, playerInRange: boolean): SpiritVeinTickResult {
        let claimed = false;
        let expired = false;
        if (!this.claimed) {
            const delta = playerInRange ? dt / CAPTURE_SECONDS : -dt * 0.24;
            this.captureProgress = Math.max(0, Math.min(1, this.captureProgress + delta));
            if (this.captureProgress >= 1) {
                this.claimed = true;
                this.buffTimer = BUFF_SECONDS;
                claimed = true;
            }
        } else if (this.buffTimer > 0) {
            this.buffTimer = Math.max(0, this.buffTimer - dt);
            expired = this.buffTimer === 0;
        }
        return { claimed, expired };
    }

    public damageMultiplier(): number {
        return this.claimed && this.buffTimer > 0 && this.kind === 'sword' ? 1.25 : 1;
    }

    public vitalityRegenPerSecond(maxHp: number): number {
        return this.claimed && this.buffTimer > 0 && this.kind === 'vitality' ? maxHp * 0.018 : 0;
    }
}

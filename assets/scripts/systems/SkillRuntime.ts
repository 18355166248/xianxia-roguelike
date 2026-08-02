import type { UpgradeId } from '../config/GameConfig';

export interface FormationSpec {
    radius: number;
    swordAmount: number;
    damageMultiplier: number;
    cooldown: number;
}

const DASH_DISTANCE = [150, 190, 230] as const;
const DASH_COOLDOWN = [5.2, 4.4, 3.5] as const;
const FORMATION_RADIUS = [145, 182, 220] as const;
const FORMATION_SWORDS = [5, 7, 9] as const;
const FORMATION_DAMAGE = [1.15, 1.48, 1.82] as const;
const FORMATION_COOLDOWN = [12, 10, 8] as const;

function tierIndex(level: number): 0 | 1 | 2 {
    return Math.max(0, Math.min(2, Math.floor(level) - 1)) as 0 | 1 | 2;
}

export function getDashDistance(level: number): number {
    return DASH_DISTANCE[tierIndex(level)];
}

export function getDashCooldown(level: number): number {
    return DASH_COOLDOWN[tierIndex(level)];
}

export function getFormationSpec(level: number): FormationSpec {
    const index = tierIndex(level);
    return {
        radius: FORMATION_RADIUS[index],
        swordAmount: FORMATION_SWORDS[index],
        damageMultiplier: FORMATION_DAMAGE[index],
        cooldown: FORMATION_COOLDOWN[index],
    };
}

export function getTribulationRequiredHold(level: number): number {
    return 0.72 - tierIndex(level) * 0.12;
}

export function getTribulationStrikeRadius(level: number): number {
    return 72 + level * 12;
}

export function getTribulationDamageMultiplier(level: number): number {
    return 1.75 + level * 0.55;
}

/**
 * 只管理功法等级、冷却、蓄力和动作时钟。
 * 命中判定与 Cocos 节点操作仍留在 GameBootstrap，避免规则层依赖场景生命周期。
 */
export class SkillRuntime {
    public levels: Partial<Record<UpgradeId, number>> = {};
    public dashCooldown = 0;
    public formationCooldown = 0;
    public tribulationCharge = 0;
    public tribulationHold = 0;
    public tribulationHolding = false;
    public dashActionTimer = 0;
    public formationActionTimer = 0;
    public tribulationActionTimer = 0;

    public reset(): void {
        // 自动御剑是初始功法，其他主动技能由破境选择逐步解锁。
        this.levels = { sword: 1 };
        this.dashCooldown = 0;
        this.formationCooldown = 0;
        this.tribulationCharge = 0;
        this.releaseTribulationHold();
        this.dashActionTimer = 0;
        this.formationActionTimer = 0;
        this.tribulationActionTimer = 0;
    }

    public getLevel(id: UpgradeId): number {
        return this.levels[id] ?? 0;
    }

    public tick(dt: number): boolean {
        this.dashCooldown = Math.max(0, this.dashCooldown - dt);
        this.formationCooldown = Math.max(0, this.formationCooldown - dt);
        this.dashActionTimer = Math.max(0, this.dashActionTimer - dt);
        this.formationActionTimer = Math.max(0, this.formationActionTimer - dt);
        this.tribulationActionTimer = Math.max(0, this.tribulationActionTimer - dt);

        const level = this.getLevel('tribulation');
        if (level > 0 && !this.tribulationHolding) {
            // 保留少量自然充能，避免波次间没有可命中目标时蓄力永久卡住。
            this.tribulationCharge = Math.min(1, this.tribulationCharge + dt * (0.012 + level * 0.003));
        }
        if (!this.tribulationHolding) return false;
        if (level <= 0 || this.tribulationCharge < 1) {
            this.releaseTribulationHold();
            return false;
        }
        this.tribulationHold += dt;
        return this.tribulationHold >= getTribulationRequiredHold(level);
    }

    public upgrade(id: UpgradeId, maxLevel = 3): number {
        const level = Math.min(maxLevel, this.getLevel(id) + 1);
        this.levels[id] = level;
        if (id === 'dash') this.dashCooldown = 0;
        if (id === 'formation') this.formationCooldown = 0;
        if (id === 'tribulation') this.tribulationCharge = 1;
        return level;
    }

    public markDashUsed(level: number): void {
        this.dashCooldown = getDashCooldown(level);
        this.dashActionTimer = 0.32;
    }

    public markFormationUsed(level: number): void {
        this.formationCooldown = getFormationSpec(level).cooldown;
        this.formationActionTimer = 0.58;
    }

    public beginTribulationHold(): boolean {
        if (this.getLevel('tribulation') <= 0 || this.tribulationCharge < 1 || this.tribulationHolding) {
            return false;
        }
        this.tribulationHolding = true;
        this.tribulationHold = 0;
        return true;
    }

    public releaseTribulationHold(): void {
        this.tribulationHolding = false;
        this.tribulationHold = 0;
    }

    public markTribulationCast(): void {
        this.tribulationCharge = 0;
        this.releaseTribulationHold();
        this.tribulationActionTimer = 0.8;
    }

    public addTribulationCharge(amount: number): void {
        if (this.getLevel('tribulation') <= 0) return;
        this.tribulationCharge = Math.min(1, this.tribulationCharge + amount);
    }

    public reduceCooldowns(seconds: number): void {
        this.dashCooldown = Math.max(0, this.dashCooldown - seconds);
        this.formationCooldown = Math.max(0, this.formationCooldown - seconds);
    }
}

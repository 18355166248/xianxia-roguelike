export type EffectDensity = 'low' | 'balanced' | 'high';

export interface GamePreferences {
    audioEnabled: boolean;
    vibrationEnabled: boolean;
    reducedMotion: boolean;
    effectDensity: EffectDensity;
    tutorialCompleted: boolean;
}

const DEFAULT_PREFERENCES: Readonly<GamePreferences> = {
    audioEnabled: true,
    vibrationEnabled: true,
    reducedMotion: false,
    effectDensity: 'balanced',
    tutorialCompleted: false,
};

export class GameSettingsRuntime {
    private state: GamePreferences;

    public constructor(systemReducedMotion = false) {
        this.state = {
            ...DEFAULT_PREFERENCES,
            reducedMotion: systemReducedMotion,
        };
    }

    public snapshot(): Readonly<GamePreferences> {
        return { ...this.state };
    }

    public update(patch: Partial<GamePreferences>): Readonly<GamePreferences> {
        this.state = { ...this.state, ...patch };
        return this.snapshot();
    }

    public completeTutorial(): void {
        this.state.tutorialCompleted = true;
    }

    public restore(serialized: string | undefined): boolean {
        if (!serialized) return false;
        try {
            const parsed = JSON.parse(serialized) as unknown;
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
            const candidate = parsed as Record<string, unknown>;
            const booleanKeys = [
                'audioEnabled',
                'vibrationEnabled',
                'reducedMotion',
                'tutorialCompleted',
            ] as const;
            if (booleanKeys.some((key) => candidate[key] !== undefined && typeof candidate[key] !== 'boolean')) {
                return false;
            }
            const density = candidate.effectDensity;
            if (density !== undefined && density !== 'low' && density !== 'balanced' && density !== 'high') return false;
            // 旧版本设置允许缺字段，新字段继续继承当前平台默认值，避免升级后重置玩家偏好。
            this.state = booleanKeys.reduce<GamePreferences>((next, key) => ({
                ...next,
                [key]: candidate[key] ?? next[key],
            }), {
                ...this.state,
                effectDensity: density ?? this.state.effectDensity,
            });
            return true;
        } catch {
            return false;
        }
    }

    public serialize(): string {
        return JSON.stringify(this.state);
    }
}

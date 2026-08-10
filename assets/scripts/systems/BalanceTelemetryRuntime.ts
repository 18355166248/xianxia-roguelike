import type { StageMapId, UpgradePath } from '../config/GameConfig';

export interface BalanceRunSample {
    stage: StageMapId;
    victory: boolean;
    durationSeconds: number;
    damageTaken: number;
    maxHp: number;
    routeChoiceId?: string;
    buildPath?: UpgradePath;
    buildTier: number;
}

export interface StageBalanceReport {
    sampleCount: number;
    victories: number;
    winRate: number;
    medianVictorySeconds?: number;
    averageDamageRatio: number;
    routeCounts: Readonly<Record<string, number>>;
    buildCounts: Readonly<Partial<Record<UpgradePath, number>>>;
    readiness: 'collecting' | 'healthy' | 'too-easy' | 'too-hard' | 'pace-outlier' | 'coverage-gap';
}

const MAX_SAMPLES = 60;
const VALID_STAGES: readonly StageMapId[] = ['qingshi-road', 'bamboo-ambush', 'frozen-ruins'];
const VALID_PATHS: readonly UpgradePath[] = ['edge', 'mystic', 'vitality'];

function median(values: readonly number[]): number | undefined {
    if (values.length === 0) return undefined;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
}

export class BalanceTelemetryRuntime {
    private samples: BalanceRunSample[] = [];

    public record(sample: Readonly<BalanceRunSample>): void {
        this.samples.push({
            ...sample,
            durationSeconds: Math.max(0, sample.durationSeconds),
            damageTaken: Math.max(0, sample.damageTaken),
            maxHp: Math.max(1, sample.maxHp),
            buildTier: Math.max(0, Math.floor(sample.buildTier)),
        });
        if (this.samples.length > MAX_SAMPLES) this.samples.splice(0, this.samples.length - MAX_SAMPLES);
    }

    public reportFor(stage: StageMapId, minimumSamples = 10): StageBalanceReport {
        const samples = this.samples.filter((sample) => sample.stage === stage);
        const victories = samples.filter((sample) => sample.victory);
        const winRate = samples.length > 0 ? victories.length / samples.length : 0;
        const medianVictorySeconds = median(victories.map((sample) => sample.durationSeconds));
        const averageDamageRatio = samples.length > 0
            ? samples.reduce((sum, sample) => sum + sample.damageTaken / sample.maxHp, 0) / samples.length
            : 0;
        const routeCounts = samples.reduce<Record<string, number>>((counts, sample) => {
            if (sample.routeChoiceId) counts[sample.routeChoiceId] = (counts[sample.routeChoiceId] ?? 0) + 1;
            return counts;
        }, {});
        // 构筑覆盖只认可通关样本，避免“尝试过但从未打通”的流派被误判为已通过数值验收。
        const buildCounts = victories.reduce<Partial<Record<UpgradePath, number>>>((counts, sample) => {
            if (sample.buildPath) counts[sample.buildPath] = (counts[sample.buildPath] ?? 0) + 1;
            return counts;
        }, {});
        let readiness: StageBalanceReport['readiness'] = 'healthy';
        if (samples.length < minimumSamples) readiness = 'collecting';
        else if (winRate > 0.8) readiness = 'too-easy';
        else if (winRate < 0.3) readiness = 'too-hard';
        else if (medianVictorySeconds !== undefined && (medianVictorySeconds < 150 || medianVictorySeconds > 300)) {
            readiness = 'pace-outlier';
        }
        else if (Object.keys(routeCounts).length < 2 || Object.keys(buildCounts).length < VALID_PATHS.length) {
            readiness = 'coverage-gap';
        }
        return {
            sampleCount: samples.length,
            victories: victories.length,
            winRate,
            medianVictorySeconds,
            averageDamageRatio,
            routeCounts,
            buildCounts,
            readiness,
        };
    }

    public serialize(): string {
        return JSON.stringify(this.samples);
    }

    public restore(serialized: string | undefined): boolean {
        if (!serialized) return false;
        try {
            const parsed = JSON.parse(serialized) as unknown;
            if (!Array.isArray(parsed)) return false;
            const restored: BalanceRunSample[] = [];
            for (const item of parsed.slice(-MAX_SAMPLES)) {
                if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
                const candidate = item as Record<string, unknown>;
                if (!VALID_STAGES.includes(candidate.stage as StageMapId)) return false;
                if (typeof candidate.victory !== 'boolean') return false;
                if (
                    typeof candidate.durationSeconds !== 'number'
                    || !Number.isFinite(candidate.durationSeconds)
                    || candidate.durationSeconds < 0
                    || typeof candidate.damageTaken !== 'number'
                    || !Number.isFinite(candidate.damageTaken)
                    || candidate.damageTaken < 0
                    || typeof candidate.maxHp !== 'number'
                    || !Number.isFinite(candidate.maxHp)
                    || candidate.maxHp <= 0
                    || typeof candidate.buildTier !== 'number'
                    || !Number.isFinite(candidate.buildTier)
                    || candidate.buildTier < 0
                ) return false;
                if (candidate.routeChoiceId !== undefined && typeof candidate.routeChoiceId !== 'string') return false;
                if (candidate.buildPath !== undefined && !VALID_PATHS.includes(candidate.buildPath as UpgradePath)) return false;
                restored.push({
                    stage: candidate.stage as StageMapId,
                    victory: candidate.victory,
                    durationSeconds: candidate.durationSeconds,
                    damageTaken: candidate.damageTaken,
                    maxHp: candidate.maxHp,
                    routeChoiceId: candidate.routeChoiceId as string | undefined,
                    buildPath: candidate.buildPath as UpgradePath | undefined,
                    buildTier: Math.floor(candidate.buildTier),
                });
            }
            this.samples = restored;
            return true;
        } catch {
            return false;
        }
    }
}

export function formatBalanceReport(report: Readonly<StageBalanceReport>): string {
    const readinessLabels: Readonly<Record<StageBalanceReport['readiness'], string>> = {
        collecting: '收集中',
        healthy: '健康',
        'too-easy': '偏易',
        'too-hard': '偏难',
        'pace-outlier': '节奏异常',
        'coverage-gap': '覆盖不足',
    };
    const pace = report.medianVictorySeconds === undefined
        ? '--:--'
        : `${Math.floor(report.medianVictorySeconds / 60)}:${String(Math.round(report.medianVictorySeconds % 60)).padStart(2, '0')}`;
    return `样本 ${report.sampleCount} · 胜率 ${Math.round(report.winRate * 100)}% · 中位 ${pace} · 承伤 ${Math.round(report.averageDamageRatio * 100)}% · ${readinessLabels[report.readiness]}`;
}

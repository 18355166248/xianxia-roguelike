import type { StageMapId } from '../config/GameConfig';
import type { BambooRouteGeometry } from './BambooRouteRuntime';
import type { FrostRouteGeometry } from './FrostRouteRuntime';
import type { QingshiRouteGeometry } from './QingshiRouteRuntime';

export type MapEventTone = 'gold' | 'jade' | 'cyan' | 'ember';
export type RouteCommitEffect =
    | 'stele-burst'
    | 'spring-flow'
    | 'bamboo-burn'
    | 'bamboo-shadow'
    | 'tide-convergence'
    | 'sealed-sanctuary';

export interface ChapterPreviewMotion {
    frameIndex: number;
    opacity: number;
    scale: number;
}

export interface RouteTracePoint {
    x: number;
    y: number;
}

export interface RouteHudSegmentState {
    completed: boolean;
    followsSelectedRoute: boolean;
}

export interface NextWaveModifiers {
    hp: number;
    speed: number;
    damage: number;
}

export interface MapEventEffect {
    hpDelta?: number;
    maxHpDelta?: number;
    swordDamageMultiplier?: number;
    moveSpeedMultiplier?: number;
    attackIntervalMultiplier?: number;
    tribulationCharge?: number;
    nextWave?: Partial<NextWaveModifiers>;
    clearObstacles?: boolean;
    qingshiRoute?: QingshiRouteGeometry;
    bambooRoute?: BambooRouteGeometry;
    frostRoute?: FrostRouteGeometry;
}

export interface MapEventChoice {
    id: string;
    title: string;
    role: string;
    description: string;
    outcome: string;
    riskLabel: string;
    tone: MapEventTone;
    iconResourcePath: string;
    geometryPreview?: string;
    commitLine: string;
    commitEffect?: RouteCommitEffect;
    effect: MapEventEffect;
}

export interface MapEventScenario {
    id: string;
    eyebrow: string;
    title: string;
    story: string;
    choices: readonly [MapEventChoice, MapEventChoice];
}

export function describeNextWaveModifiers(modifiers: Partial<NextWaveModifiers> | undefined): string {
    if (!modifiers) return '敌军常态';
    const entries: string[] = [];
    const append = (label: string, value: number | undefined): void => {
        if (value === undefined || value === 1) return;
        const percent = Math.round(Math.abs(value - 1) * 100);
        entries.push(`${label} ${value > 1 ? '+' : '-'}${percent}%`);
    };
    append('敌血', modifiers.hp);
    append('敌速', modifiers.speed);
    append('敌伤', modifiers.damage);
    return entries.length > 0 ? entries.join(' · ') : '敌军常态';
}

export function resolveRouteHudSegmentState(
    segmentIndex: number,
    currentWaveIndex: number,
    triggerWaveIndex: number,
    routeSelected: boolean,
): RouteHudSegmentState {
    return {
        completed: segmentIndex < currentWaveIndex,
        // 奇遇在触发波结束后才作选择，因此路线色只能从该波之后的线段开始，不能提前暗示玩家已选边。
        followsSelectedRoute: routeSelected && segmentIndex >= triggerWaveIndex,
    };
}

const DEFAULT_NEXT_WAVE: NextWaveModifiers = {
    hp: 1,
    speed: 1,
    damage: 1,
};

const MAP_EVENTS: Readonly<Record<StageMapId, MapEventScenario>> = {
    'qingshi-road': {
        id: 'qingshi-sword-stele',
        eyebrow: '山 道 奇 遇',
        title: '残碑问剑',
        story: '古剑碑横卧山门，剑痕未散。\n是以血悟锋，还是借泉稳住道心？',
        choices: [
            {
                id: 'read-the-scar',
                title: '以血悟痕',
                role: '锋芒捷径',
                description: '承受 12 点气血损耗，参悟碑上旧剑意。',
                outcome: '飞剑伤害 +22%',
                riskLabel: '代价：损血',
                tone: 'gold',
                iconResourcePath: 'art/relics/xianxia-relics_00/spriteFrame',
                geometryPreview: '剑碑阵列',
                commitLine: '三碑落阵 · 诱敌入痕承伤',
                commitEffect: 'stele-burst',
                effect: {
                    hpDelta: -12,
                    swordDamageMultiplier: 1.22,
                    qingshiRoute: 'sword-stele-array',
                },
            },
            {
                id: 'settle-the-breath',
                title: '引泉调息',
                role: '稳守道基',
                description: '放下急进之念，以灵泉重整经脉。',
                outcome: '气血上限 +18，并回复 36',
                riskLabel: '安稳：续战',
                tone: 'jade',
                iconResourcePath: 'art/relics/xianxia-relics_19/spriteFrame',
                geometryPreview: '灵泉侧路',
                commitLine: '灵泉移向侧路 · 驻足回气',
                commitEffect: 'spring-flow',
                effect: {
                    maxHpDelta: 18,
                    hpDelta: 36,
                    qingshiRoute: 'spring-detour',
                },
            },
        ],
    },
    'bamboo-ambush': {
        id: 'bamboo-hidden-path',
        eyebrow: '竹 林 奇 遇',
        title: '竹火分径',
        story: '伏兵将至，残竹仍在风中作响。\n可焚障抢攻，也可隐入竹影诱敌深入。',
        choices: [
            {
                id: 'burn-the-barriers',
                title: '焚竹开径',
                role: '强攻捷径',
                description: '烧尽残障，借火势催动飞剑。',
                outcome: '清除竹障，飞剑伤害 +15%',
                riskLabel: '风险：敌伤 +12%',
                tone: 'ember',
                iconResourcePath: 'art/relics/xianxia-relics_11/spriteFrame',
                geometryPreview: '开阔正面',
                commitLine: '竹障焚尽 · 敌军正面压境',
                commitEffect: 'bamboo-burn',
                effect: {
                    swordDamageMultiplier: 1.15,
                    tribulationCharge: 0.55,
                    clearObstacles: true,
                    bambooRoute: 'open-lane',
                    nextWave: { damage: 1.12 },
                },
            },
            {
                id: 'hide-in-bamboo',
                title: '敛息入影',
                role: '身法迂回',
                description: '借竹影换位，诱使伏兵仓促追入窄径。',
                outcome: '移速 +12%，下波敌人气血 -12%',
                riskLabel: '风险：敌速 +10%',
                tone: 'jade',
                iconResourcePath: 'art/relics/xianxia-relics_23/spriteFrame',
                geometryPreview: '竹影夹道',
                commitLine: '竹障成径 · 伏兵左右夹击',
                commitEffect: 'bamboo-shadow',
                effect: {
                    moveSpeedMultiplier: 1.12,
                    bambooRoute: 'shadow-corridor',
                    nextWave: { hp: 0.88, speed: 1.1 },
                },
            },
        ],
    },
    'frozen-ruins': {
        id: 'frozen-tide-altar',
        eyebrow: '寒 潭 奇 遇',
        title: '祭坛逆潮',
        story: '冰下灵潮撞击古坛，寒光忽明忽暗。\n可强借潮力破敌，也可封脉稳住身形。',
        choices: [
            {
                id: 'borrow-the-tide',
                title: '逆祭借潮',
                role: '险中求胜',
                description: '引寒潮灌入剑脉，抢在反噬前破阵。',
                outcome: '飞剑伤害 +18%，下波敌血 -18%',
                riskLabel: '风险：敌伤 +18%',
                tone: 'cyan',
                iconResourcePath: 'art/relics/xianxia-relics_05/spriteFrame',
                geometryPreview: '潮线聚敌',
                commitLine: '祭纹聚敌 · 寒潮穿阵',
                commitEffect: 'tide-convergence',
                effect: {
                    swordDamageMultiplier: 1.18,
                    tribulationCharge: 0.35,
                    frostRoute: 'tide-convergence',
                    nextWave: { hp: 0.82, damage: 1.18 },
                },
            },
            {
                id: 'seal-the-tide',
                title: '封脉稳息',
                role: '御寒续战',
                description: '闭合寒脉，以更缓的节奏穿过祭坛。',
                outcome: '回复 40 气血，攻击间隔 -8%',
                riskLabel: '风险：敌血 +10%',
                tone: 'jade',
                iconResourcePath: 'art/relics/xianxia-relics_04/spriteFrame',
                geometryPreview: '封脉结界',
                commitLine: '结界落位 · 入阵避潮',
                commitEffect: 'sealed-sanctuary',
                effect: {
                    hpDelta: 40,
                    attackIntervalMultiplier: 0.92,
                    frostRoute: 'sealed-sanctuary',
                    nextWave: { hp: 1.1 },
                },
            },
        ],
    },
};

export function mapEventScenarioFor(mapId: StageMapId): MapEventScenario {
    return MAP_EVENTS[mapId];
}

export function describeChapterBranchMemory(mapId: StageMapId): string {
    const labels = mapEventScenarioFor(mapId).choices.map(
        (choice) => choice.geometryPreview ?? choice.title,
    );
    return `分岔预见 · ${labels.join(' / ')}`;
}

function clampRandomIndex(random: () => number, length: number): number {
    return Math.min(length - 1, Math.floor(Math.max(0, random()) * length));
}

export function resolveRouteCommitFrame(progress: number): number {
    const normalized = Math.min(1, Math.max(0, progress));
    return Math.min(3, Math.floor(normalized * 4));
}

export function resolveChapterPreviewMotion(progress: number): ChapterPreviewMotion {
    const normalized = Math.min(1, Math.max(0, progress));
    const opacity = normalized < 0.12
        ? normalized / 0.12
        : normalized > 0.72
            ? Math.max(0, (1 - normalized) / 0.28)
            : 1;
    return {
        // 菜单预演只播放一次四帧呼吸，不循环常驻，避免持续动态干扰章节与奖励信息的扫读。
        frameIndex: resolveRouteCommitFrame(Math.min(1, normalized / 0.62)),
        opacity,
        scale: 0.88 + normalized * 0.1,
    };
}

export function resolveMapEventPreludeMotion(
    progress: number,
    choiceIndex: 0 | 1,
): ChapterPreviewMotion {
    const normalized = Math.min(1, Math.max(0, progress));
    const start = choiceIndex === 0 ? 0 : 0.42;
    const local = Math.min(1, Math.max(0, (normalized - start) / 0.58));
    const opacity = local < 0.18
        ? local / 0.18
        : local > 0.78
            ? Math.max(0, (1 - local) / 0.22)
            : 1;
    return {
        // 两条路线错峰回闪，先呈现风险落点再呈现稳健落点，短时重叠只用于建立空间比较。
        frameIndex: resolveRouteCommitFrame(Math.min(1, local / 0.72)),
        opacity,
        scale: 0.86 + local * 0.14,
    };
}

export function buildRouteTrace(
    placements: readonly RouteTracePoint[],
    start: RouteTracePoint,
    end: RouteTracePoint,
): readonly RouteTracePoint[] {
    // 路线墨迹必须从入境走向关底；先复制再排序，避免 UI 预演改写真实场地落点顺序。
    const ordered = placements
        .map((point) => ({ ...point }))
        .sort((left, right) => left.y - right.y || left.x - right.x);
    return [{ ...start }, ...ordered, { ...end }];
}

export function revealRouteTrace(
    route: readonly RouteTracePoint[],
    progress: number,
): readonly RouteTracePoint[] {
    if (route.length === 0) return [];
    if (route.length === 1) return [{ ...route[0] }];

    const segmentLengths = route.slice(1).map((point, index) => (
        Math.hypot(point.x - route[index].x, point.y - route[index].y)
    ));
    const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);
    const revealLength = Math.min(1, Math.max(0, progress)) * totalLength;
    const visible: RouteTracePoint[] = [{ ...route[0] }];
    let consumed = 0;

    for (let index = 0; index < segmentLengths.length; index += 1) {
        const segmentLength = segmentLengths[index];
        const from = route[index];
        const to = route[index + 1];
        if (consumed + segmentLength <= revealLength || segmentLength === 0) {
            visible.push({ ...to });
            consumed += segmentLength;
            continue;
        }
        const local = (revealLength - consumed) / segmentLength;
        visible.push({
            x: from.x + (to.x - from.x) * local,
            y: from.y + (to.y - from.y) * local,
        });
        break;
    }
    return visible;
}

/**
 * 每局只安排一次地图奇遇，并只在普通波次结束后打开。
 * 触发波次在第一、二波之间随机，避免紧贴首领战弹窗，也让重复闯关拥有不同节奏。
 */
export class MapEventRuntime {
    private mapId: StageMapId = 'qingshi-road';
    private triggerAfterWave = 0;
    private opened = false;
    private resolvedChoice?: MapEventChoice;
    private nextWaveModifiers: NextWaveModifiers = { ...DEFAULT_NEXT_WAVE };

    public begin(mapId: StageMapId, random: () => number = Math.random): void {
        this.mapId = mapId;
        this.triggerAfterWave = clampRandomIndex(random, 2);
        this.opened = false;
        this.resolvedChoice = undefined;
        this.nextWaveModifiers = { ...DEFAULT_NEXT_WAVE };
    }

    public scenario(): MapEventScenario {
        return mapEventScenarioFor(this.mapId);
    }

    public triggerWaveIndex(): number {
        return this.triggerAfterWave;
    }

    public routeHudText(currentWaveIndex: number, totalWaves = 4): string {
        if (this.resolvedChoice) {
            const safeTotal = Math.max(1, totalWaves);
            const safeWave = Math.min(safeTotal - 1, Math.max(0, currentWaveIndex));
            const route = this.resolvedChoice.geometryPreview ?? this.resolvedChoice.title;
            const nextWaveRisk = this.resolvedChoice.effect.nextWave
                ? describeNextWaveModifiers(this.resolvedChoice.effect.nextWave)
                : this.resolvedChoice.riskLabel;
            return `${route}  ·  第 ${safeWave + 1}/${safeTotal} 境  ·  ${nextWaveRisk}`;
        }
        const timing = currentWaveIndex === this.triggerAfterWave
            ? '本境后分岔'
            : `第 ${this.triggerAfterWave + 1} 境后分岔`;
        return `${timing}  ·  ${this.scenario().title}`;
    }

    public shouldTriggerAfterWave(completedWaveIndex: number): boolean {
        return !this.opened && !this.resolvedChoice && completedWaveIndex === this.triggerAfterWave;
    }

    public openForQa(): MapEventScenario {
        this.opened = true;
        return this.scenario();
    }

    public open(): MapEventScenario {
        this.opened = true;
        return this.scenario();
    }

    public resolve(choiceId: string): MapEventChoice {
        const choice = this.scenario().choices.find((candidate) => candidate.id === choiceId);
        if (!choice) throw new Error(`Unknown map event choice: ${choiceId}`);
        this.opened = true;
        this.resolvedChoice = choice;
        this.nextWaveModifiers = {
            hp: choice.effect.nextWave?.hp ?? 1,
            speed: choice.effect.nextWave?.speed ?? 1,
            damage: choice.effect.nextWave?.damage ?? 1,
        };
        return choice;
    }

    public choice(): MapEventChoice | undefined {
        return this.resolvedChoice;
    }

    public modifiersForWave(active: boolean): NextWaveModifiers {
        return active ? { ...this.nextWaveModifiers } : { ...DEFAULT_NEXT_WAVE };
    }
}

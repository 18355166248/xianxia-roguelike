import {
    _decorator,
    Camera,
    Canvas,
    Color,
    Component,
    EventKeyboard,
    EventTouch,
    Graphics,
    Input,
    KeyCode,
    Label,
    Layers,
    Node,
    Rect,
    Size,
    Sprite,
    SpriteFrame,
    UIOpacity,
    UITransform,
    Vec2,
    Vec3,
    input,
    profiler,
    ResolutionPolicy,
    screen,
    view,
} from 'cc';
import {
    BACKGROUND_ASSET,
    BACKGROUND_ASSETS,
    BAMBOO_BARRICADE_ASSET,
    BAMBOO_BURN_COMMIT_ANIMATION_ASSET,
    BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET,
    BOSS_ANIMATION_ASSET,
    ENEMY_ASSETS,
    FROZEN_BOSS_ANIMATION_ASSET,
    FROST_IMPACT_ANIMATION_ASSET,
    FROST_SEAL_COMMIT_ANIMATION_ASSET,
    FROST_TIDE_COMMIT_ANIMATION_ASSET,
    HUD_PORTRAIT_ASSET,
    PLAYER_ANIMATION_ASSET,
    PLAYER_ASSET,
    PRELOAD_SPRITE_PATHS,
    QINGSHI_SPRING_COMMIT_ANIMATION_ASSET,
    QINGSHI_STELE_COMMIT_ANIMATION_ASSET,
    SpriteAssetSpec,
    WAVE_CREST_ASSET,
} from './config/AssetCatalog';
import {
    type StageConfig,
    STAGES,
    UPGRADES,
    UpgradeConfig,
    UpgradeId,
    UpgradePath,
    WaveConfig,
} from './config/GameConfig';
import {
    ARENA_BOUNDS,
    BAMBOO_AMBUSH_PROFILE,
    DESIGN_SIZE,
    FROZEN_RUINS_PROFILE,
    QINGSHI_ROAD_PROFILE,
    RoadProfilePoint,
} from './config/ArenaConfig';
import {
    AmbientState,
    BossPincerState,
    BossPulseState,
    EnemyState,
    Phase,
    ProjectileState,
    SkillHud,
    UnitVisual,
    VisualEffectState,
} from './runtime/GameRuntimeTypes';
import { loadSpriteFrame } from './runtime/SpriteAssetLoader';
import { PlatformFeedbackService } from './runtime/PlatformFeedbackService';
import { GameSettingsRuntime, type GamePreferences } from './systems/GameSettingsRuntime';
import {
    BalanceTelemetryRuntime,
    formatBalanceReport,
} from './systems/BalanceTelemetryRuntime';
import { shouldShowPortraitGuard } from './systems/DevicePresentationRuntime';
import {
    getDashCooldown,
    getDashDistance,
    getFormationSpec,
    getTribulationDamageMultiplier,
    getTribulationStrikeRadius,
    SkillRuntime,
} from './systems/SkillRuntime';
import {
    ENEMY_ANIMATION_COLUMNS,
    ENEMY_ANIMATION_ROWS,
    resolveBossAnimationFrame,
} from './systems/EnemyAnimationRuntime';
import {
    BOSS_PHASE_TWO_THRESHOLD,
    bossEntranceRiskFor,
    bossPhasePresentationFor,
} from './systems/BossPhaseRuntime';
import {
    bambooPincerGapFor,
    bossAbilityPatternFor,
    isInsideBambooPincerDanger,
    qingshiSealPlacementsFor,
} from './systems/BossAbilityRuntime';
import {
    bossFinishFrameFor,
    bossFinishPatternFor,
    shouldDeferUpgradeForKill,
} from './systems/BossFinishRuntime';
import {
    PLAYER_ANIMATION_COLUMNS,
    PLAYER_ANIMATION_ROWS,
    resolvePlayerAnimationFrame,
} from './systems/PlayerAnimationRuntime';
import {
    PlayerActionRuntime,
    resolveTapMovePoint,
    resolveTapMoveStep,
    shouldConfirmTapMove,
} from './systems/PlayerActionRuntime';
import { SpiritVeinRuntime } from './systems/SpiritVeinRuntime';
import {
    MapObstacleRuntime,
    MapObstacleState,
} from './systems/MapObstacleRuntime';
import {
    bambooObstacleSpecs,
    bambooSpawnEdge,
    describeBambooRouteGeometry,
    type BambooRouteGeometry,
} from './systems/BambooRouteRuntime';
import {
    describeQingshiRouteGeometry,
    qingshiRouteMarkers,
    qingshiRouteSpawn,
    qingshiSpiritVeinKind,
    qingshiSpiritVeinPosition,
    qingshiSwordSteleDamageMultiplier,
    type QingshiRouteGeometry,
} from './systems/QingshiRouteRuntime';
import {
    FrostTideRuntime,
    isOnFrostIce,
    resolveFrostImpactFrame,
    resolveFrostVelocity,
} from './systems/FrostTideRuntime';
import {
    describeFrostRouteGeometry,
    frostConvergenceSpawn,
    frostRouteMarker,
    frostTideEnemyDamage,
    isInFrostSanctuary,
    type FrostRouteGeometry,
} from './systems/FrostRouteRuntime';
import {
    pickUpgradeChoices,
    summarizeUpgradePaths,
    UPGRADE_PATH_LABELS,
    UPGRADE_PATH_ORDER,
} from './systems/UpgradeChoiceRuntime';
import {
    CombatFlowRuntime,
    combatImpactPresentationFor,
    type CombatImpactTier,
} from './systems/CombatFlowRuntime';
import { HitStopRuntime, type HitStopTier } from './systems/HitStopRuntime';
import {
    glowStrokeLayers,
    impactExpansion,
    impactFade,
    impactShardLayout,
    shardTravel,
    trailSegmentWidths,
    type ImpactShard,
} from './systems/ImpactVfxRuntime';
import {
    describeUpgradeDelta,
    previewUpgradeImpact,
    resolveRelicPulse,
    resolveCultivationBuild,
    resolveUpgradeMomentum,
    resolveUpgradeShowcase,
    resolveBossReadiness,
    type CultivationBuildSnapshot,
    type UpgradeImpactPreview,
    type UpgradeMomentumSpec,
    type UpgradeShowcaseSpec,
} from './systems/CultivationBuildRuntime';
import {
    buildRouteTrace,
    describeChapterBranchMemory,
    describeNextWaveModifiers,
    mapEventScenarioFor,
    MapEventChoice,
    MapEventRuntime,
    MapEventTone,
    resolveChapterPreviewMotion,
    resolveMapEventPreludeMotion,
    resolveRouteHudSegmentState,
    revealRouteTrace,
    resolveRouteCommitFrame,
    type RouteCommitEffect,
} from './systems/MapEventRuntime';
import {
    describeMapAchievement,
    describeMapEventDecision,
    describeRouteReplaySteps,
    formatRunDuration,
    type RunDamageCause,
    RunStatsSnapshot,
    RunStatsRuntime,
} from './systems/RunStatsRuntime';
import {
    formatFirstClearReward,
    formatStageRecord,
    STAGE_FIRST_CLEAR_REWARDS,
    StageProgressRuntime,
    type StageVictoryResult,
} from './systems/StageProgressRuntime';
import {
    resultMilestonePresentation,
    resultActionGuidanceFor,
    resultRevealFrameFor,
    resultStagePresentationFor,
} from './systems/ResultPresentationRuntime';
import {
    STAGE_ENTRY_DURATION,
    STAGE_ENTRY_REDUCED_MOTION_DURATION,
    stageEntryPresentationFor,
    stageEntryRevealFrameFor,
    type StageEntryEffect,
} from './systems/StageEntryPresentationRuntime';
import {
    OpeningObjectiveRuntime,
    openingObjectivePresentationFor,
    openingSpawnDirectiveFor,
    type OpeningObjectiveInput,
    type OpeningObjectiveSnapshot,
} from './systems/OpeningObjectiveRuntime';
import {
    EliteEncounterRuntime,
    eliteEncounterPresentationFor,
    eliteEncounterSpawnDirectiveFor,
    isInsideQingshiEliteVein,
    qingshiEliteVeinDamageMultiplier,
    shouldStaggerBambooWarden,
} from './systems/EliteEncounterRuntime';
import { drawSkillHud, drawTribulationHud } from './ui/SkillHudRenderer';
import {
    BUTTON_STYLES,
    ButtonVariant,
    CARD_STYLES,
    CardVariant,
    UI_THEME,
} from './ui/XianxiaUiTheme';

const { ccclass } = _decorator;

const UPGRADE_PATH_COLORS: Readonly<Record<UpgradePath, string>> = {
    edge: '#F0C879',
    mystic: '#72DDE8',
    vitality: '#82D7AC',
};

const PLAYER_AURA_SWORD_RESOURCES: Readonly<Record<UpgradePath, string>> = {
    edge: 'art/vfx/dao-sword-aura/dao-sword-edge-v2/spriteFrame',
    mystic: 'art/vfx/dao-sword-aura/dao-sword-mystic-v2/spriteFrame',
    vitality: 'art/vfx/dao-sword-aura/dao-sword-vitality-v2/spriteFrame',
};

const MAP_EVENT_TONE_COLORS: Readonly<Record<MapEventTone, string>> = {
    gold: '#F0C879',
    jade: '#82D7AC',
    cyan: '#72DDE8',
    ember: '#E58B62',
};

interface CasualUpgradePresentation {
    readonly title: string;
    readonly result: string;
    readonly accent: string;
}


// 修为进入这一段后开始播报破境预警：留出约一次击杀的反应时间，形成"看着它来"的期待。
const BREAKTHROUGH_WARNING_RATIO = 0.78;

/**
 * 九张道法各自的三级质变。键是能力语义，值是"哪张牌修满会给出它"，
 * 让战斗代码按能力读，而不必记住某个效果挂在哪张卡上。
 */
type CultivationTrait =
    | 'returning-sword'
    | 'sword-mark'
    | 'cloud-step'
    | 'thunder-seal'
    | 'shield-burst'
    | 'overflow-shield';

const CULTIVATION_TRAIT_SOURCES: Readonly<Record<CultivationTrait, UpgradeId>> = {
    'returning-sword': 'sword',
    'sword-mark': 'damage',
    'cloud-step': 'dash',
    'thunder-seal': 'tribulation',
    'shield-burst': 'guard',
    'overflow-shield': 'endless-life',
};
const STAGE_PROGRESS_STORAGE_KEY = 'xianxia-roguelike.stage-progress.v1';
const GAME_SETTINGS_STORAGE_KEY = 'xianxia-roguelike.settings.v1';
const BALANCE_TELEMETRY_STORAGE_KEY = 'xianxia-roguelike.balance-runs.v1';

interface SpiritVeinVisual {
    node: Node;
    ring: Graphics;
    label: Label;
}

interface PlayerAuraSwordVisual {
    readonly path: UpgradePath;
    readonly phase: number;
    readonly node: Node;
    readonly opacity: UIOpacity;
    readonly ghosts: ReadonlyArray<{ node: Node; opacity: UIOpacity; phaseOffset: number }>;
    readonly active: boolean;
    /** 该柄剑气代表的是某一系的第几级，用于给最新一级做出场高亮。 */
    readonly step: number;
}

interface MapObstacleVisual {
    node: Node;
    hpBar: Graphics;
    opacity: UIOpacity;
}

interface FrostTideVisual {
    node: Node;
    graphics: Graphics;
    opacity: UIOpacity;
}

interface OpeningObjectiveVisual {
    node: Node;
    sprite: Sprite;
    opacity: UIOpacity;
    frames: SpriteFrame[];
    baseScale: number;
}

interface RouteCommitBurstVisual {
    node: Node;
    sprite: Sprite;
    opacity: UIOpacity;
    frames: SpriteFrame[];
    baseScale: number;
}

interface RouteCommitPlacement {
    x: number;
    y: number;
    diameter: number;
}

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    private readonly designWidth = DESIGN_SIZE.width;
    private readonly designHeight = DESIGN_SIZE.height;
    private readonly arena = ARENA_BOUNDS;

    private phase: Phase = 'menu';
    private selectedStageIndex = 0;
    private chapterBriefOpen = false;
    private chapterBriefPreviewChoiceId?: string;
    private canvas!: Node;
    private world!: Node;
    private battleLayer!: Node;
    private effectsLayer!: Node;
    private screenFxLayer!: Node;
    private overlay!: Node;
    private player!: Node;
    private playerVisual!: Node;
    private playerSprite?: Sprite;
    private playerBaseScale = 1;
    private playerAuraNode?: Node;
    private playerAuraFrontNode?: Node;
    private playerAuraSwords: PlayerAuraSwordVisual[] = [];
    private playerAuraSigil?: Graphics;
    private playerAnimationFrameIndex = -1;
    private playerAnimationFrames: SpriteFrame[] = [];
    private bossAnimationFrames: SpriteFrame[] = [];
    private frozenBossAnimationFrames: SpriteFrame[] = [];
    private frostImpactAnimationFrames: SpriteFrame[] = [];
    private qingshiSteleCommitAnimationFrames: SpriteFrame[] = [];
    private qingshiSpringCommitAnimationFrames: SpriteFrame[] = [];
    private bambooBurnCommitAnimationFrames: SpriteFrame[] = [];
    private bambooShadowCommitAnimationFrames: SpriteFrame[] = [];
    private frostTideCommitAnimationFrames: SpriteFrame[] = [];
    private frostSealCommitAnimationFrames: SpriteFrame[] = [];
    private backgroundSprite!: Sprite;
    private hpLabel!: Label;
    private xpLabel!: Label;
    private waveLabel!: Label;
    private objectiveLabel!: Label;
    private objectiveBacking!: Node;
    private routeChoiceLabel!: Label;
    private routeChoiceBacking!: Node;
    private chapterBranchMemoryTimer = 0;
    private waveRouteGraphics!: Graphics;
    private recentUpgradePanel?: Node;
    private recentUpgradeLabel?: Label;
    private recentUpgradeTimer = 0;
    private recentUpgradeText = '';
    private comboPanel?: Node;
    private comboLabel?: Label;
    private cultivationChoiceHistory: UpgradeId[] = [];
    private upgradePreviewFx?: Node;
    private cultivationRelicVolley = 0;
    private hpBar!: Graphics;
    private xpBar!: Graphics;
    private breakthroughRing?: Graphics;
    private breakthroughPulse = 0;
    private breakthroughImminent = false;
    private bossHud!: Node;
    private bossHpBar!: Graphics;
    private bossHpLabel!: Label;
    private bossPhaseLabel!: Label;
    private dashHud!: SkillHud;
    private formationHud!: SkillHud;
    private tribulationHud!: SkillHud;
    private moveTargetMarker?: Node;
    private enemies: EnemyState[] = [];
    private projectiles: ProjectileState[] = [];
    private bossPulses: BossPulseState[] = [];
    private bossPincers: BossPincerState[] = [];
    private bossCastIndex = 0;
    private bossFinishEnemy?: EnemyState;
    private bossFinishStarted = false;
    private effects: VisualEffectState[] = [];
    private ambience: AmbientState[] = [];
    private spiritVeinVisual?: SpiritVeinVisual;
    private obstacleVisuals = new Map<string, MapObstacleVisual>();
    private qingshiRouteVisual?: Node;
    private frostTideVisual?: FrostTideVisual;
    private frostRouteVisual?: Node;
    private openingObjectiveVisual?: OpeningObjectiveVisual;
    private bossArenaVisual?: Node;
    private bossArenaActive = false;
    private pressed = new Set<KeyCode>();
    private moveTarget?: Vec2;
    private touchOrigin?: Vec2;
    private touchCurrent?: Vec2;
    private swordFrame?: SpriteFrame;
    private spriteFrames = new Map<string, SpriteFrame>();
    private initializationFinished = false;
    private loadingProgressGraphics?: Graphics;
    private loadingProgressLabel?: Label;

    private hp = 100;
    private maxHp = 100;
    private moveSpeed = 235;
    private swordDamage = 18;
    private swordCount = 1;
    private attackInterval = 0.72;
    private attackTimer = 0;
    private level = 1;
    private xp = 0;
    private xpNeed = 42;
    private waveIndex = 0;
    private spawned = 0;
    private spawnTimer = 0;
    private waveRestTimer = 0;
    private waveFinished = false;
    private elapsed = 0;
    private playerAttackTimer = 0;
    private playerHitTimer = 0;
    private playerInvulnerableTimer = 0;
    private playerMoveAmount = 0;
    private playerFacing = 1;
    private cultivationRerolls = 1;
    private cultivationShield = 0;
    private cultivationShieldMax = 0;
    private cultivationResumeAfterUpgrade?: () => void;
    private cultivationMomentum?: UpgradeMomentumSpec;
    private cultivationMomentumTimer = 0;
    private lastMoveDirection = new Vec2(0, 1);
    // 功法等级、冷却和蓄力统一由规则对象维护，场景类只负责节点、命中与表现编排。
    private readonly skills = new SkillRuntime();
    private readonly actions = new PlayerActionRuntime();
    private readonly spiritVein = new SpiritVeinRuntime();
    private readonly mapObstacles = new MapObstacleRuntime();
    private readonly frostTide = new FrostTideRuntime();
    private readonly openingObjective = new OpeningObjectiveRuntime();
    private readonly eliteEncounter = new EliteEncounterRuntime();
    private readonly mapEvent = new MapEventRuntime();
    private readonly runStats = new RunStatsRuntime();
    private readonly stageProgress = new StageProgressRuntime();
    private readonly balanceTelemetry = new BalanceTelemetryRuntime();
    private readonly settings = new GameSettingsRuntime(
        globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    );
    private readonly combatFlow = new CombatFlowRuntime();
    // 顿帧与破境预警都只读写自身状态，放在规则层便于回归测试覆盖时间轴换算。
    private readonly hitStop = new HitStopRuntime();
    private readonly platformFeedback = new PlatformFeedbackService();
    private lastStageVictory?: StageVictoryResult;
    private mapEventModifierWaveIndex = -1;
    private mapEventAdvanceAfterChoice = false;
    private readonly frostVelocity = new Vec2();
    private frostTidePlayerHitCycle = -1;
    private frostTideEnemyHitCycle = -1;
    private readonly frostTideEnemyHits = new Set<Node>();
    private openingObjectiveState?: OpeningObjectiveSnapshot;
    private eliteEncounterCompletionShown = false;
    private touchGestureStartedAt = 0;
    private touchMaxDrag = 0;
    private cameraShakeTimer = 0;
    private cameraShakeStrength = 0;
    private stageEntryCameraOffsetY = 0;
    private qaResultConsumed = false;
    private orientationGuard?: Node;
    private orientationPausedByGuard = false;

    private get prefersReducedMotion(): boolean {
        return this.settings.snapshot().reducedMotion;
    }

    private readonly onVisibilityChange = (): void => {
        // 移动端切后台时必须冻结战斗，避免玩家回来后已经被敌人击败。
        if (globalThis.document?.hidden && this.phase === 'playing') this.showPauseMenu('暂离修行');
    };

    private readonly onViewportResize = (): void => {
        // 浏览器旋转完成后再读取 screen.windowSize，避免使用 resize 事件触发前的旧尺寸。
        this.scheduleOnce(() => this.updateOrientationGuard(), 0);
    };

    private get currentStage(): StageConfig {
        return STAGES[this.selectedStageIndex] ?? STAGES[0];
    }

    private get roadProfile(): ReadonlyArray<RoadProfilePoint> {
        if (this.currentStage.mapId === 'bamboo-ambush') return BAMBOO_AMBUSH_PROFILE;
        if (this.currentStage.mapId === 'frozen-ruins') return FROZEN_RUINS_PROFILE;
        return QINGSHI_ROAD_PROFILE;
    }

    protected override onLoad(): void {
        // 休闲战斗以完整竖屏为主视觉，固定高度并裁切两侧，避免窄长设备出现上下黑边。
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.FIXED_HEIGHT);
        // 调试构建也交付干净游戏画面；性能数据保留给开发工具，不在玩家视口叠加引擎统计面板。
        profiler.hideStats();
        this.buildRuntimeScene();
        this.updateOrientationGuard();
        this.bindInput();
        this.restoreSettings();
        this.restoreStageProgress();
        this.restoreBalanceTelemetry();
        globalThis.document?.addEventListener('visibilitychange', this.onVisibilityChange);
        globalThis.addEventListener?.('resize', this.onViewportResize);
        // 远程大图不再进入首包；启动页等待必要美术收敛，避免玩家先看到空背景再突然补图。
        void this.initializeGame();
    }

    protected override onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        globalThis.document?.removeEventListener('visibilitychange', this.onVisibilityChange);
        globalThis.removeEventListener?.('resize', this.onViewportResize);
        this.platformFeedback.dispose();
    }

    protected override update(dt: number): void {
        if (this.orientationGuard?.isValid && this.phase === 'playing' && !this.orientationPausedByGuard) {
            // 入境演出可能在横屏期间交权；下一帧立即冻结，不能让遮罩下的敌人继续行动。
            this.phase = 'paused';
            this.orientationPausedByGuard = true;
            this.platformFeedback.setAmbiencePaused(true);
        }
        // 顿帧只压缩战斗与特效的时间轴；镜头抖动、氛围和 UI 计时继续走真实时间，
        // 这样"画面定住但还在震"的一瞬间才有重量，而不是整个界面卡住。
        const combatDt = this.hitStop.consume(dt);
        this.elapsed += dt;
        this.updateAmbience(dt);
        this.updateEffects(combatDt);
        this.updateCameraFeedback(dt);
        if (this.recentUpgradeTimer > 0) {
            this.recentUpgradeTimer = Math.max(0, this.recentUpgradeTimer - dt);
            // 最近一次的强反馈结束后退化为轻量累计入口，不让旧进化像被新选择覆盖。
            if (this.recentUpgradeTimer <= 0) this.showUpgradeHistorySummary();
        }
        if (this.phase !== 'playing') return;
        if (this.chapterBranchMemoryTimer > 0) {
            this.chapterBranchMemoryTimer = Math.max(0, this.chapterBranchMemoryTimer - dt);
        }
        this.updateBreakthroughPulse(dt);
        if (combatDt <= 0) {
            // 定格期间仍要刷新 HUD，否则血量与破境进度会在最有张力的半秒里停止响应。
            this.updateHud();
            return;
        }
        this.runStats.tick(combatDt);
        // 波次已清但下一波尚未刷新时冻结剑势计时，换波不再必然打断连斩。
        this.combatFlow.tick(combatDt, this.waveFinished);
        this.updatePlayer(combatDt);
        this.updateFrostTide(combatDt);
        this.updateSpiritVein(combatDt);
        this.updateOpeningObjective(combatDt);
        this.updateAbilities(combatDt);
        this.updateCultivation(combatDt);
        this.updateSpawning(combatDt);
        this.updateEnemies(combatDt);
        this.updateBossPulses(combatDt);
        this.updateBossPincers(combatDt);
        this.updateAttacks(combatDt);
        this.updateProjectiles(combatDt);
        this.updateHud();
        this.checkStageProgress(combatDt);
    }

    private buildRuntimeScene(): void {
        const cameraNode = new Node('UICamera');
        cameraNode.layer = Layers.Enum.UI_2D;
        cameraNode.setPosition(0, 0, 1000);
        const camera = cameraNode.addComponent(Camera);
        camera.projection = Camera.ProjectionType.ORTHO;
        camera.orthoHeight = this.designHeight / 2;
        camera.visibility = Layers.BitMask.UI_2D;
        camera.clearColor = new Color('#0B1520');
        this.node.addChild(cameraNode);

        this.canvas = new Node('Canvas');
        this.canvas.layer = Layers.Enum.UI_2D;
        this.canvas.addComponent(UITransform).setContentSize(this.designWidth, this.designHeight);
        const canvas = this.canvas.addComponent(Canvas);
        canvas.cameraComponent = camera;
        this.node.addChild(this.canvas);

        this.world = new Node('World');
        this.world.layer = Layers.Enum.UI_2D;
        this.canvas.addChild(this.world);
        this.drawArena();

        this.battleLayer = new Node('BattleLayer');
        this.battleLayer.layer = Layers.Enum.UI_2D;
        this.world.addChild(this.battleLayer);

        this.effectsLayer = new Node('EffectsLayer');
        this.effectsLayer.layer = Layers.Enum.UI_2D;
        this.world.addChild(this.effectsLayer);

        this.screenFxLayer = new Node('ScreenFxLayer');
        this.screenFxLayer.layer = Layers.Enum.UI_2D;
        this.canvas.addChild(this.screenFxLayer);

        this.overlay = new Node('Overlay');
        this.overlay.layer = Layers.Enum.UI_2D;
        this.canvas.addChild(this.overlay);
    }

    private drawArena(): void {
        const viewportWidth = this.visibleDesignWidth();
        const backdrop = new Node('Backdrop');
        backdrop.layer = Layers.Enum.UI_2D;
        const graphics = backdrop.addComponent(Graphics);
        graphics.fillColor = new Color('#071719');
        graphics.roundRect(-viewportWidth / 2, -667, viewportWidth, 1334, 0);
        graphics.fill();
        this.world.addChild(backdrop);

        const art = new Node('ArenaArt');
        art.layer = Layers.Enum.UI_2D;
        art.addComponent(UITransform).setContentSize(BACKGROUND_ASSET.displayWidth, BACKGROUND_ASSET.displayHeight);
        this.backgroundSprite = art.addComponent(Sprite);
        this.backgroundSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.world.addChild(art);

        const inputSurface = new Node('BattleInputSurface');
        inputSurface.layer = Layers.Enum.UI_2D;
        // 输入面覆盖 FIXED_HEIGHT 下的完整可视宽度，不能跟着各章节背景图宽度变化。
        inputSurface.addComponent(UITransform).setContentSize(this.visibleDesignWidth(), this.designHeight);
        inputSurface.on(Node.EventType.TOUCH_START, (event: EventTouch) => this.onTouchStart(event));
        inputSurface.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => this.onTouchMove(event));
        inputSurface.on(Node.EventType.TOUCH_END, (event: EventTouch) => this.onTouchEnd(event));
        inputSurface.on(Node.EventType.TOUCH_CANCEL, () => this.onTouchCancel());
        this.world.addChild(inputSurface);

        this.createArenaAmbience();
    }

    private createArenaAmbience(): void {
        const viewportWidth = this.visibleDesignWidth();
        const vignette = new Node('ArenaVignette');
        vignette.layer = Layers.Enum.UI_2D;
        const g = vignette.addComponent(Graphics);
        // 暗幕必须覆盖 SHOW_ALL 暴露出的完整可视宽度，否则宽屏两侧会形成独立贴图般的硬接缝。
        // 保留轻量边界压暗：重点降低上下边缘压迫感，避免左右与底部形成明显阴影块。
        g.fillColor = new Color(3, 12, 15, 28);
        g.rect(-viewportWidth / 2 + 8, 515, viewportWidth - 16, 96);
        g.fill();
        g.strokeColor = new Color(123, 215, 189, 46);
        g.lineWidth = 2;
        g.moveTo(-viewportWidth / 2 + 35, 508);
        g.lineTo(viewportWidth / 2 - 35, 508);
        g.stroke();
        this.world.addChild(vignette);

        // 萤火与灵气只做低频漂移，让静态背景有呼吸感，同时避免抢占战斗主体。
        for (let index = 0; index < 12; index += 1) {
            const node = new Node(`SpiritMote-${index}`);
            node.layer = Layers.Enum.UI_2D;
            const mote = node.addComponent(Graphics);
            const large = index % 5 === 0;
            mote.fillColor = new Color(large ? 151 : 116, large ? 235 : 205, 181, large ? 125 : 82);
            mote.circle(0, 0, large ? 3.5 : 2);
            mote.fill();
            const x = this.random(this.arena.left + 24, this.arena.right - 24);
            const y = this.random(this.arena.bottom + 20, this.arena.top - 20);
            node.setPosition(x, y);
            this.world.addChild(node);
            this.ambience.push({
                node,
                baseX: x,
                baseY: y,
                speed: this.random(5, 13),
                phase: Math.random() * Math.PI * 2,
                range: this.random(9, 24),
            });
        }
    }

    private async initializeGame(): Promise<void> {
        this.showLoadingScreen();
        const failed = await this.preloadArt((completed, total, failedCount) => {
            this.updateLoadingProgress(completed, total, failedCount);
        });
        if (!this.node.isValid) return;

        // 单张 CDN 图失败时仍允许进入：现有角色、敌人和地形都有程序化占位表现，不应让弱网变成白屏。
        this.updateLoadingProgress(1, 1, failed);
        this.initializationFinished = true;
        // 休闲破境验收链接直达实战暂停帧，方便设计对照与回归截图；
        // 其他本地 QA 标记和正式流程仍从章节选择开始。
        if (
            this.hasLocalQaFlag('qaCultivation=1')
            || this.hasLocalQaFlag('qaCultivationHistory=1')
            || this.hasLocalQaFlag('qaUpgradeAdvanced=1')
            || this.hasLocalQaFlag('qaCultivationGoal=1')
            || this.hasLocalQaFlag('qaCombo=1')
        ) {
            this.startStage();
        } else {
            this.showMenu();
        }
    }

    private showLoadingScreen(): void {
        this.clearOverlay();
        this.bringOverlayToFront();
        this.overlay.addChild(this.makeRect(this.visibleDesignWidth(), this.designHeight, new Color(2, 12, 16, 252)));

        const title = this.makeLabel('仙 途 劫', 58, new Color('#F8E4AC'));
        title.node.setPosition(0, 176);
        this.overlay.addChild(title.node);
        const subtitle = this.makeLabel('引灵入境 · 正在加载游戏资源', 22, new Color('#B9D8CE'));
        subtitle.node.setPosition(0, 104);
        this.overlay.addChild(subtitle.node);

        const track = this.makeRect(536, 34, new Color(5, 27, 31, 245), new Color(100, 166, 149, 150), 17, 2);
        track.setPosition(0, 20);
        this.overlay.addChild(track);
        const fillNode = new Node('LoadingProgressFill');
        fillNode.layer = Layers.Enum.UI_2D;
        fillNode.addComponent(UITransform).setContentSize(512, 18);
        this.loadingProgressGraphics = fillNode.addComponent(Graphics);
        track.addChild(fillNode);

        this.loadingProgressLabel = this.makeLabel('正在连接灵脉…', 18, new Color('#D9EEE7'));
        this.loadingProgressLabel.node.setPosition(0, -42);
        this.overlay.addChild(this.loadingProgressLabel.node);
        this.updateLoadingProgress(0, 1, 0);
    }

    private updateLoadingProgress(completed: number, total: number, failed: number): void {
        const safeTotal = Math.max(total, 1);
        const ratio = Math.min(1, Math.max(0, completed / safeTotal));
        const width = 512 * ratio;
        const graphics = this.loadingProgressGraphics;
        if (graphics?.isValid) {
            graphics.clear();
            if (width > 0) {
                graphics.fillColor = new Color('#67D4B8');
                graphics.roundRect(-256, -9, width, 18, Math.min(9, width / 2));
                graphics.fill();
            }
        }
        if (this.loadingProgressLabel?.isValid) {
            const percent = Math.round(ratio * 100);
            const fallback = failed > 0 ? ` · ${failed} 项将使用占位表现` : '';
            this.loadingProgressLabel.string = `引灵进度 ${percent}%${fallback}`;
        }
    }

    private async preloadArt(
        onProgress: (completed: number, total: number, failed: number) => void,
    ): Promise<number> {
        // 避免直接迭代 Set：Cocos Web Mobile 的兼容转译会把 Set 错当成单个数组元素。
        const paths = [
            ...PRELOAD_SPRITE_PATHS,
            ...UPGRADES.map((upgrade) => upgrade.iconResourcePath),
            ...Object.values(PLAYER_AURA_SWORD_RESOURCES),
            'art/relics/xianxia-relics_19/spriteFrame',
        ].filter((path, index, allPaths) => allPaths.indexOf(path) === index);
        let completed = 0;
        let failed = 0;
        onProgress(0, paths.length, 0);
        await Promise.all(paths.map(async (path) => {
            try {
                const frame = await loadSpriteFrame(path);
                if (!this.node.isValid) return;
                this.applyLoadedArt(path, frame);
            } catch (error) {
                failed += 1;
                if (this.node.isValid) {
                    console.warn(`[art] 资源加载失败，使用程序化占位: ${path}`, error);
                }
            } finally {
                completed += 1;
                if (this.node.isValid) onProgress(completed, paths.length, failed);
            }
        }));
        return failed;
    }

    private applyLoadedArt(path: string, frame: SpriteFrame): void {
        this.spriteFrames.set(path, frame);
        if (path === 'art/relics/xianxia-relics_00/spriteFrame') this.swordFrame = frame;
        if (path === BACKGROUND_ASSETS[this.currentStage.mapId].resourcePath) {
            this.applyStageVisual(this.phase === 'menu');
        }
        if (path === PLAYER_ANIMATION_ASSET.resourcePath) {
            this.playerAnimationFrames = this.slicePlayerAnimationSheet(frame);
            this.installPlayerAnimation();
        }
        if (path === BOSS_ANIMATION_ASSET.resourcePath) {
            this.bossAnimationFrames = this.sliceAnimationSheet(frame, ENEMY_ANIMATION_COLUMNS, ENEMY_ANIMATION_ROWS, 'shanxiao');
        }
        if (path === FROZEN_BOSS_ANIMATION_ASSET.resourcePath) {
            this.frozenBossAnimationFrames = this.sliceAnimationSheet(frame, ENEMY_ANIMATION_COLUMNS, ENEMY_ANIMATION_ROWS, 'hanyuan-shanxiao');
        }
        if (path === FROST_IMPACT_ANIMATION_ASSET.resourcePath) {
            this.frostImpactAnimationFrames = this.sliceAnimationSheet(frame, FROST_IMPACT_ANIMATION_ASSET.columns, FROST_IMPACT_ANIMATION_ASSET.rows, 'hanyuan-frost-impact');
        }
        if (path === QINGSHI_STELE_COMMIT_ANIMATION_ASSET.resourcePath) {
            this.qingshiSteleCommitAnimationFrames = this.sliceAnimationSheet(frame, QINGSHI_STELE_COMMIT_ANIMATION_ASSET.columns, QINGSHI_STELE_COMMIT_ANIMATION_ASSET.rows, 'qingshi-stele-commit');
        }
        if (path === QINGSHI_SPRING_COMMIT_ANIMATION_ASSET.resourcePath) {
            this.qingshiSpringCommitAnimationFrames = this.sliceAnimationSheet(frame, QINGSHI_SPRING_COMMIT_ANIMATION_ASSET.columns, QINGSHI_SPRING_COMMIT_ANIMATION_ASSET.rows, 'qingshi-spring-commit');
        }
        if (path === BAMBOO_BURN_COMMIT_ANIMATION_ASSET.resourcePath) {
            this.bambooBurnCommitAnimationFrames = this.sliceAnimationSheet(frame, BAMBOO_BURN_COMMIT_ANIMATION_ASSET.columns, BAMBOO_BURN_COMMIT_ANIMATION_ASSET.rows, 'bamboo-burn-commit');
        }
        if (path === BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET.resourcePath) {
            this.bambooShadowCommitAnimationFrames = this.sliceAnimationSheet(frame, BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET.columns, BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET.rows, 'bamboo-shadow-commit');
        }
        if (path === FROST_TIDE_COMMIT_ANIMATION_ASSET.resourcePath) {
            this.frostTideCommitAnimationFrames = this.sliceAnimationSheet(frame, FROST_TIDE_COMMIT_ANIMATION_ASSET.columns, FROST_TIDE_COMMIT_ANIMATION_ASSET.rows, 'frost-tide-commit');
        }
        if (path === FROST_SEAL_COMMIT_ANIMATION_ASSET.resourcePath) {
            this.frostSealCommitAnimationFrames = this.sliceAnimationSheet(frame, FROST_SEAL_COMMIT_ANIMATION_ASSET.columns, FROST_SEAL_COMMIT_ANIMATION_ASSET.rows, 'frost-seal-commit');
        }
        if (this.initializationFinished && this.phase === 'menu' && path === this.activeChapterPreviewAssetPath(this.currentStage)) {
            // 运行期重试成功时只刷新当前路线，避免旧网络回调覆盖玩家已切换的章节。
            this.renderMenu();
        }
    }

    private visibleDesignWidth(): number {
        const frame = screen.windowSize;
        if (frame.width <= 0 || frame.height <= 0) return this.designWidth;
        // FIXED_HEIGHT 下可视宽度随设备纵横比变化；全屏遮罩和底图必须使用真实宽度，不能沿用 750。
        return this.designHeight * frame.width / frame.height;
    }

    private updateOrientationGuard(): void {
        const frame = screen.windowSize;
        const landscape = shouldShowPortraitGuard(frame.width, frame.height);
        if (!landscape) {
            if (this.orientationGuard?.isValid) this.orientationGuard.destroy();
            this.orientationGuard = undefined;
            if (this.orientationPausedByGuard && this.phase === 'paused') {
                this.phase = 'playing';
                this.platformFeedback.setAmbiencePaused(false);
            }
            this.orientationPausedByGuard = false;
            return;
        }
        if (this.orientationGuard?.isValid) return;
        if (this.phase === 'playing') {
            this.phase = 'paused';
            this.orientationPausedByGuard = true;
            this.platformFeedback.setAmbiencePaused(true);
        }
        const guard = this.makeRect(
            this.visibleDesignWidth(),
            this.designHeight,
            new Color(2, 10, 14, 252),
        );
        guard.name = 'PortraitOrientationGuard';
        // 横屏时 FIXED_HEIGHT 会整体缩放画布，因此提示字号需要按横屏比例放大，确保真机仍可读。
        const title = this.makeLabel('请 旋 转 设 备', 92, new Color('#FFF0BE'));
        title.node.setPosition(0, 58);
        guard.addChild(title.node);
        const detail = this.makeLabel('仙途劫为竖屏试炼 · 旋回后将继续当前进度', 36, new Color('#B9D8CE'));
        detail.node.setPosition(0, -52);
        detail.node.getComponent(UITransform)?.setContentSize(980, 58);
        guard.addChild(detail.node);
        const mark = this.makeLabel('↻', 104, new Color('#72DDE8'));
        mark.node.setPosition(0, -166);
        guard.addChild(mark.node);
        this.canvas.addChild(guard);
        guard.setSiblingIndex(this.canvas.children.length - 1);
        this.orientationGuard = guard;
    }

    private applyStageVisual(coverMenuViewport = false): void {
        const asset = BACKGROUND_ASSETS[this.currentStage.mapId] ?? BACKGROUND_ASSET;
        const frame = this.spriteFrames.get(asset.resourcePath);
        const transform = this.backgroundSprite.node.getComponent(UITransform);
        const coverScale = coverMenuViewport
            ? Math.max(1, this.visibleDesignWidth() / asset.displayWidth)
            : 1;
        // 菜单背景使用 cover 规则铺满宽屏；进入战斗后恢复关卡标定尺寸，避免地形图与碰撞坐标错位。
        transform?.setContentSize(
            asset.displayWidth * coverScale,
            asset.displayHeight * coverScale,
        );
        if (frame) this.backgroundSprite.spriteFrame = frame;
    }

    private slicePlayerAnimationSheet(sheet: SpriteFrame): SpriteFrame[] {
        return this.sliceAnimationSheet(
            sheet,
            PLAYER_ANIMATION_COLUMNS,
            PLAYER_ANIMATION_ROWS,
            'qinglan',
        );
    }

    private sliceAnimationSheet(
        sheet: SpriteFrame,
        columns: number,
        rows: number,
        prefix: string,
    ): SpriteFrame[] {
        const texture = sheet.texture;
        const cellWidth = texture.width / columns;
        const cellHeight = texture.height / rows;
        if (!Number.isInteger(cellWidth) || !Number.isInteger(cellHeight)) {
            console.warn(`[art] ${prefix} 序列帧尺寸不能被 ${columns}×${rows} 网格整除，继续使用静态立绘`);
            return [];
        }

        const frames: SpriteFrame[] = [];
        for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
                const frame = new SpriteFrame();
                frame.name = `${prefix}-${row}-${column}`;
                frame.reset({
                    texture,
                    rect: new Rect(column * cellWidth, row * cellHeight, cellWidth, cellHeight),
                    originalSize: new Size(cellWidth, cellHeight),
                    offset: new Vec2(),
                });
                frames.push(frame);
            }
        }
        return frames;
    }

    private installPlayerAnimation(): void {
        if (!this.playerVisual?.isValid || this.playerAnimationFrames.length === 0) return;
        const fallback = this.playerVisual.getComponent(Graphics);
        if (fallback) fallback.destroy();
        this.playerSprite = this.playerVisual.getComponent(Sprite) ?? this.playerVisual.addComponent(Sprite);
        this.playerSprite.sizeMode = Sprite.SizeMode.RAW;
        this.playerAnimationFrameIndex = -1;
        const firstFrame = this.playerAnimationFrames[0];
        this.playerBaseScale = PLAYER_ANIMATION_ASSET.displayHeight / Math.max(firstFrame.originalSize.height, 1);
        this.playerVisual.setScale(this.playerBaseScale * this.playerFacing, this.playerBaseScale);
        this.updatePlayerAnimationFrame();
    }

    private updatePlayerAnimationFrame(): void {
        if (!this.playerSprite?.isValid || this.playerAnimationFrames.length === 0) return;
        const selection = resolvePlayerAnimationFrame(
            this.actions.current,
            this.actions.elapsed,
            this.actions.progress(),
        );
        const index = selection.row * PLAYER_ANIMATION_ASSET.columns + selection.column;
        if (index === this.playerAnimationFrameIndex) return;
        const frame = this.playerAnimationFrames[index];
        if (!frame) return;
        this.playerSprite.spriteFrame = frame;
        this.playerAnimationFrameIndex = index;
    }

    private bindInput(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(event: EventKeyboard): void {
        const firstPress = !this.pressed.has(event.keyCode);
        this.pressed.add(event.keyCode);
        if (!firstPress) return;
        if (event.keyCode === KeyCode.ESCAPE) {
            if (this.phase === 'playing') this.showPauseMenu();
            else if (this.phase === 'paused') {
                this.clearOverlay();
                this.phase = 'playing';
                this.platformFeedback.setAmbiencePaused(false);
            }
            return;
        }
        if (this.phase !== 'playing') return;
        if (
            event.keyCode === KeyCode.KEY_A
            || event.keyCode === KeyCode.KEY_D
            || event.keyCode === KeyCode.KEY_S
            || event.keyCode === KeyCode.KEY_W
            || event.keyCode === KeyCode.ARROW_LEFT
            || event.keyCode === KeyCode.ARROW_RIGHT
            || event.keyCode === KeyCode.ARROW_DOWN
            || event.keyCode === KeyCode.ARROW_UP
        ) {
            this.clearMoveTarget();
        }
        if (event.keyCode === KeyCode.SPACE) this.tryDash();
        if (event.keyCode === KeyCode.KEY_Q) this.trySwordFormation();
        if (event.keyCode === KeyCode.KEY_E) this.startTribulationHold();
    }

    private onKeyUp(event: EventKeyboard): void {
        this.pressed.delete(event.keyCode);
        if (event.keyCode === KeyCode.KEY_E) this.releaseTribulationHold();
    }

    private onTouchStart(event: EventTouch): void {
        if (this.phase !== 'playing') return;
        const point = this.touchWorldPoint(event);
        // 可交互 HUD 会主动阻止冒泡；这里只排除真实战场边界，避免顶部近百单位地图变成点击盲区。
        if (point.y > this.arena.top || point.y < this.arena.bottom) {
            this.onTouchCancel();
            return;
        }
        this.touchOrigin = point;
        this.touchCurrent = point.clone();
        this.touchGestureStartedAt = this.elapsed;
        this.touchMaxDrag = 0;
    }

    private onTouchMove(event: EventTouch): void {
        if (!this.touchOrigin || this.phase !== 'playing') return;
        const point = this.touchWorldPoint(event);
        this.touchCurrent = point;
        this.touchMaxDrag = Math.max(this.touchMaxDrag, Vec2.distance(this.touchOrigin, point));
    }

    private onTouchEnd(event?: EventTouch): void {
        if (event && this.touchOrigin) {
            const point = this.touchWorldPoint(event);
            this.touchCurrent = point;
            this.touchMaxDrag = Math.max(this.touchMaxDrag, Vec2.distance(this.touchOrigin, point));
        }
        const gestureDuration = this.elapsed - this.touchGestureStartedAt;
        const target = this.touchCurrent?.clone();
        const shouldMove = Boolean(target)
            && this.phase === 'playing'
            && shouldConfirmTapMove(gestureDuration, this.touchMaxDrag);
        this.touchOrigin = undefined;
        this.touchCurrent = undefined;
        this.touchMaxDrag = 0;
        if (shouldMove && target) this.setMoveTarget(target);
    }

    private onTouchCancel(): void {
        this.touchOrigin = undefined;
        this.touchCurrent = undefined;
        this.touchMaxDrag = 0;
    }

    private touchWorldPoint(event: EventTouch): Vec2 {
        const ui = event.getUILocation();
        // getUILocation 已移除设备像素比与视口缩放，但 FIXED_HEIGHT 的逻辑宽度会随设备比例变化。
        // 以真实可视宽度取中心，避免横屏、折叠屏和嵌入式预览把目标点整体推向一侧。
        const point = resolveTapMovePoint(
            ui,
            this.visibleDesignWidth(),
            this.designHeight,
            this.world.position,
        );
        return new Vec2(point.x, point.y);
    }

    private setMoveTarget(point: Readonly<Vec2>): void {
        const constrained = this.constrainToRoad(new Vec3(point.x, point.y), 28);
        if (Vec3.distance(this.player.position, constrained) <= 18) {
            this.frostVelocity.set(0, 0);
            this.clearMoveTarget();
            return;
        }
        if (this.hasTrait('cloud-step')) {
            this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.28);
            this.createAbilityHint('踏云无痕', new Color('#B7D8CB'));
        }
        this.moveTarget = new Vec2(constrained.x, constrained.y);
        this.drawMoveTargetMarker();
    }

    private drawMoveTargetMarker(): void {
        if (!this.moveTarget) return;
        if (this.moveTargetMarker?.isValid) this.moveTargetMarker.destroy();
        const marker = new Node('MoveTargetMarker');
        marker.layer = Layers.Enum.UI_2D;
        marker.setPosition(this.moveTarget.x, this.moveTarget.y);
        const graphics = marker.addComponent(Graphics);
        graphics.fillColor = new Color(111, 202, 177, 34);
        graphics.circle(0, 0, 31);
        graphics.fill();
        graphics.strokeColor = new Color(183, 216, 203, 218);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, 25);
        graphics.stroke();
        graphics.strokeColor = new Color(217, 184, 108, 232);
        graphics.lineWidth = 3;
        for (let index = 0; index < 4; index += 1) {
            const angle = Math.PI / 4 + index * Math.PI / 2;
            graphics.moveTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
            graphics.lineTo(Math.cos(angle) * 39, Math.sin(angle) * 39);
        }
        graphics.stroke();
        graphics.fillColor = new Color(243, 231, 200, 225);
        graphics.circle(0, 0, 4);
        graphics.fill();
        this.effectsLayer.addChild(marker);
        this.moveTargetMarker = marker;
    }

    private clearMoveTarget(): void {
        this.moveTarget = undefined;
        if (this.moveTargetMarker?.isValid) this.moveTargetMarker.destroy();
        this.moveTargetMarker = undefined;
    }

    private showFirstRunTutorial(): void {
        this.phase = 'tutorial';
        this.clearOverlay();
        this.bringOverlayToFront();
        this.overlay.addChild(this.makeRect(this.visibleDesignWidth(), this.designHeight, new Color(2, 10, 14, 238)));
        const panel = this.makeThemedCard(620, 930, 'chapter', new Color('#7DD3B8'));
        panel.name = 'FirstRunTutorial';

        const eyebrow = this.makeLabel('初 入 仙 途', 18, new Color('#7DD3B8'));
        eyebrow.node.setPosition(0, 388);
        panel.addChild(eyebrow.node);
        const title = this.makeLabel('三步即可开战', 42, new Color('#FFF0BE'));
        title.node.setPosition(0, 338);
        panel.addChild(title.node);
        const intro = this.makeLabel('战斗会自动御剑，你只需走位、破境与应对机关', 18, new Color('#C9E2D9'));
        intro.node.setPosition(0, 294);
        intro.node.getComponent(UITransform)?.setContentSize(550, 34);
        panel.addChild(intro.node);

        const steps: ReadonlyArray<readonly [string, string, string]> = [
            ['壹 · 走 位', '点击战场任意位置，角色自动走过去', '避开红色预警 · 靠近阵眼获取增益'],
            ['贰 · 御 剑', '飞剑会自动寻找最近的敌人', '解锁功法后，右侧按钮释放踏云与天劫'],
            ['叁 · 破 境', '头像亮起金环即将破境，届时三选一', '奇遇会改变下一境和关底，请先看清代价'],
        ];
        steps.forEach(([number, action, detail], index) => {
            const card = this.makeThemedCard(548, 142, 'summary', new Color(index === 0 ? '#72DDE8' : index === 1 ? '#F0C879' : '#82D7AC'));
            card.setPosition(0, 178 - index * 158);
            const stepTitle = this.makeLabel(number, 21, new Color(index === 0 ? '#72DDE8' : index === 1 ? '#F0C879' : '#82D7AC'));
            stepTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
            stepTitle.node.setPosition(-150, 38);
            stepTitle.node.getComponent(UITransform)?.setContentSize(220, 30);
            card.addChild(stepTitle.node);
            const actionLabel = this.makeLabel(action, 19, new Color('#F3E8CB'));
            actionLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            actionLabel.node.setPosition(0, 2);
            actionLabel.node.getComponent(UITransform)?.setContentSize(490, 30);
            card.addChild(actionLabel.node);
            const detailLabel = this.makeLabel(detail, 16, new Color('#AFCBC1'));
            detailLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            detailLabel.node.setPosition(0, -34);
            detailLabel.node.getComponent(UITransform)?.setContentSize(490, 28);
            card.addChild(detailLabel.node);
            panel.addChild(card);
        });

        const start = this.makeActionButton('明 白 · 开 始 试 炼', 'primary', new Color('#F0C879'), () => {
            this.settings.completeTutorial();
            this.persistSettings();
            this.phase = 'stage-entry';
            this.clearOverlay();
            this.showStageEntry();
        }, 500, 66);
        start.name = 'TutorialStart';
        start.setPosition(0, -380);
        panel.addChild(start);
        this.overlay.addChild(panel);
    }

    private showPauseMenu(reason = '试炼已暂停'): void {
        if (this.phase !== 'playing' && this.phase !== 'paused') return;
        this.phase = 'paused';
        this.platformFeedback.setAmbiencePaused(true);
        this.releaseTribulationHold();
        this.onTouchCancel();
        this.clearOverlay();
        this.bringOverlayToFront();
        this.overlay.addChild(this.makeRect(this.visibleDesignWidth(), this.designHeight, new Color(2, 10, 14, 214)));
        const panel = this.makeThemedCard(560, 620, 'chapter', new Color(this.currentStage.accent));
        panel.name = 'PausePanel';
        const eyebrow = this.makeLabel('暂 止 行 功', 18, new Color(this.currentStage.accent));
        eyebrow.node.setPosition(0, 236);
        panel.addChild(eyebrow.node);
        const title = this.makeLabel(reason, 42, new Color('#FFF0BE'));
        title.node.setPosition(0, 180);
        panel.addChild(title.node);
        const detail = this.makeLabel('计时、敌人、寒潮与功法冷却均已冻结', 18, new Color('#BDD7CD'));
        detail.node.setPosition(0, 132);
        detail.node.getComponent(UITransform)?.setContentSize(500, 32);
        panel.addChild(detail.node);

        const resume = this.makeActionButton('继 续 试 炼', 'primary', new Color(this.currentStage.accent), () => {
            this.clearOverlay();
            this.phase = 'playing';
            this.platformFeedback.setAmbiencePaused(false);
        }, 430, 64);
        resume.name = 'PauseResume';
        resume.setPosition(0, 54);
        panel.addChild(resume);
        const settings = this.makeActionButton('声 音 与 画 面', 'secondary', new Color('#8AB9A7'), () => {
            this.showSettingsPanel('pause');
        }, 430, 60);
        settings.setPosition(0, -30);
        panel.addChild(settings);
        const restart = this.makeActionButton('重 新 开 始', 'quiet', new Color('#B9A269'), () => {
            this.startStage(this.selectedStageIndex);
        }, 206, 58);
        restart.setPosition(-112, -116);
        panel.addChild(restart);
        const exit = this.makeActionButton('返 回 试 炼 图', 'quiet', new Color('#A6786F'), () => this.showMenu(), 206, 58);
        exit.setPosition(112, -116);
        panel.addChild(exit);
        const note = this.makeLabel('返回试炼图不会记录本局战绩', 15, new Color('#8FAFA5'));
        note.node.setPosition(0, -198);
        panel.addChild(note.node);
        this.overlay.addChild(panel);
    }

    /**
     * 道法谱是局外的独立页面：九式道法一屏排开，点开任意一式看清三重效果。
     * 玩家应当能在开局之前就知道自己能修什么，而不是靠局内三选一慢慢试出来。
     */
    private showCultivationCodex(selectedId: UpgradeId = UPGRADES[0].id): void {
        this.clearOverlay();
        this.bringOverlayToFront();
        this.overlay.addChild(this.makeRect(
            this.visibleDesignWidth(),
            this.designHeight,
            new Color(2, 10, 14, 238),
        ));
        const gold = new Color('#D8B86B');
        const panel = this.makeThemedCard(600, 1150, 'chapter', gold);
        panel.name = 'CultivationCodex';
        this.overlay.addChild(panel);

        const title = this.makeLabel('道 法 谱', 46, new Color('#FFF0BE'));
        title.node.setPosition(0, 500);
        panel.addChild(title.node);
        const subtitle = this.makeLabel('九 式 道 法  ·  每 式 三 重  ·  破 境 时 三 选 一', 17, new Color('#BBD6CC'));
        subtitle.node.setPosition(0, 456);
        subtitle.node.getComponent(UITransform)?.setContentSize(556, 28);
        panel.addChild(subtitle.node);
        // 把身上光效的读法直接写出来，玩家才能把战场上看到的东西和这一页对上。
        const rule = this.makeLabel('每 修 一 重 · 身 上 多 一 柄 剑 气 　 同 系 满 三 重 · 脚 下 法 阵 显 化 真 形', 14, new Color('#8FB3A8'));
        rule.node.setPosition(0, 430);
        rule.node.getComponent(UITransform)?.setContentSize(556, 24);
        panel.addChild(rule.node);

        const columnX = [-186, 0, 186];
        UPGRADE_PATH_ORDER.forEach((path, columnIndex) => {
            const pathColor = new Color(UPGRADE_PATH_COLORS[path]);
            const header = this.makeLabel(UPGRADE_PATH_LABELS[path], 22, pathColor);
            header.node.setPosition(columnX[columnIndex], 400);
            header.node.getComponent(UITransform)?.setContentSize(172, 30);
            panel.addChild(header.node);

            UPGRADES.filter((art) => art.path === path).forEach((art, rowIndex) => {
                const chosen = art.id === selectedId;
                const cell = this.makeRect(
                    172,
                    150,
                    new Color(pathColor.r, pathColor.g, pathColor.b, chosen ? 46 : 20),
                    new Color(pathColor.r, pathColor.g, pathColor.b, chosen ? 245 : 120),
                    16,
                    chosen ? 3 : 1,
                );
                cell.name = `CodexArt-${art.id}`;
                cell.setPosition(columnX[columnIndex], 296 - rowIndex * 160);
                const icon = this.createResourceSprite(art.iconResourcePath, 62);
                icon.setPosition(0, 26);
                cell.addChild(icon);
                const name = this.makeLabel(art.title, 20, new Color(chosen ? '#FFF0C8' : '#DCEDE6'));
                name.node.setPosition(0, -30);
                name.node.getComponent(UITransform)?.setContentSize(160, 28);
                cell.addChild(name.node);
                const role = this.makeLabel(art.role, 14, new Color(pathColor.r, pathColor.g, pathColor.b, 225));
                role.node.setPosition(0, -54);
                role.node.getComponent(UITransform)?.setContentSize(160, 22);
                cell.addChild(role.node);
                cell.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
                    event.propagationStopped = true;
                    this.showCultivationCodex(art.id);
                });
                panel.addChild(cell);
            });
        });

        const selected = UPGRADES.find((art) => art.id === selectedId) ?? UPGRADES[0];
        const selectedColor = new Color(UPGRADE_PATH_COLORS[selected.path]);
        const detail = this.makeRect(
            556,
            286,
            new Color(2, 16, 20, 232),
            new Color(selectedColor.r, selectedColor.g, selectedColor.b, 168),
            18,
            2,
        );
        detail.name = 'CodexDetail';
        detail.setPosition(0, -324);
        panel.addChild(detail);

        const detailIcon = this.createResourceSprite(selected.iconResourcePath, 74);
        detailIcon.setPosition(-222, 84);
        detail.addChild(detailIcon);
        const detailName = this.makeLabel(selected.title, 28, new Color('#FFF0C8'));
        detailName.horizontalAlign = Label.HorizontalAlign.LEFT;
        detailName.node.setPosition(-46, 96);
        detailName.node.getComponent(UITransform)?.setContentSize(300, 34);
        detail.addChild(detailName.node);
        const detailRole = this.makeLabel(
            `${UPGRADE_PATH_LABELS[selected.path]}  ·  ${selected.role}`,
            16,
            new Color(selectedColor.r, selectedColor.g, selectedColor.b, 240),
        );
        detailRole.horizontalAlign = Label.HorizontalAlign.LEFT;
        detailRole.node.setPosition(-58, 66);
        detailRole.node.getComponent(UITransform)?.setContentSize(276, 24);
        detail.addChild(detailRole.node);

        const tierNames = ['一 重', '二 重', '三 重'] as const;
        selected.descriptions.forEach((text, index) => {
            const final = index === selected.descriptions.length - 1;
            const row = this.makeRect(
                520,
                52,
                new Color(selectedColor.r, selectedColor.g, selectedColor.b, final ? 34 : 14),
                new Color(selectedColor.r, selectedColor.g, selectedColor.b, final ? 190 : 78),
                12,
                1,
            );
            row.setPosition(0, 12 - index * 60);
            const tier = this.makeLabel(
                final ? `${tierNames[index]} · 圆满` : tierNames[index],
                16,
                new Color(final ? '#F4D78B' : '#9FC7BB'),
            );
            tier.horizontalAlign = Label.HorizontalAlign.LEFT;
            tier.node.setPosition(-206, 0);
            tier.node.getComponent(UITransform)?.setContentSize(110, 24);
            row.addChild(tier.node);
            const body = this.makeLabel(text, 17, new Color(final ? '#FFF0C8' : '#DCEDE6'));
            body.horizontalAlign = Label.HorizontalAlign.LEFT;
            body.node.setPosition(30, 0);
            body.node.getComponent(UITransform)?.setContentSize(340, 44);
            row.addChild(body.node);
            // 行末用剑气菱形标出修到这一重时身上累计挂几柄，和战场表现一一对应。
            const marks = row.getComponent(Graphics);
            if (marks) {
                for (let slot = 0; slot <= index; slot += 1) {
                    const x = 214 + slot * 15;
                    marks.fillColor = new Color(selectedColor.r, selectedColor.g, selectedColor.b, final ? 250 : 200);
                    marks.moveTo(x, 9);
                    marks.lineTo(x + 5, 0);
                    marks.lineTo(x, -9);
                    marks.lineTo(x - 5, 0);
                    marks.close();
                    marks.fill();
                }
            }
            detail.addChild(row);
        });

        const close = this.makeActionButton('收 起', 'primary', gold, () => this.renderMenu(), 320, 60);
        close.name = 'CodexClose';
        close.setPosition(0, -510);
        panel.addChild(close);
    }

    private showSettingsPanel(origin: 'menu' | 'pause'): void {
        const preferences = this.settings.snapshot();
        this.clearOverlay();
        this.bringOverlayToFront();
        this.overlay.addChild(this.makeRect(this.visibleDesignWidth(), this.designHeight, new Color(2, 10, 14, 232)));
        const panel = this.makeThemedCard(580, 760, 'chapter', new Color('#7DD3B8'));
        panel.name = 'SettingsPanel';
        const title = this.makeLabel('设 置', 44, new Color('#FFF0BE'));
        title.node.setPosition(0, 302);
        panel.addChild(title.node);
        const subtitle = this.makeLabel('声音、震动与动态偏好会自动保存', 17, new Color('#BBD6CC'));
        subtitle.node.setPosition(0, 258);
        panel.addChild(subtitle.node);

        const rows: ReadonlyArray<readonly [keyof GamePreferences, string, string]> = [
            ['audioEnabled', '音效', '攻击、破境与战斗反馈'],
            ['vibrationEnabled', '震动', '移动设备上的命中与里程碑反馈'],
            ['reducedMotion', '减少动态', '缩短入境演出并移除循环漂移'],
        ];
        rows.forEach(([key, label, detail], index) => {
            const row = this.makeThemedCard(510, 112, 'summary');
            row.setPosition(0, 166 - index * 128);
            const rowTitle = this.makeLabel(label, 22, new Color('#E9DDC1'));
            rowTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
            rowTitle.node.setPosition(-142, 18);
            rowTitle.node.getComponent(UITransform)?.setContentSize(190, 30);
            row.addChild(rowTitle.node);
            const rowDetail = this.makeLabel(detail, 15, new Color('#91B2A7'));
            rowDetail.horizontalAlign = Label.HorizontalAlign.LEFT;
            rowDetail.node.setPosition(-66, -20);
            rowDetail.node.getComponent(UITransform)?.setContentSize(340, 26);
            row.addChild(rowDetail.node);
            const toggle = this.makeCompactButton(preferences[key] ? '已 开' : '已 关', () => {
                this.settings.update({ [key]: !this.settings.snapshot()[key] });
                this.persistSettings();
                this.showSettingsPanel(origin);
            }, 106, 48, preferences[key]);
            toggle.setPosition(178, 8);
            row.addChild(toggle);
            panel.addChild(row);
        });

        const tutorial = this.makeThemedCard(510, 92, 'summary');
        tutorial.setPosition(0, -226);
        const tutorialTitle = this.makeLabel('新手指引', 20, new Color('#E9DDC1'));
        tutorialTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
        tutorialTitle.node.setPosition(-132, 17);
        tutorialTitle.node.getComponent(UITransform)?.setContentSize(210, 28);
        tutorial.addChild(tutorialTitle.node);
        const tutorialDetail = this.makeLabel(
            preferences.tutorialCompleted ? '已完成 · 可在下次入境时重看' : '下次入境将自动显示',
            14,
            new Color('#91B2A7'),
        );
        tutorialDetail.horizontalAlign = Label.HorizontalAlign.LEFT;
        tutorialDetail.node.setPosition(-70, -18);
        tutorialDetail.node.getComponent(UITransform)?.setContentSize(330, 24);
        tutorial.addChild(tutorialDetail.node);
        if (preferences.tutorialCompleted) {
            const replay = this.makeCompactButton('下局重看', () => {
                this.settings.update({ tutorialCompleted: false });
                this.persistSettings();
                this.showSettingsPanel(origin);
            }, 116, 44);
            replay.setPosition(170, 6);
            tutorial.addChild(replay);
        }
        panel.addChild(tutorial);

        const close = this.makeActionButton('完 成', 'primary', new Color('#7DD3B8'), () => {
            if (origin === 'pause') this.showPauseMenu();
            else this.showMenu();
        }, 420, 62);
        close.setPosition(0, -320);
        panel.addChild(close);
        this.overlay.addChild(panel);
    }

    private showJourneyEpilogue(): void {
        const journey = this.stageProgress.journeyCompletion();
        if (!journey.allStagesCleared) return;
        this.phase = 'victory';
        this.platformFeedback.playCue('journey-complete');
        this.clearOverlay();
        this.bringOverlayToFront();
        this.overlay.addChild(this.makeRect(this.visibleDesignWidth(), this.designHeight, new Color(1, 9, 13, 242)));
        const panel = this.makeThemedCard(620, 920, 'reward', new Color('#E3C06F'));
        panel.name = 'JourneyEpilogue';
        const eyebrow = this.makeLabel('仙 途 劫 · 道 藏 终 卷', 18, new Color('#E3C06F'));
        eyebrow.node.setPosition(0, 386);
        panel.addChild(eyebrow.node);
        const title = this.makeLabel('三 境 归 一', 52, new Color('#FFF0BE'));
        title.node.setPosition(0, 326);
        panel.addChild(title.node);
        const closure = this.makeLabel('地脉归寂 · 竹心复明 · 潮声俱寂', 18, new Color('#CDE2D9'));
        closure.node.setPosition(0, 274);
        panel.addChild(closure.node);

        const seal = this.makeRect(178, 178, new Color(55, 43, 21, 142), new Color('#E3C06F'), 48, 2);
        seal.setPosition(0, 156);
        const sealLabel = this.makeLabel('劫\n尽', 44, new Color('#FFE7A3'));
        sealLabel.lineHeight = 50;
        seal.addChild(sealLabel.node);
        panel.addChild(seal);

        const stats = [
            ['渡劫', `${journey.totalClears}`],
            ['道途', `${journey.discoveredRoutes}/6`],
            ['真形', `${journey.masteredPaths}/3`],
            ['连斩', `${journey.bestCombo}`],
        ] as const;
        const statStrip = this.makeThemedCard(548, 98, 'summary');
        statStrip.setPosition(0, 22);
        stats.forEach(([label, value], index) => {
            const item = this.makeResultStat(label, value, new Color('#E3C06F'));
            item.setPosition(-204 + index * 136, 0);
            statStrip.addChild(item);
        });
        panel.addChild(statStrip);

        const rewards = this.makeThemedCard(548, 174, 'summary');
        rewards.setPosition(0, -130);
        const rewardTitle = this.makeLabel('三 枚 道 印 已 齐 聚', 17, new Color('#E3C06F'));
        rewardTitle.node.setPosition(0, 56);
        rewards.addChild(rewardTitle.node);
        const rewardText = this.makeLabel('青石剑印 · 御剑伤害 +2\n竹影行符 · 移动速度 +10\n寒潭玉魄 · 最大气血 +8', 19, new Color('#E8E0CA'));
        rewardText.lineHeight = 36;
        rewardText.node.setPosition(0, -18);
        rewards.addChild(rewardText.node);
        panel.addChild(rewards);

        const next = this.makeLabel('终卷不是终点 · 继续印证六条道途与三脉真形', 18, new Color('#A9C9BE'));
        next.node.setPosition(0, -252);
        next.node.getComponent(UITransform)?.setContentSize(540, 32);
        panel.addChild(next.node);
        const close = this.makeActionButton('返 回 三 境 试 炼', 'primary', new Color('#E3C06F'), () => this.showMenu(), 480, 66);
        close.name = 'JourneyContinue';
        close.setPosition(0, -350);
        panel.addChild(close);
        this.overlay.addChild(panel);
    }

    private showBalanceReportPanel(): void {
        this.clearOverlay();
        this.bringOverlayToFront();
        this.overlay.addChild(this.makeRect(this.visibleDesignWidth(), this.designHeight, new Color(2, 10, 14, 236)));
        const panel = this.makeThemedCard(590, 720, 'chapter', new Color('#72DDE8'));
        panel.name = 'BalanceReportPanel';
        const eyebrow = this.makeLabel('P3 · 数 值 验 收', 17, new Color('#72DDE8'));
        eyebrow.node.setPosition(0, 288);
        panel.addChild(eyebrow.node);
        const title = this.makeLabel('三境实战样本', 40, new Color('#FFF0BE'));
        title.node.setPosition(0, 236);
        panel.addChild(title.node);
        const rule = this.makeLabel('每章至少 10 局 · 胜率 30–80% · 中位局长 2:30–5:00', 16, new Color('#BBD4CB'));
        rule.node.setPosition(0, 198);
        rule.node.getComponent(UITransform)?.setContentSize(540, 28);
        panel.addChild(rule.node);

        STAGES.forEach((stage, index) => {
            const report = this.balanceTelemetry.reportFor(stage.mapId);
            const row = this.makeThemedCard(520, 118, 'summary', new Color(stage.accent));
            row.setPosition(0, 100 - index * 136);
            const stageName = this.makeLabel(`${stage.chapter} · ${stage.stageName}`, 20, new Color(stage.accent));
            stageName.horizontalAlign = Label.HorizontalAlign.LEFT;
            stageName.node.setPosition(-118, 28);
            stageName.node.getComponent(UITransform)?.setContentSize(280, 30);
            row.addChild(stageName.node);
            const reportText = this.makeLabel(formatBalanceReport(report), 15, new Color('#D9E8E2'));
            reportText.horizontalAlign = Label.HorizontalAlign.LEFT;
            reportText.node.setPosition(0, -10);
            reportText.node.getComponent(UITransform)?.setContentSize(472, 26);
            row.addChild(reportText.node);
            const coverage = this.makeLabel(
                `路线 ${Object.keys(report.routeCounts).length}/2 · 通关构筑 ${Object.keys(report.buildCounts).length}/3`,
                14,
                new Color('#8FAFA5'),
            );
            coverage.horizontalAlign = Label.HorizontalAlign.LEFT;
            coverage.node.setPosition(-94, -38);
            coverage.node.getComponent(UITransform)?.setContentSize(320, 24);
            row.addChild(coverage.node);
            panel.addChild(row);
        });

        const exportStatus = this.makeLabel('正式对局自动保留最近 60 局 · 可复制给数值汇总工具', 14, new Color('#8FAFA5'));
        exportStatus.node.setPosition(0, -240);
        exportStatus.node.getComponent(UITransform)?.setContentSize(500, 24);
        panel.addChild(exportStatus.node);
        const copy = this.makeActionButton('复 制 样 本', 'secondary', new Color('#72DDE8'), () => {
            const clipboard = globalThis.navigator?.clipboard;
            if (!clipboard) {
                exportStatus.string = '当前宿主不支持剪贴板 · 请在本地浏览器打开报告';
                return;
            }
            void clipboard.writeText(this.balanceTelemetry.exportBundle(globalThis.navigator?.userAgent))
                .then(() => {
                    if (exportStatus.node.isValid) exportStatus.string = '已复制最近 60 局 JSON 样本包';
                })
                .catch(() => {
                    if (exportStatus.node.isValid) exportStatus.string = '复制失败 · 请允许浏览器剪贴板权限后重试';
                });
        }, 244, 62);
        copy.name = 'BalanceExportAction';
        copy.setPosition(-132, -294);
        panel.addChild(copy);
        const close = this.makeActionButton('返 回 试 炼 图', 'primary', new Color('#72DDE8'), () => this.showMenu(), 244, 62);
        close.setPosition(132, -294);
        panel.addChild(close);
        this.overlay.addChild(panel);
    }

    private showMenu(): void {
        this.chapterBriefOpen = false;
        this.chapterBriefPreviewChoiceId = undefined;
        this.renderMenu();
    }

    private renderMenu(): void {
        this.phase = 'menu';
        this.platformFeedback.setAmbience('menu');
        this.platformFeedback.setAmbiencePaused(false);
        // 结算页返回路线图时必须清掉上一局 HUD 与战斗节点，否则菜单会叠在旧战场状态上。
        this.clearBattle();
        this.clearOverlay();
        this.applyStageVisual(true);
        this.bringOverlayToFront();
        const shade = this.makeRect(this.visibleDesignWidth(), 1334, new Color(3, 13, 16, 146));
        this.overlay.addChild(shade);

        const title = this.makeLabel('仙 途 劫', 62, new Color('#FFF0BE'));
        title.node.setPosition(0, 558);
        this.overlay.addChild(title.node);
        const titleRule = new Node('TitleRule');
        titleRule.layer = Layers.Enum.UI_2D;
        titleRule.setPosition(0, 510);
        const rule = titleRule.addComponent(Graphics);
        rule.strokeColor = new Color(239, 202, 118, 175);
        rule.lineWidth = 2;
        rule.moveTo(-206, 0);
        rule.lineTo(-42, 0);
        rule.moveTo(42, 0);
        rule.lineTo(206, 0);
        rule.stroke();
        rule.fillColor = new Color(239, 202, 118, 220);
        rule.circle(0, 0, 4);
        rule.fill();
        this.overlay.addChild(titleRule);

        const subtitle = this.makeLabel('御 剑 破 劫  ·  三 境 问 道', 18, new Color('#CFE5DB'));
        subtitle.node.setPosition(0, 478);
        this.overlay.addChild(subtitle.node);

        const archive = this.stageProgress.cultivationArchive();
        const journey = this.stageProgress.journeyCompletion();
        const archivePill = this.makeRect(
            410,
            38,
            new Color(3, 18, 22, 206),
            new Color('#9B8150'),
            13,
            1,
        );
        archivePill.setPosition(0, 438);
        const archiveLabel = this.makeLabel(
            journey.allStagesCleared
                ? `三境归一 · 道途 ${archive.discoveredRoutes}/6 · 真形 ${archive.masteredPaths.length}/3`
                : `道藏 · 道途 ${archive.discoveredRoutes}/6 · 真形 ${archive.masteredPaths.length}/3 · 渡劫 ${archive.totalClears}`,
            16,
            new Color('#EBD9A7'),
        );
        archiveLabel.node.getComponent(UITransform)?.setContentSize(390, 28);
        archivePill.addChild(archiveLabel.node);
        if (journey.allStagesCleared) {
            archivePill.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
                event.propagationStopped = true;
                this.showJourneyEpilogue();
            });
        }
        this.overlay.addChild(archivePill);

        const settingsButton = this.makeCompactButton('设 置', () => this.showSettingsPanel('menu'), 94, 40);
        settingsButton.name = 'MenuSettings';
        settingsButton.setPosition(this.visibleDesignWidth() / 2 - 62, 558);
        this.overlay.addChild(settingsButton);
        // 道法谱是开局前理解"我能修什么"的唯一入口，与设置对称放在标题两侧。
        const codexButton = this.makeCompactButton('道 法', () => this.showCultivationCodex(), 94, 40);
        codexButton.name = 'MenuCultivationCodex';
        codexButton.setPosition(-this.visibleDesignWidth() / 2 + 62, 558);
        this.overlay.addChild(codexButton);
        if (this.hasLocalQaFlag('qaBalance=1')) {
            const balanceButton = this.makeCompactButton('平 衡', () => this.showBalanceReportPanel(), 94, 40, true);
            balanceButton.name = 'BalanceReportAction';
            // 让出标题左侧给道法谱，验收入口下移一行。
            balanceButton.setPosition(-this.visibleDesignWidth() / 2 + 62, 508);
            this.overlay.addChild(balanceButton);
        }

        const heroGlow = new Node('HeroGlow');
        heroGlow.layer = Layers.Enum.UI_2D;
        heroGlow.setPosition(0, 365);
        const glow = heroGlow.addComponent(Graphics);
        glow.fillColor = new Color(76, 190, 167, 28);
        glow.circle(0, 0, 96);
        glow.fill();
        glow.strokeColor = new Color(126, 224, 197, 62);
        glow.lineWidth = 2;
        glow.circle(0, 0, 82);
        glow.stroke();
        this.overlay.addChild(heroGlow);
        const hero = this.createResourceSprite(PLAYER_ASSET.resourcePath, 176);
        hero.setPosition(0, 356);
        this.overlay.addChild(hero);

        const routeTitle = this.makeLabel('三 境 试 炼', 24, new Color('#F2DEAA'));
        routeTitle.node.setPosition(0, 252);
        this.overlay.addChild(routeTitle.node);
        this.overlay.addChild(this.makeChapterRoute());
        this.overlay.addChild(this.makeStagePreview(this.currentStage));
    }

    private makeChapterRoute(): Node {
        const route = new Node('ChapterRoute');
        route.layer = Layers.Enum.UI_2D;
        route.setPosition(0, 154);
        const graphics = route.addComponent(Graphics);
        graphics.strokeColor = new Color(95, 153, 139, 145);
        graphics.lineWidth = 3;
        graphics.moveTo(-218, 0);
        graphics.lineTo(218, 0);
        graphics.stroke();

        STAGES.forEach((stage, index) => {
            const selected = index === this.selectedStageIndex;
            const stageRecord = this.stageProgress.recordFor(stage.mapId);
            const cleared = stageRecord.clears > 0;
            const accent = new Color(stage.accent);
            const x = (index - 1) * 218;
            const backing = this.makeRect(
                selected ? 126 : 106,
                selected ? 126 : 106,
                new Color(4, 20, 24, selected ? 252 : 238),
                accent,
                selected ? 30 : 25,
                selected ? 3 : 1.5,
            );
            backing.name = `ChapterNode-${index + 1}`;
            backing.setPosition(x, 0);
            const thumbnail = this.createResourceSprite(
                BACKGROUND_ASSETS[stage.mapId].resourcePath,
                selected ? 104 : 86,
            );
            backing.addChild(thumbnail);
            const chapter = this.makeLabel(
                stage.chapter,
                selected ? 20 : 18,
                new Color(accent.r, accent.g, accent.b, selected ? 255 : 210),
            );
            chapter.node.setPosition(0, selected ? -80 : -69);
            chapter.node.getComponent(UITransform)?.setContentSize(128, 30);
            backing.addChild(chapter.node);
            if (selected || cleared) {
                const markerText = selected && cleared ? '已破 · 当前' : cleared ? '已破' : '当前';
                const markerWidth = selected && cleared ? 94 : 60;
                const marker = this.makeRect(
                    markerWidth,
                    24,
                    new Color(cleared ? 65 : 19, cleared ? 50 : 55, cleared ? 27 : 50, 238),
                    new Color(accent.r, accent.g, accent.b, 175),
                    9,
                    1,
                );
                marker.setPosition(0, selected ? 78 : 65);
                const markerLabel = this.makeLabel(markerText, 18, new Color(cleared ? '#FFF0BE' : '#D5EEE3'));
                markerLabel.node.getComponent(UITransform)?.setContentSize(markerWidth - 6, 20);
                marker.addChild(markerLabel.node);
                backing.addChild(marker);
            }
            backing.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
                event.propagationStopped = true;
                backing.setScale(0.96, 0.96);
            });
            backing.on(Node.EventType.TOUCH_CANCEL, () => backing.setScale(1, 1));
            backing.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
                event.propagationStopped = true;
                backing.setScale(1, 1);
                if (this.selectedStageIndex === index) return;
                // 路线节点只切换预览，必须由底部主按钮确认入场，避免玩家误触直接开战。
                this.selectedStageIndex = index;
                this.showMenu();
            });
            route.addChild(backing);
        });
        return route;
    }

    private makeStagePreview(stage: StageConfig): Node {
        const accent = new Color(stage.accent);
        const panel = this.makeThemedCard(660, 590, 'chapter', accent);
        panel.name = 'StagePreview';
        panel.setPosition(0, -293);

        const headerSurface = this.makeRect(
            624,
            178,
            new Color(2, 15, 19, 174),
            undefined,
            UI_THEME.radius.compact,
        );
        headerSurface.setPosition(0, 188);
        panel.addChild(headerSurface);

        const thumbnailBacking = this.makeRect(150, 144, new Color(UI_THEME.colors.ink), new Color(accent.r, accent.g, accent.b, 132), UI_THEME.radius.compact, 1);
        thumbnailBacking.setPosition(-222, 188);
        const thumbnail = this.createResourceSprite(BACKGROUND_ASSETS[stage.mapId].resourcePath, 140);
        thumbnailBacking.addChild(thumbnail);
        if (this.chapterBriefOpen && this.chapterBriefPreviewChoiceId) {
            this.createChapterRouteSpatialPreview(stage, thumbnailBacking);
        } else {
            this.createChapterMotionPreview(stage, thumbnailBacking);
        }
        panel.addChild(thumbnailBacking);

        const chapter = this.makeLabel(stage.chapter, 16, new Color(accent.r, accent.g, accent.b, 245));
        chapter.horizontalAlign = Label.HorizontalAlign.LEFT;
        chapter.node.setPosition(16, 236);
        chapter.node.getComponent(UITransform)?.setContentSize(220, 28);
        panel.addChild(chapter.node);
        const name = this.makeLabel(stage.stageName, 36, new Color('#FFF2CC'));
        name.horizontalAlign = Label.HorizontalAlign.LEFT;
        name.node.setPosition(50, 191);
        name.node.getComponent(UITransform)?.setContentSize(300, 50);
        panel.addChild(name.node);
        const tagline = this.makeLabel(stage.tagline, 18, new Color(184, 215, 204, 240));
        tagline.horizontalAlign = Label.HorizontalAlign.LEFT;
        tagline.node.setPosition(44, 149);
        tagline.node.getComponent(UITransform)?.setContentSize(300, 32);
        panel.addChild(tagline.node);

        const risk = this.makeRect(82, 30, new Color(111, 55, 35, 238), accent, 11, 1);
        risk.setPosition(255, 243);
        const riskLabel = this.makeLabel(stage.riskLabel, 19, new Color('#FFF0BE'));
        risk.addChild(riskLabel.node);
        panel.addChild(risk);

        const goalBacking = this.makeRect(590, 44, new Color(3, 17, 21, 146), undefined, UI_THEME.radius.compact);
        goalBacking.setPosition(0, 80);
        const goal = this.makeLabel(`试炼目标  ·  ${stage.goal}`, 20, new Color(211, 232, 223, 245));
        goal.horizontalAlign = Label.HorizontalAlign.LEFT;
        goal.node.getComponent(UITransform)?.setContentSize(548, 30);
        goalBacking.addChild(goal.node);
        panel.addChild(goalBacking);

        const enter = this.makeActionButton(
            `踏 入 ${stage.stageName}`,
            'primary',
            accent,
            () => this.startStage(this.selectedStageIndex),
            520,
            62,
        );
        enter.name = 'StagePrimaryAction';
        enter.setPosition(0, 22);
        panel.addChild(enter);

        if (this.chapterBriefOpen) {
            this.addChapterRouteBrief(stage, panel, accent);
        } else {
            const routeLabel = this.makeLabel('本 章 道 途', 19, new Color(accent.r, accent.g, accent.b, 225));
            routeLabel.node.setPosition(0, -32);
            panel.addChild(routeLabel.node);
            const pathLine = new Node('StagePathLine');
            pathLine.layer = Layers.Enum.UI_2D;
            pathLine.setPosition(0, -98);
            const line = pathLine.addComponent(Graphics);
            line.strokeColor = new Color(accent.r, accent.g, accent.b, 100);
            line.lineWidth = 2;
            line.moveTo(-164, 0);
            line.lineTo(164, 0);
            line.stroke();
            panel.addChild(pathLine);

            const pathItems = [
                ['地图机关', stage.routePreview.mechanic],
                ['路线奇遇', stage.routePreview.encounter],
                ['关底首领', stage.routePreview.boss],
            ] as const;
            pathItems.forEach(([role, value], index) => {
                const item = new Node(index === 1 ? 'ChapterRouteBriefTrigger' : `ChapterRoute-${index}`);
                item.layer = Layers.Enum.UI_2D;
                item.addComponent(UITransform).setContentSize(174, 92);
                item.setPosition((index - 1) * 188, -98);
                const roleLabel = this.makeLabel(
                    index === 1 ? `${role} · 预览` : role,
                    18,
                    new Color(139, 172, 162, 235),
                );
                roleLabel.node.setPosition(0, 24);
                item.addChild(roleLabel.node);
                const valueLabel = this.makeLabel(value, 22, new Color(index === 1 ? UI_THEME.colors.gold : UI_THEME.colors.ivory));
                valueLabel.node.setPosition(0, -14);
                valueLabel.node.getComponent(UITransform)?.setContentSize(154, 34);
                item.addChild(valueLabel.node);
                if (index === 1) {
                    item.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
                        event.propagationStopped = true;
                        item.setScale(0.97, 0.97);
                    });
                    item.on(Node.EventType.TOUCH_CANCEL, () => item.setScale(1, 1));
                    item.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
                        event.propagationStopped = true;
                        item.setScale(1, 1);
                        this.chapterBriefOpen = true;
                        this.chapterBriefPreviewChoiceId = mapEventScenarioFor(stage.mapId).choices[0]?.id;
                        this.renderMenu();
                    });
                }
                panel.addChild(item);
            });

            const mechanicText = this.makeLabel(
                `${stage.featureTags[0]}  ·  ${stage.featureTags[1]}`,
                18,
                new Color(accent.r, accent.g, accent.b, 242),
            );
            mechanicText.node.setPosition(0, -154);
            panel.addChild(mechanicText.node);

            const stageRecord = this.stageProgress.recordFor(stage.mapId);
            const recordCard = this.makeThemedCard(278, 62, 'summary');
            recordCard.setPosition(-149, -220);
            const recordTitle = this.makeLabel('试 炼 记 录', 18, new Color(139, 172, 162, 235));
            recordTitle.node.setPosition(0, 17);
            recordCard.addChild(recordTitle.node);
            const recordLabel = this.makeLabel(
                formatStageRecord(stageRecord),
                18,
                new Color(
                    stageRecord.clears > 0 ? accent.r : 137,
                    stageRecord.clears > 0 ? accent.g : 166,
                    stageRecord.clears > 0 ? accent.b : 158,
                    235,
                ),
            );
            recordLabel.node.setPosition(0, -14);
            recordLabel.node.getComponent(UITransform)?.setContentSize(250, 26);
            recordCard.addChild(recordLabel.node);
            panel.addChild(recordCard);

            const reward = STAGE_FIRST_CLEAR_REWARDS[stage.mapId];
            const rewardCard = this.makeThemedCard(278, 62, 'summary');
            rewardCard.setPosition(149, -220);
            const routeChoices = stageRecord.routeChoices ?? [];
            const alternateRoute = mapEventScenarioFor(stage.mapId).choices.find(
                (choice) => !routeChoices.includes(choice.id),
            );
            const rewardTitle = this.makeLabel(
                stageRecord.clears > 0 ? '道 途 印 证' : '首 通 奖 励',
                18,
                new Color(139, 172, 162, 235),
            );
            rewardTitle.node.setPosition(0, 17);
            rewardCard.addChild(rewardTitle.node);
            const rewardIconBacking = this.makeRect(
                30,
                30,
                new Color(3, 15, 18, 238),
                new Color(accent.r, accent.g, accent.b, 145),
                9,
                1,
            );
            rewardIconBacking.setPosition(-108, -14);
            rewardIconBacking.addChild(this.createResourceSprite(reward.iconResourcePath, 23));
            rewardCard.addChild(rewardIconBacking);
            const rewardLabel = this.makeLabel(
                stageRecord.clears > 0
                    ? `${routeChoices.length}/2  ·  ${alternateRoute ? `待证 ${alternateRoute.geometryPreview ?? alternateRoute.title}` : '双途已证'}`
                    : formatFirstClearReward(stage.mapId, false),
                18,
                new Color(
                    stageRecord.clears > 0 ? accent.r : 157,
                    stageRecord.clears > 0 ? accent.g : 181,
                    stageRecord.clears > 0 ? accent.b : 173,
                    235,
                ),
            );
            rewardLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            rewardLabel.node.setPosition(27, -14);
            rewardLabel.node.getComponent(UITransform)?.setContentSize(205, 26);
            rewardCard.addChild(rewardLabel.node);
            panel.addChild(rewardCard);
        }
        return panel;
    }

    private addChapterRouteBrief(stage: StageConfig, panel: Node, accent: Color): void {
        const scenario = mapEventScenarioFor(stage.mapId);
        const heading = this.makeLabel(
            `路线奇遇 · ${scenario.title}`,
            20,
            new Color(accent.r, accent.g, accent.b, 235),
        );
        heading.horizontalAlign = Label.HorizontalAlign.LEFT;
        heading.node.setPosition(-52, -46);
        heading.node.getComponent(UITransform)?.setContentSize(360, 30);
        panel.addChild(heading.node);

        const close = this.makeRect(
            112,
            34,
            new Color(7, 35, 38, 246),
            new Color(accent.r, accent.g, accent.b, 165),
            12,
            1.5,
        );
        close.name = 'ChapterRouteBriefClose';
        close.setPosition(238, -46);
        const closeLabel = this.makeLabel('收起', 18, new Color('#D9EEE6'));
        closeLabel.node.getComponent(UITransform)?.setContentSize(102, 24);
        close.addChild(closeLabel.node);
        close.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            close.setScale(0.97, 0.97);
        });
        close.on(Node.EventType.TOUCH_CANCEL, () => close.setScale(1, 1));
        close.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            close.setScale(1, 1);
            this.chapterBriefOpen = false;
            this.chapterBriefPreviewChoiceId = undefined;
            this.renderMenu();
        });
        panel.addChild(close);

        scenario.choices.forEach((choice, index) => {
            const tone = new Color(MAP_EVENT_TONE_COLORS[choice.tone]);
            const selected = choice.id === this.chapterBriefPreviewChoiceId;
            const card = this.makeRect(
                270,
                164,
                selected
                    ? new Color(
                        Math.round(tone.r * 0.16),
                        Math.round(tone.g * 0.16),
                        Math.round(tone.b * 0.16),
                        252,
                    )
                    : new Color(4, 21, 25, 252),
                new Color(tone.r, tone.g, tone.b, selected ? 245 : 190),
                UI_THEME.radius.compact,
                selected ? 2 : 1,
            );
            card.name = `ChapterRouteBrief-${choice.id}`;
            card.setPosition(index === 0 ? -145 : 145, -162);
            card.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
                event.propagationStopped = true;
                card.setScale(0.98, 0.98);
            });
            card.on(Node.EventType.TOUCH_CANCEL, () => card.setScale(1, 1));
            card.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
                event.propagationStopped = true;
                card.setScale(1, 1);
                // 菜单点击只切换缩略图预演，不调用 MapEventRuntime.resolve，正式路线仍留到波次间抉择。
                this.chapterBriefPreviewChoiceId = choice.id;
                this.renderMenu();
            });

            const role = this.makeLabel(
                selected ? `${choice.role} · 预演中` : choice.role,
                18,
                new Color(tone.r, tone.g, tone.b, 240),
            );
            role.horizontalAlign = Label.HorizontalAlign.LEFT;
            role.node.setPosition(-50, 55);
            role.node.getComponent(UITransform)?.setContentSize(150, 22);
            card.addChild(role.node);
            const risk = this.makeLabel(choice.riskLabel, 18, new Color(164, 190, 181, 230));
            risk.horizontalAlign = Label.HorizontalAlign.RIGHT;
            risk.node.setPosition(73, 55);
            risk.node.getComponent(UITransform)?.setContentSize(104, 22);
            card.addChild(risk.node);

            const iconBacking = this.makeRect(
                58,
                58,
                new Color(2, 14, 18, 246),
                new Color(tone.r, tone.g, tone.b, 145),
                15,
                1,
            );
            iconBacking.setPosition(-93, 5);
            iconBacking.addChild(this.createResourceSprite(choice.iconResourcePath, 46));
            card.addChild(iconBacking);

            const title = this.makeLabel(choice.title, 22, new Color('#FFF0C2'));
            title.horizontalAlign = Label.HorizontalAlign.LEFT;
            title.node.setPosition(42, 27);
            title.node.getComponent(UITransform)?.setContentSize(160, 34);
            card.addChild(title.node);
            const summary = this.makeLabel(choice.outcome, 18, new Color(190, 216, 207, 242));
            summary.horizontalAlign = Label.HorizontalAlign.LEFT;
            summary.node.setPosition(42, -11);
            summary.node.getComponent(UITransform)?.setContentSize(160, 42);
            card.addChild(summary.node);

            const outcome = this.makeRect(
                238,
                30,
                new Color(tone.r, tone.g, tone.b, 22),
                new Color(tone.r, tone.g, tone.b, 76),
                10,
                1,
            );
            outcome.setPosition(0, -59);
            const outcomeLabel = this.makeLabel(
                `落点 · ${choice.geometryPreview ?? choice.title}`,
                18,
                new Color(tone.r, tone.g, tone.b, 245),
            );
            outcomeLabel.node.getComponent(UITransform)?.setContentSize(224, 22);
            outcome.addChild(outcomeLabel.node);
            card.addChild(outcome);
            panel.addChild(card);
        });

    }

    private chapterPreviewEffect(stage: StageConfig): RouteCommitEffect {
        if (stage.mapId === 'bamboo-ambush') return 'bamboo-shadow';
        if (stage.mapId === 'frozen-ruins') return 'sealed-sanctuary';
        return 'spring-flow';
    }

    private chapterPreviewAssetPath(stage: StageConfig): string {
        const effect = this.chapterPreviewEffect(stage);
        return this.routeCommitAssetPath(effect);
    }

    private routeCommitAssetPath(effect: RouteCommitEffect): string {
        if (effect === 'stele-burst') return QINGSHI_STELE_COMMIT_ANIMATION_ASSET.resourcePath;
        if (effect === 'spring-flow') return QINGSHI_SPRING_COMMIT_ANIMATION_ASSET.resourcePath;
        if (effect === 'bamboo-burn') return BAMBOO_BURN_COMMIT_ANIMATION_ASSET.resourcePath;
        if (effect === 'bamboo-shadow') return BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET.resourcePath;
        if (effect === 'tide-convergence') return FROST_TIDE_COMMIT_ANIMATION_ASSET.resourcePath;
        if (effect === 'sealed-sanctuary') return FROST_SEAL_COMMIT_ANIMATION_ASSET.resourcePath;
        return FROST_SEAL_COMMIT_ANIMATION_ASSET.resourcePath;
    }

    private activeChapterPreviewAssetPath(stage: StageConfig): string {
        if (!this.chapterBriefOpen || !this.chapterBriefPreviewChoiceId) {
            return this.chapterPreviewAssetPath(stage);
        }
        const choice = mapEventScenarioFor(stage.mapId).choices.find(
            (candidate) => candidate.id === this.chapterBriefPreviewChoiceId,
        );
        return choice?.commitEffect
            ? this.routeCommitAssetPath(choice.commitEffect)
            : this.chapterPreviewAssetPath(stage);
    }

    private createChapterMotionPreview(stage: StageConfig, parent: Node): void {
        const effect = this.chapterPreviewEffect(stage);
        const frames = this.routeCommitFrames(effect);
        // 预演复用战斗内已经验收的真实序列帧；缺帧时保留原缩略图，不生成程序化替代图形。
        if (frames.length !== 4) return;

        const node = new Node(`ChapterMotionPreview-${stage.mapId}`);
        node.layer = Layers.Enum.UI_2D;
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.RAW;
        sprite.spriteFrame = frames[0];
        const opacity = node.addComponent(UIOpacity);
        opacity.opacity = 0;
        const baseScale = 124 / Math.max(frames[0].originalSize.height, 1);
        node.setScale(baseScale * 0.88, baseScale * 0.88);
        parent.addChild(node);

        this.effects.push({
            node,
            elapsed: 0,
            life: 1.65,
            update: (progress) => {
                const motion = resolveChapterPreviewMotion(progress);
                sprite.spriteFrame = frames[motion.frameIndex];
                // 深墨竹影需要略高峰值才能在缩略图内被看见，其余章节保持更轻的水墨呼吸。
                const opacityMultiplier = effect === 'bamboo-shadow' ? 0.82 : 0.68;
                opacity.opacity = Math.round(255 * motion.opacity * opacityMultiplier);
                node.setScale(baseScale * motion.scale, baseScale * motion.scale);
            },
        });
    }

    private chapterRoutePreviewPlacements(effect: RouteCommitEffect): RouteCommitPlacement[] {
        if (effect === 'spring-flow') {
            return [0, 1, 2].flatMap((waveIndex) => {
                const position = qingshiSpiritVeinPosition('spring-detour', waveIndex);
                return position ? [{ ...position, diameter: 120 }] : [];
            });
        }
        return this.routeCommitPlacements(effect);
    }

    private projectRoutePlacementToChapterThumbnail(placement: RouteCommitPlacement): Vec2 {
        const x = (placement.x / Math.max(Math.abs(this.arena.left), this.arena.right)) * 58;
        const normalizedY = (placement.y - this.arena.bottom) / (this.arena.top - this.arena.bottom);
        return new Vec2(x, (normalizedY - 0.5) * 118);
    }

    private createRouteInkTrace(
        parent: Node,
        placements: readonly Vec2[],
        startY: number,
        endY: number,
        accent: Color,
        endpointSize: number,
        lineWidth: number,
        name: string,
    ): void {
        const route = buildRouteTrace(
            placements.map((point) => ({ x: point.x, y: point.y })),
            { x: 0, y: startY },
            { x: 0, y: endY },
        );
        const trace = new Node(name);
        trace.layer = Layers.Enum.UI_2D;
        const graphics = trace.addComponent(Graphics);
        parent.addChild(trace);

        const drawPath = (progress: number): void => {
            const visible = revealRouteTrace(route, progress);
            graphics.clear();
            if (visible.length < 2) return;
            const stroke = (width: number, alpha: number): void => {
                graphics.lineWidth = width;
                graphics.strokeColor = new Color(accent.r, accent.g, accent.b, alpha);
                graphics.moveTo(visible[0].x, visible[0].y);
                visible.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
                graphics.stroke();
            };
            stroke(lineWidth * 3.2, 38);
            stroke(lineWidth, 205);
        };
        drawPath(0);
        // 墨迹按“入境 → 真实落点 → 关底”逐段显现，复述路线方向但不改变任何正式选择状态。
        for (let step = 1; step <= 7; step += 1) {
            this.scheduleOnce(() => {
                if (!trace.isValid) return;
                drawPath(step / 7);
            }, step * 0.075);
        }

        const addEndpoint = (text: string, y: number): void => {
            const endpoint = this.makeRect(
                endpointSize,
                endpointSize,
                new Color(3, 18, 22, 242),
                new Color(accent.r, accent.g, accent.b, 220),
                endpointSize / 2,
                1.5,
            );
            endpoint.setPosition(0, y);
            const label = this.makeLabel(
                text,
                Math.max(9, Math.round(endpointSize * 0.42)),
                new Color('#FFF0BE'),
            );
            label.node.getComponent(UITransform)?.setContentSize(endpointSize - 2, endpointSize - 2);
            endpoint.addChild(label.node);
            parent.addChild(endpoint);
        };
        addEndpoint('入', startY);
        addEndpoint('魁', endY);
    }

    private createChapterRouteSpatialPreview(stage: StageConfig, parent: Node): void {
        const choice = mapEventScenarioFor(stage.mapId).choices.find(
            (candidate) => candidate.id === this.chapterBriefPreviewChoiceId,
        );
        if (!choice?.commitEffect) return;
        const effect = choice.commitEffect;
        const frames = this.routeCommitFrames(effect);
        // 缩略图沿用战场的真实帧表与真实坐标投影；缺帧时保留底图，避免用假标记误导路线落点。
        if (frames.length !== 4) return;

        const placements = this.chapterRoutePreviewPlacements(effect);
        const projectedPlacements = placements.map(
            (placement) => this.projectRoutePlacementToChapterThumbnail(placement),
        );
        this.createRouteInkTrace(
            parent,
            projectedPlacements,
            -48,
            50,
            new Color(MAP_EVENT_TONE_COLORS[choice.tone]),
            18,
            2,
            `ChapterRouteTrace-${effect}`,
        );
        const calm = this.isCalmRouteCommitEffect(effect);
        const markerHeight = placements.length >= 3
            ? calm ? 48 : 40
            : placements.length === 2
                ? 48
                : 66;
        placements.forEach((placement, index) => {
            const node = new Node(`ChapterRoutePlacement-${effect}-${index}`);
            node.layer = Layers.Enum.UI_2D;
            const position = projectedPlacements[index];
            node.setPosition(position.x, position.y);
            const sprite = node.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.RAW;
            sprite.spriteFrame = frames[0];
            const baseScale = markerHeight / Math.max(frames[0].originalSize.height, 1);
            node.setScale(baseScale * 0.82, baseScale * 0.82);
            const opacity = node.addComponent(UIOpacity);
            opacity.opacity = calm ? 235 : 225;
            parent.addChild(node);

            // 四帧完整播完后回到最清晰的峰值帧常驻，兼顾动作完整性与缩略图持续可读性。
            [1, 2, 3, 2].forEach((frameIndex, step) => {
                this.scheduleOnce(() => {
                    if (!node.isValid) return;
                    sprite.spriteFrame = frames[frameIndex];
                    const pulse = 0.88 + Math.min(step, 2) * 0.06;
                    node.setScale(baseScale * pulse, baseScale * pulse);
                }, 0.11 * (step + 1) + index * 0.04);
            });
        });

        const label = this.makeRect(
            132,
            24,
            new Color(3, 18, 21, 224),
            new Color(MAP_EVENT_TONE_COLORS[choice.tone]),
            8,
            1,
        );
        label.setPosition(0, -62);
        const labelText = this.makeLabel(choice.geometryPreview ?? choice.title, 10, new Color('#E8F4EF'));
        labelText.node.getComponent(UITransform)?.setContentSize(122, 20);
        label.addChild(labelText.node);
        parent.addChild(label);
    }

    private restoreStageProgress(): void {
        if (this.hasLocalQaFlag('qaJourneyFinal=1')) {
            // 终局验收只预置另外两章，当前青石首破仍走真实胜利落印，证明“三境归一”由本局触发。
            this.stageProgress.restore(JSON.stringify({
                'bamboo-ambush': { clears: 1, bestSeconds: 176.2, bestCombo: 18 },
                'frozen-ruins': { clears: 1, bestSeconds: 210, bestCombo: 14 },
            }));
            return;
        }
        if (this.hasLocalQaFlag('qaJourney=1')) {
            this.stageProgress.restore(JSON.stringify({
                'qingshi-road': { clears: 2, bestSeconds: 128.4, bestCombo: 27, routeChoices: ['read-the-scar'] },
                'bamboo-ambush': { clears: 1, bestSeconds: 176.2, bestCombo: 18, routeChoices: ['burn-the-grove'] },
                'frozen-ruins': { clears: 1, bestSeconds: 210, bestCombo: 14, routeChoices: ['seal-the-tide'] },
            }));
            return;
        }
        if (this.hasLocalQaFlag('qaProgress=1')) {
            this.stageProgress.restore(JSON.stringify({
                'qingshi-road': {
                    clears: 3,
                    bestSeconds: 128.4,
                    bestCombo: 27,
                    lastBuild: '太初剑匣 · 万剑归宗',
                    masteredPaths: ['edge'],
                },
                'bamboo-ambush': {
                    clears: 1,
                    bestSeconds: 176.2,
                    bestCombo: 18,
                    lastBuild: '九霄雷篆 · 术剑相引',
                    masteredPaths: [],
                },
            }));
            return;
        }
        try {
            this.stageProgress.restore(globalThis.localStorage?.getItem(STAGE_PROGRESS_STORAGE_KEY) ?? undefined);
        } catch {
            // 隐私模式或宿主禁用存储时只退化为单次会话，不阻断章节选择和战斗。
        }
    }

    private restoreSettings(): void {
        try {
            this.settings.restore(globalThis.localStorage?.getItem(GAME_SETTINGS_STORAGE_KEY) ?? undefined);
        } catch {
            // 设置存储不可用时继续使用系统默认值，首局和战斗不能依赖本地存储权限。
        }
        this.platformFeedback.configure(this.settings.snapshot());
    }

    private persistSettings(): void {
        this.platformFeedback.configure(this.settings.snapshot());
        this.platformFeedback.setAmbiencePaused(this.phase === 'paused');
        if (this.hasLocalQaFlag('qa')) return;
        try {
            globalThis.localStorage?.setItem(GAME_SETTINGS_STORAGE_KEY, this.settings.serialize());
        } catch {
            // 设置写入失败只影响跨会话记忆，当前会话的音频与动态偏好仍立即生效。
        }
    }

    private persistStageProgress(): void {
        if (this.hasLocalQaFlag('qa')) return;
        try {
            globalThis.localStorage?.setItem(STAGE_PROGRESS_STORAGE_KEY, this.stageProgress.serialize());
        } catch {
            // 存储失败不应改变胜利结算；玩家仍可在本次会话内看到刚写入的道印。
        }
    }

    private restoreBalanceTelemetry(): void {
        try {
            this.balanceTelemetry.restore(
                globalThis.localStorage?.getItem(BALANCE_TELEMETRY_STORAGE_KEY) ?? undefined,
            );
        } catch {
            // 平衡样本只服务调参；存储能力缺失时不能影响正式战斗或章节记录。
        }
    }

    private persistBalanceTelemetry(): void {
        if (this.hasLocalQaFlag('qa')) return;
        try {
            globalThis.localStorage?.setItem(
                BALANCE_TELEMETRY_STORAGE_KEY,
                this.balanceTelemetry.serialize(),
            );
        } catch {
            // 样本写入失败时保留当前会话统计，不向玩家展示存储错误。
        }
    }

    private startStage(stageIndex = this.selectedStageIndex): void {
        this.selectedStageIndex = Math.max(0, Math.min(STAGES.length - 1, stageIndex));
        this.platformFeedback.playCue('ui-confirm', this.selectedStageIndex);
        this.platformFeedback.setAmbience(this.currentStage.mapId);
        this.platformFeedback.setAmbiencePaused(false);
        this.applyStageVisual(false);
        const directBattlePreview = this.shouldStartBossPreview() || this.shouldStartElitePreview();
        this.phase = directBattlePreview ? 'playing' : 'stage-entry';
        this.lastStageVictory = undefined;
        this.clearOverlay();
        this.clearBattle();
        const metaBonuses = this.stageProgress.rewardBonuses();
        // 首破道印只在下一局初始化时应用，避免胜利结算瞬间修改本局战报中的气血与伤害。
        this.maxHp = 100 + metaBonuses.maxHp;
        this.hp = this.maxHp;
        this.moveSpeed = 235 + metaBonuses.moveSpeed;
        this.swordDamage = 18 + metaBonuses.swordDamage;
        this.swordCount = 1;
        this.attackInterval = 0.72;
        // QA 的第二波直达入口也必须保留真实战斗行为；Infinity 会让
        // updateAttacks() 永远提前返回，表现为敌人贴身后仍不自动御剑。
        this.attackTimer = 0;
        this.level = 1;
        this.xp = 0;
        this.xpNeed = 42;
        this.waveIndex = this.shouldStartBossPreview()
            ? this.currentStage.waves.length - 1
            : this.shouldStartElitePreview()
                ? 1
                : 0;
        this.spawned = 0;
        this.spawnTimer = this.currentStage.waves[this.waveIndex]?.danger ? 1.7 : 0.65;
        this.waveRestTimer = 0;
        this.waveFinished = false;
        this.playerAttackTimer = 0;
        this.playerHitTimer = 0;
        this.playerInvulnerableTimer = directBattlePreview
            ? Number.POSITIVE_INFINITY
            : 0;
        this.lastMoveDirection.set(0, 1);
        this.skills.reset();
        this.cultivationRerolls = 1;
        this.cultivationChoiceHistory = [];
        this.cultivationShield = 0;
        this.cultivationShieldMax = 0;
        this.cultivationRelicVolley = 0;
        this.cultivationMomentum = undefined;
        this.cultivationMomentumTimer = 0;
        this.recentUpgradeText = '';
        this.combatFlow.reset();
        this.mapEvent.begin(
            this.currentStage.mapId,
            this.hasLocalQaFlag('qaRouteHud=1') ? () => 0 : Math.random,
        );
        if (this.shouldStartBossPreview() && this.hasLocalQaFlag('qaBossReadiness=1')) {
            // 关底构筑验收直接建立一条已确认路线与真形道基，不经过事件弹层，避免截图时序被前置流程干扰。
            this.mapEvent.openForQa();
            this.mapEvent.resolve(
                mapEventScenarioFor(this.currentStage.mapId).choices[
                    this.hasLocalQaFlag('qaStableRoute=1') ? 1 : 0
                ].id,
            );
            ['seed-edge', 'returning-sword', 'sword-mark', 'split-sword'].forEach((id) => {
                this.skills.upgrade(id as UpgradeId);
            });
            this.swordCount = 5;
        }
        this.openingObjective.begin(this.currentStage.mapId);
        if (this.shouldStartElitePreview()) {
            // 第二波视觉验收只跳过首境，不复用或伪造开场目标；正式域名仍从第一波开始。
            this.openingObjective.reset();
        }
        this.eliteEncounter.begin(this.currentStage.mapId, this.waveIndex);
        this.eliteEncounterCompletionShown = false;
        this.openingObjectiveState = this.openingObjective.snapshot(this.openingObjectiveInput());
        // 入境层已经复述章节路线，正式首波直接把 HUD 交给可执行的场地动作；
        // 旧分岔记忆只保留本地回归入口，避免与首境目标竞争第一眼。
        this.chapterBranchMemoryTimer = this.shouldStartBossPreview()
            ? 0
            : this.hasLocalQaFlag('qaBranchMemory=1')
                ? Number.POSITIVE_INFINITY
                : 0;
        this.mapEventModifierWaveIndex = -1;
        this.mapEventAdvanceAfterChoice = false;
        this.runStats.reset();
        this.actions.reset();
        this.hitStop.reset();
        this.breakthroughImminent = false;
        this.breakthroughPulse = 0;
        this.spiritVein.reset();
        this.mapObstacles.reset();
        this.frostTide.reset();
        this.frostVelocity.set(0, 0);
        this.frostTidePlayerHitCycle = -1;
        this.frostTideEnemyHitCycle = -1;
        this.frostTideEnemyHits.clear();
        this.cameraShakeTimer = 0;
        this.createPlayer();
        this.createMapObstacles();
        this.createStageHazards();
        this.openingObjectiveState = this.openingObjective.snapshot(this.openingObjectiveInput());
        this.createHud();
        this.setupWaveArena();
        this.createSpiritVeinForWave();
        this.createOpeningObjectiveMarker();
        // 正式首境先冻结计时、输入与刷怪，让章节身份和路线方向成立后再交权；
        // 首领直达回归仍跳过该状态，避免测试入口把二相目标误判为章节开场。
        if (this.phase === 'stage-entry') {
            if (
                this.hasLocalQaFlag('qaTutorial=1')
                || (!this.settings.snapshot().tutorialCompleted && !this.hasLocalQaFlag('qa'))
            ) {
                this.showFirstRunTutorial();
            } else {
                this.showStageEntry();
            }
        } else if (!this.hasLocalQaFlag('qaBossPhase=2')) {
            this.showWaveAnnouncement();
        }
        if (this.hasLocalQaFlag('qaRouteHud=1')) {
            // 固定首境分岔并暂停刷怪，便于检查 HUD 预告而不被升级页或随机触发时机打断。
            this.spawnTimer = Number.POSITIVE_INFINITY;
        }
        if (this.hasLocalQaFlag('qaCultivationHistory=1')) {
            // 累计进化验收使用真实确认路径写入三次选择，再直达修行卷检查历史、阶数与叠加结果。
            this.phase = 'playing';
            this.clearOverlay();
            this.applyUpgrade('formation');
            this.applyUpgrade('tribulation');
            this.applyUpgrade('dash');
            this.updateHud();
            this.showUpgradeHistorySummary();
            this.showCultivationSheet();
        } else if (this.hasLocalQaFlag('qaCultivationAura=1')) {
            // 固定在锋芒共鸣后的可玩战场，便于核对本命法宝光效与常驻面板，不弹出选择层。
            this.skills.upgrade('sword');
            this.skills.upgrade('sword');
            this.level = 4;
            this.refreshPlayerAura();
            this.updateHud();
        } else if (this.hasLocalQaFlag('qaCultivationGoal=1')) {
            // 固定展示强反馈退场后的下一成形目标，不刷怪、不追加第二次破境。
            this.phase = 'playing';
            this.clearOverlay();
            this.applyUpgrade('sword');
            this.spawnTimer = Number.POSITIVE_INFINITY;
            this.showUpgradeHistorySummary();
            this.updateHud();
        } else if (this.hasLocalQaFlag('qaUpgradeAdvanced=1')) {
            // 后续破境专门验收等级徽章与观星；先走一次真实结算，再打开三槽命盘。
            this.phase = 'playing';
            this.clearOverlay();
            this.applyUpgrade('sword');
            this.level = 3;
            this.showUpgrade();
        } else if (this.hasLocalQaFlag('qaCombo=1')) {
            this.phase = 'playing';
            for (let index = 0; index < 12; index += 1) this.combatFlow.recordKill();
            this.runStats.recordCombatFlow(12, 2);
            this.updateHud();
        } else if (this.hasLocalQaFlag('qaCultivation=1')) {
            // 休闲版视觉验收固定在第一次破境；保留三只真实波次敌人，
            // 让升级特效的作用对象和实战层次在暂停界面里也能被直接看懂。
            const qaWave = this.currentStage.waves[0];
            const qaEnemyPositions = [
                new Vec3(-148, 286),
                new Vec3(142, 274),
                new Vec3(18, 414),
            ];
            qaEnemyPositions.forEach((position) => {
                this.spawnEnemy(qaWave);
                this.spawned += 1;
                this.enemies[this.enemies.length - 1]?.node.setPosition(position);
            });
            this.level = 2;
            this.showUpgrade();
        } else if (this.hasLocalQaFlag('qaUpgrade=1')) {
            // 视觉回归需要稳定进入同一破境状态；仅本地地址识别，线上流程与数值不受影响。
            this.level = 2;
            this.showUpgrade();
        }
        if (
            this.hasLocalQaFlag('qaEventPrelude=1')
            || this.hasLocalQaFlag('qaEventPreludeAuto=1')
        ) {
            // 前奏可固定在双落点峰值，或按正式节奏自动进入奇遇页；两个入口都只对本地地址生效。
            this.showMapEventPrelude(
                false,
                true,
                this.hasLocalQaFlag('qaEventPrelude=1'),
            );
        } else if (this.hasLocalQaFlag('qaEvent=1')) {
            // 地图奇遇使用独立本地入口，首屏即可检查三章文案、卡片与选择反馈。
            this.showMapEvent(false, true);
        }
        if (
            !this.qaResultConsumed
            && (this.hasLocalQaFlag('qaVictory=1') || this.hasLocalQaFlag('qaDefeat=1'))
        ) {
            // 结算页视觉回归使用固定构筑，避免随机升级导致前后截图无法逐项比较。
            const qaVictory = this.hasLocalQaFlag('qaVictory=1');
            this.qaResultConsumed = true;
            this.level = 6;
            this.waveIndex = qaVictory ? this.currentStage.waves.length - 1 : 2;
            if (!qaVictory) this.hp = 0;
            ['sword', 'dash', 'formation', 'tribulation', 'damage', 'guard'].forEach((id) => {
                this.skills.upgrade(id as UpgradeId);
            });
            const qaEventChoice = mapEventScenarioFor(this.currentStage.mapId).choices[
                this.hasLocalQaFlag('qaStableRoute=1') ? 1 : 0
            ];
            this.runStats.restoreForQa({
                elapsedSeconds: 148,
                enemiesDefeated: qaVictory ? 23 : 15,
                damageDealt: qaVictory ? 2864 : 1792,
                damageTaken: 37,
                spiritVeinsClaimed: 3,
                obstaclesBroken: this.currentStage.mapId === 'bamboo-ambush' ? 2 : 0,
                tideEnemyHits: this.currentStage.mapId === 'frozen-ruins' ? 9 : 0,
                bestCombo: 18,
                peakFlowTier: 2,
                mapEvent: this.hasLocalQaFlag('qaNoEvent=1')
                    ? undefined
                    : {
                        choiceId: qaEventChoice.id,
                        title: qaEventChoice.title,
                        role: qaEventChoice.role,
                        geometryPreview: qaEventChoice.geometryPreview ?? qaEventChoice.title,
                        commitLine: qaEventChoice.commitLine,
                        commitEffect: qaEventChoice.commitEffect,
                        outcome: qaEventChoice.outcome,
                        tone: qaEventChoice.tone,
                        iconResourcePath: qaEventChoice.iconResourcePath,
                    },
            });
            if (qaVictory && this.hasLocalQaFlag('qaReplayGoal=1')) {
                // 先写入同一路线的一次旧胜利，使本次 QA 战报稳定进入“改走另一途”的重复通关分支。
                this.stageProgress.recordVictory(this.currentStage.mapId, 172, {
                    bestCombo: 14,
                    routeChoiceId: qaEventChoice.id,
                });
            }
            this.finish(qaVictory);
            if (this.hasLocalQaFlag('qaRouteReplay=1')) {
                this.showResultRouteReplay(this.runStats.snapshot());
            }
        }
        if (this.currentStage.mapId === 'frozen-ruins') {
            const revealFrostHint = (): void => {
                if (this.phase !== 'playing') return;
                this.createWorldHint('冰面有惯性 · 寒潮亦可伤敌', this.player.position, new Color('#BCEFF5'));
            };
            if (this.phase === 'stage-entry') {
                this.scheduleOnce(revealFrostHint, STAGE_ENTRY_DURATION + 0.08);
            } else {
                revealFrostHint();
            }
        }
    }

    private hasLocalQaFlag(flag: string): boolean {
        const browserLocation = (globalThis as {
            location?: { hostname?: string; search?: string };
        }).location;
        const localHost = browserLocation?.hostname === '127.0.0.1' || browserLocation?.hostname === 'localhost';
        return Boolean(localHost && browserLocation?.search?.includes(flag));
    }

    private shouldStartBossPreview(): boolean {
        // 本地视觉验收可直接进入关底，正式域名即使携带参数也不会跳过正常波次。
        return this.hasLocalQaFlag('qaBoss=1');
    }

    private shouldStartElitePreview(): boolean {
        // 固定第二波用于三章同状态对照，并给玩家无敌以避免截图期间被随机接触伤害打断。
        return this.hasLocalQaFlag('qaElite=1');
    }

    private createPlayer(): void {
        this.player = new Node('QingLan');
        this.player.layer = Layers.Enum.UI_2D;
        const unit = this.attachUnitVisual(this.player, PLAYER_ASSET, 27);
        this.playerVisual = unit.visual;
        this.playerSprite = this.playerVisual.getComponent(Sprite) ?? undefined;
        this.playerBaseScale = unit.baseScale;
        this.playerAnimationFrameIndex = -1;
        this.installPlayerAnimation();
        this.player.setPosition(0, -260);
        this.battleLayer.addChild(this.player);
        this.createPlayerAura();
    }

    private createMapObstacles(): void {
        this.obstacleVisuals.clear();
        if (this.currentStage.mapId !== 'bamboo-ambush') {
            this.mapObstacles.reset();
            return;
        }
        this.mapObstacles.begin(bambooObstacleSpecs());
        for (const obstacle of this.mapObstacles.list()) this.createMapObstacleVisual(obstacle);
    }

    private applyBambooRouteGeometry(route: BambooRouteGeometry): void {
        if (this.currentStage.mapId !== 'bamboo-ambush') return;
        // 路线选择会重建后续战场：焚竹清空通路，入影则用三段真实竹障形成可绕可破的夹道。
        this.clearMapObstacles();
        this.mapObstacles.begin(bambooObstacleSpecs(route));
        for (const obstacle of this.mapObstacles.list()) this.createMapObstacleVisual(obstacle);
    }

    private createStageHazards(): void {
        if (this.qingshiRouteVisual?.isValid) this.qingshiRouteVisual.destroy();
        this.qingshiRouteVisual = undefined;
        if (this.frostTideVisual?.node.isValid) this.frostTideVisual.node.destroy();
        this.frostTideVisual = undefined;
        if (this.frostRouteVisual?.isValid) this.frostRouteVisual.destroy();
        this.frostRouteVisual = undefined;
        if (this.currentStage.mapId !== 'frozen-ruins') return;

        const node = new Node('FrostTide');
        node.layer = Layers.Enum.UI_2D;
        const opacity = node.addComponent(UIOpacity);
        const graphics = node.addComponent(Graphics);
        this.battleLayer.addChild(node);
        node.setSiblingIndex(0);
        this.frostTideVisual = { node, graphics, opacity };
        // 寒潮节点常驻但只在预警与横渡阶段绘制，避免每个周期反复创建销毁节点。
        this.drawFrostTide();
    }

    private applyQingshiRouteGeometry(route: QingshiRouteGeometry): void {
        if (this.currentStage.mapId !== 'qingshi-road') return;
        if (this.qingshiRouteVisual?.isValid) this.qingshiRouteVisual.destroy();
        this.qingshiRouteVisual = undefined;

        const accent = new Color(route === 'sword-stele-array' ? '#F0C879' : '#82D7AC');
        if (route === 'sword-stele-array') {
            // 剑碑阵接管本章原有阵眼职责；移除旧剑脉，避免场上出现第四个同图标圆环误导数量。
            if (this.spiritVeinVisual?.node.isValid) this.spiritVeinVisual.node.destroy();
            this.spiritVeinVisual = undefined;
            this.spiritVein.reset();
            const field = new Node('QingshiSwordSteleArray');
            field.layer = Layers.Enum.UI_2D;
            // 三座剑碑沿道路纵向错位，让追兵必须穿过至少一个增伤圈，而不是只增加 HUD 数值。
            for (const marker of qingshiRouteMarkers(route)) {
                const node = new Node(`SwordStele-${marker.id}`);
                node.layer = Layers.Enum.UI_2D;
                node.setPosition(marker.x, marker.y);
                const ring = node.addComponent(Graphics);
                ring.fillColor = new Color(accent.r, accent.g, accent.b, 26);
                ring.circle(0, 0, marker.radius);
                ring.fill();
                ring.strokeColor = new Color(accent.r, accent.g, accent.b, 178);
                ring.lineWidth = 2.5;
                ring.circle(0, 0, marker.radius);
                ring.stroke();
                ring.strokeColor = new Color(255, 244, 205, 76);
                ring.lineWidth = 1;
                ring.circle(0, 0, marker.radius - 10);
                ring.stroke();
                const icon = this.createResourceSprite(
                    'art/relics/xianxia-relics_00/spriteFrame',
                    40,
                );
                icon.setPosition(0, 4);
                node.addChild(icon);
                field.addChild(node);
            }
            const label = this.makeLabel('三碑试锋 · 敌入碑阵承伤 +35%', 14, new Color('#FFF0C2'));
            label.node.setPosition(0, -174);
            label.node.getComponent(UITransform)?.setContentSize(300, 28);
            field.addChild(label.node);
            this.battleLayer.addChild(field);
            field.setSiblingIndex(0);
            this.qingshiRouteVisual = field;
        } else if (!this.mapEventAdvanceAfterChoice) {
            // QA 与当前波选择要立即把阵眼移到侧路；正常波间选择会由下一波创建新的灵泉。
            this.createSpiritVeinForWave();
        }

    }

    private applyFrostRouteGeometry(route: FrostRouteGeometry): void {
        if (this.currentStage.mapId !== 'frozen-ruins') return;
        if (this.frostRouteVisual?.isValid) this.frostRouteVisual.destroy();

        const marker = frostRouteMarker(route);
        const accent = new Color(route === 'tide-convergence' ? '#72DDE8' : '#82D7AC');
        const node = new Node(route === 'tide-convergence' ? 'TideConvergenceAltar' : 'SealedSanctuary');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(marker.x, marker.y);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(accent.r, accent.g, accent.b, route === 'tide-convergence' ? 30 : 38);
        graphics.circle(0, 0, marker.radius);
        graphics.fill();
        graphics.strokeColor = new Color(accent.r, accent.g, accent.b, 195);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, marker.radius);
        graphics.stroke();
        graphics.strokeColor = new Color(232, 248, 244, 90);
        graphics.lineWidth = 1.5;
        graphics.circle(0, 0, marker.radius - 12);
        graphics.stroke();
        const iconPath = route === 'tide-convergence'
            ? 'art/relics/xianxia-relics_05/spriteFrame'
            : 'art/relics/xianxia-relics_04/spriteFrame';
        const icon = this.createResourceSprite(iconPath, 46);
        icon.setPosition(0, 8);
        node.addChild(icon);
        const label = this.makeLabel(marker.label, 14, new Color('#DDF7F1'));
        // 结界落在玩家初始站位左侧，标签上置，避免法宝图标和文字被角色身体遮住。
        label.node.setPosition(0, route === 'tide-convergence' ? -58 : 68);
        label.node.getComponent(UITransform)?.setContentSize(190, 26);
        node.addChild(label.node);
        this.battleLayer.addChild(node);
        node.setSiblingIndex(0);
        this.frostRouteVisual = node;

        // 借潮路线在确认后立即进入一秒预警，让玩家看见“主动引潮”而不是等待下一轮随机发生。
        if (route === 'tide-convergence') this.frostTide.triggerWarning();
    }

    private createMapObstacleVisual(obstacle: MapObstacleState): void {
        const node = new Node(`BambooBarrier-${obstacle.id}`);
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(obstacle.x, obstacle.y);
        const opacity = node.addComponent(UIOpacity);

        const shadow = new Node('BarrierShadow');
        shadow.layer = Layers.Enum.UI_2D;
        shadow.setPosition(0, -19);
        shadow.setScale(1.65, 0.28);
        const shadowGraphics = shadow.addComponent(Graphics);
        shadowGraphics.fillColor = new Color(2, 8, 10, 125);
        shadowGraphics.circle(0, 0, 66);
        shadowGraphics.fill();
        node.addChild(shadow);

        const sprite = this.createResourceSprite(BAMBOO_BARRICADE_ASSET.resourcePath, 104);
        sprite.name = 'BambooBarrierSprite';
        node.addChild(sprite);
        const label = this.makeLabel('可破坏 · 竹障', 14, new Color('#D8F3E2'));
        label.node.setPosition(0, -58);
        label.node.getComponent(UITransform)?.setContentSize(150, 26);
        node.addChild(label.node);

        const hpNode = new Node('BarrierHp');
        hpNode.layer = Layers.Enum.UI_2D;
        hpNode.setPosition(0, 54);
        const hpBar = hpNode.addComponent(Graphics);
        node.addChild(hpNode);

        // 竹障是带碰撞和耐久的地图实体，图片只负责外观，伤害与通路状态由纯规则对象维护。
        this.battleLayer.addChild(node);
        node.setSiblingIndex(0);
        this.obstacleVisuals.set(obstacle.id, { node, hpBar, opacity });
        this.drawMapObstacle(obstacle);
    }

    private drawMapObstacle(obstacle: MapObstacleState): void {
        const visual = this.obstacleVisuals.get(obstacle.id);
        if (!visual?.node.isValid) return;
        const ratio = Math.max(0, obstacle.hp / obstacle.maxHp);
        visual.hpBar.clear();
        visual.hpBar.fillColor = new Color(2, 10, 12, 220);
        visual.hpBar.roundRect(-72, -5, 144, 10, 5);
        visual.hpBar.fill();
        visual.hpBar.fillColor = new Color(ratio < 0.35 ? '#E08A62' : '#79C89B');
        visual.hpBar.roundRect(-70, -3, 140 * ratio, 6, 3);
        visual.hpBar.fill();
    }

    private damageMapObstacle(obstacle: MapObstacleState, damage: number): void {
        const result = this.mapObstacles.damage(obstacle.id, damage);
        if (!result.hit) return;
        this.drawMapObstacle(obstacle);
        this.createHitBurst(new Vec3(obstacle.x, obstacle.y), new Color('#B7E4C7'), 42, true);
        this.createDamageNumber(new Vec3(obstacle.x, obstacle.y + 20), Math.round(damage), 'normal');
        if (!result.destroyed) return;

        // 绕开竹障更安全，主动击破则返还修为与劫力，让地图机关形成明确的风险—收益选择。
        this.runStats.recordObstacleBroken();
        this.gainXp(12);
        this.skills.addTribulationCharge(0.18);
        this.createWorldHint('破竹得灵 · 修为 +12', new Vec3(obstacle.x, obstacle.y), new Color('#D9F99D'));

        const visual = this.obstacleVisuals.get(obstacle.id);
        if (visual?.node.isValid) {
            const startY = visual.node.position.y;
            this.effects.push({
                node: visual.node,
                elapsed: 0,
                life: 0.48,
                update: (progress) => {
                    visual.node.setPosition(obstacle.x, startY - progress * 22);
                    visual.node.setScale(1 + progress * 0.18, Math.max(0.08, 1 - progress * 0.84));
                    visual.opacity.opacity = Math.round(255 * (1 - progress));
                },
            });
        }
        this.createDeathBurst(new Vec3(obstacle.x, obstacle.y), 68);
        this.createAbilityHint('竹障已破 · 通路开启', new Color('#BBF7D0'));
        this.cameraShakeTimer = 0.22;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 8);
    }

    private damageMapObstaclesInRadius(position: Readonly<Vec3>, radius: number, damage: number): void {
        for (const obstacle of this.mapObstacles.list()) {
            if (obstacle.destroyed) continue;
            const obstacleRadius = Math.max(obstacle.width, obstacle.height) * 0.42;
            if (Math.hypot(position.x - obstacle.x, position.y - obstacle.y) > radius + obstacleRadius) continue;
            this.damageMapObstacle(obstacle, damage);
        }
    }

    private setupWaveArena(): void {
        if (this.bossArenaVisual?.isValid) this.bossArenaVisual.destroy();
        this.bossArenaVisual = undefined;
        const wave = this.currentStage.waves[this.waveIndex];
        this.bossArenaActive = wave?.arena === 'boss-clearing';
        if (!this.bossArenaActive) return;

        this.clearMapObstacles();
        const frozen = this.currentStage.mapId === 'frozen-ruins';
        const node = new Node(frozen ? 'FrozenBossBasin' : 'BambooBossClearing');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(0, 260);
        const g = node.addComponent(Graphics);
        g.fillColor = frozen ? new Color(74, 171, 194, 24) : new Color(28, 84, 67, 24);
        g.circle(0, 0, 246);
        g.fill();
        g.strokeColor = frozen ? new Color(133, 220, 233, 155) : new Color(142, 212, 168, 135);
        g.lineWidth = 4;
        g.circle(0, 0, 246);
        g.stroke();
        g.strokeColor = new Color(236, 196, 111, 90);
        g.lineWidth = 2;
        g.circle(0, 0, 226);
        g.stroke();
        const label = this.makeLabel(frozen ? '寒 渊 祭 坛' : '竹 心 封 界', 17, new Color(frozen ? '#BCEFF5' : '#F7D996'));
        label.node.setPosition(0, -214);
        node.addChild(label.node);
        this.battleLayer.addChild(node);
        node.setSiblingIndex(0);
        this.bossArenaVisual = node;
        if (this.player?.isValid) {
            this.player.setPosition(0, 58);
            // 连战进入关底时提供固定保底回息，避免上一波残血让首领独立机制来不及出现。
            const recoveredHp = Math.max(this.hp, Math.round(this.maxHp * 0.55));
            if (recoveredHp > this.hp) {
                this.hp = recoveredHp;
                this.createWorldHint(
                    frozen ? '寒坛回息 · 气血稳固' : '竹心回息 · 气血稳固',
                    this.player.position,
                    new Color(frozen ? '#C9F8FF' : '#D9F99D'),
                );
            }
            this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 1.1);
        }
    }

    private clearMapObstacles(): void {
        this.mapObstacles.reset();
        for (const visual of this.obstacleVisuals.values()) {
            if (visual.node.isValid) visual.node.destroy();
        }
        this.obstacleVisuals.clear();
    }

    private createSpiritVeinForWave(): void {
        const wave = this.currentStage.waves[this.waveIndex];
        if (!wave) return;
        if (this.spiritVeinVisual?.node.isValid) this.spiritVeinVisual.node.destroy();
        const qingshiRoute = this.currentStage.mapId === 'qingshi-road'
            ? this.mapEvent.choice()?.effect.qingshiRoute
            : undefined;
        if (qingshiRoute === 'sword-stele-array') {
            // 悟痕路线用三碑增伤替代逐波驻足阵眼，后续波次不能重新生成第四个剑脉圆环。
            this.spiritVein.reset();
            this.spiritVeinVisual = undefined;
            return;
        }
        const veinKind = qingshiSpiritVeinKind(qingshiRoute, wave.spiritVein);
        this.spiritVein.begin(veinKind);

        const positions = [
            new Vec3(-118, 70),
            new Vec3(122, -42),
            new Vec3(-96, 168),
            new Vec3(0, 210),
        ];
        const routePosition = qingshiSpiritVeinPosition(qingshiRoute, this.waveIndex);
        const preferred = this.bossArenaActive
            ? new Vec3(-105, 235)
            : routePosition
                ? new Vec3(routePosition.x, routePosition.y)
                : positions[this.waveIndex] ?? new Vec3(0, 80);
        const position = this.constrainToRoad(preferred, 54);
        const node = new Node(`SpiritVein-${veinKind}`);
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const ring = node.addComponent(Graphics);

        const iconPath = veinKind === 'sword'
            ? 'art/relics/xianxia-relics_00/spriteFrame'
            : 'art/relics/xianxia-relics_19/spriteFrame';
        const icon = this.createResourceSprite(iconPath, 58);
        icon.setPosition(0, 7);
        node.addChild(icon);

        const plate = this.makeRect(
            176,
            34,
            new Color(3, 18, 22, 218),
            new Color(veinKind === 'sword' ? '#F2CF7B' : '#79DDB2'),
            12,
            1.5,
        );
        plate.setPosition(0, -70);
        const label = this.makeLabel('', 16, new Color('#F2FFF9'));
        label.node.getComponent(UITransform)?.setContentSize(166, 30);
        plate.addChild(label.node);
        node.addChild(plate);

        // 阵眼放在真实道路轮廓内，并使用现有法宝资源作地标，给走位提供明确的争夺目标。
        this.battleLayer.addChild(node);
        node.setSiblingIndex(0);
        this.spiritVeinVisual = { node, ring, label };
        this.drawSpiritVein();
    }

    private openingObjectiveInput(): OpeningObjectiveInput {
        const frostState = this.frostTide.snapshot();
        return {
            spiritVeinProgress: this.spiritVein.captureProgress,
            spiritVeinClaimed: this.spiritVein.claimed,
            obstaclesRemaining: this.mapObstacles.activeCount(),
            frostTidePhase: frostState.phase,
            frostTideCycle: frostState.cycle,
            frostSecondsToSurge: frostState.secondsToSurge,
            frostPlayerHitCycle: this.frostTidePlayerHitCycle,
        };
    }

    private createOpeningObjectiveMarker(): void {
        if (this.waveIndex !== 0 || this.shouldStartBossPreview()) return;
        if (this.openingObjectiveVisual?.node.isValid) this.openingObjectiveVisual.node.destroy();
        this.openingObjectiveVisual = undefined;
        const presentation = openingObjectivePresentationFor(this.currentStage.mapId);
        const frames = presentation.markerEffect === 'qingshi-stele'
            ? this.qingshiSteleCommitAnimationFrames
            : presentation.markerEffect === 'bamboo-burn'
                ? this.bambooBurnCommitAnimationFrames
                : this.frostSealCommitAnimationFrames;
        // 首境地标必须复用已验收的真实场地序列帧；资源未就绪时保留 HUD 和原机关，不生成替代图形。
        if (frames.length !== 4) return;

        const node = new Node(`OpeningObjective-${presentation.markerEffect}`);
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(presentation.markerPosition.x, presentation.markerPosition.y);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.RAW;
        sprite.spriteFrame = frames[0];
        const opacity = node.addComponent(UIOpacity);
        opacity.opacity = 0;
        const original = frames[0].originalSize;
        const baseScale = presentation.markerDiameter / Math.max(original.width, original.height, 1);
        node.setScale(baseScale, baseScale);
        this.battleLayer.addChild(node);
        // 剑脉特效继续垫在阵眼图标下；竹障与封脉圈需要盖在地形上方，否则会被实体素材完全遮住。
        if (presentation.markerEffect === 'qingshi-stele') node.setSiblingIndex(0);
        this.openingObjectiveVisual = { node, sprite, opacity, frames, baseScale };
    }

    private updateOpeningObjective(dt: number): void {
        if (this.waveIndex !== 0) return;
        this.openingObjectiveState = this.openingObjective.tick(dt, this.openingObjectiveInput());
        const visual = this.openingObjectiveVisual;
        if (!this.openingObjectiveState.visible) {
            if (visual?.node.isValid) visual.node.destroy();
            this.openingObjectiveVisual = undefined;
            return;
        }
        if (!visual?.node.isValid) return;
        if (this.prefersReducedMotion) {
            // 减少动态模式保留真实落点和可见状态，但不循环换帧或脉冲缩放。
            visual.sprite.spriteFrame = visual.frames[visual.frames.length - 1];
            visual.opacity.opacity = 170;
            visual.node.setScale(visual.baseScale, visual.baseScale);
            return;
        }
        const pulse = (Math.sin(this.elapsed * 4.6) + 1) / 2;
        const active = this.openingObjectiveState.outcome === 'active';
        const frameIndex = active
            ? Math.floor(this.elapsed * 6) % visual.frames.length
            : visual.frames.length - 1;
        visual.sprite.spriteFrame = visual.frames[frameIndex];
        const markerBoost = this.currentStage.mapId === 'bamboo-ambush' ? 45 : 0;
        visual.opacity.opacity = Math.min(
            235,
            Math.round((active ? 105 : 150) + markerBoost + pulse * (active ? 65 : 30)),
        );
        const scale = visual.baseScale * (0.96 + pulse * 0.08);
        visual.node.setScale(scale, scale);
    }

    private isInOpeningFrostSanctuary(): boolean {
        if (!this.openingObjective.isFrostSanctuaryActive()) return false;
        const marker = openingObjectivePresentationFor('frozen-ruins');
        return Math.hypot(
            this.player.position.x - marker.markerPosition.x,
            this.player.position.y - marker.markerPosition.y,
        ) <= marker.markerDiameter / 2;
    }

    private clearOpeningObjective(): void {
        this.openingObjective.reset();
        this.openingObjectiveState = undefined;
        if (this.openingObjectiveVisual?.node.isValid) this.openingObjectiveVisual.node.destroy();
        this.openingObjectiveVisual = undefined;
    }

    private updateSpiritVein(dt: number): void {
        const visual = this.spiritVeinVisual;
        if (!visual?.node.isValid || !this.player?.isValid) return;
        const inRange = Vec3.distance(this.player.position, visual.node.position) <= 82;
        const result = this.spiritVein.tick(dt, inRange);
        if (result.claimed) {
            this.runStats.recordSpiritVeinClaimed();
            const swordVein = this.spiritVein.kind === 'sword';
            this.createAbilityHint(
                swordVein ? '剑脉共鸣 · 剑伤提升' : '灵泉共鸣 · 持续回气',
                new Color(swordVein ? '#FDE68A' : '#A7F3D0'),
            );
            this.createSpiritVeinClaimPulse(
                visual.node.position,
                new Color(
                    swordVein ? 240 : 110,
                    swordVein ? 201 : 231,
                    swordVein ? 107 : 183,
                    170,
                ),
            );
            this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.35);
        }
        const regen = this.spiritVein.vitalityRegenPerSecond(this.maxHp);
        if (regen > 0) this.hp = Math.min(this.maxHp, this.hp + regen * dt);
        this.drawSpiritVein();
    }

    private drawSpiritVein(): void {
        const visual = this.spiritVeinVisual;
        if (!visual?.node.isValid) return;
        const swordVein = this.spiritVein.kind === 'sword';
        const accent = swordVein ? new Color('#F2CF7B') : new Color('#79DDB2');
        const pulse = 1 + Math.sin(this.elapsed * 3.4) * 0.04;
        visual.node.setScale(pulse, pulse);
        visual.ring.clear();
        visual.ring.fillColor = swordVein
            ? new Color(242, 207, 123, this.spiritVein.claimed ? 42 : 24)
            : new Color(121, 221, 178, this.spiritVein.claimed ? 42 : 24);
        visual.ring.circle(0, 0, 54);
        visual.ring.fill();
        visual.ring.strokeColor = new Color(accent.r, accent.g, accent.b, 105);
        visual.ring.lineWidth = 2;
        visual.ring.circle(0, 0, 54);
        visual.ring.stroke();
        visual.ring.strokeColor = new Color(accent.r, accent.g, accent.b, 238);
        visual.ring.lineWidth = 6;
        const progress = this.spiritVein.claimed ? 1 : this.spiritVein.captureProgress;
        visual.ring.arc(0, 0, 47, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
        visual.ring.stroke();
        visual.label.string = this.spiritVein.claimed
            ? `${swordVein ? '剑脉' : '灵泉'} ${this.spiritVein.buffTimer.toFixed(1)}秒`
            : `驻足引灵 ${Math.round(progress * 100)}%`;
    }

    private currentSwordDamage(): number {
        const momentumMultiplier = this.cultivationMomentumTimer > 0
            ? this.cultivationMomentum?.damageMultiplier ?? 1
            : 1;
        return this.swordDamage
            * this.spiritVein.damageMultiplier()
            * momentumMultiplier
            * this.combatFlow.snapshot().damageMultiplier;
    }

    private currentAttackInterval(): number {
        const momentumMultiplier = this.cultivationMomentumTimer > 0
            ? this.cultivationMomentum?.attackIntervalMultiplier ?? 1
            : 1;
        return Math.max(0.2, this.attackInterval * momentumMultiplier);
    }

    private cultivationVisualTone(): { color: Color; tier: number } {
        const build = resolveCultivationBuild((id) => this.skills.getLevel(id));
        return {
            color: new Color(build.path ? UPGRADE_PATH_COLORS[build.path] : '#7DD3FC'),
            tier: build.tier,
        };
    }

    private createHud(): void {
        const hud = new Node('HUD');
        hud.layer = Layers.Enum.UI_2D;
        this.canvas.addChild(hud);
        const visibleWidth = this.visibleDesignWidth();

        const backing = this.makeRect(this.visibleDesignWidth(), 116, new Color(3, 16, 20, 72), new Color(91, 151, 137, 48), 0, 1);
        backing.name = 'HudBacking';
        backing.setPosition(0, 609);
        hud.addChild(backing);

        // 破境预警环画在头像底下：临近破境时整个头像会开始呼吸，余光就能看见。
        const breakthroughRingNode = new Node('BreakthroughRing');
        breakthroughRingNode.layer = Layers.Enum.UI_2D;
        breakthroughRingNode.setPosition(-252, 608);
        this.breakthroughRing = breakthroughRingNode.addComponent(Graphics);
        hud.addChild(breakthroughRingNode);

        const portrait = this.createResourceSprite(
            HUD_PORTRAIT_ASSET.resourcePath,
            96,
        );
        portrait.setPosition(-252, 608);
        hud.addChild(portrait);

        // 修行卷入口挂在头像上：它在战场上边界之外，不会像旧的构筑面板那样吃掉点地移动。
        const sheetEntry = new Node('CultivationSheetEntry');
        sheetEntry.layer = Layers.Enum.UI_2D;
        sheetEntry.addComponent(UITransform).setContentSize(112, 112);
        sheetEntry.setPosition(-252, 608);
        sheetEntry.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            if (this.phase === 'playing') this.showCultivationSheet();
        });
        hud.addChild(sheetEntry);

        const hpBarNode = new Node('HpBar');
        hpBarNode.layer = Layers.Enum.UI_2D;
        hpBarNode.setPosition(-118, 597);
        this.hpBar = hpBarNode.addComponent(Graphics);
        hud.addChild(hpBarNode);

        // 修为条是升级快感的期待载体，必须常驻可见：玩家要能看着它涨满。
        const xpBarNode = new Node('XpBar');
        xpBarNode.layer = Layers.Enum.UI_2D;
        xpBarNode.setPosition(-118, 572);
        this.xpBar = xpBarNode.addComponent(Graphics);
        hud.addChild(xpBarNode);

        this.hpLabel = this.makeLabel('', 22, new Color('#FFE3D5'));
        this.hpLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.hpLabel.node.setPosition(-118, 624);
        this.hpLabel.node.getComponent(UITransform)?.setContentSize(232, 42);
        hud.addChild(this.hpLabel.node);
        this.xpLabel = this.makeLabel('', 16, new Color('#D9FBEC'));
        this.xpLabel.node.setPosition(-118, 572);
        this.xpLabel.node.getComponent(UITransform)?.setContentSize(232, 24);
        hud.addChild(this.xpLabel.node);

        const waveCrest = this.createResourceSprite(
            WAVE_CREST_ASSET.resourcePath,
            88,
        );
        waveCrest.setPosition(0, 606);
        hud.addChild(waveCrest);
        this.waveLabel = this.makeLabel('', 23, new Color('#FFE8A6'));
        this.waveLabel.node.setPosition(0, 606);
        this.waveLabel.node.getComponent(UITransform)?.setContentSize(188, 82);
        hud.addChild(this.waveLabel.node);

        const pauseButton = this.makeCompactButton('暂 停', () => this.showPauseMenu(), 94, 46);
        pauseButton.name = 'PauseAction';
        pauseButton.setPosition(visibleWidth / 2 - 58, 611);
        hud.addChild(pauseButton);

        const objectiveWidth = Math.min(620, visibleWidth - 24);
        this.objectiveBacking = this.makeRect(
            objectiveWidth,
            52,
            new Color(3, 18, 22, 150),
            new Color(105, 205, 177, 112),
            18,
            2,
        );
        this.objectiveBacking.name = 'WaveObjective';
        // 目标条、道途条与连斩条现在会同时出现，纵向必须互不重叠地依次排布。
        this.objectiveBacking.setPosition(0, 502);
        this.objectiveBacking.active = false;
        hud.addChild(this.objectiveBacking);
        this.objectiveLabel = this.makeLabel('', 20, new Color('#D8F3E9'));
        this.objectiveLabel.node.getComponent(UITransform)?.setContentSize(objectiveWidth - 22, 44);
        this.objectiveBacking.addChild(this.objectiveLabel.node);

        const waveRouteNode = new Node('WaveRoute');
        waveRouteNode.layer = Layers.Enum.UI_2D;
        waveRouteNode.setPosition(260, 542);
        this.waveRouteGraphics = waveRouteNode.addComponent(Graphics);
        hud.addChild(waveRouteNode);
        this.drawWaveRoute();

        this.routeChoiceBacking = this.makeRect(
            470,
            36,
            new Color(4, 23, 27, 218),
            new Color(this.currentStage.accent),
            12,
            1,
        );
        this.routeChoiceBacking.name = 'RouteChoiceStatus';
        this.routeChoiceBacking.setPosition(0, 452);
        this.routeChoiceBacking.active = false;
        this.routeChoiceLabel = this.makeLabel('', 18, new Color('#CDE9DF'));
        this.routeChoiceLabel.node.getComponent(UITransform)?.setContentSize(450, 30);
        this.routeChoiceBacking.addChild(this.routeChoiceLabel.node);
        hud.addChild(this.routeChoiceBacking);

        const bottomBacking = this.makeRect(750, 236, new Color(3, 14, 18, 12));
        bottomBacking.setPosition(0, -551);
        hud.addChild(bottomBacking);
        const leftHudCenter = -Math.min(185, Math.max(0, visibleWidth / 2 - 180));

        this.recentUpgradePanel = this.makeRect(
            360,
            52,
            new Color(3, 18, 22, 238),
            new Color('#D9B86C'),
            UI_THEME.radius.compact,
            1,
        );
        this.recentUpgradePanel.name = 'RecentUpgrade';
        this.recentUpgradePanel.setPosition(leftHudCenter, -360);
        this.recentUpgradePanel.active = false;
        this.recentUpgradeTimer = 0;
        this.recentUpgradeLabel = this.makeLabel('', 18, new Color('#F3E7C8'));
        this.recentUpgradeLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.recentUpgradeLabel.node.getComponent(UITransform)?.setContentSize(326, 38);
        this.recentUpgradePanel.addChild(this.recentUpgradeLabel.node);
        this.recentUpgradePanel.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            if (this.phase === 'playing') this.showCultivationSheet();
        });
        hud.addChild(this.recentUpgradePanel);

        this.comboPanel = this.makeRect(
            178,
            48,
            new Color(3, 18, 22, 228),
            new Color('#F0C879'),
            UI_THEME.radius.compact,
            1.5,
        );
        this.comboPanel.name = 'CombatFlow';
        // 连斩条右边缘不能超过 FIXED_HEIGHT 的真实可视宽度，否则窄长屏会只显示半句。
        this.comboPanel.setPosition(Math.min(244, visibleWidth / 2 - 89), 404);
        this.comboPanel.active = false;
        this.comboLabel = this.makeLabel('', 18, new Color('#FFF0BE'));
        this.comboLabel.node.getComponent(UITransform)?.setContentSize(164, 38);
        this.comboPanel.addChild(this.comboLabel.node);
        hud.addChild(this.comboPanel);

        this.createAbilityHud(hud);
        this.createBossHud(hud);
        this.updateHud();
    }

    private createAbilityHud(hud: Node): void {
        // 攻击盘移除后空出的拇指位交给天劫；三个按钮沿右下弧线排开，互不遮挡。
        // 锚点随可视宽度收缩，避免 19.5:9 及更窄的机型把按钮推出屏幕。
        const rightHudCenter = Math.min(272, this.visibleDesignWidth() / 2 - 62);

        this.dashHud = this.createSkillHud(
            hud,
            'DashHud',
            new Vec3(rightHudCenter - 122, -444),
            48,
            '踏云',
            'art/relics/xianxia-relics_23/spriteFrame',
            () => this.tryDash(),
        );
        this.formationHud = this.createSkillHud(
            hud,
            'FormationHud',
            new Vec3(rightHudCenter, -372),
            48,
            '剑阵',
            'art/relics/xianxia-relics_05/spriteFrame',
            () => this.trySwordFormation(),
        );
        this.dashHud.node.active = false;
        this.formationHud.node.active = false;

        const tribulationNode = new Node('TribulationHud');
        tribulationNode.layer = Layers.Enum.UI_2D;
        const tribulationRadius = 48;
        tribulationNode.addComponent(UITransform).setContentSize(tribulationRadius * 2 + 14, tribulationRadius * 2 + 14);
        tribulationNode.setPosition(rightHudCenter, -516);
        const tribulationGraphics = tribulationNode.addComponent(Graphics);
        const tribulationIcon = this.createResourceSprite('art/relics/xianxia-relics_11/spriteFrame', 56);
        const tribulationIconOpacity = tribulationIcon.addComponent(UIOpacity);
        tribulationIcon.setPosition(0, 5);
        tribulationNode.addChild(tribulationIcon);
        const tribulationLabel = this.makeLabel('天劫', 21, new Color('#FFF0BE'));
        tribulationLabel.node.setPosition(0, -tribulationRadius - 14);
        tribulationLabel.node.getComponent(UITransform)?.setContentSize(106, 26);
        tribulationNode.addChild(tribulationLabel.node);
        tribulationNode.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            tribulationNode.setScale(0.95, 0.95);
            this.startTribulationHold();
        });
        tribulationNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            tribulationNode.setScale(1, 1);
            this.releaseTribulationHold();
        });
        tribulationNode.on(Node.EventType.TOUCH_CANCEL, () => {
            tribulationNode.setScale(1, 1);
            this.releaseTribulationHold();
        });
        hud.addChild(tribulationNode);
        this.tribulationHud = {
            node: tribulationNode,
            graphics: tribulationGraphics,
            label: tribulationLabel,
            iconOpacity: tribulationIconOpacity,
            radius: tribulationRadius,
        };
    }

    private createSkillHud(
        hud: Node,
        name: string,
        position: Readonly<Vec3>,
        radius: number,
        labelText: string,
        iconResourcePath: string,
        onTap: () => void,
    ): SkillHud {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform).setContentSize(radius * 2 + 14, radius * 2 + 14);
        node.setPosition(position);
        const graphics = node.addComponent(Graphics);
        const icon = this.createResourceSprite(iconResourcePath, radius * 1.16);
        const iconOpacity = icon.addComponent(UIOpacity);
        icon.setPosition(0, 5);
        node.addChild(icon);
        const label = this.makeLabel(labelText, 21, new Color('#FFF0BE'));
        label.node.setPosition(0, -radius - 14);
        label.node.getComponent(UITransform)?.setContentSize(radius * 2 + 12, 26);
        node.addChild(label.node);
        node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(0.95, 0.95);
        });
        node.on(Node.EventType.TOUCH_CANCEL, () => node.setScale(1, 1));
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(1, 1);
            onTap();
        });
        hud.addChild(node);
        return { node, graphics, label, iconOpacity, radius };
    }

    private createBossHud(hud: Node): void {
        this.bossHud = new Node('BossHud');
        this.bossHud.layer = Layers.Enum.UI_2D;
        this.bossHud.setPosition(0, 482);
        const backing = this.makeRect(620, 88, new Color(24, 8, 12, 230), new Color(211, 139, 65, 210), 18, 3);
        this.bossHud.addChild(backing);
        this.bossHpLabel = this.makeLabel('', 19, new Color('#F8D9A0'));
        this.bossHpLabel.node.setPosition(0, 26);
        this.bossHpLabel.node.getComponent(UITransform)?.setContentSize(580, 30);
        this.bossHud.addChild(this.bossHpLabel.node);
        const barNode = new Node('BossHpBar');
        barNode.layer = Layers.Enum.UI_2D;
        barNode.setPosition(0, 2);
        this.bossHpBar = barNode.addComponent(Graphics);
        this.bossHud.addChild(barNode);
        this.bossPhaseLabel = this.makeLabel('', 14, new Color('#D9BFA8'));
        this.bossPhaseLabel.node.setPosition(0, -27);
        this.bossPhaseLabel.node.getComponent(UITransform)?.setContentSize(570, 24);
        this.bossHud.addChild(this.bossPhaseLabel.node);
        this.bossHud.active = false;
        hud.addChild(this.bossHud);
    }

    private updatePlayer(dt: number): void {
        this.playerAttackTimer = Math.max(0, this.playerAttackTimer - dt);
        this.playerHitTimer = Math.max(0, this.playerHitTimer - dt);
        this.playerInvulnerableTimer = Math.max(0, this.playerInvulnerableTimer - dt);
        let x = 0;
        let y = 0;
        if (this.pressed.has(KeyCode.KEY_A) || this.pressed.has(KeyCode.ARROW_LEFT)) x -= 1;
        if (this.pressed.has(KeyCode.KEY_D) || this.pressed.has(KeyCode.ARROW_RIGHT)) x += 1;
        if (this.pressed.has(KeyCode.KEY_S) || this.pressed.has(KeyCode.ARROW_DOWN)) y -= 1;
        if (this.pressed.has(KeyCode.KEY_W) || this.pressed.has(KeyCode.ARROW_UP)) y += 1;
        const keyboardMoving = Math.abs(x) + Math.abs(y) > 0;
        if (keyboardMoving && this.moveTarget) this.clearMoveTarget();
        const p = this.player.position;
        let snapTarget: Vec2 | undefined;
        if (!keyboardMoving && this.moveTarget) {
            const arrivalRadius = Math.max(16, Math.min(38, this.frostVelocity.length() * dt * 1.35));
            const step = resolveTapMoveStep(p, this.moveTarget, arrivalRadius);
            if (step.arrived) {
                snapTarget = this.moveTarget.clone();
            } else {
                x = step.x;
                y = step.y;
            }
        }
        const direction = new Vec2(x, y);
        if (direction.lengthSqr() > 1) direction.normalize();
        const onIce = this.currentStage.mapId === 'frozen-ruins' && isOnFrostIce(p);
        if (snapTarget) {
            this.frostVelocity.set(0, 0);
            this.player.setPosition(snapTarget.x, snapTarget.y, p.z);
            this.clearMoveTarget();
        } else {
            const resolvedVelocity = resolveFrostVelocity(
                this.frostVelocity,
                direction,
                this.moveSpeed,
                dt,
                onIce,
            );
            this.frostVelocity.set(resolvedVelocity.x, resolvedVelocity.y);
            this.player.setPosition(this.constrainToRoad(
                new Vec3(p.x + this.frostVelocity.x * dt, p.y + this.frostVelocity.y * dt),
                28,
            ));
        }
        const movementAmount = Math.min(1, this.frostVelocity.length() / Math.max(this.moveSpeed, 1));
        this.actions.tick(dt, movementAmount > 0.04);
        if (direction.lengthSqr() > 0.04) this.lastMoveDirection.set(direction).normalize();
        this.playerMoveAmount += (movementAmount - this.playerMoveAmount) * Math.min(1, dt * 12);
        if (Math.abs(this.frostVelocity.x) > 18) this.playerFacing = this.frostVelocity.x >= 0 ? 1 : -1;

        const hitJitter = this.playerHitTimer > 0 ? Math.sin(this.playerHitTimer * 95) * 5 : 0;
        const playerSprite = this.playerVisual.getComponent(Sprite);
        if (this.playerAnimationFrames.length > 0 && playerSprite) {
            // 正式序列帧接管身体姿态；节点层只保留朝向与受击位移，避免再叠加旧缩放导致动作变形。
            this.updatePlayerAnimationFrame();
            this.playerVisual.setPosition(hitJitter, 0);
            this.playerVisual.setScale(this.playerBaseScale * this.playerFacing, this.playerBaseScale);
            this.playerVisual.angle = 0;
        } else {
            // 资源慢加载或导入失败时保留轻量姿态反馈，保证战斗不会退化成完全静止的占位圆。
            const idleBreath = Math.sin(this.elapsed * 3.2) * 0.025;
            const step = Math.sin(this.elapsed * 12);
            const bob = this.playerMoveAmount > 0.08 ? Math.abs(step) * 7 : Math.sin(this.elapsed * 2.4) * 2.5;
            const scaleX = 1 + idleBreath + this.playerMoveAmount * Math.abs(step) * 0.035;
            const scaleY = 1 - idleBreath - this.playerMoveAmount * Math.abs(step) * 0.025;
            this.playerVisual.setPosition(hitJitter, bob);
            this.playerVisual.setScale(
                this.playerBaseScale * this.playerFacing * scaleX,
                this.playerBaseScale * scaleY,
            );
            this.playerVisual.angle = -direction.x * 5.5;
        }
        if (playerSprite) {
            playerSprite.color = this.playerHitTimer > 0
                ? new Color(255, 150, 142, 255)
                : new Color(255, 255, 255, this.playerInvulnerableTimer > 0 && Math.floor(this.elapsed * 20) % 2 === 0 ? 155 : 255);
        }
        this.updatePlayerAuraVisual();
    }

    private updateFrostTide(dt: number): void {
        if (this.currentStage.mapId !== 'frozen-ruins') return;
        const state = this.frostTide.tick(dt);
        const frostRoute = this.mapEvent.choice()?.effect.frostRoute;
        if (state.cycle !== this.frostTideEnemyHitCycle) {
            this.frostTideEnemyHitCycle = state.cycle;
            this.frostTideEnemyHits.clear();
        }
        this.drawFrostTide();
        if (state.phase !== 'surge') return;

        if (
            this.frostTidePlayerHitCycle !== state.cycle
            && this.frostTide.isInWaveBand(this.player.position.y, 62)
            && !isInFrostSanctuary(this.player.position, frostRoute)
            && !this.isInOpeningFrostSanctuary()
            && this.playerInvulnerableTimer <= 0
        ) {
            this.frostTidePlayerHitCycle = state.cycle;
            this.damagePlayer(12, undefined, 'frost-tide');
            this.frostVelocity.y = state.direction * 260;
            this.player.setPosition(this.constrainToRoad(
                new Vec3(this.player.position.x, this.player.position.y + state.direction * 58),
                28,
            ));
            this.createWorldHint('寒潮卷袭', this.player.position, new Color('#BDEFF7'));
        }

        for (const enemy of this.enemies) {
            if (!enemy.node.isValid || enemy.dead || this.frostTideEnemyHits.has(enemy.node)) continue;
            if (!this.frostTide.isInWaveBand(enemy.node.position.y, enemy.radius + 42)) continue;
            // 寒潮同时影响敌我，玩家可把追兵引到浪线上换取环境伤害，而不是只被动躲避。
            this.frostTideEnemyHits.add(enemy.node);
            this.runStats.recordTideEnemyHit();
            this.eliteEncounter.recordFrostTideHit(enemy.node.uuid);
            this.dealSkillDamage(
                enemy,
                frostTideEnemyDamage(frostRoute),
                new Color('#A5F3FC'),
                enemy.elite ? 54 : 38,
            );
            if (!enemy.dead) {
                enemy.node.setPosition(this.constrainToRoad(
                    new Vec3(enemy.node.position.x, enemy.node.position.y + state.direction * 42),
                    enemy.radius,
                ));
            }
            this.completeEliteEncounterIfNeeded();
        }
    }

    private drawFrostTide(): void {
        const visual = this.frostTideVisual;
        if (!visual?.node.isValid) return;
        const state = this.frostTide.snapshot();
        visual.graphics.clear();
        if (state.phase === 'calm') {
            visual.opacity.opacity = 0;
            return;
        }

        const y = state.bandY;
        const warning = state.phase === 'warning';
        visual.opacity.opacity = warning ? Math.round(120 + Math.sin(this.elapsed * 18) * 55) : 235;
        visual.graphics.fillColor = warning
            ? new Color(111, 222, 236, 28)
            : new Color(118, 225, 240, 78);
        visual.graphics.rect(-365, y - (warning ? 34 : 52), 730, warning ? 68 : 104);
        visual.graphics.fill();
        visual.graphics.strokeColor = new Color(184, 244, 250, warning ? 145 : 225);
        visual.graphics.lineWidth = warning ? 3 : 7;
        visual.graphics.moveTo(-350, y);
        visual.graphics.bezierCurveTo(-190, y + 18, -80, y - 18, 40, y + 4);
        visual.graphics.bezierCurveTo(150, y + 22, 240, y - 14, 350, y);
        visual.graphics.stroke();
        if (!warning) {
            visual.graphics.strokeColor = new Color(214, 250, 252, 140);
            visual.graphics.lineWidth = 2;
            visual.graphics.moveTo(-340, y - 24);
            visual.graphics.bezierCurveTo(-160, y - 5, 70, y - 42, 340, y - 18);
            visual.graphics.stroke();
        }
    }

    private updateAbilities(dt: number): void {
        if (this.skills.tick(dt)) this.castTribulation();
        // 剑阵改为自动功法：解锁后在敌群出现且冷却结束时自动施放，减少一个常驻操作按钮。
        if (
            this.skills.getLevel('formation') > 0
            && this.skills.formationCooldown <= 0
            && this.enemies.some((enemy) => enemy.node.isValid && !enemy.dead)
        ) {
            this.trySwordFormation();
        }
    }

    /**
     * 每张道法修到三级都会附带一个质变效果。它们不是独立的牌，也不需要玩家额外理解——
     * 卡面描述里已经写明，这里只负责把"某张牌满级了"翻译成具体的战斗行为。
     */
    private hasTrait(trait: CultivationTrait): boolean {
        return this.skills.getLevel(CULTIVATION_TRAIT_SOURCES[trait]) >= 3;
    }

    private updateCultivation(dt: number): void {
        this.updateUpgradeMomentum(dt);
        for (const enemy of this.enemies) {
            if ((enemy.thunderMarkTimer ?? 0) > 0) enemy.thunderMarkTimer = Math.max(0, (enemy.thunderMarkTimer ?? 0) - dt);
        }
    }

    private activateUpgradeMomentum(
        choice: UpgradeConfig,
        build: CultivationBuildSnapshot,
        milestone: boolean,
    ): UpgradeMomentumSpec {
        const resolved = resolveUpgradeMomentum(choice, build, milestone);
        this.cultivationMomentum = {
            ...resolved,
            duration: resolved.duration,
        };
        this.cultivationMomentumTimer = this.cultivationMomentum.duration;
        return this.cultivationMomentum;
    }


    private updateUpgradeMomentum(dt: number): void {
        const momentum = this.cultivationMomentum;
        if (!momentum || this.cultivationMomentumTimer <= 0) return;
        this.cultivationMomentumTimer = Math.max(0, this.cultivationMomentumTimer - dt);
        if (momentum.cooldownAcceleration > 0) {
            this.skills.reduceCooldowns(dt * momentum.cooldownAcceleration);
        }
        if (momentum.shieldPerSecond > 0) {
            this.grantCultivationShield(dt * momentum.shieldPerSecond);
        }
        if (this.recentUpgradePanel?.active && this.recentUpgradeLabel && this.recentUpgradeText) {
            this.recentUpgradeLabel.string = this.cultivationMomentumTimer > 0
                ? `${this.recentUpgradeText} · ${momentum.label} ${this.cultivationMomentumTimer.toFixed(1)}秒`
                : this.recentUpgradeText;
        }
        if (this.cultivationMomentumTimer <= 0) this.cultivationMomentum = undefined;
    }

    private healCultivation(amount: number): void {
        if (amount <= 0) return;
        const missing = Math.max(0, this.maxHp - this.hp);
        const restored = Math.min(missing, amount);
        this.hp += restored;
        const overflow = amount - restored;
        if (overflow > 0 && this.hasTrait('overflow-shield')) {
            this.grantCultivationShield(overflow);
        }
    }

    private grantCultivationShield(amount: number): void {
        if (amount <= 0) return;
        this.cultivationShieldMax = Math.max(this.cultivationShieldMax, Math.round(this.maxHp * 0.35));
        this.cultivationShield = Math.min(this.cultivationShieldMax, this.cultivationShield + amount);
    }

    private triggerCultivationShieldBurst(): void {
        if (!this.hasTrait('shield-burst')) return;
        const radius = 152;
        const damage = this.currentSwordDamage() * 0.95;
        this.createSwordFormationEffect(this.player.position, radius, 6);
        for (const enemy of this.enemies) {
            if (!enemy.node.isValid || enemy.dead) continue;
            if (Vec3.distance(enemy.node.position, this.player.position) <= radius + enemy.radius) {
                this.dealSkillDamage(enemy, damage, new Color('#8DE0B7'), 38, 'environment');
            }
        }
        this.createAbilityHint('罡气反震', new Color('#9BE3BE'));
    }

    private tryDash(): void {
        const level = this.skills.getLevel('dash');
        if (this.phase !== 'playing') return;
        if (level <= 0) {
            this.createAbilityHint('踏云尚未参悟', new Color('#A8C9BE'));
            return;
        }
        if (this.skills.dashCooldown > 0) return;

        const distance = getDashDistance(level);
        const direction = this.lastMoveDirection.lengthSqr() > 0.01
            ? this.lastMoveDirection.clone().normalize()
            : new Vec2(this.playerFacing, 0);
        const from = this.player.position.clone();
        const to = this.constrainToRoad(
            new Vec3(from.x + direction.x * distance, from.y + direction.y * distance),
            28,
        );
        this.player.setPosition(to);
        this.frostVelocity.set(direction.x * this.moveSpeed, direction.y * this.moveSpeed);
        this.playerFacing = Math.abs(direction.x) > 0.08 ? (direction.x >= 0 ? 1 : -1) : this.playerFacing;
        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.18 + level * 0.08);
        this.skills.markDashUsed(level);
        this.actions.enter('dash', 0.32);
        this.createDashEffect(from, to, level);

        const barrier = this.mapObstacles.findSegmentHit(from, to, 30);
        if (barrier) this.damageMapObstacle(barrier, this.currentSwordDamage() * (level >= 3 ? 1.4 : 0.75));
        if (level >= 3) {
            for (const enemy of this.enemies) {
                if (!enemy.node.isValid || enemy.dead) continue;
                const distanceToPath = this.distanceToSegment(enemy.node.position, from, to);
                if (distanceToPath <= enemy.radius + 34) {
                    this.dealSkillDamage(enemy, this.currentSwordDamage() * 0.8, new Color('#A7F3D0'), 34);
                }
            }
        }
    }

    private trySwordFormation(): void {
        const level = this.skills.getLevel('formation');
        if (this.phase !== 'playing') return;
        if (level <= 0) {
            this.createAbilityHint('剑阵尚未参悟', new Color('#A8C9BE'));
            return;
        }
        if (this.skills.formationCooldown > 0) return;

        const spec = getFormationSpec(level);
        const { radius, swordAmount } = spec;
        const damage = this.currentSwordDamage() * spec.damageMultiplier;
        this.skills.markFormationUsed(level);
        this.actions.enter('formation', 0.58);
        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.16);
        this.createSwordFormationEffect(this.player.position, radius, swordAmount);
        for (const enemy of this.enemies) {
            if (!enemy.node.isValid || enemy.dead) continue;
            if (Vec3.distance(enemy.node.position, this.player.position) <= radius + enemy.radius) {
                this.dealSkillDamage(enemy, damage, new Color('#67E8F9'), enemy.elite ? 48 : enemy.champion ? 41 : 34);
            }
        }
        this.damageMapObstaclesInRadius(this.player.position, radius, damage);
        this.cameraShakeTimer = 0.18;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 6 + level);
    }

    private startTribulationHold(): void {
        const level = this.skills.getLevel('tribulation');
        if (this.phase !== 'playing') return;
        if (level <= 0) {
            this.createAbilityHint('天劫尚未参悟', new Color('#A8C9BE'));
            return;
        }
        if (!this.skills.beginTribulationHold()) return;
        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.12);
    }

    private releaseTribulationHold(): void {
        this.skills.releaseTribulationHold();
    }

    private castTribulation(): void {
        const level = this.skills.getLevel('tribulation');
        if (level <= 0 || this.skills.tribulationCharge < 1) return;
        const alive = this.enemies
            .filter((enemy) => enemy.node.isValid && !enemy.dead)
            .sort((a, b) => Vec3.distance(a.node.position, this.player.position) - Vec3.distance(b.node.position, this.player.position));
        const fallback = this.constrainToRoad(
            new Vec3(this.player.position.x, this.player.position.y + 170),
            20,
        );
        const strikeRadius = getTribulationStrikeRadius(level);
        const damage = this.currentSwordDamage() * getTribulationDamageMultiplier(level);

        // 多重天劫优先分摊到不同目标；目标不足时围绕首要目标落雷，保证首领战仍有成长收益。
        for (let index = 0; index < level; index += 1) {
            const primary = alive[index % Math.max(1, alive.length)];
            const base = primary?.node.position ?? fallback;
            const angle = index * Math.PI * 2 / Math.max(level, 1);
            const position = new Vec3(
                base.x + (level > 1 ? Math.cos(angle) * 34 : 0),
                base.y + (level > 1 ? Math.sin(angle) * 24 : 0),
            );
            this.createTribulationStrike(position, strikeRadius, index);
            for (const enemy of this.enemies) {
                if (!enemy.node.isValid || enemy.dead) continue;
                if (Vec3.distance(enemy.node.position, position) <= strikeRadius + enemy.radius) {
                    this.dealSkillDamage(enemy, damage, new Color('#E0F2FE'), enemy.elite ? 58 : enemy.champion ? 50 : 42);
                }
            }
            this.damageMapObstaclesInRadius(position, strikeRadius, damage);
        }
        this.skills.markTribulationCast();
        this.actions.enter('tribulation', 0.8);
        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.45);
        this.createScreenFlash(new Color(154, 230, 255, 46), 0.28);
        this.cameraShakeTimer = 0.34;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 10 + level * 2);
    }


    private dealSkillDamage(
        enemy: EnemyState,
        damage: number,
        color: Color,
        burstRadius: number,
        source: 'skill' | 'sword' | 'environment' = 'skill',
    ): void {
        if (!enemy.node.isValid || enemy.dead) return;
        const qingshiRoute = this.currentStage.mapId === 'qingshi-road'
            ? this.mapEvent.choice()?.effect.qingshiRoute
            : undefined;
        const eliteVeinPosition = this.spiritVeinVisual?.node.isValid
            ? this.spiritVeinVisual.node.position
            : undefined;
        const insideEliteVein = this.currentStage.mapId === 'qingshi-road'
            && isInsideQingshiEliteVein(enemy.node.position, eliteVeinPosition);
        // 只有敌人实际进入剑碑圈时才放大伤害，避免把空间路线退化成永久面板增益。
        const resolvedDamage = damage * qingshiSwordSteleDamageMultiplier(
            enemy.node.position,
            qingshiRoute,
        ) * qingshiEliteVeinDamageMultiplier(
            this.waveIndex,
            enemy.node.position,
            eliteVeinPosition,
        );
        const hpBeforeHit = enemy.hp;
        const lethal = resolvedDamage >= hpBeforeHit;
        const impact = combatImpactPresentationFor(
            source,
            enemy.elite || enemy.champion,
            lethal,
            resolvedDamage / Math.max(enemy.maxHp, 1),
        );
        this.platformFeedback.playCue(
            lethal ? 'enemy-defeat' : 'enemy-hit',
            source === 'sword' ? 0 : source === 'skill' ? 1 : 2,
        );
        this.runStats.recordDamageDealt(Math.min(hpBeforeHit, resolvedDamage));
        enemy.hp -= resolvedDamage;
        if (source === 'skill' && this.hasTrait('thunder-seal')) {
            enemy.thunderMarkTimer = 5;
        }
        enemy.hitTimer = 0.18;
        this.createHitBurst(enemy.node.position, color, burstRadius * impact.burstScale, true);
        this.createDamageNumber(enemy.node.position, Math.round(resolvedDamage), impact.tier, impact.numberScale);
        // 命中反馈在伤害结算点统一分级，确保飞剑、功法和环境联动使用同一套视觉语义。
        this.cameraShakeTimer = Math.max(this.cameraShakeTimer, impact.shakeDuration);
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, impact.shakeStrength);
        if (impact.flashAlpha > 0) {
            this.createScreenFlash(
                new Color(color.r, color.g, color.b, impact.flashAlpha),
                impact.tier === 'finisher' ? 0.16 : 0.1,
            );
        }
        this.skills.addTribulationCharge(enemy.elite ? 0.07 : enemy.champion ? 0.05 : 0.035);
        if (enemy.hp <= 0) {
            if (insideEliteVein && this.waveIndex === 1) {
                this.eliteEncounter.recordQingshiVeinKill();
                this.createEliteEncounterFrameBurst(
                    this.qingshiSteleCommitAnimationFrames,
                    enemy.node.position,
                    150,
                );
                this.completeEliteEncounterIfNeeded();
            }
            this.killEnemy(enemy);
        } else {
            this.drawEnemyHp(enemy);
        }
    }

    private completeEliteEncounterIfNeeded(): void {
        const snapshot = this.eliteEncounter.snapshot();
        if (!snapshot.active || !snapshot.completed || this.eliteEncounterCompletionShown) return;
        this.eliteEncounterCompletionShown = true;
        this.skills.addTribulationCharge(0.18);
        const presentation = eliteEncounterPresentationFor(this.currentStage.mapId);
        this.createAbilityHint('境中试炼已破 · 劫力 +18%', new Color(presentation.accent));
        this.createScreenFlash(new Color(presentation.accent), 0.2);
    }

    private createEliteEncounterFrameBurst(
        frames: ReadonlyArray<SpriteFrame>,
        position: Readonly<Vec3>,
        diameter: number,
    ): void {
        // 境中试炼反馈复用章节已验收的四帧场地资源；资源未就绪时只保留规则与 HUD，不绘制替代图。
        if (frames.length !== 4) return;
        const node = new Node('EliteEncounterFrameBurst');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.RAW;
        sprite.spriteFrame = frames[this.prefersReducedMotion ? frames.length - 1 : 0];
        const opacity = node.addComponent(UIOpacity);
        const frameHeight = Math.max(frames[0].originalSize.height, 1);
        const baseScale = diameter / frameHeight;
        node.setScale(baseScale, baseScale);
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: this.prefersReducedMotion ? 0.38 : 0.56,
            update: (progress) => {
                opacity.opacity = Math.round(235 * (1 - progress));
                if (this.prefersReducedMotion) return;
                sprite.spriteFrame = frames[Math.min(frames.length - 1, Math.floor(progress * frames.length))];
                const pulse = 0.9 + Math.sin(progress * Math.PI) * 0.18;
                node.setScale(baseScale * pulse, baseScale * pulse);
            },
        });
    }

    private createDashEffect(from: Readonly<Vec3>, to: Readonly<Vec3>, level: number): void {
        const trail = new Node('CloudStepTrail');
        trail.layer = Layers.Enum.UI_2D;
        const trailOpacity = trail.addComponent(UIOpacity);
        const g = trail.addComponent(Graphics);
        g.strokeColor = new Color(125, 231, 211, 105 + level * 25);
        g.lineWidth = 12 + level * 3;
        g.moveTo(from.x, from.y);
        g.bezierCurveTo(
            from.x + (to.x - from.x) * 0.35 - 18,
            from.y + (to.y - from.y) * 0.35 + 12,
            from.x + (to.x - from.x) * 0.7 + 16,
            from.y + (to.y - from.y) * 0.7 - 10,
            to.x,
            to.y,
        );
        g.stroke();
        this.effectsLayer.addChild(trail);
        this.effects.push({
            node: trail,
            elapsed: 0,
            life: 0.38,
            update: (progress) => {
                trailOpacity.opacity = Math.round(220 * (1 - progress));
            },
        });

        const currentFrame = this.playerSprite?.spriteFrame;
        const afterimage = currentFrame
            ? this.createSpriteFromFrame(currentFrame, this.playerBaseScale, this.playerFacing)
            : this.createResourceSprite(PLAYER_ASSET.resourcePath, PLAYER_ASSET.displayHeight);
        afterimage.name = 'CloudStepAfterimage';
        afterimage.setPosition(from);
        const opacity = afterimage.addComponent(UIOpacity);
        opacity.opacity = 150;
        this.effectsLayer.addChild(afterimage);
        this.effects.push({
            node: afterimage,
            elapsed: 0,
            life: 0.32,
            update: (progress) => {
                afterimage.setPosition(
                    from.x + (to.x - from.x) * progress * 0.34,
                    from.y + (to.y - from.y) * progress * 0.34 + progress * 16,
                );
                afterimage.setScale(afterimage.scale.x * 1.002, afterimage.scale.y * 1.002);
                opacity.opacity = Math.round(150 * (1 - progress));
            },
        });
    }

    private createSwordFormationEffect(position: Readonly<Vec3>, radius: number, swordAmount: number): void {
        const node = new Node('SwordFormation');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const opacity = node.addComponent(UIOpacity);
        const ring = node.addComponent(Graphics);
        ring.strokeColor = new Color(116, 227, 216, 175);
        ring.lineWidth = 3;
        ring.circle(0, 0, radius);
        ring.stroke();
        ring.strokeColor = new Color(211, 250, 240, 95);
        ring.lineWidth = 2;
        ring.circle(0, 0, radius * 0.72);
        ring.stroke();
        for (let index = 0; index < swordAmount; index += 1) {
            const angle = index * Math.PI * 2 / swordAmount - Math.PI / 2;
            const sword = this.createResourceSprite('art/relics/xianxia-relics_00/spriteFrame', 50);
            sword.setPosition(Math.cos(angle) * radius * 0.82, Math.sin(angle) * radius * 0.82);
            sword.angle = angle * 180 / Math.PI - 45;
            node.addChild(sword);
        }
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.72,
            update: (progress) => {
                const scale = 0.46 + Math.sin(Math.min(progress / 0.42, 1) * Math.PI / 2) * 0.62;
                node.setScale(scale, scale);
                node.angle = progress * 70;
                opacity.opacity = Math.round(255 * (1 - Math.max(0, progress - 0.55) / 0.45));
            },
        });
    }

    private createTribulationStrike(position: Readonly<Vec3>, radius: number, index: number): void {
        const node = new Node(`TribulationStrike-${index + 1}`);
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const opacity = node.addComponent(UIOpacity);
        const g = node.addComponent(Graphics);
        g.fillColor = new Color(190, 239, 255, 42);
        g.circle(0, 0, radius);
        g.fill();
        g.strokeColor = new Color(222, 247, 255, 225);
        g.lineWidth = 10;
        g.moveTo(0, 560);
        g.lineTo(0, 16);
        g.stroke();
        g.strokeColor = new Color(105, 211, 238, 170);
        g.lineWidth = 3;
        g.circle(0, 0, radius);
        g.stroke();
        const sword = this.createResourceSprite('art/relics/xianxia-relics_00/spriteFrame', 86);
        sword.setPosition(0, 20);
        sword.setRotationFromEuler(0, 0, 45);
        node.addChild(sword);
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.62 + index * 0.06,
            update: (progress) => {
                const strike = Math.sin(Math.min(1, progress * 2.6) * Math.PI);
                node.setScale(0.62 + strike * 0.58, 0.62 + strike * 0.58);
                opacity.opacity = Math.round(255 * (1 - progress));
            },
        });
    }

    private createUpgradeResonance(id: UpgradeId, level: number): void {
        const upgrade = UPGRADES.find((choice) => choice.id === id);
        if (!upgrade) return;
        const build = resolveCultivationBuild((choiceId) => this.skills.getLevel(choiceId));
        const pathColor = new Color(UPGRADE_PATH_COLORS[upgrade.path]);
        const node = new Node('UpgradeResonance');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(this.player.position);
        const opacity = node.addComponent(UIOpacity);
        const g = node.addComponent(Graphics);
        g.strokeColor = new Color(pathColor.r, pathColor.g, pathColor.b, 220);
        g.lineWidth = 4;
        for (let ring = 0; ring < Math.max(1, build.tier); ring += 1) {
            g.circle(0, 0, 44 + ring * 23);
            g.stroke();
        }
        const iconBacking = new Node('UpgradeResonanceIcon');
        iconBacking.layer = Layers.Enum.UI_2D;
        iconBacking.setPosition(0, 105);
        const iconRing = iconBacking.addComponent(Graphics);
        iconRing.fillColor = new Color(3, 18, 22, 232);
        iconRing.circle(0, 0, 34);
        iconRing.fill();
        iconRing.strokeColor = new Color(pathColor.r, pathColor.g, pathColor.b, 235);
        iconRing.lineWidth = 2;
        iconRing.circle(0, 0, 34);
        iconRing.stroke();
        iconBacking.addChild(this.createResourceSprite(upgrade.iconResourcePath, 50));
        node.addChild(iconBacking);
        const label = this.makeLabel(
            build.relic && build.path === upgrade.path
                ? `${build.relic.name} · ${build.evolutionName}`
                : `${upgrade.title} · ${level}阶`,
            24,
            new Color('#FFF1B8'),
        );
        label.node.setPosition(0, 154);
        label.node.getComponent(UITransform)?.setContentSize(300, 34);
        node.addChild(label.node);
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 1.08,
            update: (progress) => {
                const reveal = Math.min(1, progress / 0.22);
                const scale = 0.72 + reveal * 0.28 + progress * 0.28;
                node.setScale(scale, scale);
                opacity.opacity = Math.round(255 * (progress < 0.62 ? reveal : (1 - progress) / 0.38));
            },
        });
        if (build.relic && build.path === upgrade.path) {
            this.createAbilityHint(`${build.tierName} · ${upgrade.title}已生效`, pathColor);
        }
        this.createUpgradeDemonstration(upgrade, build);
        this.createScreenFlash(new Color(pathColor.r, pathColor.g, pathColor.b, 44 + level * 8), 0.32);
    }

    private createUpgradeDemonstration(upgrade: UpgradeConfig, build: CultivationBuildSnapshot): void {
        const path = upgrade.path;
        const color = new Color(UPGRADE_PATH_COLORS[path]);
        const amount = build.tier >= 3 ? 5 : build.tier >= 2 ? 3 : 2;
        const displayHeight = path === 'edge' ? 62 : path === 'mystic' ? 58 : 31;
        const travel = path === 'edge' ? 126 : path === 'mystic' ? 108 : 92;
        for (let index = 0; index < amount; index += 1) {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / amount;
            const sword = new Node(`UpgradeDemoSword-${path}-${index}`);
            sword.layer = Layers.Enum.UI_2D;
            sword.setPosition(this.player.position);
            sword.angle = angle * 180 / Math.PI - 45;
            const opacity = sword.addComponent(UIOpacity);
            sword.addChild(this.createResourceSprite(PLAYER_AURA_SWORD_RESOURCES[path], displayHeight));
            this.effectsLayer.addChild(sword);
            this.effects.push({
                node: sword,
                elapsed: 0,
                life: 0.82,
                update: (progress) => {
                    const reveal = Math.min(1, progress / 0.2);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const radius = 22 + travel * eased;
                    sword.setPosition(
                        this.player.position.x + Math.cos(angle) * radius,
                        this.player.position.y + Math.sin(angle) * radius * 0.72,
                    );
                    const scale = 0.72 + reveal * 0.28;
                    sword.setScale(scale, scale);
                    const fade = Math.min(1, Math.max(0, (1 - progress) / 0.34));
                    opacity.opacity = Math.round(235 * reveal * fade);
                },
            });
        }
        if (path === 'mystic') {
            this.createSwordFormationEffect(this.player.position, 86 + build.tier * 8, 4 + build.tier);
        } else if (path === 'vitality') {
            const pulse = new Node('UpgradeVitalityPulse');
            pulse.layer = Layers.Enum.UI_2D;
            pulse.setPosition(this.player.position);
            const opacity = pulse.addComponent(UIOpacity);
            const ring = pulse.addComponent(Graphics);
            ring.fillColor = new Color(color.r, color.g, color.b, 34);
            ring.circle(0, 0, 70);
            ring.fill();
            ring.strokeColor = new Color(color.r, color.g, color.b, 220);
            ring.lineWidth = 5;
            ring.circle(0, 0, 70);
            ring.stroke();
            this.effectsLayer.addChild(pulse);
            this.effects.push({
                node: pulse,
                elapsed: 0,
                life: 0.8,
                update: (progress) => {
                    const scale = 0.6 + progress * 0.8;
                    pulse.setScale(scale, scale);
                    opacity.opacity = Math.round(220 * (1 - progress));
                },
            });
        }
    }

    private playUpgradeShowcase(spec: UpgradeShowcaseSpec): void {
        if (this.phase !== 'playing' || !this.player?.isValid) return;
        const color = new Color(
            spec.kind === 'sword-volley'
                ? UPGRADE_PATH_COLORS.edge
                : spec.kind === 'thunder-chain'
                    ? UPGRADE_PATH_COLORS.mystic
                    : UPGRADE_PATH_COLORS.vitality,
        );
        const alive = this.enemies
            .filter((enemy) => enemy.node.isValid && !enemy.dead)
            .sort((a, b) => (
                Vec3.distance(a.node.position, this.player.position)
                - Vec3.distance(b.node.position, this.player.position)
            ));

        if (spec.kind === 'sword-volley') {
            const target = alive[0];
            if (target) {
                for (let index = 0; index < spec.amount; index += 1) {
                    const spread = (index - (spec.amount - 1) / 2) * 0.12;
                    this.fireSword(target, spread, spec.damageMultiplier);
                }
            }
            // 波次间没有敌人时仍完整展示剑匣层级；下一波普攻继续沿用新的数量与真形外观。
            this.createSwordFormationEffect(this.player.position, spec.radius, spec.amount);
            this.actions.enter('aimedVolley', 0.48);
        } else if (spec.kind === 'thunder-chain') {
            const targets = alive.slice(0, spec.amount);
            if (targets.length > 0) {
                let previous = this.player.position.clone();
                targets.forEach((target, index) => {
                    this.createLightningArc(previous, target.node.position, color);
                    this.dealSkillDamage(
                        target,
                        this.currentSwordDamage() * spec.damageMultiplier,
                        color,
                        46 + spec.tier * 6,
                        'skill',
                    );
                    if (index === 0) this.createTribulationStrike(target.node.position, spec.radius, 0);
                    previous = target.node.position.clone();
                });
            } else {
                const fallback = this.constrainToRoad(
                    new Vec3(this.player.position.x, this.player.position.y + 170),
                    20,
                );
                this.createTribulationStrike(fallback, spec.radius, 0);
            }
            this.actions.enter('tribulation', 0.72);
        } else {
            this.grantCultivationShield(spec.shieldAmount);
            this.createSwordFormationEffect(this.player.position, spec.radius, spec.amount);
            for (const enemy of alive) {
                const offset = new Vec2(
                    enemy.node.position.x - this.player.position.x,
                    enemy.node.position.y - this.player.position.y,
                );
                if (offset.length() > spec.radius + enemy.radius) continue;
                this.dealSkillDamage(
                    enemy,
                    this.currentSwordDamage() * spec.damageMultiplier,
                    color,
                    42 + spec.tier * 6,
                    'environment',
                );
                if (!enemy.dead && offset.lengthSqr() > 0.01) {
                    offset.normalize().multiplyScalar(38 + spec.tier * 8);
                    enemy.node.setPosition(this.constrainToRoad(
                        enemy.node.position.clone().add(new Vec3(offset.x, offset.y)),
                        enemy.radius,
                    ));
                }
            }
            this.actions.enter('formation', 0.5);
        }

        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.34);
        this.attackTimer = Math.max(this.attackTimer, 0.42);
        this.createAbilityHint(spec.label, color);
        this.createScreenFlash(new Color(color.r, color.g, color.b, 62 + spec.tier * 12), 0.34);
        this.cameraShakeTimer = 0.28 + spec.tier * 0.06;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 8 + spec.tier * 3);
        this.platformFeedback.playUpgradeImpact(spec.kind, spec.tier);
    }

    private createAbilityHint(text: string, color: Color): void {
        const label = this.makeLabel(text, 20, color);
        const node = label.node;
        node.name = 'AbilityHint';
        node.setPosition(this.player.position.x, this.player.position.y + 74);
        const opacity = node.addComponent(UIOpacity);
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.7,
            update: (progress) => {
                node.setPosition(node.position.x, this.player.position.y + 74 + progress * 28);
                opacity.opacity = Math.round(255 * (1 - progress));
            },
        });
    }

    private distanceToSegment(point: Readonly<Vec3>, start: Readonly<Vec3>, end: Readonly<Vec3>): number {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared <= 0.001) return Vec3.distance(point, start);
        const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
        const closestX = start.x + dx * t;
        const closestY = start.y + dy * t;
        return Math.hypot(point.x - closestX, point.y - closestY);
    }

    private updateSpawning(dt: number): void {
        const wave = this.currentStage.waves[this.waveIndex];
        if (!wave || this.waveFinished || this.spawned >= wave.count) return;
        this.spawnTimer -= dt;
        if (this.spawnTimer > 0) return;
        this.spawnEnemy(wave);
        this.spawned += 1;
        this.spawnTimer = wave.spawnInterval;
    }

    private spawnEnemy(wave: WaveConfig): void {
        const champion = wave.danger === 'elite';
        // 本地首领验收压缩血量以覆盖施法与转阶段帧；正式域名始终使用关卡原始数值。
        const qaBoss = wave.behavior === 'boss' && this.shouldStartBossPreview();
        // 紧邻波次修正只结算一次；关底因果单独读取，确保路线选择能延续到本局最终检验。
        const eventModifiers = this.mapEvent.modifiersForWave(
            this.mapEventModifierWaveIndex === this.waveIndex,
            wave.danger === 'boss',
        );
        const runtimeHp = qaBoss
            ? this.hasLocalQaFlag('qaBossFinish=1')
                ? 72
                : this.hasLocalQaFlag('qaBossHud=1') ? 1800 : 360
            : Math.round(wave.hp * eventModifiers.hp);
        const node = new Node(
            wave.elite
                ? `Boss-${wave.enemyKind}`
                : champion
                    ? `Champion-${wave.enemyKind}`
                    : `Enemy-${wave.enemyKind}`,
        );
        node.layer = Layers.Enum.UI_2D;
        const radius = wave.radius;
        const unit = this.attachUnitVisual(node, ENEMY_ASSETS[wave.enemyKind], radius);
        const hpBar = this.createEnemyHpBar(
            node,
            Math.max(
                radius + (wave.elite ? 32 : champion ? 26 : 20),
                ENEMY_ASSETS[wave.enemyKind].displayHeight * 0.56,
            ),
        );
        if (this.bossArenaActive) {
            if (wave.arena === 'boss-clearing') {
                node.setPosition(0, 392);
            } else {
                // 首领援军直接落在决战圈边缘，避免沿普通道路出生后被场景裁切。
                const angle = this.enemies.length * Math.PI + Math.PI * 0.25;
                node.setPosition(Math.cos(angle) * 180, 270 + Math.sin(angle) * 95);
            }
        } else {
            const qingshiRoute = this.currentStage.mapId === 'qingshi-road'
                ? this.mapEvent.choice()?.effect.qingshiRoute
                : undefined;
            const qingshiSpawn = qingshiRouteSpawn(qingshiRoute, this.spawned);
            const bambooRoute = this.currentStage.mapId === 'bamboo-ambush'
                ? this.mapEvent.choice()?.effect.bambooRoute
                : undefined;
            const routeEdge = bambooSpawnEdge(bambooRoute, this.spawned);
            const frostRoute = this.currentStage.mapId === 'frozen-ruins'
                ? this.mapEvent.choice()?.effect.frostRoute
                : undefined;
            const convergenceSpawn = frostConvergenceSpawn(frostRoute, this.spawned);
            const openingSpawn = this.waveIndex === 0 && !this.mapEvent.choice()
                ? openingSpawnDirectiveFor(this.currentStage.mapId, this.spawned)
                : undefined;
            const eliteSpawn = this.waveIndex === 1 && !this.mapEvent.choice()
                ? eliteEncounterSpawnDirectiveFor(this.currentStage.mapId, this.spawned)
                : undefined;
            if (openingSpawn) {
                // 首境敌群与地图动作使用同一空间语义：青石正面压入、竹林两翼切入、寒潭上台列阵；
                // 后续波次仍由路线选择接管，避免开场教学永久覆盖 Roguelike 分岔。
                const road = this.getRoadBounds(openingSpawn.y, radius + 4);
                if (openingSpawn.edge === 'top') {
                    const ratio = Math.max(-1, Math.min(1, openingSpawn.xRatio ?? 0));
                    node.setPosition(
                        road.minX + (road.maxX - road.minX) * (ratio + 1) / 2,
                        openingSpawn.y,
                    );
                } else {
                    node.setPosition(
                        openingSpawn.edge === 'left' ? road.minX : road.maxX,
                        openingSpawn.y,
                    );
                }
            } else if (eliteSpawn) {
                // 第二波把敌人来向与本章机关对齐：狐妖两翼绕脉、竹甲正面撞障、冰尸沿潮线列阵。
                const road = this.getRoadBounds(eliteSpawn.y, radius + 4);
                if (eliteSpawn.edge === 'top') {
                    const ratio = Math.max(-1, Math.min(1, eliteSpawn.xRatio ?? 0));
                    node.setPosition(
                        road.minX + (road.maxX - road.minX) * (ratio + 1) / 2,
                        eliteSpawn.y,
                    );
                } else {
                    node.setPosition(
                        eliteSpawn.edge === 'left' ? road.minX : road.maxX,
                        eliteSpawn.y,
                    );
                }
            } else if (qingshiSpawn) {
                // 悟痕路线把下一波从山门上端压入三碑纵阵，玩家可主动引敌穿过增伤圈。
                const road = this.getRoadBounds(qingshiSpawn.y, radius + 4);
                const x = road.minX
                    + (road.maxX - road.minX) * (qingshiSpawn.xRatio + 1) / 2;
                node.setPosition(x, qingshiSpawn.y);
            } else if (routeEdge === 'top') {
                // 开阔路线把风险兑现为正面压力，所有敌人从道路上端成扇形推进。
                const y = this.arena.top - radius;
                const road = this.getRoadBounds(y, radius + 4);
                const fan = [-0.58, 0, 0.58][this.spawned % 3];
                node.setPosition(road.minX + (road.maxX - road.minX) * (0.5 + fan * 0.5), y);
            } else if (routeEdge === 'left' || routeEdge === 'right') {
                // 入影路线在三段夹道之间交替侧刷，玩家必须利用竹障拆分两翼追兵。
                const yBands = [-28, 142, 314];
                const y = yBands[this.spawned % yBands.length];
                const road = this.getRoadBounds(y, radius + 4);
                node.setPosition(routeEdge === 'left' ? road.minX : road.maxX, y);
            } else if (convergenceSpawn) {
                // 借潮路线把敌人引到上层冰台的三点潮线，寒潮会更早穿过整个阵形。
                const road = this.getRoadBounds(convergenceSpawn.y, radius + 4);
                const x = road.minX
                    + (road.maxX - road.minX) * (convergenceSpawn.xRatio + 1) / 2;
                node.setPosition(x, convergenceSpawn.y);
            } else {
                const edge = Math.floor(Math.random() * 3);
                const y = edge < 2 ? this.random(-80, this.arena.top - 70) : this.arena.top - radius;
                const road = this.getRoadBounds(y, radius + 4);
                const x = edge === 0 ? road.minX : edge === 1
                    ? road.maxX
                    : this.random(road.minX, road.maxX);
                node.setPosition(x, y);
            }
        }
        this.battleLayer.addChild(node);
        const initialHp = qaBoss && this.hasLocalQaFlag('qaBossPhase=2')
            ? Math.ceil(runtimeHp * BOSS_PHASE_TWO_THRESHOLD) - 1
            : runtimeHp;
        const enemy: EnemyState = {
            node,
            visual: unit.visual,
            opacity: unit.opacity,
            kind: wave.enemyKind,
            behavior: wave.behavior,
            // 本地二相验收只把首领初始血线放到阈值下方；正式战斗始终从满血第一相开始。
            hp: initialHp,
            maxHp: runtimeHp,
            speed: wave.speed * eventModifiers.speed,
            damage: wave.damage * eventModifiers.damage,
            radius,
            xp: wave.xp,
            elite: Boolean(wave.elite),
            champion,
            age: 0,
            strafeSign: Math.random() > 0.5 ? 1 : -1,
            abilityTimer: wave.abilityInterval ?? Number.POSITIVE_INFINITY,
            abilityInterval: wave.abilityInterval ?? Number.POSITIVE_INFINITY,
            // 敌伤路线同时作用于接触和首领招式，不能让面板写着 +18% 而落印伤害仍保持原值。
            abilityDamage: (wave.abilityDamage ?? 0) * eventModifiers.damage,
            hpBar,
            baseScale: unit.baseScale,
            baseVisualY: 0,
            hitTimer: 0,
            deathTimer: 0,
            spawnTimer: 0.28,
            castTimer: 0,
            bossPhase: 1,
            enrageTimer: 0,
            encounterStaggerTimer: 0,
            encounterCollisionCooldown: 0,
            animationFrameIndex: -1,
            dead: false,
        };
        this.enemies.push(enemy);
        this.installBossAnimation(enemy);
        this.drawEnemyHp(enemy);
        if (enemy.elite || enemy.champion) this.createBossAura(enemy);
    }

    private installBossAnimation(enemy: EnemyState): void {
        const frames = this.getBossAnimationFrames();
        if (enemy.kind !== 'shanxiao' || frames.length === 0) return;
        const sprite = enemy.visual.getComponent(Sprite) ?? enemy.visual.addComponent(Sprite);
        const fallback = enemy.visual.getComponent(Graphics);
        if (fallback) fallback.destroy();
        sprite.sizeMode = Sprite.SizeMode.RAW;
        sprite.spriteFrame = frames[0];
        enemy.animationFrameIndex = 0;
        const frameHeight = Math.max(frames[0].originalSize.height, 1);
        enemy.baseScale = this.getBossAnimationAsset().displayHeight / frameHeight;
        enemy.visual.setScale(enemy.baseScale, enemy.baseScale);
    }

    private getBossAnimationFrames(): SpriteFrame[] {
        return this.currentStage.mapId === 'frozen-ruins'
            ? this.frozenBossAnimationFrames
            : this.bossAnimationFrames;
    }

    private getBossAnimationAsset() {
        return this.currentStage.mapId === 'frozen-ruins'
            ? FROZEN_BOSS_ANIMATION_ASSET
            : BOSS_ANIMATION_ASSET;
    }

    private attachUnitVisual(node: Node, asset: SpriteAssetSpec, fallbackRadius: number): UnitVisual {
        const shadow = new Node('Shadow');
        shadow.layer = Layers.Enum.UI_2D;
        shadow.setPosition(0, -fallbackRadius * 0.82);
        shadow.setScale(1.35, 0.34);
        const shadowGraphics = shadow.addComponent(Graphics);
        shadowGraphics.fillColor = new Color(2, 9, 12, 105);
        shadowGraphics.circle(0, 0, fallbackRadius * 0.74);
        shadowGraphics.fill();
        node.addChild(shadow);

        const visual = new Node('Visual');
        visual.layer = Layers.Enum.UI_2D;
        node.addChild(visual);
        const opacity = visual.addComponent(UIOpacity);
        const frame = this.spriteFrames.get(asset.resourcePath);
        if (frame) {
            const sprite = visual.addComponent(Sprite);
            sprite.spriteFrame = frame;
            sprite.sizeMode = Sprite.SizeMode.RAW;
            const sourceHeight = Math.max(frame.originalSize.height, 1);
            const scale = asset.displayHeight / sourceHeight;
            visual.setScale(scale, scale);
            return { visual, opacity, baseScale: scale };
        }

        // 资源在慢设备上尚未加载完时仍保证可玩，下一局会自动使用正式图片。
        const graphics = visual.addComponent(Graphics);
        graphics.fillColor = new Color(asset.fallbackFill);
        graphics.circle(0, 0, fallbackRadius);
        graphics.fill();
        graphics.strokeColor = new Color(asset.fallbackStroke);
        graphics.lineWidth = 5;
        graphics.circle(0, 0, fallbackRadius);
        graphics.stroke();
        return { visual, opacity, baseScale: 1 };
    }

    private createEnemyHpBar(owner: Node, y: number): Graphics {
        const node = new Node('HpBar');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(0, y);
        const graphics = node.addComponent(Graphics);
        owner.addChild(node);
        return graphics;
    }

    private drawEnemyHp(enemy: EnemyState): void {
        const width = enemy.elite ? 118 : enemy.champion ? 92 : 72;
        const ratio = Math.max(0, enemy.hp / enemy.maxHp);
        enemy.hpBar.clear();
        enemy.hpBar.fillColor = new Color(8, 15, 20, 210);
        enemy.hpBar.roundRect(-width / 2, -4, width, 8, 4);
        enemy.hpBar.fill();
        enemy.hpBar.fillColor = new Color(enemy.elite ? '#E6A244' : enemy.champion ? '#D3B35B' : '#C65855');
        enemy.hpBar.roundRect(-width / 2 + 2, -2, (width - 4) * ratio, 4, 2);
        enemy.hpBar.fill();
    }

    private updateEnemies(dt: number): void {
        const playerPos = this.player.position;
        for (const enemy of this.enemies) {
            if (!enemy.node.isValid) continue;
            if (enemy.dead) {
                this.updateEnemyDeath(enemy, dt);
                continue;
            }
            enemy.age += dt;
            enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);
            enemy.castTimer = Math.max(0, enemy.castTimer - dt);
            enemy.spawnTimer = Math.max(0, enemy.spawnTimer - dt);
            enemy.enrageTimer = Math.max(0, enemy.enrageTimer - dt);
            enemy.encounterStaggerTimer = Math.max(0, enemy.encounterStaggerTimer - dt);
            enemy.encounterCollisionCooldown = Math.max(0, enemy.encounterCollisionCooldown - dt);
            const delta = new Vec3(playerPos.x - enemy.node.position.x, playerPos.y - enemy.node.position.y);
            const distance = Math.max(delta.length(), 0.001);
            delta.multiplyScalar(1 / distance);

            if (enemy.behavior === 'weaver') {
                // 狐妖以垂直于追击方向的摆动制造走位压力，避免所有敌人挤成同一条直线。
                const sway = Math.sin(enemy.age * 4.6) * 0.72 * enemy.strafeSign;
                delta.add3f(-delta.y * sway, delta.x * sway, 0).normalize();
            }

            let speedMultiplier = 1;
            if (enemy.behavior === 'lunger') {
                const cycle = enemy.age % 2.2;
                speedMultiplier = cycle > 1.65 && cycle < 2.05 ? 2.25 : 0.72;
            } else if (enemy.behavior === 'guardian') {
                // 竹甲镇守以“压步—突进”形成可读节拍，比纯追踪更像一道会移动的路障。
                const cycle = enemy.age % 2.8;
                speedMultiplier = cycle > 1.75 && cycle < 2.25 ? 2 : 0.48;
            } else if (enemy.enrageTimer > 0) {
                speedMultiplier = 0;
            }
            if (enemy.encounterStaggerTimer > 0) speedMultiplier = 0;
            const proposedPosition = this.constrainToRoad(
                enemy.node.position.clone().add(delta.clone().multiplyScalar(enemy.speed * speedMultiplier * dt)),
                enemy.radius,
            );
            const charging = enemy.behavior === 'guardian' && speedMultiplier > 1.2;
            const barrier = charging
                ? this.mapObstacles.findSegmentHit(enemy.node.position, proposedPosition, enemy.radius)
                : undefined;
            if (shouldStaggerBambooWarden(
                this.waveIndex,
                charging,
                Boolean(barrier),
                enemy.encounterCollisionCooldown,
            ) && barrier) {
                // 竹甲突进命中真实竹障后停顿，障碍承伤但仍保留玩家主动破路的价值。
                enemy.encounterStaggerTimer = 1.1;
                enemy.encounterCollisionCooldown = 2.2;
                this.damageMapObstacle(barrier, 8);
                this.eliteEncounter.recordBambooBarrierStagger();
                this.createEliteEncounterFrameBurst(
                    this.bambooBurnCommitAnimationFrames,
                    new Vec3(barrier.x, barrier.y),
                    172,
                );
                this.createWorldHint('竹障截锋 · 镇守失衡', enemy.node.position, new Color('#D9F99D'));
                this.completeEliteEncounterIfNeeded();
                const resolved = this.mapObstacles.resolveCircle(enemy.node.position, enemy.radius);
                enemy.node.setPosition(this.constrainToRoad(
                    new Vec3(resolved.x, resolved.y),
                    enemy.radius,
                ));
            } else {
                enemy.node.setPosition(proposedPosition);
            }

            if (enemy.behavior === 'boss') {
                if (enemy.bossPhase === 1 && enemy.hp / enemy.maxHp <= BOSS_PHASE_TWO_THRESHOLD) {
                    this.enterBossPhaseTwo(enemy);
                }
                enemy.abilityTimer -= enemy.enrageTimer > 0 ? 0 : dt;
                if (enemy.abilityTimer <= 0 && enemy.enrageTimer <= 0) {
                    this.createBossAbility(enemy);
                    enemy.abilityTimer = enemy.abilityInterval;
                    enemy.castTimer = 0.85;
                }
            }

            if (distance < enemy.radius + 27) {
                this.damagePlayer(
                    enemy.damage * 0.5,
                    enemy.node.position,
                    'enemy-contact',
                );
                if (this.phase !== 'playing') return;
            }

            this.animateEnemy(enemy, delta, speedMultiplier);
        }
    }

    private animateEnemy(enemy: EnemyState, direction: Vec3, speedMultiplier: number): void {
        // 单帧素材按敌人类型映射到不同的位移、倾斜和压缩节奏，状态数据与未来序列帧动画可共用。
        const phase = enemy.age * (enemy.kind === 'foxSpirit' ? 5.4 : enemy.kind === 'jiangshi' ? 4.1 : 3.6);
        const facing = direction.x >= 0 ? 1 : -1;
        let bob = 0;
        let lean = -direction.x * 3;
        let scaleX = 1;
        let scaleY = 1;

        if (enemy.kind === 'shanxiao' && this.updateBossAnimationFrame(enemy, speedMultiplier > 0.15)) {
            const spawnProgress = 1 - Math.min(enemy.spawnTimer / 0.28, 1);
            const spawnEase = 1 - Math.pow(1 - spawnProgress, 3);
            enemy.opacity.opacity = Math.round(255 * spawnEase);
            enemy.visual.setPosition(0, enemy.baseVisualY);
            enemy.visual.setScale(
                enemy.baseScale * facing * Math.max(0.15, spawnEase),
                enemy.baseScale * Math.max(0.15, spawnEase),
            );
            enemy.visual.angle = 0;
            const sprite = enemy.visual.getComponent(Sprite);
            if (sprite) {
                sprite.color = enemy.enrageTimer > 0
                    ? this.currentStage.mapId === 'frozen-ruins'
                        ? new Color(178, 246, 255, 255)
                        : new Color(255, 190, 116, 255)
                    : enemy.hitTimer > 0
                        ? new Color(255, 128, 112, 255)
                        : Color.WHITE;
            }
            enemy.node.getChildByName('BossAura')?.setRotationFromEuler(
                0,
                0,
                -this.elapsed * (enemy.bossPhase === 2 ? 32 : 15),
            );
            return;
        }

        if (enemy.kind === 'mountainSpirit') {
            bob = Math.abs(Math.sin(phase)) * 4;
            lean += Math.sin(phase * 0.5) * 2.5;
            scaleX += Math.sin(phase) * 0.035;
            scaleY -= Math.sin(phase) * 0.025;
        } else if (enemy.kind === 'bambooWarden') {
            const stomp = Math.max(0, Math.sin(phase));
            bob = stomp * (speedMultiplier > 1 ? 10 : 3);
            lean += direction.x * (speedMultiplier > 1 ? -10 : -2);
            scaleX += stomp * 0.035;
            scaleY -= stomp * 0.025;
        } else if (enemy.kind === 'foxSpirit') {
            bob = Math.sin(phase) * 5 + 4;
            lean += Math.sin(phase * 0.7) * 7;
            scaleX += Math.sin(phase * 0.8) * 0.035;
        } else if (enemy.kind === 'jiangshi') {
            const hop = Math.max(0, Math.sin(phase));
            bob = hop * (speedMultiplier > 1 ? 15 : 7);
            lean += direction.x * (speedMultiplier > 1 ? -13 : -5);
            scaleY += hop * 0.08;
            scaleX -= hop * 0.045;
        } else {
            const breath = Math.sin(enemy.age * 2.1);
            bob = Math.abs(Math.sin(enemy.age * 2.8)) * 3;
            scaleX += breath * 0.04;
            scaleY -= breath * 0.025;
            lean += Math.sin(enemy.age * 1.4) * 2;
            if (enemy.castTimer > 0) {
                const cast = Math.sin((1 - enemy.castTimer / 0.85) * Math.PI);
                scaleX += cast * 0.11;
                scaleY += cast * 0.08;
                lean += Math.sin(enemy.castTimer * 45) * 3;
            }
        }
        enemy.node.getChildByName('BossAura')?.setRotationFromEuler(
            0,
            0,
            -this.elapsed * (enemy.champion ? 24 : 15),
        );

        if (enemy.hitTimer > 0) {
            const impact = Math.min(1, enemy.hitTimer / 0.14);
            scaleX += impact * 0.14;
            scaleY -= impact * 0.12;
            lean += Math.sin(enemy.hitTimer * 110) * 7;
        }

        const spawnProgress = 1 - Math.min(enemy.spawnTimer / 0.28, 1);
        const spawnEase = 1 - Math.pow(1 - spawnProgress, 3);
        enemy.opacity.opacity = Math.round(255 * spawnEase);
        enemy.visual.setPosition(0, enemy.baseVisualY + bob);
        enemy.visual.setScale(
            enemy.baseScale * facing * scaleX * Math.max(0.15, spawnEase),
            enemy.baseScale * scaleY * Math.max(0.15, spawnEase),
        );
        enemy.visual.angle = lean;
        const sprite = enemy.visual.getComponent(Sprite);
        if (sprite) {
            const veinPosition = this.spiritVeinVisual?.node.isValid
                ? this.spiritVeinVisual.node.position
                : undefined;
            const insideEliteVein = this.currentStage.mapId === 'qingshi-road'
                && this.waveIndex === 1
                && isInsideQingshiEliteVein(enemy.node.position, veinPosition);
            sprite.color = enemy.hitTimer > 0
                ? new Color(255, 128, 112, 255)
                : enemy.encounterStaggerTimer > 0
                    ? new Color(201, 248, 213, 255)
                    : insideEliteVein
                        ? new Color(255, 225, 142, 255)
                        : Color.WHITE;
        }
    }

    private updateBossAnimationFrame(enemy: EnemyState, moving: boolean): boolean {
        const frames = this.getBossAnimationFrames();
        if (enemy.kind !== 'shanxiao' || frames.length === 0) return false;
        const frame = resolveBossAnimationFrame({
            age: enemy.age,
            moving,
            castTimer: enemy.castTimer,
            hitTimer: enemy.hitTimer,
            enrageTimer: enemy.enrageTimer,
        });
        const frameIndex = frame.row * ENEMY_ANIMATION_COLUMNS + frame.column;
        if (frameIndex !== enemy.animationFrameIndex) {
            const sprite = enemy.visual.getComponent(Sprite);
            const spriteFrame = frames[frameIndex];
            if (sprite && spriteFrame) sprite.spriteFrame = spriteFrame;
            enemy.animationFrameIndex = frameIndex;
        }
        return true;
    }

    private updateEnemyDeath(enemy: EnemyState, dt: number): void {
        if (this.bossFinishEnemy === enemy) {
            // 关底首领先用动作表真实踉跄帧跪伏；若仍有援军，保持该姿态直到战场真正清空。
            enemy.deathTimer = Math.min(enemy.deathTimer + dt, 0.42);
            const frame = bossFinishFrameFor(enemy.deathTimer);
            const frames = this.getBossAnimationFrames();
            const sprite = enemy.visual.getComponent(Sprite);
            const spriteFrame = frames[frame.row * ENEMY_ANIMATION_COLUMNS + frame.column];
            if (sprite && spriteFrame) sprite.spriteFrame = spriteFrame;
            enemy.opacity.opacity = 230;
            enemy.visual.setPosition(0, enemy.baseVisualY - Math.min(enemy.deathTimer / 0.3, 1) * 10);
            enemy.visual.setScale(enemy.baseScale * 1.03, enemy.baseScale * 0.92);
            enemy.visual.angle = -4;
            this.tryStartBossFinish();
            return;
        }
        // 死亡阶段保留碰撞实体一小段时间用于播放退场，但 dead 标记会阻止重复伤害与重复结算。
        enemy.deathTimer += dt;
        const progress = Math.min(enemy.deathTimer / 0.42, 1);
        const currentScale = enemy.visual.scale;
        const sign = currentScale.x < 0 ? -1 : 1;
        enemy.opacity.opacity = Math.round(255 * (1 - progress));
        enemy.visual.setPosition(0, enemy.baseVisualY + progress * 22);
        enemy.visual.setScale(
            sign * enemy.baseScale * (1 + progress * 0.28),
            enemy.baseScale * Math.max(0.08, 1 - progress * 0.88),
        );
        enemy.visual.angle += dt * 150 * sign;
        if (progress >= 1 && enemy.node.isValid) enemy.node.destroy();
    }

    private damagePlayer(
        amount: number,
        source?: Readonly<Vec3>,
        cause: RunDamageCause = 'enemy-contact',
    ): void {
        // 接触伤害改为带无敌帧的离散命中，避免贴身时每帧扣血，并统一触发震屏、闪红与击退。
        if (this.playerInvulnerableTimer > 0 || this.phase !== 'playing') return;
        const shieldBefore = this.cultivationShield;
        const absorbed = Math.min(this.cultivationShield, amount);
        this.cultivationShield = Math.max(0, this.cultivationShield - amount);
        const remainingDamage = Math.max(0, amount - absorbed);
        const appliedDamage = Math.min(this.hp, remainingDamage);
        this.hp = Math.max(0, this.hp - remainingDamage);
        this.runStats.recordDamageTaken(appliedDamage, cause);
        if (this.combatFlow.breakFlow()) {
            this.createAbilityHint('剑势中断 · 重新起势', new Color('#D9A08F'));
        }
        this.playerInvulnerableTimer = 0.42;
        this.playerHitTimer = 0.24;
        this.actions.enter('hit', 0.24);
        this.cameraShakeTimer = 0.2;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 8);
        this.createScreenFlash(new Color(190, 49, 45, 92), 0.18);
        this.createHitBurst(this.player.position, new Color('#FCA5A5'), 30, false);
        // 挨打也要顿一下：连斩被打断的那一刻必须能被身体感知到，而不只是数字变少。
        this.triggerHitStop('light');
        this.platformFeedback.playCue('player-hit');
        if (shieldBefore > 0 && this.cultivationShield <= 0) this.triggerCultivationShieldBurst();

        if (source) {
            const knockback = this.player.position.clone().subtract(source);
            if (knockback.lengthSqr() > 0.001) {
                knockback.normalize().multiplyScalar(18);
                this.player.setPosition(this.constrainToRoad(
                    new Vec3(this.player.position.x + knockback.x, this.player.position.y + knockback.y),
                    28,
                ));
            }
        }

        if (this.hp <= 0) this.finish(false);
    }

    private createBossAbility(enemy: EnemyState): void {
        if (!enemy.node.isValid) return;
        this.platformFeedback.playCue('boss-cast', enemy.bossPhase);
        const pattern = bossAbilityPatternFor(this.currentStage.mapId, enemy.bossPhase);
        const castIndex = this.bossCastIndex;
        this.bossCastIndex += 1;
        this.createWorldHint(
            `${pattern.title} · ${pattern.cue}`,
            enemy.node.position,
            new Color(
                pattern.kind === 'frost-tide-slam'
                    ? '#C9F8FF'
                    : pattern.kind === 'bamboo-pincer'
                        ? '#D9F99D'
                        : '#FFE09A',
            ),
        );

        if (pattern.kind === 'bamboo-pincer') {
            this.createBambooBossPincer(enemy, castIndex);
            return;
        }
        if (pattern.kind === 'frost-tide-slam') {
            // 寒渊每次重击都把环境潮时钟推进到预警，局部落印与横向寒潮形成连续两段走位题。
            this.frostTide.triggerWarning();
            this.createBossPulseAt(
                this.constrainToRoad(this.player.position, 112),
                0,
                pattern.triggerAt,
                pattern.life,
                enemy.bossPhase === 2 ? 132 : 116,
                enemy.abilityDamage * pattern.damageMultiplier,
                pattern.kind,
            );
            return;
        }

        const placements = qingshiSealPlacementsFor(
            { x: this.player.position.x, y: this.player.position.y },
            castIndex,
            enemy.bossPhase,
        );
        placements.forEach((placement, index) => {
            this.createBossPulseAt(
                this.constrainToRoad(new Vec3(placement.x, placement.y), 72),
                index,
                pattern.triggerAt + index * (enemy.bossPhase === 2 ? 0.13 : 0.17),
                pattern.life + index * (enemy.bossPhase === 2 ? 0.13 : 0.17),
                enemy.bossPhase === 2 ? 76 : 68,
                enemy.abilityDamage * pattern.damageMultiplier,
                pattern.kind,
            );
        });
    }

    private createBossPulseAt(
        position: Readonly<Vec3>,
        sequenceIndex: number,
        triggerAt: number,
        life: number,
        radius: number,
        damage: number,
        kind: BossPulseState['kind'],
    ): void {
        const node = new Node('BossPulse');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const graphics = node.addComponent(Graphics);
        this.battleLayer.addChild(node);
        this.bossPulses.push({
            node,
            graphics,
            kind,
            sequenceIndex,
            elapsed: 0,
            triggerAt,
            life,
            radius,
            damage,
            applied: false,
        });
    }

    private createBambooBossPincer(enemy: EnemyState, castIndex: number): void {
        const pattern = bossAbilityPatternFor(this.currentStage.mapId, enemy.bossPhase);
        const gap = bambooPincerGapFor(castIndex, enemy.bossPhase);
        const node = new Node('BambooBossPincer');
        node.layer = Layers.Enum.UI_2D;
        const graphics = node.addComponent(Graphics);
        const opacity = node.addComponent(UIOpacity);
        const minY = 18;
        const maxY = 492;
        for (const x of [gap.centerX - gap.halfWidth, gap.centerX + gap.halfWidth]) {
            for (const y of [105, 258, 411]) {
                const marker = this.createResourceSprite(BAMBOO_BARRICADE_ASSET.resourcePath, 74);
                marker.setPosition(x, y);
                node.addChild(marker);
            }
        }
        this.battleLayer.addChild(node);
        this.bossPincers.push({
            node,
            graphics,
            opacity,
            elapsed: 0,
            triggerAt: pattern.triggerAt,
            life: pattern.life,
            gapCenterX: gap.centerX,
            gapHalfWidth: gap.halfWidth,
            minY,
            maxY,
            damage: enemy.abilityDamage * pattern.damageMultiplier,
            applied: false,
        });
    }

    private enterBossPhaseTwo(enemy: EnemyState): void {
        if (enemy.bossPhase === 2 || enemy.dead) return;
        // 二阶段只在血线首次越过 55% 时触发：锁住动作、召援并缩短震地间隔，避免每帧重复转阶段。
        const frozenBoss = this.currentStage.mapId === 'frozen-ruins';
        enemy.bossPhase = 2;
        this.platformFeedback.playCue('boss-phase', this.selectedStageIndex);
        enemy.enrageTimer = 1.05;
        enemy.abilityInterval = Math.max(2.15, enemy.abilityInterval * 0.7);
        enemy.abilityTimer = this.hasLocalQaFlag('qaBossAbility=1') ? 0.42 : 1.15;
        enemy.speed *= 1.12;
        this.createWorldHint(
            frozenBoss ? '寒狱狂相 · 唤潮凝霜' : '魇兽狂相 · 竹影增援',
            enemy.node.position,
            new Color(frozenBoss ? '#C9F8FF' : '#FFE09A'),
        );
        this.createScreenFlash(
            frozenBoss ? new Color(112, 222, 238, 70) : new Color(190, 72, 42, 76),
            0.42,
        );
        this.cameraShakeTimer = 0.48;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 15);
        // 转相是一章的情绪拐点，用最重的一档停顿把"它变强了"钉在玩家眼前。
        this.triggerHitStop('finisher');
        // 寒渊形态以环境机制作为转阶段招式，保留一秒预警给玩家滑出浪线。
        if (frozenBoss) this.frostTide.triggerWarning();
        // 终结演出视觉回归入口固定为单首领战，避免召援随机清怪时机让截图漂移；正式流程仍保留召援清场规则。
        if (!this.hasLocalQaFlag('qaBossFinish=1')) {
            this.spawnBossReinforcements(enemy);
        }
        this.showBossPhaseTransition(enemy);
    }

    private showBossPhaseTransition(enemy: EnemyState): void {
        const presentation = bossPhasePresentationFor(this.currentStage.mapId, enemy.bossPhase);
        const holdForQa = this.hasLocalQaFlag('qaBossPhaseReveal=1');
        const reveal = new Node('BossPhaseTransition');
        reveal.layer = Layers.Enum.UI_2D;
        const veil = this.makeRect(
            this.visibleDesignWidth(),
            this.designHeight,
            new Color(2, 7, 10, 118),
        );
        const veilOpacity = veil.addComponent(UIOpacity);
        reveal.addChild(veil);

        const aura = new Node('BossPhaseAura');
        aura.layer = Layers.Enum.UI_2D;
        aura.setPosition(enemy.node.position);
        const auraOpacity = aura.addComponent(UIOpacity);
        const auraGraphics = aura.addComponent(Graphics);
        auraGraphics.strokeColor = new Color(presentation.tone);
        auraGraphics.lineWidth = 7;
        auraGraphics.circle(0, 0, 78);
        auraGraphics.stroke();
        auraGraphics.lineWidth = 2;
        auraGraphics.circle(0, 0, 108);
        auraGraphics.stroke();
        for (let index = 0; index < 8; index += 1) {
            const angle = index * Math.PI / 4;
            auraGraphics.moveTo(Math.cos(angle) * 64, Math.sin(angle) * 64);
            auraGraphics.lineTo(Math.cos(angle) * 134, Math.sin(angle) * 134);
            auraGraphics.stroke();
        }
        reveal.addChild(aura);

        const card = this.makeRect(
            540,
            124,
            new Color(12, 7, 10, 232),
            new Color(presentation.tone),
            18,
            3,
        );
        card.name = 'BossPhaseCard';
        card.setPosition(0, 205);
        const opacity = card.addComponent(UIOpacity);
        const title = this.makeLabel(presentation.transitionTitle, 28, new Color('#FFF1C8'));
        title.node.setPosition(0, 18);
        title.node.getComponent(UITransform)?.setContentSize(500, 42);
        card.addChild(title.node);
        const detail = this.makeLabel(presentation.transitionDetail, 17, new Color(presentation.tone));
        detail.node.setPosition(0, -24);
        detail.node.getComponent(UITransform)?.setContentSize(480, 30);
        card.addChild(detail.node);
        reveal.addChild(card);
        this.screenFxLayer.addChild(reveal);
        // 转相用暗场、首领冲击环和信息卡收束为完整节拍；首领锁招仍是既有 1.05 秒，不新增无敌帧。
        this.effects.push({
            node: reveal,
            elapsed: 0,
            // 本地视觉回归可固定峰值帧；正式流程仍严格维持 1.05 秒的非阻塞转场。
            life: holdForQa ? 30 : 1.05,
            update: (progress) => {
                if (holdForQa) {
                    opacity.opacity = 255;
                    veilOpacity.opacity = 210;
                    auraOpacity.opacity = 255;
                    aura.setScale(1.2, 1.2);
                    card.setPosition(0, 205);
                    card.setScale(1, 1);
                    return;
                }
                const fade = progress < 0.14
                    ? progress / 0.14
                    : progress > 0.76
                        ? (1 - progress) / 0.24
                        : 1;
                opacity.opacity = Math.round(255 * Math.max(0, fade));
                veilOpacity.opacity = Math.round(190 * Math.max(0, fade));
                const auraFade = progress > 0.7 ? (1 - progress) / 0.3 : 1;
                auraOpacity.opacity = Math.round(255 * Math.max(0, auraFade));
                const auraScale = 0.5 + Math.min(progress / 0.3, 1) * 0.9;
                aura.setScale(auraScale, auraScale);
                aura.angle = progress * 24;
                card.setPosition(0, 188 + Math.min(progress / 0.22, 1) * 17);
                const scale = 0.92 + Math.min(progress / 0.2, 1) * 0.08;
                card.setScale(scale, scale);
            },
        });
    }

    private spawnBossReinforcements(enemy: EnemyState): void {
        const frozenStage = this.currentStage.mapId === 'frozen-ruins';
        const bambooStage = this.currentStage.mapId === 'bamboo-ambush';
        const reinforcement: WaveConfig = {
            enemyKind: bambooStage ? 'foxSpirit' : frozenStage ? 'jiangshi' : 'mountainSpirit',
            behavior: bambooStage ? 'weaver' : frozenStage ? 'lunger' : 'chaser',
            title: frozenStage ? '冻尸增援' : '魇影增援',
            objective: '',
            spiritVein: 'sword',
            count: 2,
            hp: 64,
            speed: 108,
            damage: 11,
            radius: 26,
            xp: 12,
            spawnInterval: 0,
        };
        // 援军属于首领技能，不计入波次出生数；死亡后仍由 enemies 清空条件统一收尾。
        for (let index = 0; index < reinforcement.count; index += 1) this.spawnEnemy(reinforcement);
        enemy.node.setSiblingIndex(this.battleLayer.children.length - 1);
    }

    private createWorldHint(text: string, position: Readonly<Vec3>, color: Color): void {
        const label = this.makeLabel(text, 22, color);
        const node = label.node;
        node.name = 'WorldHint';
        node.setPosition(position.x, position.y + 112);
        const opacity = node.addComponent(UIOpacity);
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 1.15,
            update: (progress) => {
                node.setPosition(position.x, position.y + 112 + progress * 34);
                opacity.opacity = Math.round(255 * (1 - progress));
            },
        });
    }

    private updateBossPulses(dt: number): void {
        for (const pulse of this.bossPulses) {
            pulse.elapsed += dt;
            const progress = Math.min(pulse.elapsed / pulse.triggerAt, 1);
            const frozenPulse = pulse.kind === 'frost-tide-slam';
            pulse.graphics.clear();
            pulse.graphics.fillColor = frozenPulse
                ? new Color(74, 181, 207, Math.round((pulse.applied ? 32 : 12) + progress * 28))
                : new Color(190, 132, 58, Math.round((pulse.applied ? 30 : 10) + progress * 30));
            pulse.graphics.circle(0, 0, Math.max(8, pulse.radius * progress));
            pulse.graphics.fill();
            pulse.graphics.strokeColor = frozenPulse
                ? new Color(139, 226, 238, pulse.applied ? 90 : 210)
                : new Color(242, 196, 103, pulse.applied ? 90 : 220);
            pulse.graphics.lineWidth = pulse.applied ? 7 : 4;
            pulse.graphics.circle(0, 0, Math.max(8, pulse.radius * progress));
            pulse.graphics.stroke();
            if (!pulse.applied) {
                pulse.graphics.strokeColor = frozenPulse
                    ? new Color(207, 250, 254, 160)
                    : new Color(255, 236, 174, 170);
                pulse.graphics.lineWidth = 2;
                pulse.graphics.circle(0, 0, Math.max(6, pulse.radius * progress * 0.72));
                pulse.graphics.stroke();
            }

            if (!pulse.applied && pulse.elapsed >= pulse.triggerAt) {
                pulse.applied = true;
                this.cameraShakeTimer = 0.28;
                this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 11);
                this.createGroundBurst(pulse.node.position, pulse.radius);
                if (Vec3.distance(this.player.position, pulse.node.position) <= pulse.radius + 27) {
                    if (!this.shouldStartBossPreview()) this.playerInvulnerableTimer = 0;
                    this.damagePlayer(
                        pulse.damage,
                        pulse.node.position,
                        pulse.kind === 'frost-tide-slam' ? 'boss-frost-slam' : 'boss-ground-slam',
                    );
                }
            }
        }

        this.bossPulses = this.bossPulses.filter((pulse) => {
            if (pulse.elapsed < pulse.life && pulse.node.isValid) return true;
            if (pulse.node.isValid) pulse.node.destroy();
            return false;
        });
    }

    private updateBossPincers(dt: number): void {
        for (const pincer of this.bossPincers) {
            pincer.elapsed += dt;
            const progress = Math.min(pincer.elapsed / pincer.triggerAt, 1);
            const gapLeft = pincer.gapCenterX - pincer.gapHalfWidth;
            const gapRight = pincer.gapCenterX + pincer.gapHalfWidth;
            const height = pincer.maxY - pincer.minY;
            pincer.graphics.clear();
            pincer.graphics.fillColor = new Color(48, 96, 69, Math.round(12 + progress * 46));
            pincer.graphics.rect(-270, pincer.minY, Math.max(0, gapLeft + 270), height);
            pincer.graphics.fill();
            pincer.graphics.rect(gapRight, pincer.minY, Math.max(0, 270 - gapRight), height);
            pincer.graphics.fill();
            pincer.graphics.strokeColor = new Color(185, 236, 178, pincer.applied ? 110 : 228);
            pincer.graphics.lineWidth = pincer.applied ? 7 : 4;
            pincer.graphics.moveTo(gapLeft, pincer.minY);
            pincer.graphics.lineTo(gapLeft, pincer.maxY);
            pincer.graphics.moveTo(gapRight, pincer.minY);
            pincer.graphics.lineTo(gapRight, pincer.maxY);
            pincer.graphics.stroke();
            pincer.opacity.opacity = pincer.applied
                ? Math.round(255 * Math.max(
                    0,
                    (pincer.life - pincer.elapsed) / (pincer.life - pincer.triggerAt),
                ))
                : 255;

            if (!pincer.applied && pincer.elapsed >= pincer.triggerAt) {
                pincer.applied = true;
                this.cameraShakeTimer = 0.32;
                this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 12);
                this.createHitBurst(
                    new Vec3(gapLeft, this.player.position.y),
                    new Color('#B7E4C7'),
                    54,
                    true,
                );
                this.createHitBurst(
                    new Vec3(gapRight, this.player.position.y),
                    new Color('#B7E4C7'),
                    54,
                    true,
                );
                if (isInsideBambooPincerDanger(
                    { x: this.player.position.x, y: this.player.position.y },
                    { centerX: pincer.gapCenterX, halfWidth: pincer.gapHalfWidth },
                    pincer.minY,
                    pincer.maxY,
                )) {
                    if (!this.shouldStartBossPreview()) this.playerInvulnerableTimer = 0;
                    this.damagePlayer(
                        pincer.damage,
                        new Vec3(pincer.gapCenterX, this.player.position.y),
                        'boss-bamboo-pincer',
                    );
                }
            }
        }

        this.bossPincers = this.bossPincers.filter((pincer) => {
            if (pincer.elapsed < pincer.life && pincer.node.isValid) return true;
            if (pincer.node.isValid) pincer.node.destroy();
            return false;
        });
    }

    private updateAttacks(dt: number): void {
        this.attackTimer -= dt;
        if (this.attackTimer > 0 || this.enemies.length === 0) return;
        const target = this.findNearestEnemy();
        if (!target) return;
        for (let i = 0; i < this.swordCount; i += 1) {
            const spread = (i - (this.swordCount - 1) / 2) * 0.16;
            this.fireSword(target, spread);
        }
        this.triggerCultivationRelicVolley(target);
        this.attackTimer = this.currentAttackInterval();
    }

    private triggerCultivationRelicVolley(target: EnemyState): void {
        const build = resolveCultivationBuild((id) => this.skills.getLevel(id));
        const pulse = resolveRelicPulse(build);
        if (!pulse) {
            this.cultivationRelicVolley = 0;
            return;
        }
        this.cultivationRelicVolley += 1;
        if (this.cultivationRelicVolley % pulse.cadence !== 0) return;
        const color = new Color(build.path ? UPGRADE_PATH_COLORS[build.path] : '#F0C879');
        if (pulse.kind === 'sword-echo') {
            const amount = Math.max(1, Math.round(pulse.magnitude));
            for (let index = 0; index < amount; index += 1) {
                this.fireSword(target, (index - (amount - 1) / 2) * 0.28, 0.58);
            }
            this.createScreenFlash(new Color(color.r, color.g, color.b, 24), 0.16);
        } else if (pulse.kind === 'thunder-brand') {
            target.thunderMarkTimer = 5;
            this.createHitBurst(target.node.position, color, 42, true);
            // 雷篆初醒就连锁四名目标，选择后第一轮普攻即可验证“天雷”不是隐藏倍率。
            const visited = new Set<Node>([target.node]);
            let previous = target;
            const secondaryTargets = build.tier >= 3 ? 5 : 3;
            for (let index = 0; index < secondaryTargets; index += 1) {
                const chain = this.findNearestEnemyFrom(previous.node.position, visited);
                if (!chain) break;
                visited.add(chain.node);
                this.createLightningArc(previous.node.position, chain.node.position, color);
                this.createHitBurst(chain.node.position, color, 34 + build.tier * 3, true);
                this.dealSkillDamage(chain, this.currentSwordDamage() * pulse.magnitude, color, 38, 'environment');
                previous = chain;
            }
        } else {
            this.grantCultivationShield(pulse.magnitude);
            this.createSwordFormationEffect(this.player.position, 74, 3 + build.tier);
        }
        this.createAbilityHint(pulse.label, color);
    }

    private createLightningArc(from: Readonly<Vec3>, to: Readonly<Vec3>, color: Color): void {
        const node = new Node('CultivationLightningArc');
        node.layer = Layers.Enum.UI_2D;
        const opacity = node.addComponent(UIOpacity);
        const graphics = node.addComponent(Graphics);
        const midX = (from.x + to.x) / 2 + (to.y - from.y) * 0.08;
        const midY = (from.y + to.y) / 2 - (to.x - from.x) * 0.08;
        graphics.strokeColor = new Color(color.r, color.g, color.b, 235);
        graphics.lineWidth = 7;
        graphics.moveTo(from.x, from.y);
        graphics.lineTo(midX, midY);
        graphics.lineTo(to.x, to.y);
        graphics.stroke();
        graphics.strokeColor = new Color(236, 232, 255, 245);
        graphics.lineWidth = 2;
        graphics.moveTo(from.x, from.y);
        graphics.lineTo(midX, midY);
        graphics.lineTo(to.x, to.y);
        graphics.stroke();
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.26,
            update: (progress) => {
                opacity.opacity = Math.round(255 * (1 - progress));
            },
        });
    }

    private fireSword(target: EnemyState, spread: number, damageScale = 1): void {
        this.actions.enter('autoAttack', 0.22);
        this.platformFeedback.playCue('sword-cast', this.swordCount);
        const visualTone = this.cultivationVisualTone();
        const node = new Node('FlyingSword');
        node.layer = Layers.Enum.UI_2D;
        const glow = new Node('SwordGlow');
        glow.layer = Layers.Enum.UI_2D;
        const glowGraphics = glow.addComponent(Graphics);
        glowGraphics.strokeColor = new Color(visualTone.color.r, visualTone.color.g, visualTone.color.b, 92 + visualTone.tier * 25);
        glowGraphics.lineWidth = 11 + visualTone.tier * 3;
        glowGraphics.moveTo(-15 - visualTone.tier * 3, 0);
        glowGraphics.lineTo(18 + visualTone.tier * 5, 0);
        glowGraphics.stroke();
        node.addChild(glow);
        if (this.swordFrame) {
            const sprite = node.addComponent(Sprite);
            sprite.spriteFrame = this.swordFrame;
            const projectileScale = 0.42 + visualTone.tier * 0.035;
            node.setScale(projectileScale, projectileScale);
        } else {
            const g = node.addComponent(Graphics);
            g.strokeColor = new Color('#BAE6FD');
            g.lineWidth = 7;
            g.moveTo(-18, 0);
            g.lineTo(22, 0);
            g.stroke();
        }
        node.setPosition(this.player.position);
        const delta = new Vec2(target.node.position.x - node.position.x, target.node.position.y - node.position.y);
        const angle = Math.atan2(delta.y, delta.x) + spread;
        if (Math.abs(delta.x) > 0.01) this.playerFacing = delta.x >= 0 ? 1 : -1;
        this.playerAttackTimer = 0.22;
        node.angle = angle * 180 / Math.PI - 45;
        this.battleLayer.addChild(node);
        this.createSwordCast(this.player.position, angle);
        this.projectiles.push({
            node,
            velocity: new Vec3(Math.cos(angle) * 520, Math.sin(angle) * 520),
            damage: this.currentSwordDamage() * damageScale,
            radius: 16 + visualTone.tier * 2,
            life: 1.6,
            hit: new Set<Node>(),
            trailTimer: 0,
            piercesRemaining: 0,
            canReturn: this.hasTrait('returning-sword'),
        });
    }

    private updateProjectiles(dt: number): void {
        for (const projectile of this.projectiles) {
            projectile.life -= dt;
            projectile.trailTimer -= dt;
            const previousPosition = projectile.node.position.clone();
            projectile.node.setPosition(previousPosition.clone().add(projectile.velocity.clone().multiplyScalar(dt)));
            if (projectile.trailTimer <= 0) {
                this.createSwordTrail(previousPosition, projectile.node.position);
                projectile.trailTimer = 0.045;
            }
            const barrier = this.mapObstacles.findSegmentHit(previousPosition, projectile.node.position, projectile.radius);
            if (barrier) {
                this.damageMapObstacle(barrier, projectile.damage);
                projectile.life = 0;
                continue;
            }
            for (const enemy of this.enemies) {
                // 同帧可能有多把飞剑命中；前一把已销毁敌人时，后续飞剑必须跳过失效节点。
                if (!enemy.node.isValid || enemy.dead) continue;
                if (projectile.hit.has(enemy.node)) continue;
                if (Vec3.distance(projectile.node.position, enemy.node.position) > projectile.radius + enemy.radius) continue;
                projectile.hit.add(enemy.node);
                const marked = (enemy.swordMarkStacks ?? 0) > 0;
                const swordMarkMultiplier = marked && this.hasTrait('sword-mark') ? 1.25 : 1;
                this.dealSkillDamage(
                    enemy,
                    projectile.damage * swordMarkMultiplier,
                    this.cultivationVisualTone().color,
                    (enemy.elite ? 42 : enemy.champion ? 36 : 28) + this.cultivationVisualTone().tier * 3,
                    'sword',
                );
                if (this.hasTrait('sword-mark')) enemy.swordMarkStacks = 1;
                if (enemy.dead) this.onCultivationSwordKill(enemy);
                const returnTarget = projectile.canReturn
                    ? this.findNearestEnemyFrom(projectile.node.position, projectile.hit)
                    : undefined;
                if (returnTarget) {
                    projectile.canReturn = false;
                    const returnDirection = returnTarget.node.position.clone().subtract(projectile.node.position).normalize();
                    projectile.velocity.set(returnDirection.x * 560, returnDirection.y * 560, 0);
                    projectile.node.angle = Math.atan2(returnDirection.y, returnDirection.x) * 180 / Math.PI - 45;
                    projectile.life = Math.max(projectile.life, 0.72);
                } else if ((projectile.piercesRemaining ?? 0) > 0) {
                    projectile.piercesRemaining = Math.max(0, (projectile.piercesRemaining ?? 0) - 1);
                } else {
                    projectile.life = 0;
                }
                break;
            }
        }
        this.projectiles = this.projectiles.filter((p) => {
            if (p.life > 0 && p.node.isValid) return true;
            if (p.node.isValid) p.node.destroy();
            return false;
        });
        this.enemies = this.enemies.filter((enemy) => enemy.node.isValid);
    }

    private findNearestEnemyFrom(position: Readonly<Vec3>, excluded: ReadonlySet<Node>): EnemyState | undefined {
        return this.enemies.reduce<EnemyState | undefined>((nearest, enemy) => {
            if (!enemy.node.isValid || enemy.dead || excluded.has(enemy.node)) return nearest;
            if (!nearest) return enemy;
            return Vec3.distance(position, enemy.node.position) < Vec3.distance(position, nearest.node.position)
                ? enemy
                : nearest;
        }, undefined);
    }

    private onCultivationSwordKill(enemy: EnemyState): void {
        const lifeLevel = this.skills.getLevel('endless-life');
        if (lifeLevel > 0) {
            // 三级分别回 2 / 3 / 5 点，满级的溢出部分由 healCultivation 转为护体。
            const restore = lifeLevel >= 3 ? 5 : lifeLevel === 2 ? 3 : 2;
            this.healCultivation(enemy.elite ? restore * 2 : restore);
        }
    }

    private killEnemy(enemy: EnemyState): void {
        if (enemy.dead) return;
        const finalWave = this.waveIndex >= this.currentStage.waves.length - 1;
        const deferUpgrade = shouldDeferUpgradeForKill(enemy.behavior, finalWave);
        enemy.dead = true;
        this.runStats.recordEnemyDefeated();
        const flowKill = this.combatFlow.recordKill(enemy.elite ? 3 : enemy.champion ? 2 : 1);
        this.runStats.recordCombatFlow(flowKill.snapshot.bestCombo, flowKill.snapshot.peakTier);
        if (flowKill.tierAdvanced) {
            const tone = this.cultivationVisualTone().color;
            this.createAbilityHint(
                `${flowKill.snapshot.label} · ${flowKill.snapshot.combo}连斩`,
                tone,
            );
            this.createScreenFlash(
                new Color(tone.r, tone.g, tone.b, 24 + flowKill.snapshot.tier * 12),
                0.18 + flowKill.snapshot.tier * 0.04,
            );
            this.platformFeedback.playComboMilestone(flowKill.snapshot.tier);
        }
        enemy.hp = 0;
        enemy.hpBar.node.active = false;
        if (deferUpgrade) {
            // 关底之后没有下一场战斗，经验选择会打断最后一击；奖励统一交给终结链和战报承接。
            this.bossFinishEnemy = enemy;
            this.bossFinishStarted = false;
        } else {
            this.gainXp(enemy.xp);
            this.createDeathBurst(enemy.node.position, enemy.elite ? 74 : enemy.champion ? 58 : 42);
            this.createXpWisp(enemy.node.position);
        }
        this.skills.addTribulationCharge(enemy.elite ? 0.22 : enemy.champion ? 0.14 : 0.08);
        this.cameraShakeTimer = enemy.elite ? 0.42 : enemy.champion ? 0.22 : 0.1;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, enemy.elite ? 14 : enemy.champion ? 8 : 4);
        // 斩杀顿帧按目标价值分档：杂兵只给一帧半，关底才配得上慢放收束。
        this.triggerHitStop(enemy.elite ? 'finisher' : enemy.champion ? 'heavy' : 'light');
        this.tryStartBossFinish();
    }

    private tryStartBossFinish(): void {
        const enemy = this.bossFinishEnemy;
        if (!enemy || this.bossFinishStarted || this.phase !== 'playing') return;
        const livingReinforcement = this.enemies.some((candidate) => (
            candidate !== enemy
            && candidate.node.isValid
            && !candidate.dead
        ));
        if (livingReinforcement) return;

        // 最后一只援军倒下后才锁定战场，确保“首领与召援一同清场”的既有胜利条件不被绕过。
        this.bossFinishStarted = true;
        this.phase = 'boss-finish';
        this.waveFinished = true;
        this.releaseTribulationHold();
        this.projectiles.forEach((projectile) => {
            if (projectile.node.isValid) projectile.node.destroy();
        });
        this.projectiles = [];
        this.bossPulses.forEach((pulse) => {
            if (pulse.node.isValid) pulse.node.destroy();
        });
        this.bossPulses = [];
        this.bossPincers.forEach((pincer) => {
            if (pincer.node.isValid) pincer.node.destroy();
        });
        this.bossPincers = [];
        this.createBossFinishPresentation(enemy);
    }

    private bossFinishEffectFrames(): SpriteFrame[] {
        if (this.currentStage.mapId === 'bamboo-ambush') {
            return this.bambooShadowCommitAnimationFrames;
        }
        if (this.currentStage.mapId === 'frozen-ruins') {
            return this.frostImpactAnimationFrames;
        }
        return this.qingshiSteleCommitAnimationFrames;
    }

    private createBossFinishPresentation(enemy: EnemyState): void {
        const pattern = bossFinishPatternFor(this.currentStage.mapId);
        const accent = new Color(pattern.tone);
        const reveal = new Node(`BossFinish-${pattern.kind}`);
        reveal.layer = Layers.Enum.UI_2D;

        const veil = this.makeRect(
            this.designWidth,
            this.designHeight,
            new Color(2, 10, 14, 58),
        );
        reveal.addChild(veil);

        const burstNode = new Node('BossFinishSequence');
        burstNode.layer = Layers.Enum.UI_2D;
        burstNode.setPosition(enemy.node.position);
        const burstOpacity = burstNode.addComponent(UIOpacity);
        const burstSprite = burstNode.addComponent(Sprite);
        burstSprite.sizeMode = Sprite.SizeMode.RAW;
        const burstFrames = this.bossFinishEffectFrames();
        const targetDiameter = pattern.kind === 'frost-shatter' ? 330 : pattern.kind === 'bamboo-release' ? 270 : 250;
        const frameHeight = Math.max(burstFrames[0]?.originalSize.height ?? targetDiameter, 1);
        const burstScale = targetDiameter / frameHeight;
        burstNode.setScale(burstScale, burstScale);
        reveal.addChild(burstNode);

        const panel = this.makeRect(
            468,
            112,
            new Color(4, 19, 23, 232),
            new Color(accent.r, accent.g, accent.b, 220),
            22,
            2,
        );
        panel.setPosition(0, 222);
        const panelOpacity = panel.addComponent(UIOpacity);
        panelOpacity.opacity = 0;
        const title = this.makeLabel(pattern.title, 32, new Color('#FFF1C5'));
        title.node.setPosition(0, 18);
        panel.addChild(title.node);
        const detail = this.makeLabel(pattern.detail, 17, accent);
        detail.node.setPosition(0, -25);
        detail.node.getComponent(UITransform)?.setContentSize(320, 28);
        panel.addChild(detail.node);
        reveal.addChild(panel);
        this.screenFxLayer.addChild(reveal);

        this.createScreenFlash(new Color(accent.r, accent.g, accent.b, 58), 0.34);
        this.createHitBurst(enemy.node.position, accent, 112, true);
        this.cameraShakeTimer = 0.5;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 16);

        this.effects.push({
            node: reveal,
            elapsed: 0,
            life: pattern.duration,
            update: (progress) => {
                const elapsed = progress * pattern.duration;
                const finishFrame = bossFinishFrameFor(elapsed);
                const bossFrames = this.getBossAnimationFrames();
                const bossSprite = enemy.visual.getComponent(Sprite);
                const bossFrame = bossFrames[
                    finishFrame.row * ENEMY_ANIMATION_COLUMNS + finishFrame.column
                ];
                if (bossSprite && bossFrame) bossSprite.spriteFrame = bossFrame;

                if (burstFrames.length === 4) {
                    const burstProgress = Math.max(0, (elapsed - pattern.burstAt) / 0.72);
                    burstSprite.spriteFrame = burstFrames[
                        Math.min(3, Math.floor(Math.min(burstProgress, 0.999) * 4))
                    ];
                    const burstFade = burstProgress < 0.12
                        ? burstProgress / 0.12
                        : Math.max(0, 1 - (burstProgress - 0.72) / 0.28);
                    burstOpacity.opacity = Math.round(255 * Math.max(0, Math.min(1, burstFade)));
                    const spread = 0.82 + Math.min(burstProgress, 1) * 0.28;
                    burstNode.setScale(burstScale * spread, burstScale * spread);
                } else {
                    // 序列帧加载失败只降级为文字与角色退场，不延迟战报，也不生成假素材替代。
                    burstOpacity.opacity = 0;
                }

                const bossFade = Math.max(0, Math.min(1, (progress - 0.34) / 0.42));
                enemy.opacity.opacity = Math.round(230 * (1 - bossFade));
                const collapse = Math.min(progress / 0.7, 1);
                const stretchX = pattern.kind === 'frost-shatter' ? 1 + collapse * 0.16 : 1 - collapse * 0.08;
                enemy.visual.setPosition(0, enemy.baseVisualY - collapse * 24);
                enemy.visual.setScale(
                    enemy.baseScale * stretchX,
                    enemy.baseScale * Math.max(0.18, 0.92 - collapse * 0.62),
                );
                enemy.visual.angle = pattern.kind === 'bamboo-release'
                    ? -4 - collapse * 10
                    : pattern.kind === 'frost-shatter'
                        ? -4 + collapse * 5
                        : -4 - collapse * 4;

                const titleProgress = Math.max(0, (elapsed - pattern.titleAt) / 0.18);
                const titleFade = progress > 0.82
                    ? (1 - progress) / 0.18
                    : Math.min(1, titleProgress);
                panelOpacity.opacity = Math.round(255 * Math.max(0, titleFade));
                panel.setPosition(0, 204 + Math.min(titleProgress, 1) * 18);
                const panelScale = 0.94 + Math.min(titleProgress, 1) * 0.06;
                panel.setScale(panelScale, panelScale);
            },
        });

        this.scheduleOnce(() => {
            if (this.phase !== 'boss-finish') return;
            this.finish(true);
        }, pattern.duration);
    }

    private gainXp(value: number): void {
        if (this.hasLocalQaFlag('qaCultivationAura=1')) return;
        this.xp += value;
        if (this.xp < this.xpNeed || this.phase !== 'playing') return;
        this.xp -= this.xpNeed;
        this.level += 1;
        // 短局目标是“道种 + 2–3 张构筑牌 + 关底成诀”，温和成长避免第一章只有两次选择。
        this.xpNeed = Math.floor(this.xpNeed * 1.32);
        this.showUpgrade();
    }

    private showUpgrade(
        fixedChoices?: UpgradeConfig[],
        bossReward = false,
        resumeAfterUpgrade?: () => void,
    ): void {
        this.phase = 'upgrade';
        this.cultivationResumeAfterUpgrade = resumeAfterUpgrade;
        this.releaseTribulationHold();
        // 破境先把世界定住再开面板：选择界面是从静止里升起来的，不是把战斗生切掉。
        this.triggerHitStop('breakthrough');
        this.breakthroughImminent = false;
        this.breakthroughPulse = 0;
        this.createScreenFlash(new Color(79, 209, 166, 38), 0.28);
        this.createDeathBurst(this.player.position, 48);
        if (this.upgradePreviewFx?.isValid) this.upgradePreviewFx.destroy();
        this.upgradePreviewFx = undefined;
        this.clearOverlay();
        this.bringOverlayToFront();
        const veil = this.makeRect(this.visibleDesignWidth(), this.designHeight, new Color(2, 10, 14, 52));
        veil.name = 'UpgradeVeil';
        this.overlay.addChild(veil);

        const choices = fixedChoices ?? this.pickUpgrades(3);
        if (choices.length === 0) {
            this.clearOverlay();
            this.phase = 'playing';
            resumeAfterUpgrade?.();
            return;
        }
        const allowDraftActions = !bossReward;

        const panel = this.makeRect(
            596,
            allowDraftActions ? 580 : 530,
            new Color(3, 17, 22, 252),
            new Color('#9B8150'),
            22,
            2,
        );
        panel.name = 'CultivationDecisionSheet';
        // 去掉二次确认后收短面板，卡片本身就是唯一操作，给上半屏战场留出更多空间。
        panel.setPosition(0, allowDraftActions ? -376 : -401);
        this.overlay.addChild(panel);
        const title = this.makeLabel(bossReward ? '选 择 真 诀' : '选 择 进 化', 36, new Color('#F4DBA2'));
        title.node.setPosition(0, 220);
        title.node.getComponent(UITransform)?.setContentSize(540, 42);
        panel.addChild(title.node);
        const subtitle = this.makeLabel('点击任意卡片 · 立即生效', 18, new Color('#AFCBC1'));
        subtitle.node.setPosition(0, 180);
        subtitle.node.getComponent(UITransform)?.setContentSize(570, 30);
        panel.addChild(subtitle.node);
        choices.forEach((choice, index) => {
            const button = this.makeCasualUpgradeChoice(choice, () => {
                // 卡片即确认动作：一次点击完成选择、结算和返回战斗，避免休闲流程重复确认。
                const impact = previewUpgradeImpact(choice, (id) => this.skills.getLevel(id));
                const nextLevel = this.applyUpgrade(choice.id);
                const momentum = this.activateUpgradeMomentum(
                    choice,
                    impact.after,
                    Boolean(impact.milestone),
                );
                this.platformFeedback.playUpgradeCommit(
                    choice.path,
                    momentum.tier,
                    Boolean(impact.milestone),
                );
                this.showUpgradeCommit(choice, nextLevel, impact);
            });
            const spacing = choices.length >= 3 ? 190 : 202;
            button.setPosition((index - (choices.length - 1) / 2) * spacing, -14);
            panel.addChild(button);
        });
        if (allowDraftActions && this.cultivationRerolls > 0) {
            // 观星是唯一的抽牌调节手段，居中放大，不再和炼化挤在一行里被忽略。
            const reroll = this.makeActionButton(
                `观 星 换 一 批 · 剩 ${this.cultivationRerolls} 次`,
                'secondary',
                new Color('#72DDE8'),
                () => {
                    if (this.cultivationRerolls <= 0) return;
                    this.cultivationRerolls -= 1;
                    this.showUpgrade(undefined, false, resumeAfterUpgrade);
                },
                332,
                52,
            );
            reroll.setPosition(0, -248);
            panel.addChild(reroll);
        }
    }

    private casualUpgradePresentation(choice: UpgradeConfig): CasualUpgradePresentation {
        const nextLevel = Math.min(choice.maxLevel, this.skills.getLevel(choice.id) + 1);
        return {
            title: choice.title,
            result: choice.descriptions[nextLevel - 1] ?? '立即生效',
            accent: UPGRADE_PATH_COLORS[choice.path],
        };
    }

    private makeCasualUpgradeChoice(
        choice: UpgradeConfig,
        onClick: () => void,
    ): Node {
        const presentation = this.casualUpgradePresentation(choice);
        const anticipation = previewUpgradeImpact(choice, (id) => this.skills.getLevel(id));
        const currentLevel = this.skills.getLevel(choice.id);
        const nextLevel = Math.min(choice.maxLevel, currentLevel + 1);
        const accent = new Color(presentation.accent);
        const node = this.makeRect(
            172,
            344,
            new Color(accent.r, accent.g, accent.b, anticipation.milestone ? 40 : 24),
            new Color(accent.r, accent.g, accent.b, anticipation.milestone ? 245 : 175),
            20,
            anticipation.milestone ? 4 : 2,
        );
        node.name = `CasualUpgrade-${choice.id}`;

        const iconBacking = this.makeRect(
            142,
            196,
            new Color(2, 16, 20, 224),
            new Color(accent.r, accent.g, accent.b, 128),
            18,
            1,
        );
        iconBacking.setPosition(0, 53);
        iconBacking.addChild(this.createResourceSprite(choice.iconResourcePath, 108));
        node.addChild(iconBacking);

        // 玩家真正需要判断的是"这张我修到第几级了"，而不是品级星数。
        const levelBadge = this.makeRect(
            134,
            28,
            new Color(accent.r, accent.g, accent.b, nextLevel >= choice.maxLevel ? 82 : 42),
            new Color(accent.r, accent.g, accent.b, 190),
            10,
            1,
        );
        levelBadge.setPosition(0, 154);
        const levelLabel = this.makeLabel(
            currentLevel <= 0
                ? `初 修 · Lv1`
                : nextLevel >= choice.maxLevel
                    ? `Lv${currentLevel} → 圆 满`
                    : `Lv${currentLevel} → Lv${nextLevel}`,
            15,
            new Color('#FFF0BE'),
        );
        levelLabel.node.getComponent(UITransform)?.setContentSize(126, 22);
        levelBadge.addChild(levelLabel.node);
        node.addChild(levelBadge);

        const name = this.makeLabel(presentation.title, 28, new Color('#FFF0C8'));
        name.node.setPosition(0, -78);
        name.node.getComponent(UITransform)?.setContentSize(150, 38);
        node.addChild(name.node);
        const result = this.makeLabel(presentation.result, 20, new Color('#B7D8CB'));
        result.node.setPosition(0, -116);
        result.node.getComponent(UITransform)?.setContentSize(148, 42);
        node.addChild(result.node);
        const forecastText = anticipation.milestone
            ? `突破 · ${anticipation.milestone}`
            : anticipation.detail.split(' · ')[0];
        const forecast = this.makeLabel(forecastText, 15, new Color(accent.r, accent.g, accent.b, 245));
        forecast.node.setPosition(0, -154);
        forecast.node.getComponent(UITransform)?.setContentSize(154, 24);
        node.addChild(forecast.node);

        node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(0.97, 0.97);
            // 按下即把路线形态投到战场，松手取消时撤回；移动端无需额外预览按钮。
            this.createCasualUpgradePreview(choice);
        });
        node.on(Node.EventType.TOUCH_CANCEL, () => {
            node.setScale(1, 1);
            if (this.upgradePreviewFx?.isValid) this.upgradePreviewFx.destroy();
            this.upgradePreviewFx = undefined;
        });
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(1, 1);
            onClick();
        });
        return node;
    }

    private createCasualUpgradePreview(choice: UpgradeConfig): void {
        if (this.upgradePreviewFx?.isValid) this.upgradePreviewFx.destroy();
        const presentation = this.casualUpgradePresentation(choice);
        const accent = new Color(presentation.accent);
        const node = new Node(`UpgradePreview-${choice.id}`);
        node.layer = Layers.Enum.UI_2D;
        const opacity = node.addComponent(UIOpacity);
        const graphics = node.addComponent(Graphics);

        if (choice.path === 'mystic') {
            graphics.strokeColor = new Color(accent.r, accent.g, accent.b, 238);
            graphics.lineWidth = 9;
            graphics.moveTo(0, -62);
            graphics.lineTo(-18, 12);
            graphics.lineTo(16, 84);
            graphics.lineTo(-8, 156);
            graphics.lineTo(22, 228);
            graphics.lineTo(0, 312);
            graphics.stroke();
            graphics.strokeColor = new Color(223, 214, 255, 245);
            graphics.lineWidth = 3;
            graphics.moveTo(0, -62);
            graphics.lineTo(-18, 12);
            graphics.lineTo(16, 84);
            graphics.lineTo(-8, 156);
            graphics.lineTo(22, 228);
            graphics.lineTo(0, 312);
            graphics.stroke();
        } else {
            graphics.strokeColor = new Color(accent.r, accent.g, accent.b, 205);
            graphics.lineWidth = choice.path === 'edge' ? 5 : 8;
            const radius = choice.path === 'edge' ? 112 : 96;
            for (let index = 0; index < (choice.path === 'edge' ? 3 : 2); index += 1) {
                graphics.circle(0, 176, radius + index * 22);
                graphics.stroke();
            }
        }
        node.setPosition(this.player.position.x, -4);
        this.screenFxLayer.addChild(node);
        this.upgradePreviewFx = node;
        this.effects.push({
            node,
            elapsed: 0,
            // 选择层可以长时间停留，预览不应在玩家思考时自行消失。
            life: 60 * 60,
            update: (progress) => {
                const pulse = 0.84 + Math.sin(progress * 60 * 60 * Math.PI * 2) * 0.16;
                opacity.opacity = Math.round(220 * pulse);
            },
        });
    }

    private showUpgradeCommit(
        choice: UpgradeConfig,
        level: number,
        impact: UpgradeImpactPreview,
    ): void {
        if (this.upgradePreviewFx?.isValid) this.upgradePreviewFx.destroy();
        this.upgradePreviewFx = undefined;
        this.clearOverlay();
        this.bringOverlayToFront();
        const pathColor = new Color(UPGRADE_PATH_COLORS[choice.path]);
        const veil = this.makeRect(this.designWidth, this.designHeight, new Color(2, 10, 14, 72));
        veil.name = 'UpgradeCommitVeil';
        this.overlay.addChild(veil);
        if (impact.milestone) {
            this.createBreakthroughSeal(
                choice.path,
                resolveUpgradeShowcase(choice, impact.after).tier,
            );
        }
        const panel = this.makeThemedCard(574, 248, 'reward', pathColor);
        panel.name = 'UpgradeCommit';
        panel.setPosition(0, 160);
        const opacity = panel.addComponent(UIOpacity);
        opacity.opacity = 0;
        panel.setScale(0.94, 0.94);
        const iconBacking = new Node('UpgradeCommitIcon');
        iconBacking.layer = Layers.Enum.UI_2D;
        iconBacking.setPosition(-214, 10);
        const ring = iconBacking.addComponent(Graphics);
        ring.fillColor = new Color(3, 18, 22, 242);
        ring.circle(0, 0, 43);
        ring.fill();
        ring.strokeColor = new Color(pathColor.r, pathColor.g, pathColor.b, 235);
        ring.lineWidth = 2;
        ring.circle(0, 0, 43);
        ring.stroke();
        iconBacking.addChild(this.createResourceSprite(choice.iconResourcePath, 64));
        panel.addChild(iconBacking);
        const eyebrow = this.makeLabel(
            `道 基 共 鸣  ·  ${UPGRADE_PATH_LABELS[choice.path]}`,
            16,
            new Color(pathColor.r, pathColor.g, pathColor.b, 240),
        );
        eyebrow.horizontalAlign = Label.HorizontalAlign.LEFT;
        eyebrow.node.setPosition(48, 82);
        eyebrow.node.getComponent(UITransform)?.setContentSize(380, 26);
        panel.addChild(eyebrow.node);
        const title = this.makeLabel(`${choice.title} · ${level}阶`, 30, new Color('#FFF2C8'));
        title.horizontalAlign = Label.HorizontalAlign.LEFT;
        title.node.setPosition(48, 46);
        title.node.getComponent(UITransform)?.setContentSize(380, 42);
        panel.addChild(title.node);
        const benefit = this.makeLabel(choice.descriptions[level - 1], 19, new Color('#CDE5DC'));
        benefit.horizontalAlign = Label.HorizontalAlign.LEFT;
        benefit.node.setPosition(48, 4);
        benefit.node.getComponent(UITransform)?.setContentSize(380, 38);
        panel.addChild(benefit.node);
        const progression = this.makeLabel(
            `前后对比  ·  ${describeUpgradeDelta(impact)}`,
            18,
            new Color(pathColor.r, pathColor.g, pathColor.b, 245),
        );
        progression.horizontalAlign = Label.HorizontalAlign.LEFT;
        progression.node.setPosition(48, -34);
        progression.node.getComponent(UITransform)?.setContentSize(380, 34);
        panel.addChild(progression.node);
        const milestone = this.makeLabel(
            `战斗验证  ·  ${impact.milestone ?? impact.detail}`,
            17,
            new Color(impact.milestone ? '#F4D78B' : '#9CB8AE'),
        );
        milestone.horizontalAlign = Label.HorizontalAlign.LEFT;
        milestone.node.setPosition(48, -72);
        milestone.node.getComponent(UITransform)?.setContentSize(380, 32);
        panel.addChild(milestone.node);
        this.overlay.addChild(panel);
        this.effects.push({
            node: panel,
            elapsed: 0,
            life: 0.96,
            update: (progress) => {
                const reveal = Math.min(1, progress / 0.2);
                const fade = progress < 0.7 ? reveal : Math.max(0, (1 - progress) / 0.3);
                opacity.opacity = Math.round(255 * fade);
                panel.setPosition(0, 146 + reveal * 14);
                const scale = 0.94 + reveal * 0.06;
                panel.setScale(scale, scale);
            },
        });
        this.updateHud();
        this.showRecentUpgrade(impact);
        if (this.recentUpgradePanel?.isValid) {
            this.recentUpgradePanel.setScale(1.045, 1.045);
            this.scheduleOnce(() => {
                if (this.recentUpgradePanel?.isValid) this.recentUpgradePanel.setScale(1, 1);
            }, 0.18);
        }
        this.scheduleOnce(() => {
            if (this.phase !== 'upgrade') return;
            this.clearOverlay();
            this.phase = 'playing';
            const resume = this.cultivationResumeAfterUpgrade;
            this.cultivationResumeAfterUpgrade = undefined;
            resume?.();
            // 先恢复波次，再免费释放一次进化效果；该次兑现不写入常规技能冷却。
            this.playUpgradeShowcase(resolveUpgradeShowcase(choice, impact.after));
        }, 1.02);
    }

    private createBreakthroughSeal(path: UpgradePath, tier: number): void {
        const color = new Color(UPGRADE_PATH_COLORS[path]);
        const seal = new Node(`BreakthroughSeal-${path}`);
        seal.layer = Layers.Enum.UI_2D;
        seal.setPosition(0, 160);
        const opacity = seal.addComponent(UIOpacity);
        const graphics = seal.addComponent(Graphics);
        graphics.strokeColor = new Color(color.r, color.g, color.b, 150);
        graphics.lineWidth = 2 + tier;
        const rings = Math.max(2, tier + 1);
        for (let index = 0; index < rings; index += 1) {
            graphics.circle(0, 0, 116 + index * 26);
            graphics.stroke();
        }
        graphics.strokeColor = new Color(255, 240, 190, 118);
        graphics.lineWidth = 2;
        for (let index = 0; index < 8 + tier * 2; index += 1) {
            const angle = index * Math.PI * 2 / (8 + tier * 2);
            const inner = 86 + tier * 5;
            const outer = 174 + tier * 12;
            graphics.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
            graphics.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        }
        graphics.stroke();
        this.overlay.addChild(seal);
        // 初醒、共鸣、真形使用同一套符纹语法，只增加层数与展开幅度，保证阶段升级可连续辨认。
        this.effects.push({
            node: seal,
            elapsed: 0,
            life: 1.02,
            update: (progress) => {
                const reveal = Math.min(1, progress / 0.2);
                const fade = progress < 0.72 ? 1 : (1 - progress) / 0.28;
                opacity.opacity = Math.round(220 * reveal * Math.max(0, fade));
                const scale = 0.72 + reveal * 0.28 + progress * 0.12;
                seal.setScale(scale, scale);
                seal.angle = (path === 'mystic' ? -1 : 1) * progress * (8 + tier * 3);
            },
        });
    }

    private showMapEvent(advanceAfterChoice: boolean, qa = false): void {
        this.phase = 'map-event';
        this.releaseTribulationHold();
        this.mapEventAdvanceAfterChoice = advanceAfterChoice;
        const scenario = qa ? this.mapEvent.openForQa() : this.mapEvent.open();
        const accent = new Color(this.currentStage.accent);
        this.clearOverlay();
        this.bringOverlayToFront();

        const veil = this.makeRect(this.designWidth, this.designHeight, new Color(2, 10, 14, 132));
        veil.name = 'MapEventVeil';
        this.overlay.addChild(veil);
        const panel = this.makeRect(
            626,
            490,
            new Color(UI_THEME.colors.surface),
            new Color(accent.r, accent.g, accent.b, 132),
            UI_THEME.radius.panel,
            1.5,
        );
        // 临时选择浮层停在固定操作区上方；显示与消失都不推动摇杆或技能簇。
        panel.setPosition(0, -180);
        this.overlay.addChild(panel);

        const title = this.makeLabel(scenario.title, 30, new Color('#FFF0BE'));
        title.node.setPosition(0, 200);
        title.node.getComponent(UITransform)?.setContentSize(420, 46);
        panel.addChild(title.node);
        const subtitle = this.makeLabel('断 路 择 行  ·  得 失 同 现', 18, new Color(UI_THEME.colors.muted));
        subtitle.node.setPosition(0, 163);
        subtitle.node.getComponent(UITransform)?.setContentSize(470, 28);
        panel.addChild(subtitle.node);
        scenario.choices.forEach((choice, index) => {
            const card = this.makeMapEventChoice(
                choice,
                () => this.resolveMapEvent(choice),
            );
            card.setPosition(0, index === 0 ? 76 : -74);
            panel.addChild(card);
        });
    }

    private showMapEventPrelude(
        advanceAfterChoice: boolean,
        qa = false,
        holdForQa = false,
    ): void {
        this.phase = 'map-event-prelude';
        this.releaseTribulationHold();
        this.mapEventAdvanceAfterChoice = advanceAfterChoice;
        this.clearOverlay();
        this.bringOverlayToFront();

        const scenario = this.mapEvent.scenario();
        const accent = new Color(this.currentStage.accent);
        const reveal = new Node('MapEventPrelude');
        reveal.layer = Layers.Enum.UI_2D;
        const veil = this.makeRect(
            this.designWidth,
            this.designHeight,
            new Color(2, 12, 16, 64),
        );
        reveal.addChild(veil);

        const choiceBursts = scenario.choices.map((choice) => ({
            choice,
            calm: choice.commitEffect
                ? this.isCalmRouteCommitEffect(choice.commitEffect)
                : false,
            bursts: this.createRouteCommitBursts(choice, reveal),
        }));
        const panel = this.makeRect(
            570,
            92,
            new Color(4, 25, 29, 238),
            new Color(accent.r, accent.g, accent.b, 205),
            22,
            2,
        );
        panel.setPosition(0, 382);
        const eyebrow = this.makeLabel('分 岔 将 现', 14, accent);
        eyebrow.node.setPosition(0, 22);
        eyebrow.node.getComponent(UITransform)?.setContentSize(210, 24);
        panel.addChild(eyebrow.node);
        const routePair = this.makeLabel(
            scenario.choices
                .map((choice) => choice.geometryPreview ?? choice.title)
                .join('  /  '),
            21,
            new Color('#FFF0C2'),
        );
        routePair.node.setPosition(0, -17);
        routePair.node.getComponent(UITransform)?.setContentSize(540, 34);
        panel.addChild(routePair.node);
        reveal.addChild(panel);

        const revealOpacity = reveal.addComponent(UIOpacity);
        this.screenFxLayer.addChild(reveal);
        if (holdForQa) {
            revealOpacity.opacity = 255;
            for (const { bursts, calm } of choiceBursts) {
                for (const burst of bursts) {
                    burst.sprite.spriteFrame = burst.frames[2];
                    burst.opacity.opacity = calm ? 188 : 232;
                    burst.node.setScale(burst.baseScale, burst.baseScale);
                }
            }
            return;
        }

        // 前奏属于状态机暂停路径：即使序列帧资源缺失，计时结束仍会打开原奇遇页，避免卡死波次。
        this.effects.push({
            node: reveal,
            elapsed: 0,
            life: 0.78,
            update: (progress) => {
                const envelope = progress < 0.08
                    ? progress / 0.08
                    : progress > 0.9
                        ? Math.max(0, (1 - progress) / 0.1)
                        : 1;
                revealOpacity.opacity = Math.round(255 * envelope);
                const panelScale = 0.96 + Math.min(1, progress / 0.18) * 0.04;
                panel.setScale(panelScale, panelScale);
                choiceBursts.forEach(({ bursts, calm }, choiceIndex) => {
                    const motion = resolveMapEventPreludeMotion(
                        progress,
                        choiceIndex as 0 | 1,
                    );
                    for (const burst of bursts) {
                        burst.sprite.spriteFrame = burst.frames[motion.frameIndex];
                        burst.opacity.opacity = Math.round(
                            255 * motion.opacity * (calm ? 0.78 : 1),
                        );
                        const scale = burst.baseScale * motion.scale;
                        burst.node.setScale(scale, scale);
                    }
                });
            },
        });
        this.scheduleOnce(() => {
            if (this.phase !== 'map-event-prelude') return;
            this.showMapEvent(advanceAfterChoice, qa);
        }, 0.72);
    }

    private makeMapEventChoice(choice: MapEventChoice, onClick: () => void): Node {
        const accent = new Color(MAP_EVENT_TONE_COLORS[choice.tone]);
        const node = this.makeThemedCard(560, 132, 'choice', accent);
        const iconBacking = this.makeRect(
            82,
            82,
            new Color(2, 16, 20, 205),
            new Color(accent.r, accent.g, accent.b, 120),
            UI_THEME.radius.compact,
            1,
        );
        iconBacking.setPosition(-224, 0);
        const icon = this.createResourceSprite(choice.iconResourcePath, 62);
        iconBacking.addChild(icon);
        node.addChild(iconBacking);

        const title = this.makeLabel(choice.title, 22, new Color('#FFF1C5'));
        title.horizontalAlign = Label.HorizontalAlign.LEFT;
        title.node.setPosition(-28, 28);
        title.node.getComponent(UITransform)?.setContentSize(270, 34);
        node.addChild(title.node);
        const role = this.makeLabel(choice.role, 18, accent);
        role.horizontalAlign = Label.HorizontalAlign.RIGHT;
        role.node.setPosition(188, 34);
        role.node.getComponent(UITransform)?.setContentSize(128, 28);
        node.addChild(role.node);
        const geometry = this.makeLabel(`地势 · ${choice.geometryPreview ?? choice.title}`, 18, new Color(UI_THEME.colors.celadon));
        geometry.horizontalAlign = Label.HorizontalAlign.LEFT;
        geometry.node.setPosition(-28, -4);
        geometry.node.getComponent(UITransform)?.setContentSize(270, 28);
        node.addChild(geometry.node);
        const outcome = this.makeLabel(`即得 · ${choice.outcome}`, 18, accent);
        outcome.horizontalAlign = Label.HorizontalAlign.LEFT;
        outcome.node.setPosition(-38, -38);
        outcome.node.getComponent(UITransform)?.setContentSize(250, 30);
        node.addChild(outcome.node);
        const bossConsequence = describeNextWaveModifiers(choice.effect.bossWave);
        const risk = this.makeLabel(
            `${choice.riskLabel}\n关底 · ${bossConsequence}`,
            15,
            new Color(202, 224, 216, 225),
        );
        risk.lineHeight = 19;
        risk.horizontalAlign = Label.HorizontalAlign.RIGHT;
        risk.node.setPosition(172, -31);
        risk.node.getComponent(UITransform)?.setContentSize(160, 44);
        node.addChild(risk.node);

        node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(0.98, 0.98);
        });
        node.on(Node.EventType.TOUCH_CANCEL, () => node.setScale(1, 1));
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(1, 1);
            onClick();
        });
        return node;
    }

    private resolveMapEvent(choice: MapEventChoice): void {
        const resolved = this.mapEvent.resolve(choice.id);
        // 结算只读取已经确认的选择记录，不能从当前属性倒推玩家在奇遇中选了哪条路线。
        this.runStats.recordMapEvent({
            choiceId: resolved.id,
            title: resolved.title,
            role: resolved.role,
            geometryPreview: resolved.geometryPreview ?? resolved.title,
            commitLine: resolved.commitLine,
            commitEffect: resolved.commitEffect,
            outcome: resolved.outcome,
            tone: resolved.tone,
            iconResourcePath: resolved.iconResourcePath,
        });
        const effect = resolved.effect;
        if (effect.maxHpDelta) this.maxHp += effect.maxHpDelta;
        if (effect.hpDelta) this.hp = Math.max(1, Math.min(this.maxHp, this.hp + effect.hpDelta));
        if (effect.swordDamageMultiplier) this.swordDamage *= effect.swordDamageMultiplier;
        if (effect.moveSpeedMultiplier) this.moveSpeed *= effect.moveSpeedMultiplier;
        if (effect.attackIntervalMultiplier) {
            this.attackInterval = Math.max(0.2, this.attackInterval * effect.attackIntervalMultiplier);
        }
        if (effect.tribulationCharge) this.skills.addTribulationCharge(effect.tribulationCharge);
        if (effect.qingshiRoute) this.applyQingshiRouteGeometry(effect.qingshiRoute);
        else if (effect.bambooRoute) this.applyBambooRouteGeometry(effect.bambooRoute);
        else if (effect.frostRoute) this.applyFrostRouteGeometry(effect.frostRoute);
        else if (effect.clearObstacles) this.clearMapObstacles();

        const targetWaveIndex = this.mapEventAdvanceAfterChoice
            ? this.waveIndex + 1
            : this.waveIndex;
        this.mapEventModifierWaveIndex = effect.nextWave ? targetWaveIndex : -1;
        this.clearOverlay();
        // 路线确认阶段暂停战斗，让场景重构与选择结果拥有独立的一拍；结束后才开放敌军刷新。
        this.phase = 'route-commit';
        this.createScreenFlash(new Color(MAP_EVENT_TONE_COLORS[resolved.tone]), 0.34);
        if (this.mapEventAdvanceAfterChoice) {
            this.advanceToNextWave(false);
        } else {
            this.waveFinished = false;
        }
        this.updateHud();
        this.showRouteCommitment(resolved);
    }

    private routeCommitFrames(effect: RouteCommitEffect): SpriteFrame[] {
        if (effect === 'stele-burst') return this.qingshiSteleCommitAnimationFrames;
        if (effect === 'spring-flow') return this.qingshiSpringCommitAnimationFrames;
        if (effect === 'bamboo-burn') return this.bambooBurnCommitAnimationFrames;
        if (effect === 'bamboo-shadow') return this.bambooShadowCommitAnimationFrames;
        if (effect === 'tide-convergence') return this.frostTideCommitAnimationFrames;
        return this.frostSealCommitAnimationFrames;
    }

    private isCalmRouteCommitEffect(effect: RouteCommitEffect): boolean {
        return effect === 'spring-flow'
            || effect === 'bamboo-shadow'
            || effect === 'sealed-sanctuary';
    }

    private routeCommitPlacements(effect: RouteCommitEffect): RouteCommitPlacement[] {
        if (effect === 'stele-burst') {
            return qingshiRouteMarkers('sword-stele-array').map((marker) => ({
                x: marker.x,
                y: marker.y,
                diameter: marker.radius * 2.16,
            }));
        }
        if (effect === 'spring-flow') {
            const spring = qingshiSpiritVeinPosition('spring-detour', this.waveIndex)
                ?? { x: -138, y: -132 };
            return [{ ...spring, diameter: 190 }];
        }
        if (effect === 'bamboo-burn') {
            return bambooObstacleSpecs().map((obstacle) => ({
                x: obstacle.x,
                y: obstacle.y,
                diameter: Math.max(obstacle.width, obstacle.height) * 1.18,
            }));
        }
        if (effect === 'bamboo-shadow') {
            return bambooObstacleSpecs('shadow-corridor').map((obstacle) => ({
                x: obstacle.x,
                y: obstacle.y,
                diameter: Math.max(obstacle.width, obstacle.height) * 0.94,
            }));
        }
        const marker = frostRouteMarker(
            effect === 'tide-convergence' ? 'tide-convergence' : 'sealed-sanctuary',
        );
        return [{
            x: marker.x,
            y: marker.y,
            diameter: marker.radius * (effect === 'tide-convergence' ? 2.5 : 2.12),
        }];
    }

    private createRouteCommitBursts(
        choice: MapEventChoice,
        parent: Node,
    ): RouteCommitBurstVisual[] {
        if (!choice.commitEffect) return [];
        const frames = this.routeCommitFrames(choice.commitEffect);
        // 场地序列帧属于确认状态的增强反馈；资源缺失时保留原确认面板，绝不阻断状态恢复与下一波刷新。
        if (frames.length !== 4) return [];
        const placements = this.routeCommitPlacements(choice.commitEffect);
        const calm = this.isCalmRouteCommitEffect(choice.commitEffect);

        return placements.map((placement, index) => {
            const node = new Node(`RouteCommitBurst-${choice.commitEffect}-${index}`);
            node.layer = Layers.Enum.UI_2D;
            node.setPosition(placement.x, placement.y);
            const sprite = node.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.RAW;
            sprite.spriteFrame = frames[0];
            const opacity = node.addComponent(UIOpacity);
            const frameHeight = Math.max(frames[0].originalSize.height, 1);
            const baseScale = placement.diameter / frameHeight;
            node.setScale(baseScale * (calm ? 0.94 : 0.84), baseScale * (calm ? 0.94 : 0.84));
            parent.addChild(node);
            return { node, sprite, opacity, frames, baseScale };
        });
    }

    private showRouteCommitment(choice: MapEventChoice): void {
        const accent = new Color(MAP_EVENT_TONE_COLORS[choice.tone]);
        const reveal = new Node('RouteCommitReveal');
        reveal.layer = Layers.Enum.UI_2D;

        const veil = this.makeRect(
            this.designWidth,
            this.designHeight,
            new Color(2, 12, 16, 178),
        );
        reveal.addChild(veil);
        const bursts = this.createRouteCommitBursts(choice, reveal);
        const calmCommit = choice.commitEffect
            ? this.isCalmRouteCommitEffect(choice.commitEffect)
            : false;

        const panel = this.makeRect(
            604,
            278,
            new Color(4, 26, 29, 246),
            new Color(accent.r, accent.g, accent.b, 220),
            24,
            2,
        );
        panel.setPosition(0, 70);
        const panelOpacity = panel.addComponent(UIOpacity);
        reveal.addChild(panel);

        const iconBacking = this.makeRect(
            104,
            104,
            new Color(2, 15, 18, 248),
            new Color(accent.r, accent.g, accent.b, 190),
            25,
            1.5,
        );
        iconBacking.setPosition(-218, 4);
        iconBacking.addChild(this.createResourceSprite(choice.iconResourcePath, 82));
        panel.addChild(iconBacking);

        const eyebrow = this.makeLabel(`道 途 已 定  ·  ${choice.role}`, 15, accent);
        eyebrow.horizontalAlign = Label.HorizontalAlign.LEFT;
        eyebrow.node.setPosition(64, 88);
        eyebrow.node.getComponent(UITransform)?.setContentSize(400, 26);
        panel.addChild(eyebrow.node);

        const title = this.makeLabel(choice.geometryPreview ?? choice.title, 36, new Color('#FFF0C2'));
        title.horizontalAlign = Label.HorizontalAlign.LEFT;
        title.node.setPosition(64, 42);
        title.node.getComponent(UITransform)?.setContentSize(400, 52);
        panel.addChild(title.node);

        const commitment = this.makeLabel(choice.commitLine, 19, new Color('#D8ECE5'));
        commitment.horizontalAlign = Label.HorizontalAlign.LEFT;
        commitment.node.setPosition(64, -8);
        commitment.node.getComponent(UITransform)?.setContentSize(400, 32);
        panel.addChild(commitment.node);

        const outcome = this.makeRect(
            398,
            42,
            new Color(accent.r, accent.g, accent.b, 22),
            new Color(accent.r, accent.g, accent.b, 94),
            12,
            1,
        );
        outcome.setPosition(64, -68);
        const outcomeLabel = this.makeLabel(`${choice.title}  ·  ${choice.outcome}`, 15, accent);
        outcomeLabel.node.getComponent(UITransform)?.setContentSize(378, 30);
        outcome.addChild(outcomeLabel.node);
        panel.addChild(outcome);

        const prompt = this.makeLabel(
            `战场已重构 · 关底 ${describeNextWaveModifiers(choice.effect.bossWave)}`,
            14,
            new Color(145, 177, 168, 220),
        );
        prompt.node.setPosition(0, -112);
        prompt.node.getComponent(UITransform)?.setContentSize(220, 24);
        panel.addChild(prompt.node);

        const opacity = reveal.addComponent(UIOpacity);
        this.screenFxLayer.addChild(reveal);
        // 先收束视线，再揭示路线名，最后把画面交回战场；动画期间 phase 会拦截移动、攻击与刷怪。
        this.effects.push({
            node: reveal,
            elapsed: 0,
            life: 1.55,
            update: (progress) => {
                const fade = progress < 0.12
                    ? progress / 0.12
                    : progress > 0.76
                        ? (1 - progress) / 0.24
                        : 1;
                opacity.opacity = Math.round(255 * Math.max(0, fade));
                const effectProgress = Math.min(1, progress / (calmCommit ? 0.56 : 0.48));
                for (const burst of bursts) {
                    burst.sprite.spriteFrame = burst.frames[resolveRouteCommitFrame(effectProgress)];
                    const burstFade = effectProgress < 0.08
                        ? effectProgress / 0.08
                        : effectProgress > 0.72
                            ? (1 - effectProgress) / 0.28
                            : 1;
                    // 竹影素材以深墨叶片为主，若沿用其他稳健路线的透明度会与竹林底色融在一起；
                    // 仅提升其可读性，尺寸和播放节奏仍保持克制，避免抢过高风险路线的爆发反馈。
                    const opacityMultiplier = choice.commitEffect === 'bamboo-shadow'
                        ? 0.9
                        : calmCommit
                            ? 0.76
                            : 1;
                    burst.opacity.opacity = Math.round(255 * Math.max(0, burstFade) * opacityMultiplier);
                    const burstScale = burst.baseScale * (
                        calmCommit
                            ? 0.94 + effectProgress * 0.1
                            : 0.84 + effectProgress * 0.22
                    );
                    burst.node.setScale(burstScale, burstScale);
                }
                // 先让场地坐标上的真实序列帧独占一拍，再浮出结果面板；寒潭祭纹位于面板正下方，
                // 若同步入场会把“聚潮”完全遮住。
                const panelRevealAt = calmCommit ? 0.5 : 0.43;
                panelOpacity.opacity = progress < panelRevealAt
                    ? 0
                    : Math.round(255 * Math.min(1, (progress - panelRevealAt) / 0.08));
                panel.setPosition(0, 46 + Math.min(progress / 0.22, 1) * 24);
                const scale = 0.94 + Math.min(progress / 0.2, 1) * 0.06;
                panel.setScale(scale, scale);
                iconBacking.angle = -5 + Math.min(progress / 0.28, 1) * 5;
            },
        });
        this.scheduleOnce(() => {
            if (this.phase !== 'route-commit') return;
            this.phase = 'playing';
            this.showWaveAnnouncement();
        }, 1.22);
    }

    private applyUpgrade(id: UpgradeId): number {
        // 选择历史记录本局确认过的每一次修行，供修行卷与战报回放。
        this.cultivationChoiceHistory.push(id);
        const nextLevel = this.skills.upgrade(id);
        if (id === 'sword') this.swordCount = nextLevel;
        if (id === 'dash') {
            this.moveSpeed *= 1.04;
        }
        if (id === 'damage') this.swordDamage *= nextLevel >= 3 ? 1.35 : 1.3;
        if (id === 'haste') this.attackInterval = Math.max(0.2, this.attackInterval * (nextLevel >= 3 ? 0.82 : 0.85));
        if (id === 'guard') {
            this.maxHp += 20 + nextLevel * 5;
            this.hp = Math.min(this.maxHp, this.hp + 30 + nextLevel * 10);
        }
        if (id === 'heal') {
            const ratio = nextLevel >= 3 ? 1 : 0.25 + nextLevel * 0.1;
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * ratio);
            if (nextLevel >= 3) this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 1.2);
        }
        if (id === 'endless-life' && nextLevel >= 3) this.grantCultivationShield(16);
        this.createUpgradeResonance(id, nextLevel);
        this.refreshPlayerAura();
        return nextLevel;
    }

    private checkStageProgress(dt: number): void {
        const wave = this.currentStage.waves[this.waveIndex];
        if (!wave || this.spawned < wave.count || this.enemies.length > 0) return;
        if (!this.waveFinished) {
            this.waveFinished = true;
            this.waveRestTimer = 1.5;
            this.showWaveClearedAnnouncement();
            if (this.waveIndex === 0) this.clearOpeningObjective();
        }
        this.waveRestTimer -= dt;
        if (this.waveRestTimer > 0) return;
        if (this.waveIndex >= this.currentStage.waves.length - 1) {
            this.finish(true);
            return;
        }
        if (this.mapEvent.shouldTriggerAfterWave(this.waveIndex)) {
            this.showMapEventPrelude(true);
            return;
        }
        this.advanceToNextWave();
    }

    private advanceToNextWave(announce = true): void {
        this.waveIndex += 1;
        this.spawned = 0;
        const nextWave = this.currentStage.waves[this.waveIndex];
        this.spawnTimer = nextWave?.danger ? 1.7 : 0.65;
        this.waveFinished = false;
        this.eliteEncounter.begin(this.currentStage.mapId, this.waveIndex);
        this.eliteEncounterCompletionShown = false;
        this.setupWaveArena();
        this.createSpiritVeinForWave();
        if (announce) this.showWaveAnnouncement();
    }

    private finish(victory: boolean): void {
        this.phase = victory ? 'victory' : 'defeat';
        this.platformFeedback.setAmbiencePaused(true);
        this.platformFeedback.playCue(victory ? 'victory' : 'defeat', this.selectedStageIndex);
        this.bossFinishEnemy = undefined;
        this.bossFinishStarted = false;
        if (!victory) this.actions.enter('defeat', 0, true);
        const stats = this.runStats.snapshot();
        const build = resolveCultivationBuild((id) => this.skills.getLevel(id));
        this.balanceTelemetry.record({
            stage: this.currentStage.mapId,
            victory,
            durationSeconds: stats.elapsedSeconds,
            damageTaken: stats.damageTaken,
            maxHp: this.maxHp,
            routeChoiceId: stats.mapEvent?.choiceId,
            buildPath: build.path,
            buildTier: build.tier,
        });
        this.persistBalanceTelemetry();
        if (this.hasLocalQaFlag('qaBalance=1')) {
            console.info(`[balance] ${this.currentStage.stageName} · ${formatBalanceReport(this.balanceTelemetry.reportFor(this.currentStage.mapId, 1))}`);
        }
        if (victory) {
            // 只在真实胜利落印；失败和中途返回不会增加通关次数或覆盖最快记录。
            this.lastStageVictory = this.stageProgress.recordVictory(
                this.currentStage.mapId,
                stats.elapsedSeconds,
                {
                    bestCombo: stats.bestCombo,
                    buildName: build.relic ? `${build.relic.name} · ${build.evolutionName}` : undefined,
                    path: build.path,
                    tier: build.tier,
                    routeChoiceId: stats.mapEvent?.choiceId,
                },
            );
            this.persistStageProgress();
        }
        this.releaseTribulationHold();
        if (victory) {
            this.createScreenFlash(new Color(244, 221, 137, 72), 0.5);
            this.cameraShakeTimer = 0.36;
            this.cameraShakeStrength = 8;
        }
        this.bossPulses.forEach((pulse) => {
            if (pulse.node.isValid) pulse.node.destroy();
        });
        this.bossPulses = [];
        this.bossPincers.forEach((pincer) => {
            if (pincer.node.isValid) pincer.node.destroy();
        });
        this.bossPincers = [];
        this.clearOverlay();
        this.bringOverlayToFront();
        const shade = this.makeRect(750, 1334, new Color(2, 10, 14, 218), undefined, 0);
        this.overlay.addChild(shade);
        this.overlay.addChild(this.makeResultPanel(victory));
    }

    private makeResultPanel(victory: boolean): Node {
        const stagePresentation = resultStagePresentationFor(this.currentStage.mapId);
        const accent = new Color(victory ? stagePresentation.accent : '#E29A7F');
        const panel = this.makeThemedCard(620, 980, 'chapter', accent);
        this.addResultStageWatermark(panel, victory);

        const portraitBacking = this.makeRect(116, 124, new Color(2, 14, 18, 245), accent, 24, 2);
        portraitBacking.setPosition(-218, 326);
        const portrait = this.createResourceSprite(PLAYER_ASSET.resourcePath, 112);
        portrait.setPosition(0, -4);
        portraitBacking.addChild(portrait);
        panel.addChild(portraitBacking);

        const eyebrow = this.makeLabel(
            `${this.currentStage.chapter}  ·  ${victory ? stagePresentation.chapterMark : '试 炼 战 报'}`,
            16,
            new Color(accent.r, accent.g, accent.b, 235),
        );
        eyebrow.horizontalAlign = Label.HorizontalAlign.LEFT;
        eyebrow.node.setPosition(54, 376);
        eyebrow.node.getComponent(UITransform)?.setContentSize(330, 28);
        panel.addChild(eyebrow.node);
        const title = this.makeLabel(victory ? '渡 劫 成 功' : '道 途 未 竟', 48, new Color('#FFF0BE'));
        title.horizontalAlign = Label.HorizontalAlign.LEFT;
        title.node.setPosition(58, 330);
        title.node.getComponent(UITransform)?.setContentSize(340, 62);
        panel.addChild(title.node);
        const subtitle = this.makeLabel(
            victory
                ? `${this.currentStage.stageName}已肃清  ·  ${stagePresentation.closure}`
                : `止步第 ${this.waveIndex + 1} / ${this.currentStage.waves.length} 境  ·  修至 ${this.level} 重`,
            19,
            new Color('#BFD8CF'),
        );
        subtitle.horizontalAlign = Label.HorizontalAlign.LEFT;
        subtitle.node.setPosition(58, 282);
        subtitle.node.getComponent(UITransform)?.setContentSize(350, 36);
        panel.addChild(subtitle.node);

        const section = this.makeLabel('本 局 关 键', 15, new Color(141, 177, 166, 230));
        section.horizontalAlign = Label.HorizontalAlign.LEFT;
        // 左对齐标签的锚点必须留在卡片安全区内，窄屏缩放后不能从画布左侧裁掉。
        section.node.setPosition(-178, 216);
        section.node.getComponent(UITransform)?.setContentSize(220, 26);
        panel.addChild(section.node);

        const stats = this.runStats.snapshot();
        const statItems: ReadonlyArray<readonly [string, string]> = [
            ['历时', formatRunDuration(stats.elapsedSeconds)],
            ['斩妖', `${stats.enemiesDefeated}`],
            ['总伤', `${Math.round(stats.damageDealt)}`],
            ['连斩', `${stats.bestCombo}`],
        ];
        const statsStrip = this.makeThemedCard(548, 88, 'summary');
        statsStrip.setPosition(0, 153);
        statItems.forEach(([label, value], index) => {
            const tile = this.makeResultStat(label, value, accent);
            tile.setPosition(-204 + index * 136, 0);
            statsStrip.addChild(tile);
        });
        panel.addChild(statsStrip);

        panel.addChild(this.makeResultJourneySummary(stats, accent));

        panel.addChild(this.makeResultBuildSummary());

        const rewardPanel = this.makeResultRewardSummary(victory, accent);
        panel.addChild(rewardPanel);

        const nextStageIndex = this.nextUnclearedStageIndex();
        const alternateRoute = this.nextUnprovenRoute();
        const journeyCompletedThisRun = Boolean(
            victory
            && this.lastStageVictory?.firstClear
            && this.stageProgress.journeyCompletion().allStagesCleared,
        );
        const guidance = resultActionGuidanceFor({
            victory,
            firstClear: Boolean(this.lastStageVictory?.firstClear),
            journeyCompleted: journeyCompletedThisRun,
            nextStageName: nextStageIndex === undefined ? undefined : STAGES[nextStageIndex]?.stageName,
            alternateRouteName: alternateRoute?.geometryPreview ?? alternateRoute?.title,
            failureCause: stats.lastDamageCause,
        });
        const guidanceCard = this.makeRect(
            548,
            62,
            new Color(victory ? 73 : 96, victory ? 64 : 43, victory ? 30 : 38, 64),
            new Color(victory ? '#BFA45B' : '#C87865'),
            14,
            1,
        );
        guidanceCard.setPosition(0, -321);
        const guidanceTitle = this.makeLabel(
            `${guidance.eyebrow}  ·  ${guidance.title}`,
            15,
            new Color(victory ? '#E8D58B' : '#F0B09A'),
        );
        guidanceTitle.node.setPosition(0, 13);
        guidanceTitle.node.getComponent(UITransform)?.setContentSize(516, 26);
        guidanceCard.addChild(guidanceTitle.node);
        const guidanceDetail = this.makeLabel(
            this.hasLocalQaFlag('qaBalance=1')
                ? formatBalanceReport(this.balanceTelemetry.reportFor(this.currentStage.mapId, 1))
                : guidance.detail,
            13,
            new Color('#BBD3CA'),
        );
        guidanceDetail.node.setPosition(0, -15);
        guidanceDetail.node.getComponent(UITransform)?.setContentSize(516, 24);
        guidanceCard.addChild(guidanceDetail.node);
        panel.addChild(guidanceCard);

        const actionBar = this.makeRect(560, 88, new Color(3, 17, 21, 128), undefined, UI_THEME.radius.compact);
        actionBar.setPosition(0, -405);
        const continueToNextStage = victory
            && !journeyCompletedThisRun
            && this.lastStageVictory?.firstClear
            && nextStageIndex !== undefined;
        const button = this.makeActionButton(
            journeyCompletedThisRun
                ? '见 证 三 境 归 一'
                : continueToNextStage
                ? '前 往 下 一 章'
                : victory && alternateRoute
                    ? '换 路 再 战'
                    : victory
                        ? '再 战 本 章'
                        : '重 整 道 心',
            'primary',
            accent,
            () => {
                if (journeyCompletedThisRun) {
                    this.showJourneyEpilogue();
                    return;
                }
                if (continueToNextStage && nextStageIndex !== undefined) {
                    this.selectedStageIndex = nextStageIndex;
                }
                this.startStage(this.selectedStageIndex);
            },
            300,
            68,
        );
        button.setPosition(-116, 0);
        actionBar.addChild(button);
        const routeButton = this.makeActionButton(
            '返 回 试 炼 图',
            'secondary',
            new Color('#8AB9A7'),
            () => this.showMenu(),
            220,
            68,
        );
        routeButton.setPosition(154, 0);
        actionBar.addChild(routeButton);
        panel.addChild(actionBar);
        this.animateResultReveal(panel, rewardPanel);
        return panel;
    }

    private nextUnclearedStageIndex(): number | undefined {
        const afterCurrent = STAGES.findIndex((stage, index) => (
            index > this.selectedStageIndex && this.stageProgress.recordFor(stage.mapId).clears <= 0
        ));
        if (afterCurrent >= 0) return afterCurrent;
        const anyUncleared = STAGES.findIndex((stage) => this.stageProgress.recordFor(stage.mapId).clears <= 0);
        return anyUncleared >= 0 && anyUncleared !== this.selectedStageIndex ? anyUncleared : undefined;
    }

    private nextUnprovenRoute(): MapEventChoice | undefined {
        const proven = this.stageProgress.recordFor(this.currentStage.mapId).routeChoices ?? [];
        return mapEventScenarioFor(this.currentStage.mapId).choices.find(
            (choice) => !proven.includes(choice.id),
        );
    }

    private addResultStageWatermark(panel: Node, victory: boolean): void {
        if (!victory) return;
        const frames = this.bossFinishEffectFrames();
        if (frames.length !== 4) return;
        const presentation = resultStagePresentationFor(this.currentStage.mapId);
        const watermark = new Node('ResultStageWatermark');
        watermark.layer = Layers.Enum.UI_2D;
        watermark.setPosition(194, 342);
        const sprite = watermark.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.RAW;
        sprite.spriteFrame = frames[0];
        const opacity = watermark.addComponent(UIOpacity);
        opacity.opacity = 34;
        const frameHeight = Math.max(frames[0].originalSize.height, 1);
        const scale = (presentation.auraDiameter + 48) / frameHeight;
        watermark.setScale(scale, scale);
        panel.addChild(watermark);
        [1, 2, 3].forEach((frameIndex, index) => {
            this.scheduleOnce(() => {
                if (!watermark.isValid) return;
                sprite.spriteFrame = frames[frameIndex];
                opacity.opacity = frameIndex === 2 ? 58 : 38;
                watermark.setScale(scale * (1 + frameIndex * 0.035), scale * (1 + frameIndex * 0.035));
            }, 0.12 + index * 0.1);
        });
    }

    private makeResultRewardSummary(victory: boolean, accent: Color): Node {
        const stagePresentation = resultStagePresentationFor(this.currentStage.mapId);
        const reward = STAGE_FIRST_CLEAR_REWARDS[this.currentStage.mapId];
        const result = this.lastStageVictory;
        const milestone = resultMilestonePresentation(
            victory,
            reward,
            result,
            this.stageProgress.recordFor(this.currentStage.mapId),
            formatRunDuration,
        );
        const panel = this.makeThemedCard(
            548,
            124,
            milestone.kind === 'first-clear' ? 'reward' : 'summary',
            milestone.kind === 'first-clear' ? undefined : accent,
        );
        panel.name = 'ResultRewardHero';
        panel.setPosition(0, -226);

        const frames = this.bossFinishEffectFrames();
        if (victory && frames.length === 4) {
            const aura = new Node('ResultRewardAura');
            aura.layer = Layers.Enum.UI_2D;
            aura.setPosition(-214, 0);
            const auraSprite = aura.addComponent(Sprite);
            auraSprite.sizeMode = Sprite.SizeMode.RAW;
            auraSprite.spriteFrame = frames[0];
            const auraOpacity = aura.addComponent(UIOpacity);
            auraOpacity.opacity = 118;
            const frameHeight = Math.max(frames[0].originalSize.height, 1);
            const scale = stagePresentation.auraDiameter / frameHeight;
            aura.setScale(scale, scale);
            panel.addChild(aura);
            [1, 2, 3].forEach((frameIndex, index) => {
                this.scheduleOnce(() => {
                    if (!aura.isValid) return;
                    auraSprite.spriteFrame = frames[frameIndex];
                    auraOpacity.opacity = frameIndex === 2 ? 185 : 136;
                    aura.setScale(scale * (1 + frameIndex * 0.04), scale * (1 + frameIndex * 0.04));
                }, 0.2 + index * 0.1);
            });
        }

        const iconBacking = this.makeRect(
            68,
            68,
            new Color(2, 15, 18, 245),
            new Color(accent.r, accent.g, accent.b, 190),
            18,
            1.5,
        );
        iconBacking.setPosition(-214, 0);
        iconBacking.addChild(this.createResourceSprite(reward.iconResourcePath, 52));
        panel.addChild(iconBacking);

        const eyebrow = this.makeLabel(
            `${victory ? stagePresentation.rewardEyebrow : '道 途 未 竟'}  ·  ${milestone.badge}`,
            13,
            new Color(accent.r, accent.g, accent.b, 235),
        );
        eyebrow.horizontalAlign = Label.HorizontalAlign.LEFT;
        eyebrow.node.setPosition(70, 42);
        eyebrow.node.getComponent(UITransform)?.setContentSize(400, 22);
        panel.addChild(eyebrow.node);

        const title = this.makeLabel(milestone.title, 22, new Color('#FFF0BE'));
        title.horizontalAlign = Label.HorizontalAlign.LEFT;
        title.node.setPosition(70, 13);
        title.node.getComponent(UITransform)?.setContentSize(400, 32);
        panel.addChild(title.node);
        const detail = this.makeLabel(milestone.detail, 15, new Color('#D4E8E0'));
        detail.horizontalAlign = Label.HorizontalAlign.LEFT;
        detail.node.setPosition(70, -16);
        detail.node.getComponent(UITransform)?.setContentSize(400, 24);
        panel.addChild(detail.node);
        const footnote = this.makeLabel(
            milestone.kind === 'first-clear' ? stagePresentation.rewardFootnote : milestone.footnote,
            12,
            new Color(133, 168, 158, 220),
        );
        footnote.horizontalAlign = Label.HorizontalAlign.LEFT;
        footnote.node.setPosition(70, -42);
        footnote.node.getComponent(UITransform)?.setContentSize(400, 20);
        panel.addChild(footnote.node);
        return panel;
    }

    private animateResultReveal(panel: Node, rewardPanel: Node): void {
        const panelOpacity = panel.addComponent(UIOpacity);
        const rewardOpacity = rewardPanel.addComponent(UIOpacity);
        // 主战报先落位、永久奖励随后凝成，避免首破价值继续被四项统计和构筑摘要淹没。
        for (let step = 0; step <= 12; step += 1) {
            this.scheduleOnce(() => {
                if (!panel.isValid || !rewardPanel.isValid) return;
                const frame = resultRevealFrameFor(step * 0.06);
                panelOpacity.opacity = frame.panelOpacity;
                panel.setScale(frame.panelScale, frame.panelScale);
                rewardOpacity.opacity = frame.rewardOpacity;
                rewardPanel.setScale(frame.rewardScale, frame.rewardScale);
            }, step * 0.06);
        }
    }

    private makeResultJourneySummary(stats: Readonly<RunStatsSnapshot>, accent: Color): Node {
        const panel = this.makeThemedCard(548, 126, 'summary', accent);
        panel.setPosition(0, 38);
        const achievementLabel = this.makeLabel('地图功绩', 15, new Color(accent.r, accent.g, accent.b, 235));
        achievementLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        achievementLabel.node.setPosition(-202, 39);
        achievementLabel.node.getComponent(UITransform)?.setContentSize(120, 25);
        panel.addChild(achievementLabel.node);
        const taken = this.makeLabel(`承伤 ${Math.round(stats.damageTaken)}`, 14, new Color(139, 172, 163, 220));
        taken.horizontalAlign = Label.HorizontalAlign.RIGHT;
        taken.node.setPosition(205, 39);
        taken.node.getComponent(UITransform)?.setContentSize(120, 24);
        panel.addChild(taken.node);
        const achievementValue = this.makeLabel(
            describeMapAchievement(this.currentStage.mapId, stats),
            17,
            new Color('#D7E9E2'),
        );
        achievementValue.horizontalAlign = Label.HorizontalAlign.LEFT;
        achievementValue.node.setPosition(26, 16);
        achievementValue.node.getComponent(UITransform)?.setContentSize(460, 30);
        panel.addChild(achievementValue.node);

        const divider = new Node('JourneyDivider');
        divider.layer = Layers.Enum.UI_2D;
        divider.setPosition(0, -7);
        const dividerGraphics = divider.addComponent(Graphics);
        dividerGraphics.strokeColor = new Color(99, 147, 136, 80);
        dividerGraphics.lineWidth = 1;
        dividerGraphics.moveTo(-244, 0);
        dividerGraphics.lineTo(244, 0);
        dividerGraphics.stroke();
        panel.addChild(divider);

        const event = stats.mapEvent;
        if (event) {
            const eventAccent = new Color(MAP_EVENT_TONE_COLORS[event.tone]);
            const iconBacking = this.makeRect(
                48,
                48,
                new Color(2, 16, 20, 245),
                new Color(eventAccent.r, eventAccent.g, eventAccent.b, 155),
                14,
                1,
            );
            iconBacking.setPosition(-220, -36);
            iconBacking.addChild(this.createResourceSprite(event.iconResourcePath, 36));
            panel.addChild(iconBacking);
            const eventLabel = this.makeLabel(`奇遇印记  ·  ${event.role}`, 13, eventAccent);
            eventLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            eventLabel.node.setPosition(-98, -25);
            eventLabel.node.getComponent(UITransform)?.setContentSize(202, 24);
            panel.addChild(eventLabel.node);
            const eventValue = this.makeLabel(describeMapEventDecision(stats), 16, new Color('#E5F2ED'));
            eventValue.horizontalAlign = Label.HorizontalAlign.LEFT;
            eventValue.node.setPosition(34, -47);
            eventValue.node.getComponent(UITransform)?.setContentSize(310, 28);
            panel.addChild(eventValue.node);

            const replayButton = this.makeRect(
                88,
                34,
                new Color(eventAccent.r, eventAccent.g, eventAccent.b, 28),
                new Color(eventAccent.r, eventAccent.g, eventAccent.b, 150),
                11,
                1,
            );
            replayButton.name = 'RouteReplayButton';
            replayButton.setPosition(216, -35);
            const replayLabel = this.makeLabel('回 放', 12, eventAccent);
            replayLabel.node.getComponent(UITransform)?.setContentSize(78, 24);
            replayButton.addChild(replayLabel.node);
            replayButton.on(Node.EventType.TOUCH_START, (touch: EventTouch) => {
                touch.propagationStopped = true;
                replayButton.setScale(0.96, 0.96);
            });
            replayButton.on(Node.EventType.TOUCH_CANCEL, () => replayButton.setScale(1, 1));
            replayButton.on(Node.EventType.TOUCH_END, (touch: EventTouch) => {
                touch.propagationStopped = true;
                replayButton.setScale(1, 1);
                this.showResultRouteReplay(stats);
            });
            panel.addChild(replayButton);
        } else {
            const empty = this.makeLabel(describeMapEventDecision(stats), 15, new Color(137, 168, 159, 225));
            empty.horizontalAlign = Label.HorizontalAlign.LEFT;
            empty.node.setPosition(-42, -36);
            empty.node.getComponent(UITransform)?.setContentSize(430, 30);
            panel.addChild(empty.node);
        }
        return panel;
    }

    private showResultRouteReplay(stats: Readonly<RunStatsSnapshot>): void {
        const event = stats.mapEvent;
        if (!event) return;
        const previous = this.overlay.getChildByName('ResultRouteReplay');
        if (previous?.isValid) previous.destroy();

        const eventAccent = new Color(MAP_EVENT_TONE_COLORS[event.tone]);
        const stageAccent = new Color(this.currentStage.accent);
        const replay = new Node('ResultRouteReplay');
        replay.layer = Layers.Enum.UI_2D;
        const shade = this.makeRect(
            this.designWidth,
            this.designHeight,
            new Color(1, 8, 12, 232),
        );
        shade.on(Node.EventType.TOUCH_START, (touch: EventTouch) => {
            // 覆盖式回放必须吞掉底层战报按钮，避免关闭前误触“再战本章”。
            touch.propagationStopped = true;
        });
        replay.addChild(shade);

        const panel = this.makeRect(
            642,
            1130,
            new Color(4, 23, 28, 252),
            new Color(stageAccent.r, stageAccent.g, stageAccent.b, 210),
            30,
            2.5,
        );
        replay.addChild(panel);
        const inner = this.makeRect(
            616,
            1104,
            new Color(4, 23, 28, 0),
            new Color(eventAccent.r, eventAccent.g, eventAccent.b, 72),
            25,
            1,
        );
        panel.addChild(inner);

        const eyebrow = this.makeLabel(
            `${this.currentStage.chapter}  ·  路 线 回 放`,
            15,
            stageAccent,
        );
        eyebrow.node.setPosition(0, 488);
        eyebrow.node.getComponent(UITransform)?.setContentSize(320, 28);
        panel.addChild(eyebrow.node);
        const title = this.makeLabel(event.geometryPreview, 43, new Color('#FFF0BE'));
        title.node.setPosition(0, 434);
        title.node.getComponent(UITransform)?.setContentSize(500, 58);
        panel.addChild(title.node);
        const subtitle = this.makeLabel(
            `${event.role}  ·  ${event.title}`,
            18,
            eventAccent,
        );
        subtitle.node.setPosition(0, 390);
        subtitle.node.getComponent(UITransform)?.setContentSize(500, 30);
        panel.addChild(subtitle.node);

        const mapBacking = this.makeRect(
            560,
            430,
            new Color(2, 14, 19, 248),
            new Color(eventAccent.r, eventAccent.g, eventAccent.b, 145),
            24,
            1.5,
        );
        mapBacking.setPosition(0, 132);
        const background = this.createResourceSprite(
            BACKGROUND_ASSETS[this.currentStage.mapId].resourcePath,
            406,
        );
        const backgroundOpacity = background.addComponent(UIOpacity);
        backgroundOpacity.opacity = 185;
        mapBacking.addChild(background);
        const mapVeil = this.makeRect(532, 402, new Color(1, 10, 14, 65), undefined, 19);
        mapBacking.addChild(mapVeil);

        if (event.commitEffect) {
            const frames = this.routeCommitFrames(event.commitEffect);
            const placements = this.chapterRoutePreviewPlacements(event.commitEffect);
            if (frames.length === 4) {
                const projectedPlacements = placements.map((placement) => {
                    const x = (placement.x / Math.max(Math.abs(this.arena.left), this.arena.right)) * 205;
                    const normalizedY = (placement.y - this.arena.bottom)
                        / (this.arena.top - this.arena.bottom);
                    return new Vec2(x, (normalizedY - 0.5) * 292);
                });
                this.createRouteInkTrace(
                    mapBacking,
                    projectedPlacements,
                    -142,
                    142,
                    eventAccent,
                    26,
                    3,
                    `ResultRouteTrace-${event.commitEffect}`,
                );
                const calm = this.isCalmRouteCommitEffect(event.commitEffect);
                const markerHeight = placements.length >= 3
                    ? calm ? 78 : 70
                    : placements.length === 2
                        ? 94
                        : 128;
                placements.forEach((placement, index) => {
                    const marker = new Node(`ResultRouteReplayMarker-${index}`);
                    marker.layer = Layers.Enum.UI_2D;
                    marker.setPosition(
                        projectedPlacements[index].x,
                        projectedPlacements[index].y,
                    );
                    const sprite = marker.addComponent(Sprite);
                    sprite.sizeMode = Sprite.SizeMode.RAW;
                    sprite.spriteFrame = frames[0];
                    const frameHeight = Math.max(frames[0].originalSize.height, 1);
                    const baseScale = markerHeight / frameHeight;
                    marker.setScale(baseScale * 0.9, baseScale * 0.9);
                    mapBacking.addChild(marker);
                    // 复盘只播放一次四帧并回驻峰值帧，既证明路线资产真实存在，也避免结算页循环干扰阅读。
                    [1, 2, 3, 2].forEach((frameIndex, step) => {
                        this.scheduleOnce(() => {
                            if (!marker.isValid) return;
                            sprite.spriteFrame = frames[frameIndex];
                            const pulse = 0.9 + Math.min(step, 2) * 0.055;
                            marker.setScale(baseScale * pulse, baseScale * pulse);
                        }, 0.12 * (step + 1) + index * 0.035);
                    });
                });
            }
        }

        const commitment = this.makeRect(
            500,
            42,
            new Color(2, 17, 21, 225),
            new Color(eventAccent.r, eventAccent.g, eventAccent.b, 98),
            13,
            1,
        );
        commitment.setPosition(0, -172);
        const commitmentLabel = this.makeLabel(event.commitLine, 14, new Color('#D8ECE5'));
        commitmentLabel.node.getComponent(UITransform)?.setContentSize(482, 30);
        commitment.addChild(commitmentLabel.node);
        mapBacking.addChild(commitment);
        panel.addChild(mapBacking);

        const steps = describeRouteReplaySteps(stats);
        steps.forEach((step, index) => {
            const card = this.makeRect(
                168,
                112,
                new Color(5, 31, 34, 246),
                new Color(
                    index === 2 ? eventAccent.r : stageAccent.r,
                    index === 2 ? eventAccent.g : stageAccent.g,
                    index === 2 ? eventAccent.b : stageAccent.b,
                    125,
                ),
                18,
                1.25,
            );
            card.setPosition(-180 + index * 180, -178);
            const stepLabel = this.makeLabel(
                `${index + 1}  ${step.label}`,
                13,
                new Color(142, 181, 169, 235),
            );
            stepLabel.node.setPosition(0, 25);
            stepLabel.node.getComponent(UITransform)?.setContentSize(154, 24);
            card.addChild(stepLabel.node);
            const stepValue = this.makeLabel(
                step.value,
                index === 2 ? 15 : 17,
                index === 2 ? eventAccent : new Color('#F5E8C5'),
            );
            stepValue.node.setPosition(0, -15);
            stepValue.node.getComponent(UITransform)?.setContentSize(152, 48);
            card.addChild(stepValue.node);
            panel.addChild(card);
        });

        const resultStrip = this.makeRect(
            548,
            66,
            new Color(eventAccent.r, eventAccent.g, eventAccent.b, 20),
            new Color(eventAccent.r, eventAccent.g, eventAccent.b, 100),
            17,
            1,
        );
        resultStrip.setPosition(0, -326);
        const resultTitle = this.makeLabel(
            `本局印证  ·  ${describeMapAchievement(this.currentStage.mapId, stats)}`,
            15,
            eventAccent,
        );
        resultTitle.node.setPosition(0, 13);
        resultTitle.node.getComponent(UITransform)?.setContentSize(520, 28);
        resultStrip.addChild(resultTitle.node);
        const resultDetail = this.makeLabel(
            `历时 ${formatRunDuration(stats.elapsedSeconds)}  ·  斩妖 ${stats.enemiesDefeated}  ·  总伤 ${Math.round(stats.damageDealt)}`,
            13,
            new Color('#D5E8E1'),
        );
        resultDetail.node.setPosition(0, -15);
        resultDetail.node.getComponent(UITransform)?.setContentSize(520, 24);
        resultStrip.addChild(resultDetail.node);
        panel.addChild(resultStrip);

        const close = this.makeButton(
            '收 起 回 放',
            stageAccent,
            () => replay.destroy(),
            330,
            66,
            new Color(14, 58, 54, 245),
        );
        close.setPosition(0, -462);
        panel.addChild(close);
        this.overlay.addChild(replay);
    }

    private makeResultStat(labelText: string, valueText: string, accent: Color): Node {
        const tile = new Node(`ResultStat-${labelText}`);
        tile.layer = Layers.Enum.UI_2D;
        tile.addComponent(UITransform).setContentSize(126, 80);
        const value = this.makeLabel(valueText, 26, new Color('#F4E6C2'));
        value.node.setPosition(0, 12);
        value.node.getComponent(UITransform)?.setContentSize(112, 38);
        tile.addChild(value.node);
        const label = this.makeLabel(labelText, 14, new Color(accent.r, accent.g, accent.b, 220));
        label.node.setPosition(0, -25);
        label.node.getComponent(UITransform)?.setContentSize(108, 24);
        tile.addChild(label.node);
        return tile;
    }

    private makeResultBuildSummary(): Node {
        const panel = this.makeThemedCard(548, 132, 'summary');
        panel.setPosition(0, -96);
        const totals = summarizeUpgradePaths((id) => this.skills.getLevel(id));
        const dominantPath = UPGRADE_PATH_ORDER.reduce((best, path) => (
            totals[path] > totals[best] ? path : best
        ), UPGRADE_PATH_ORDER[0]);
        const title = this.makeLabel(
            `道基归途  ·  主修${UPGRADE_PATH_LABELS[dominantPath]}`,
            17,
            new Color('#D8E9E2'),
        );
        title.horizontalAlign = Label.HorizontalAlign.LEFT;
        // FIXED_HEIGHT 在窄长屏会裁掉设计画布两侧，左对齐文本需控制在 ±300 的安全区。
        title.node.setPosition(-116, 41);
        title.node.getComponent(UITransform)?.setContentSize(360, 30);
        panel.addChild(title.node);
        UPGRADE_PATH_ORDER.forEach((path, index) => {
            const chip = new Node(`ResultPath-${path}`);
            chip.layer = Layers.Enum.UI_2D;
            chip.addComponent(UITransform).setContentSize(150, 40);
            chip.setPosition(-170 + index * 170, -5);
            const label = this.makeLabel(
                `${UPGRADE_PATH_LABELS[path]} ${totals[path]}重`,
                16,
                new Color(UPGRADE_PATH_COLORS[path]),
            );
            label.node.getComponent(UITransform)?.setContentSize(140, 28);
            chip.addChild(label.node);
            panel.addChild(chip);
        });
        const activeBuild = this.makeLabel(
            `御剑 ${this.skills.getLevel('sword')} · 踏云 ${this.skills.getLevel('dash')} · 剑阵 ${this.skills.getLevel('formation')} · 天劫 ${this.skills.getLevel('tribulation')} · 最高连斩 ${this.runStats.snapshot().bestCombo}`,
            13,
            new Color(130, 162, 154, 225),
        );
        activeBuild.node.setPosition(0, -48);
        activeBuild.node.getComponent(UITransform)?.setContentSize(500, 24);
        panel.addChild(activeBuild.node);
        return panel;
    }

    private findNearestEnemy(): EnemyState | undefined {
        return this.enemies.reduce<EnemyState | undefined>((nearest, enemy) => {
            if (!enemy.node.isValid || enemy.dead) return nearest;
            if (nearest?.dead) return enemy;
            if (!nearest) return enemy;
            return Vec3.distance(this.player.position, enemy.node.position) < Vec3.distance(this.player.position, nearest.node.position) ? enemy : nearest;
        }, undefined);
    }

    private updateHud(): void {
        const wave = this.currentStage.waves[this.waveIndex];
        this.hpLabel.string = `${Math.ceil(this.hp)} / ${this.maxHp}`;
        this.waveLabel.string = `第 ${this.waveIndex + 1} 波`;
        this.drawWaveRoute();
        if (this.objectiveLabel) {
            const firstClearPending = this.stageProgress.recordFor(this.currentStage.mapId).clears <= 0;
            const openingObjectiveVisible = this.waveIndex === 0
                && this.openingObjectiveState?.visible
                && !this.mapEvent.choice();
            const eliteEncounterState = this.eliteEncounter.snapshot();
            const rememberingChapterBranch = this.waveIndex === 0
                && this.chapterBranchMemoryTimer > 0
                && !this.mapEvent.choice();
            if (openingObjectiveVisible) {
                const presentation = openingObjectivePresentationFor(this.currentStage.mapId);
                this.objectiveLabel.string = firstClearPending
                    ? `初入指引 1/2  ·  ${this.openingObjectiveState?.text ?? presentation.instruction}`
                    : `${presentation.eyebrow}  ·  ${this.openingObjectiveState?.text ?? presentation.instruction}`;
                this.objectiveLabel.color = new Color(presentation.accent);
            } else if (firstClearPending && this.waveIndex === 0 && !this.mapEvent.choice()) {
                // 首境动作完成后继续交代基础战斗目标，首次玩家不会从地图教学突然掉进无提示战斗。
                this.objectiveLabel.string = '初入指引 2/2  ·  保持移动  ·  御剑自动索敌  ·  清除余敌';
                this.objectiveLabel.color = new Color(this.currentStage.accent);
            } else if (eliteEncounterState.active) {
                const presentation = eliteEncounterPresentationFor(this.currentStage.mapId);
                this.objectiveLabel.string = `${presentation.eyebrow}  ·  ${eliteEncounterState.text}`;
                this.objectiveLabel.color = new Color(presentation.accent);
            } else if (rememberingChapterBranch) {
                this.objectiveLabel.string = describeChapterBranchMemory(this.currentStage.mapId);
                this.objectiveLabel.color = new Color(this.currentStage.accent);
            } else {
                const veinStatus = this.spiritVeinVisual?.node.isValid
                    ? this.spiritVein.claimed
                        ? `${this.spiritVein.kind === 'sword' ? '剑脉加持' : '灵泉回气'} ${this.spiritVein.buffTimer.toFixed(1)}秒`
                        : `阵眼 ${Math.round(this.spiritVein.captureProgress * 100)}%`
                    : '';
                const qingshiRoute = this.currentStage.mapId === 'qingshi-road'
                    ? this.mapEvent.choice()?.effect.qingshiRoute
                    : undefined;
                const qingshiStatus = qingshiRoute
                    ? qingshiRoute === 'sword-stele-array'
                        ? `${describeQingshiRouteGeometry(qingshiRoute)} · 入碑承伤 +35%`
                        : `${describeQingshiRouteGeometry(qingshiRoute)} · 灵泉换位`
                    : '';
                const bambooRoute = this.currentStage.mapId === 'bamboo-ambush'
                    ? this.mapEvent.choice()?.effect.bambooRoute
                    : undefined;
                const obstacleStatus = bambooRoute
                    ? `${describeBambooRouteGeometry(bambooRoute)} · 竹障 ${this.mapObstacles.activeCount()}`
                    : this.mapObstacles.activeCount() > 0
                        ? `竹障 ${this.mapObstacles.activeCount()}`
                        : '';
                const frostState = this.currentStage.mapId === 'frozen-ruins'
                    ? this.frostTide.snapshot()
                    : undefined;
                const frostRoute = this.currentStage.mapId === 'frozen-ruins'
                    ? this.mapEvent.choice()?.effect.frostRoute
                    : undefined;
                const tideStatus = frostState
                    ? frostState.phase === 'surge'
                        ? `${frostRoute ? `${describeFrostRouteGeometry(frostRoute)} · ` : ''}寒潮横渡`
                        : `${frostRoute ? `${describeFrostRouteGeometry(frostRoute)} · ` : ''}寒潮 ${Math.max(0, frostState.secondsToSurge).toFixed(1)}秒`
                    : '';
                // 目标条只保留主目标和当下最要命的一条状态：五段拼接会长到没人读。
                // 优先级按"来不及反应的排前面"：寒潮 > 阵眼 > 竹障 > 青石路形。
                const urgentStatus = [tideStatus, veinStatus, obstacleStatus, qingshiStatus]
                    .find(Boolean) ?? '';
                this.objectiveLabel.string = urgentStatus
                    ? `${wave?.objective ?? '肃清妖潮'}  ·  ${urgentStatus}`
                    : wave?.objective ?? '肃清妖潮';
                this.objectiveLabel.color = new Color('#D8F3E9');
            }
        }
        if (this.routeChoiceLabel) {
            this.routeChoiceLabel.string = this.mapEvent.routeHudText(
                this.waveIndex,
                this.currentStage.waves.length,
                wave?.danger === 'boss',
            );
            const choice = this.mapEvent.choice();
            this.routeChoiceLabel.color = choice
                ? new Color(MAP_EVENT_TONE_COLORS[choice.tone])
                : new Color('#CDE9DF');
        }
        const flow = this.combatFlow.snapshot();
        if (this.comboPanel && this.comboLabel) {
            this.comboPanel.active = flow.combo >= 2;
            this.comboLabel.string = flow.tier > 0
                ? `${flow.combo}连斩 · ${flow.label}`
                : `${flow.combo}连斩 · 起势`;
            this.comboLabel.color = new Color(
                flow.tier >= 3 ? '#FFF0A8' : flow.tier >= 2 ? '#F4D28A' : '#CDE8DE',
            );
        }
        const dashLevel = this.skills.getLevel('dash');
        const formationLevel = this.skills.getLevel('formation');
        drawSkillHud(
            this.dashHud,
            '踏云',
            dashLevel,
            this.skills.dashCooldown,
            dashLevel > 0 ? getDashCooldown(dashLevel) : 1,
        );
        drawSkillHud(
            this.formationHud,
            '剑阵',
            formationLevel,
            this.skills.formationCooldown,
            formationLevel > 0 ? getFormationSpec(formationLevel).cooldown : 1,
        );
        drawTribulationHud(this.tribulationHud, this.skills);

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        this.hpBar.clear();
        this.hpBar.fillColor = new Color(2, 9, 12, 210);
        this.hpBar.roundRect(-116, -8, 232, 16, 8);
        this.hpBar.fill();
        this.hpBar.fillColor = new Color(hpRatio < 0.3 ? '#E64F4F' : '#D96C61');
        this.hpBar.roundRect(-113, -5, 226 * hpRatio, 10, 5);
        this.hpBar.fill();
        this.hpBar.strokeColor = new Color(255, 214, 194, 75);
        this.hpBar.lineWidth = 1;
        this.hpBar.roundRect(-116, -8, 232, 16, 8);
        this.hpBar.stroke();

        this.drawBreakthroughProgress();

        const boss = this.enemies.find((enemy) => enemy.elite && enemy.node.isValid && !enemy.dead);
        this.bossHud.active = Boolean(boss);
        // 目标条与道途条不再无条件隐藏：没有它们，玩家在局内既不知道要做什么，也看不到自己选过的路。
        // 关底血条占用同一段纵向空间，也确实是此刻唯一的目标，因此登场时由它独占。
        this.objectiveBacking.active = !boss && Boolean(this.objectiveLabel?.string);
        this.routeChoiceBacking.active = !boss && Boolean(this.routeChoiceLabel?.string);
        if (boss) {
            const ratio = Math.max(0, boss.hp / boss.maxHp);
            const presentation = bossPhasePresentationFor(this.currentStage.mapId, boss.bossPhase);
            this.bossHpLabel.string = `关底 · ${presentation.bossName}    ${presentation.phaseName}    ${Math.ceil(boss.hp)}/${boss.maxHp}`;
            this.bossHpLabel.color = new Color(presentation.tone);
            this.bossPhaseLabel.string = presentation.hudDetail;
            this.bossPhaseLabel.color = new Color(presentation.tone);
            this.bossHpBar.clear();
            this.bossHpBar.fillColor = new Color(5, 4, 6, 230);
            this.bossHpBar.roundRect(-270, -7, 540, 14, 7);
            this.bossHpBar.fill();
            this.bossHpBar.fillColor = new Color(presentation.tone);
            this.bossHpBar.roundRect(-268, -5, 536 * ratio, 10, 5);
            this.bossHpBar.fill();
            const thresholdX = -268 + 536 * BOSS_PHASE_TWO_THRESHOLD;
            this.bossHpBar.strokeColor = new Color('#FFF0B5');
            this.bossHpBar.lineWidth = 2;
            this.bossHpBar.moveTo(thresholdX, -10);
            this.bossHpBar.lineTo(thresholdX, 10);
            this.bossHpBar.stroke();
            this.bossHpBar.fillColor = boss.bossPhase === 2
                ? new Color(presentation.tone)
                : new Color('#FFF0B5');
            this.bossHpBar.moveTo(thresholdX, 11);
            this.bossHpBar.lineTo(thresholdX + 6, 5);
            this.bossHpBar.lineTo(thresholdX, -1);
            this.bossHpBar.lineTo(thresholdX - 6, 5);
            this.bossHpBar.close();
            this.bossHpBar.fill();
        }
    }

    /**
     * 修为条与破境预警环共用同一份进度：条给准确读数，环给余光可见的紧迫感。
     */
    private drawBreakthroughProgress(): void {
        const xpRatio = Math.max(0, Math.min(1, this.xp / Math.max(this.xpNeed, 1)));
        const breathing = this.breakthroughImminent && !this.prefersReducedMotion
            ? (Math.sin(this.breakthroughPulse) + 1) / 2
            : 0;

        this.xpBar.clear();
        this.xpBar.fillColor = new Color(2, 9, 12, 220);
        this.xpBar.roundRect(-116, -6, 232, 12, 6);
        this.xpBar.fill();
        const fillWidth = 228 * xpRatio;
        if (fillWidth > 0.5) {
            // 临近破境时填充色从灵气青偏向破境金，颜色本身就是"快到了"的信号。
            this.xpBar.fillColor = this.breakthroughImminent
                ? new Color(
                    Math.round(75 + 180 * breathing),
                    Math.round(200 + 40 * breathing),
                    Math.round(167 - 20 * breathing),
                    255,
                )
                : new Color('#4BC8A7');
            this.xpBar.roundRect(-114, -4, fillWidth, 8, 4);
            this.xpBar.fill();
        }
        this.xpBar.strokeColor = new Color(
            167,
            243,
            208,
            Math.round(60 + 130 * breathing),
        );
        this.xpBar.lineWidth = 1.5;
        this.xpBar.roundRect(-116, -6, 232, 12, 6);
        this.xpBar.stroke();
        this.xpLabel.string = this.breakthroughImminent
            ? `破 境 在 即 · ${Math.round(xpRatio * 100)}%`
            : `修为 ${Math.round(xpRatio * 100)}%`;
        this.xpLabel.color = this.breakthroughImminent
            ? new Color(255, 240, 190, 255)
            : new Color(217, 251, 236, 205);

        const ring = this.breakthroughRing;
        if (!ring?.isValid) return;
        ring.clear();
        if (!this.breakthroughImminent) return;
        const radius = 54 + breathing * 6;
        ring.strokeColor = new Color(255, 226, 150, Math.round(70 + 165 * breathing));
        ring.lineWidth = 3 + breathing * 3;
        ring.circle(0, 0, radius);
        ring.stroke();
        ring.strokeColor = new Color(120, 240, 210, Math.round(40 + 90 * breathing));
        ring.lineWidth = 1.5;
        ring.circle(0, 0, radius + 7);
        ring.stroke();
    }


    private showCultivationSheet(): void {
        if (this.phase !== 'playing') return;
        this.phase = 'cultivation-sheet';
        this.moveTarget = undefined;
        this.clearOverlay();
        this.bringOverlayToFront();

        const build = resolveCultivationBuild((id) => this.skills.getLevel(id));
        const totals = summarizeUpgradePaths((id) => this.skills.getLevel(id));
        // Cocos Web Mobile 的兼容转译不能可靠展开 Set；沿用数组去重，避免历史次数正确但列表变成 0 项。
        const selectedIds = this.cultivationChoiceHistory.filter(
            (id, index, allIds) => allIds.indexOf(id) === index,
        );
        const equipped = selectedIds
            .map((id) => UPGRADES.find((upgrade) => upgrade.id === id))
            .filter((upgrade): upgrade is UpgradeConfig => Boolean(upgrade));
        const layoutRowCount = Math.max(3, Math.min(5, equipped.length));
        const sheetHeight = 620 + (layoutRowCount - 3) * 68;
        const sheetTop = sheetHeight / 2;
        const rowStartY = sheetTop - 292;
        const statsY = rowStartY - (layoutRowCount - 1) * 68 - 112;
        const accent = new Color(build.path ? UPGRADE_PATH_COLORS[build.path] : '#6FCAB1');
        const gold = new Color('#D8B86B');
        const veil = this.makeRect(this.designWidth, this.designHeight, new Color(2, 9, 12, 158));
        veil.name = 'CultivationSheetVeil';
        this.overlay.addChild(veil);

        const sheet = this.makeRect(
            596,
            sheetHeight,
            new Color(3, 18, 23, 252),
            new Color(gold.r, gold.g, gold.b, 150),
            UI_THEME.radius.panel,
            2,
        );
        sheet.name = 'CultivationSheet';
        // 顶边固定在战场可视区，历史条目增加时只向下延展，避免标题与收起入口漂移。
        sheet.setPosition(0, 330 - sheetHeight / 2);
        this.overlay.addChild(sheet);
        // 使用无文字的实图边框承接设计稿材质；所有名称、数值与交互仍由运行时节点实时生成。
        const sheetFrame = this.createResourceSprite('art/ui/cultivation-sheet-frame-v1/spriteFrame', sheetHeight - 8);
        sheetFrame.addComponent(UIOpacity).opacity = 210;
        sheet.addChild(sheetFrame);
        const innerFrame = this.makeRect(
            576,
            sheetHeight - 20,
            new Color(3, 18, 23, 0),
            new Color(gold.r, gold.g, gold.b, 62),
            20,
            1,
        );
        sheet.addChild(innerFrame);

        const closeSheet = (): void => {
            if (this.phase !== 'cultivation-sheet') return;
            this.clearOverlay();
            this.phase = 'playing';
            this.updateHud();
        };

        const title = this.makeLabel('修 行 卷', 42, new Color('#F3E7C8'));
        title.horizontalAlign = Label.HorizontalAlign.LEFT;
        title.node.setPosition(-144, sheetTop - 42);
        title.node.getComponent(UITransform)?.setContentSize(250, 48);
        sheet.addChild(title.node);
        const buildCaption = this.makeLabel('本局构筑', 18, new Color('#BCA772'));
        buildCaption.node.setPosition(12, sheetTop - 42);
        buildCaption.node.getComponent(UITransform)?.setContentSize(150, 28);
        sheet.addChild(buildCaption.node);
        const close = this.makeActionButton('收起', 'quiet', gold, closeSheet, 112, 48);
        close.setPosition(222, sheetTop - 42);
        sheet.addChild(close);

        const relicCard = this.makeRect(
            548,
            132,
            new Color(6, 29, 34, 238),
            new Color(gold.r, gold.g, gold.b, 88),
            UI_THEME.radius.compact,
            1,
        );
        relicCard.setPosition(0, sheetTop - 135);
        sheet.addChild(relicCard);
        const relicIcon = new Node('CultivationSheetRelic');
        relicIcon.layer = Layers.Enum.UI_2D;
        relicIcon.setPosition(-214, 0);
        const relicRing = relicIcon.addComponent(Graphics);
        relicRing.fillColor = new Color(3, 18, 22, 242);
        relicRing.circle(0, 0, 48);
        relicRing.fill();
        relicRing.strokeColor = new Color(accent.r, accent.g, accent.b, 215);
        relicRing.lineWidth = 2;
        relicRing.circle(0, 0, 48);
        relicRing.stroke();
        relicRing.strokeColor = new Color(accent.r, accent.g, accent.b, 72);
        relicRing.circle(0, 0, 40);
        relicRing.stroke();
        if (build.relic) relicIcon.addChild(this.createResourceSprite(build.relic.iconResourcePath, 70));
        relicCard.addChild(relicIcon);
        const relicName = this.makeLabel(
            build.relic ? `${build.relic.name} · ${build.evolutionName}` : '尚未装备本命法宝',
            30,
            new Color('#FFF0C8'),
        );
        relicName.horizontalAlign = Label.HorizontalAlign.LEFT;
        relicName.node.setPosition(-20, 24);
        relicName.node.getComponent(UITransform)?.setContentSize(292, 38);
        relicCard.addChild(relicName.node);
        const relicNext = this.makeLabel(
            build.relic ? `${build.tierName} · ${build.nextText}` : '首次破境选择道种后立即装备',
            19,
            new Color('#B7D8CB'),
        );
        relicNext.horizontalAlign = Label.HorizontalAlign.LEFT;
        relicNext.node.setPosition(-20, -22);
        relicNext.node.getComponent(UITransform)?.setContentSize(292, 30);
        relicCard.addChild(relicNext.node);

        const pathSeal = this.makeRect(
            96,
            110,
            new Color(4, 26, 31, 248),
            new Color(accent.r, accent.g, accent.b, 180),
            38,
            2,
        );
        pathSeal.setPosition(216, 0);
        relicCard.addChild(pathSeal);
        const pathSealText = build.path
            ? `${UPGRADE_PATH_LABELS[build.path]}\n${totals[build.path]}重`
            : '待悟\n0重';
        const pathLabel = this.makeLabel(pathSealText, 23, accent);
        pathLabel.lineHeight = 31;
        pathLabel.node.getComponent(UITransform)?.setContentSize(82, 78);
        pathSeal.addChild(pathLabel.node);

        const sectionTitle = this.makeLabel(
            `已悟道法  ${this.cultivationChoiceHistory.length}项`,
            25,
            new Color('#F1E5C6'),
        );
        sectionTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
        sectionTitle.node.setPosition(-86, sheetTop - 231);
        sectionTitle.node.getComponent(UITransform)?.setContentSize(400, 34);
        sheet.addChild(sectionTitle.node);

        const listHeight = layoutRowCount * 68;
        const listPanel = this.makeRect(
            528,
            listHeight,
            new Color(5, 25, 30, 216),
            new Color(gold.r, gold.g, gold.b, 90),
            16,
            1,
        );
        listPanel.setPosition(8, rowStartY - (layoutRowCount - 1) * 34);
        sheet.addChild(listPanel);

        // 修行脉络与真实历史顺序一致；节点跟随条目扩展，不使用写死的装饰图避免数据变化后错位。
        const lineage = new Node('CultivationLineage');
        lineage.layer = Layers.Enum.UI_2D;
        lineage.setPosition(-258, rowStartY);
        const lineageGraphics = lineage.addComponent(Graphics);
        lineageGraphics.strokeColor = new Color(accent.r, accent.g, accent.b, 190);
        lineageGraphics.lineWidth = 2;
        lineageGraphics.moveTo(0, 0);
        lineageGraphics.lineTo(0, -(layoutRowCount - 1) * 68);
        lineageGraphics.stroke();
        for (let index = 0; index < layoutRowCount; index += 1) {
            lineageGraphics.fillColor = new Color(4, 23, 28, 255);
            lineageGraphics.circle(0, -index * 68, 6);
            lineageGraphics.fill();
            lineageGraphics.strokeColor = new Color(accent.r, accent.g, accent.b, 220);
            lineageGraphics.circle(0, -index * 68, 6);
            lineageGraphics.stroke();
        }
        sheet.addChild(lineage);

        if (equipped.length === 0) {
            const empty = this.makeLabel('尚未选择进化', 21, new Color('#8FAFA5'));
            empty.node.setPosition(8, rowStartY);
            empty.node.getComponent(UITransform)?.setContentSize(500, 40);
            sheet.addChild(empty.node);
        }
        equipped.slice(0, 5).forEach((upgrade, index) => {
            const level = this.skills.getLevel(upgrade.id);
            const row = new Node('CultivationLineageRow');
            row.layer = Layers.Enum.UI_2D;
            row.setPosition(8, rowStartY - index * 68);
            row.addChild(this.createResourceSprite(upgrade.iconResourcePath, 46));
            row.children[row.children.length - 1]?.setPosition(-218, 0);
            const levelText = upgrade.maxLevel > 1 || level > 1 ? ` · ${level}阶` : '';
            const rowTitle = this.makeLabel(`${upgrade.title}${levelText}`, 24, new Color('#F3E7C8'));
            rowTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
            rowTitle.node.setPosition(-48, 14);
            rowTitle.node.getComponent(UITransform)?.setContentSize(292, 28);
            row.addChild(rowTitle.node);
            const compactDetail = upgrade.descriptions[Math.max(0, level - 1)] ?? '';
            const rowDetail = this.makeLabel(
                compactDetail,
                20,
                new Color('#AFCBC1'),
            );
            rowDetail.horizontalAlign = Label.HorizontalAlign.LEFT;
            rowDetail.node.setPosition(-48, -15);
            rowDetail.node.getComponent(UITransform)?.setContentSize(292, 24);
            row.addChild(rowDetail.node);
            const effectTag = upgrade.role.split(' · ')[0];
            const tag = this.makeLabel(effectTag, 20, accent);
            tag.horizontalAlign = Label.HorizontalAlign.RIGHT;
            tag.node.setPosition(210, 0);
            tag.node.getComponent(UITransform)?.setContentSize(72, 28);
            row.addChild(tag.node);
            if (index < layoutRowCount - 1) {
                const divider = this.makeRect(436, 1, new Color(gold.r, gold.g, gold.b, 58));
                divider.setPosition(20, -34);
                row.addChild(divider);
            }
            sheet.addChild(row);
        });
        if (equipped.length > 5) {
            const more = this.makeLabel(`另有 ${equipped.length - 5} 项已生效`, 19, new Color('#8FAFA5'));
            more.horizontalAlign = Label.HorizontalAlign.RIGHT;
            more.node.setPosition(166, statsY + 58);
            more.node.getComponent(UITransform)?.setContentSize(190, 26);
            sheet.addChild(more.node);
        }

        const swordDamage = this.currentSwordDamage();
        const attackInterval = this.currentAttackInterval();
        const stats = this.makeRect(
            548,
            84,
            new Color(2, 15, 19, 246),
            new Color(gold.r, gold.g, gold.b, 125),
            14,
            1,
        );
        stats.setPosition(0, statsY);
        sheet.addChild(stats);
        [-40, 136].forEach((x) => {
            const divider = this.makeRect(1, 52, new Color(gold.r, gold.g, gold.b, 82));
            divider.setPosition(x, 0);
            stats.addChild(divider);
        });
        const swordUpgrade = UPGRADES.find((upgrade) => upgrade.id === 'sword');
        if (swordUpgrade) {
            const swordIcon = this.createResourceSprite(swordUpgrade.iconResourcePath, 48);
            swordIcon.setPosition(-238, 0);
            stats.addChild(swordIcon);
        }
        const primaryStat = this.makeLabel(`飞剑\n${this.swordCount}柄 · ${Math.round(swordDamage)}伤`, 25, new Color('#F3D18A'));
        primaryStat.lineHeight = 29;
        primaryStat.node.setPosition(-132, 0);
        primaryStat.node.getComponent(UITransform)?.setContentSize(184, 64);
        stats.addChild(primaryStat.node);
        [
            `间隔\n${attackInterval.toFixed(2)}秒`,
            this.cultivationShield > 0
                ? `护体 ${Math.ceil(this.cultivationShield)}\n气血 ${Math.ceil(this.hp)}/${Math.ceil(this.maxHp)}`
                : `气血\n${Math.ceil(this.hp)}/${Math.ceil(this.maxHp)}`,
        ].forEach((text, index) => {
            const stat = this.makeLabel(text, 20, new Color('#B7D8CB'));
            stat.lineHeight = 26;
            stat.node.setPosition(54 + index * 176, 0);
            stat.node.getComponent(UITransform)?.setContentSize(164, 60);
            stats.addChild(stat.node);
        });
    }

    private showRecentUpgrade(impact: UpgradeImpactPreview): void {
        if (!this.recentUpgradePanel?.isValid || !this.recentUpgradeLabel) return;
        const accent = impact.after.path
            ? new Color(UPGRADE_PATH_COLORS[impact.after.path])
            : new Color('#D9B86C');
        const graphics = this.recentUpgradePanel.getComponent(Graphics);
        if (graphics) {
            graphics.clear();
            graphics.fillColor = new Color(3, 18, 22, 238);
            graphics.roundRect(-180, -26, 360, 52, UI_THEME.radius.compact);
            graphics.fill();
            graphics.strokeColor = new Color(accent.r, accent.g, accent.b, 205);
            graphics.lineWidth = 1;
            graphics.roundRect(-180, -26, 360, 52, UI_THEME.radius.compact);
            graphics.stroke();
        }
        const shortDelta = describeUpgradeDelta(impact);
        this.recentUpgradeText = impact.milestone
            ? `${impact.milestone} · ${shortDelta}`
            : `${shortDelta} · 已生效`;
        const momentum = this.cultivationMomentum;
        this.recentUpgradeLabel.string = momentum && this.cultivationMomentumTimer > 0
            ? `${this.recentUpgradeText} · ${momentum.label} ${this.cultivationMomentumTimer.toFixed(1)}秒`
            : this.recentUpgradeText;
        this.recentUpgradeLabel.color = new Color(accent.r, accent.g, accent.b, 255);
        this.recentUpgradePanel.active = true;
        // 面板至少覆盖整段余势，让玩家始终知道此刻为何变强；结束后再退化为构筑历史入口。
        this.recentUpgradeTimer = Math.max(6, (momentum?.duration ?? 0) + 1.1);
    }

    private showUpgradeHistorySummary(): void {
        if (!this.recentUpgradePanel?.isValid || !this.recentUpgradeLabel) return;
        const choiceCount = this.cultivationChoiceHistory.length;
        if (choiceCount <= 0) {
            this.recentUpgradePanel.active = false;
            return;
        }
        const uniqueCount = this.cultivationChoiceHistory.filter(
            (id, index, allIds) => allIds.indexOf(id) === index,
        ).length;
        const build = resolveCultivationBuild((id) => this.skills.getLevel(id));
        const graphics = this.recentUpgradePanel.getComponent(Graphics);
        if (graphics) {
            graphics.clear();
            graphics.fillColor = new Color(3, 18, 22, 218);
            graphics.roundRect(-180, -26, 360, 52, UI_THEME.radius.compact);
            graphics.fill();
            graphics.strokeColor = new Color(111, 202, 177, 145);
            graphics.lineWidth = 1;
            graphics.roundRect(-180, -26, 360, 52, UI_THEME.radius.compact);
            graphics.stroke();
        }
        this.recentUpgradeLabel.string = build.relic
            ? `${build.relic.name} · ${build.evolutionName} · ${build.nextText}`
            : `本局进化 ${choiceCount}次 · ${uniqueCount}项生效 · 点击查看`;
        this.recentUpgradeText = this.recentUpgradeLabel.string;
        this.recentUpgradeLabel.color = new Color('#BFE3D8');
        this.recentUpgradePanel.active = true;
    }

    private drawWaveRoute(): void {
        if (!this.waveRouteGraphics) return;
        const graphics = this.waveRouteGraphics;
        const count = this.currentStage.waves.length;
        const gap = 60;
        const startX = -gap * (count - 1) / 2;
        const triggerWaveIndex = this.mapEvent.triggerWaveIndex();
        const choice = this.mapEvent.choice();
        const routeTone = choice ? new Color(MAP_EVENT_TONE_COLORS[choice.tone]) : undefined;
        graphics.clear();
        for (let index = 0; index < count; index += 1) {
            const x = startX + gap * index;
            if (index < count - 1) {
                const segment = resolveRouteHudSegmentState(
                    index,
                    this.waveIndex,
                    triggerWaveIndex,
                    Boolean(choice),
                );
                graphics.strokeColor = segment.followsSelectedRoute && routeTone
                    ? new Color(routeTone.r, routeTone.g, routeTone.b, segment.completed ? 245 : 125)
                    : new Color(segment.completed ? '#6FD0AE' : '#355953');
                graphics.lineWidth = segment.followsSelectedRoute ? 4 : 3;
                graphics.moveTo(x + 9, 0);
                graphics.lineTo(x + gap - 9, 0);
                graphics.stroke();

                if (index === triggerWaveIndex) {
                    const branchX = x + gap / 2;
                    graphics.strokeColor = routeTone
                        ? new Color(routeTone.r, routeTone.g, routeTone.b, 245)
                        : new Color('#7EA99D');
                    graphics.lineWidth = 2;
                    graphics.moveTo(branchX - 12, 0);
                    graphics.lineTo(branchX - 5, 7);
                    graphics.moveTo(branchX - 12, 0);
                    graphics.lineTo(branchX - 5, -7);
                    graphics.stroke();
                    graphics.fillColor = routeTone
                        ? new Color(routeTone.r, routeTone.g, routeTone.b, 255)
                        : new Color('#173A36');
                    graphics.moveTo(branchX, 8);
                    graphics.lineTo(branchX + 8, 0);
                    graphics.lineTo(branchX, -8);
                    graphics.lineTo(branchX - 8, 0);
                    graphics.close();
                    graphics.fill();
                    graphics.stroke();
                }
            }
            const current = index === this.waveIndex;
            const completed = index < this.waveIndex;
            const boss = this.currentStage.waves[index]?.danger === 'boss';
            const followsSelectedRoute = Boolean(routeTone) && index > triggerWaveIndex;
            graphics.fillColor = followsSelectedRoute && routeTone
                ? new Color(routeTone.r, routeTone.g, routeTone.b, current || completed ? 255 : 150)
                : new Color(
                    current
                        ? '#F2CD78'
                        : completed
                            ? '#6FD0AE'
                            : boss
                                ? '#7B4437'
                                : '#173A36',
                );
            graphics.circle(x, 0, current ? 9 : boss ? 7 : 6);
            graphics.fill();
            if (current) {
                graphics.strokeColor = followsSelectedRoute && routeTone
                    ? new Color(routeTone.r, routeTone.g, routeTone.b, 245)
                    : new Color('#FFF0B5');
                graphics.lineWidth = 2;
                graphics.circle(x, 0, 13);
                graphics.stroke();
            }
        }
    }

    private createPlayerAura(): void {
        // 法阵画在最底层：它是脚下的地面光，必须压在角色与剑气之下。
        const sigil = new Node('PlayerAuraSigil');
        sigil.layer = Layers.Enum.UI_2D;
        sigil.setPosition(0, -34);
        this.player.addChild(sigil);
        sigil.setSiblingIndex(0);
        this.playerAuraSigil = sigil.addComponent(Graphics);

        const back = new Node('PlayerAuraBack');
        back.layer = Layers.Enum.UI_2D;
        back.setPosition(0, -5);
        this.player.addChild(back);
        back.setSiblingIndex(1);
        this.playerAuraNode = back;

        const front = new Node('PlayerAuraFront');
        front.layer = Layers.Enum.UI_2D;
        front.setPosition(0, -5);
        this.player.addChild(front);
        front.setSiblingIndex(this.player.children.length - 1);
        this.playerAuraFrontNode = front;
        this.refreshPlayerAura();
    }

    private refreshPlayerAura(): void {
        const back = this.playerAuraNode;
        const front = this.playerAuraFrontNode;
        if (!back || !front) return;
        const totals = summarizeUpgradePaths((id) => this.skills.getLevel(id));
        const total = UPGRADE_PATH_ORDER.reduce((sum, path) => sum + totals[path], 0);
        back.children.slice().forEach((child) => child.destroy());
        front.children.slice().forEach((child) => child.destroy());
        this.playerAuraSwords = [];
        if (total === 0) return;

        // 每修一级就在身上多挂一柄剑气：绕行剑气的数量直接等于本局破境次数，
        // 颜色分布就是玩家的路线选择。不看面板也能一眼读出"我练到哪了、走的哪条路"。
        const swords: Array<{ path: UpgradePath; step: number }> = [];
        UPGRADE_PATH_ORDER.forEach((path) => {
            for (let step = 1; step <= totals[path]; step += 1) swords.push({ path, step });
        });
        this.playerAuraSwords = swords.map((entry, index) => this.createAuraSword(
            entry.path,
            -Math.PI / 2 + index * Math.PI * 2 / swords.length,
            true,
            entry.step,
        ));
        this.updatePlayerAuraVisual();
    }

    private createAuraSword(
        path: UpgradePath,
        phase: number,
        active: boolean,
        step: number,
    ): PlayerAuraSwordVisual {
        const node = new Node(`DaoFoundationSword-${path}`);
        node.layer = Layers.Enum.UI_2D;
        const opacity = node.addComponent(UIOpacity);
        // 三张素材的长轴方向不同，按各自源图比例校准到约 86–100px 的实机剑气长度。
        const displayHeight = path === 'edge' ? 86 : path === 'mystic' ? 80 : 42;
        node.addChild(this.createResourceSprite(PLAYER_AURA_SWORD_RESOURCES[path], displayHeight));

        // 新版素材已经自带附着式剑气拖尾；不再复制整柄剑做残影，避免主修路线看成三把同色武器。
        const ghosts: PlayerAuraSwordVisual['ghosts'] = [];
        return { path, phase, node, opacity, ghosts, active, step };
    }

    private updatePlayerAuraVisual(): void {
        const back = this.playerAuraNode;
        const front = this.playerAuraFrontNode;
        if (!back || !front || this.playerAuraSwords.length === 0) return;
        const momentum = this.cultivationMomentumTimer > 0 ? this.cultivationMomentum : undefined;
        const motionSpeed = momentum ? 0.78 + momentum.tier * 0.08 : 0.58;
        const motion = this.prefersReducedMotion ? 0 : this.elapsed * motionSpeed;
        const build = resolveCultivationBuild((id) => this.skills.getLevel(id));
        // 剑身可以小，但轨道不能贴进角色轮廓，否则会重新读成手持武器而不是护体剑气。
        const radiusX = 66 + build.tier * 3 + (momentum ? 7 + momentum.tier * 2 : 0);
        const radiusY = 48 + build.tier * 2 + (momentum ? 4 + momentum.tier : 0);

        const place = (node: Node, angle: number, scale: number, target: Node): void => {
            if (node.parent !== target) target.addChild(node);
            const x = Math.cos(angle) * radiusX;
            const y = Math.sin(angle) * radiusY;
            const tangent = Math.atan2(Math.cos(angle) * radiusY, -Math.sin(angle) * radiusX);
            node.setPosition(x, y);
            node.angle = tangent * 180 / Math.PI - 45;
            node.setScale(scale, scale);
        };

        this.drawPlayerAuraSigil(build, motion, momentum);

        this.playerAuraSwords.forEach((visual) => {
            const angle = motion + visual.phase;
            const depth = (1 - Math.sin(angle)) / 2;
            const target = Math.sin(angle) < -0.06 ? front : back;
            const routeSurging = momentum?.path === visual.path;
            const surgePulse = routeSurging && !this.prefersReducedMotion
                ? 1 + Math.sin(this.elapsed * 8) * 0.07
                : 1;
            // 第三级的剑气代表某式已经圆满，单独放大一档，让"修满了"在战场上看得见。
            const masteredStep = visual.step >= 3 ? 1.16 : 1;
            const scale = (0.9 + depth * 0.18)
                * (visual.active ? 1 + build.tier * 0.03 : 0.86)
                * masteredStep
                * (routeSurging ? (1.12 + momentum.tier * 0.035) * surgePulse : 1);
            // 素材自身已经包含半透明剑气；潜伏路线仍需保留约六成亮度，避免二次透明后完全消失。
            visual.opacity.opacity = Math.min(255, Math.round(
                (visual.active ? 210 : 166)
                + depth * (visual.active ? 40 : 24)
                + (visual.step >= 3 ? 30 : 0)
                + (routeSurging ? 35 : 0),
            ));
            place(visual.node, angle, scale, target);
            visual.ghosts.forEach((ghost, index) => {
                const ghostAngle = angle - ghost.phaseOffset;
                const ghostDepth = (1 - Math.sin(ghostAngle)) / 2;
                const ghostTarget = Math.sin(ghostAngle) < -0.06 ? front : back;
                ghost.opacity.opacity = Math.round(
                    (visual.active ? 24 + build.tier * 6 : 0) * (index === 0 ? 1 : 0.42) * (0.6 + ghostDepth * 0.4),
                );
                place(ghost.node, ghostAngle, scale * (index === 0 ? 0.94 : 0.86), ghostTarget);
            });
        });
    }

    /**
     * 脚下法阵是本命法宝阶数唯一的常驻形态：初醒一环、共鸣两环、真形三环，
     * 环的颜色取自主修路线，破境余势期间整体加亮。玩家不必打开任何面板就知道法宝练到哪了。
     */
    private drawPlayerAuraSigil(
        build: CultivationBuildSnapshot,
        motion: number,
        momentum?: UpgradeMomentumSpec,
    ): void {
        const sigil = this.playerAuraSigil;
        if (!sigil?.isValid) return;
        sigil.clear();
        if (!build.path || build.tier <= 0) return;
        const tone = new Color(UPGRADE_PATH_COLORS[build.path]);
        const surge = momentum ? 1.14 : 1;
        const breath = this.prefersReducedMotion ? 1 : 1 + Math.sin(this.elapsed * 2.4) * 0.045;

        for (let ring = 0; ring < build.tier; ring += 1) {
            const rx = (30 + ring * 11) * surge * breath;
            const alpha = Math.round((132 - ring * 24) * (momentum ? 1.25 : 1));
            sigil.strokeColor = new Color(tone.r, tone.g, tone.b, Math.min(215, alpha));
            sigil.lineWidth = ring === 0 ? 2.6 : 1.6;
            // 地面透视统一压成 0.42 的扁椭圆，避免看成悬空的正圆。
            sigil.ellipse(0, 0, rx, rx * 0.42);
            sigil.stroke();
        }

        // 真形追加一圈随行旋转的刻度，让最高阶在动态上也和共鸣区分开。
        if (build.tier >= 3) {
            const marks = 6;
            const rx = 56 * surge * breath;
            sigil.strokeColor = new Color(tone.r, tone.g, tone.b, momentum ? 205 : 165);
            sigil.lineWidth = 2.4;
            for (let index = 0; index < marks; index += 1) {
                const angle = motion * 0.6 + index * Math.PI * 2 / marks;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle) * 0.42;
                sigil.moveTo(cos * rx * 0.82, sin * rx * 0.82);
                sigil.lineTo(cos * rx, sin * rx);
                sigil.stroke();
            }
        }
    }

    private createBossAura(enemy: EnemyState): void {
        const aura = new Node('BossAura');
        aura.layer = Layers.Enum.UI_2D;
        const g = aura.addComponent(Graphics);
        g.strokeColor = this.currentStage.mapId === 'frozen-ruins'
            ? new Color(126, 224, 237, 135)
            : new Color(238, 174, 76, 125);
        g.lineWidth = 3;
        g.circle(0, 0, enemy.radius + 12);
        g.stroke();
        for (let index = 0; index < 8; index += 1) {
            const angle = index * Math.PI / 4;
            g.moveTo(Math.cos(angle) * (enemy.radius + 5), Math.sin(angle) * (enemy.radius + 5));
            g.lineTo(Math.cos(angle) * (enemy.radius + 18), Math.sin(angle) * (enemy.radius + 18));
            g.stroke();
        }
        enemy.node.addChild(aura);
        aura.setSiblingIndex(1);
    }

    private updateAmbience(dt: number): void {
        for (const mote of this.ambience) {
            if (!mote.node.isValid) continue;
            mote.baseY += mote.speed * dt;
            if (mote.baseY > this.arena.top - 12) mote.baseY = this.arena.bottom + 12;
            const drift = Math.sin(this.elapsed * 0.8 + mote.phase) * mote.range;
            mote.node.setPosition(mote.baseX + drift, mote.baseY);
            const pulse = 0.72 + Math.sin(this.elapsed * 2 + mote.phase) * 0.28;
            mote.node.setScale(pulse, pulse);
        }
    }

    private updateEffects(dt: number): void {
        // 所有短生命周期表现统一在这里回收，防止长局中命中特效节点持续累积。
        for (const effect of this.effects) {
            if (!effect.node.isValid) continue;
            effect.elapsed += dt;
            effect.update(Math.min(effect.elapsed / effect.life, 1));
        }
        this.effects = this.effects.filter((effect) => {
            if (effect.elapsed < effect.life && effect.node.isValid) return true;
            if (effect.node.isValid) effect.node.destroy();
            return false;
        });
    }

    private updateCameraFeedback(dt: number): void {
        if (this.cameraShakeTimer > 0) {
            this.cameraShakeTimer = Math.max(0, this.cameraShakeTimer - dt);
            const fade = Math.min(1, this.cameraShakeTimer / 0.16);
            this.world.setPosition(
                this.random(-this.cameraShakeStrength, this.cameraShakeStrength) * fade,
                this.random(-this.cameraShakeStrength, this.cameraShakeStrength) * fade,
            );
            this.cameraShakeStrength *= Math.pow(0.06, dt);
        } else {
            // 入境镜头只沿纵向缓慢落定；其他状态必须归零，避免上一次章节的偏移泄漏到战斗。
            this.world.setPosition(0, this.phase === 'stage-entry' ? this.stageEntryCameraOffsetY : 0);
        }
    }

    private triggerHitStop(tier: HitStopTier): void {
        // 减少动态时保留极短定格：打击的"实心感"仍在，但不做慢放，避免眩晕与操作延迟感。
        this.hitStop.trigger(tier, this.prefersReducedMotion);
    }

    /**
     * 破境前的最后一段修为用呼吸环预告，让升级从"突然弹窗"变成"看着它来"。
     */
    private updateBreakthroughPulse(dt: number): void {
        const ratio = Math.max(0, Math.min(1, this.xp / Math.max(this.xpNeed, 1)));
        const imminent = ratio >= BREAKTHROUGH_WARNING_RATIO;
        if (imminent && !this.breakthroughImminent) {
            this.breakthroughPulse = 0;
            this.platformFeedback.playBreakthroughWarning();
        }
        this.breakthroughImminent = imminent;
        if (!imminent) {
            this.breakthroughPulse = 0;
            return;
        }
        // 越接近满修为，呼吸越快：不看数字也能从节奏判断还差多少。
        const urgency = (ratio - BREAKTHROUGH_WARNING_RATIO) / Math.max(1 - BREAKTHROUGH_WARNING_RATIO, 0.01);
        this.breakthroughPulse += dt * (5.2 + urgency * 6.4);
    }

    private createScreenFlash(color: Color, life: number): void {
        const node = this.makeRect(this.designWidth, this.designHeight, color);
        node.name = 'DamageFlash';
        const opacity = node.addComponent(UIOpacity);
        this.screenFxLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life,
            update: (progress) => {
                opacity.opacity = Math.round(255 * (1 - progress));
            },
        });
    }

    private createSpiritVeinClaimPulse(position: Readonly<Vec3>, color: Color): void {
        const node = new Node('SpiritVeinClaimPulse');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const opacity = node.addComponent(UIOpacity);
        const ring = node.addComponent(Graphics);
        const baseRadius = 24;
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.56,
            update: (progress) => {
                const p = Math.min(progress, 1);
                const faded = 1 - p;
                node.setScale(0.72 + p * 1.72, 0.72 + p * 1.72);
                opacity.opacity = Math.round(200 * faded * faded);
                ring.clear();
                ring.strokeColor = new Color(color.r, color.g, color.b, Math.round(150 * faded));
                ring.lineWidth = 3.4 + 2.8 * p;
                ring.circle(0, 0, baseRadius);
                ring.stroke();
            },
        });
    }

    private createSwordCast(position: Readonly<Vec3>, angle: number): void {
        const visualTone = this.cultivationVisualTone();
        const node = new Node('SwordCast');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        node.angle = angle * 180 / Math.PI;
        const g = node.addComponent(Graphics);
        const color = visualTone.color;
        const spread = 18 + visualTone.tier * 4;
        const reach = 48 + visualTone.tier * 8;
        // 起手的火星沿出剑方向喷出，让"剑从这里飞出去"有来源而不是凭空出现。
        const sparks = impactShardLayout(this.vfxShardCount(4 + visualTone.tier), angle * 97.3, {
            reach: reach * 0.7,
            direction: 0,
            spread: Math.PI * 0.42,
        });
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.22,
            update: (progress) => {
                const expand = impactExpansion(progress);
                const fade = impactFade(progress, 0.2);
                g.clear();
                if (fade <= 0) return;
                const scale = 0.72 + expand * 0.7;
                this.strokeWithGlow(
                    g,
                    color,
                    (3.4 + visualTone.tier) * (1 - expand * 0.4),
                    215 * fade,
                    () => {
                        g.moveTo(8 * scale, -spread * scale);
                        g.lineTo(reach * scale, 0);
                        g.lineTo(8 * scale, spread * scale);
                    },
                );
                this.strokeShards(g, new Color(243, 231, 200), sparks, progress, fade * 0.8);
            },
        });
    }

    private createSwordTrail(from: Readonly<Vec3>, to: Readonly<Vec3>): void {
        const visualTone = this.cultivationVisualTone();
        const node = new Node('SwordTrail');
        node.layer = Layers.Enum.UI_2D;
        const g = node.addComponent(Graphics);
        const color = visualTone.color;
        // 拖尾切成逐段收窄的缎带：等宽直线读起来是一根棍子，收窄后才有掠过的速度感。
        const segments = 5;
        const widths = trailSegmentWidths(4 + visualTone.tier, segments);
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.18,
            update: (progress) => {
                const fade = impactFade(progress, 0.12);
                g.clear();
                if (fade <= 0) return;
                for (let index = 0; index < segments; index += 1) {
                    // 尾端随时间向剑锋收拢，剑光像被抽走而不是整体变淡。
                    const headT = 1 - index / segments * progress * 0.85;
                    const tailT = 1 - (index + 1) / segments;
                    const hx = from.x + (to.x - from.x) * headT;
                    const hy = from.y + (to.y - from.y) * headT;
                    const tx = from.x + (to.x - from.x) * tailT;
                    const ty = from.y + (to.y - from.y) * tailT;
                    const alpha = Math.round((150 + visualTone.tier * 30) * fade * (1 - index / segments * 0.7));
                    if (alpha <= 1) continue;
                    g.strokeColor = new Color(color.r, color.g, color.b, alpha);
                    g.lineWidth = widths[index];
                    g.moveTo(tx, ty);
                    g.lineTo(hx, hy);
                    g.stroke();
                }
                // 三阶补一道近白的高光芯，把"圆满"直接画在剑光上。
                if (visualTone.tier >= 3) {
                    g.strokeColor = new Color(247, 252, 255, Math.round(180 * fade));
                    g.lineWidth = 1.6;
                    g.moveTo(from.x, from.y);
                    g.lineTo(to.x, to.y);
                    g.stroke();
                }
            },
        });
    }

    /**
     * 伪辉光与碎片都是逐帧重绘，绘制量高于"画一次再缩放"的旧做法。
     * 减少动态时收掉光晕层和碎片数，既是无障碍选项，也是低端机的性能阀门。
     */
    private get vfxHaloCount(): number {
        return this.prefersReducedMotion ? 0 : 2;
    }

    private vfxShardCount(count: number): number {
        return this.prefersReducedMotion ? Math.max(2, Math.round(count * 0.45)) : count;
    }

    /**
     * 沿给定路径反复描边，由宽而淡到窄而亮，在没有叠加混合的 2D 管线上伪造发光。
     */
    private strokeWithGlow(
        g: Graphics,
        color: Readonly<Color>,
        coreWidth: number,
        coreAlpha: number,
        path: () => void,
        haloCount = this.vfxHaloCount,
    ): void {
        for (const layer of glowStrokeLayers(coreWidth, coreAlpha, haloCount)) {
            g.strokeColor = new Color(color.r, color.g, color.b, layer.alpha);
            g.lineWidth = layer.width;
            path();
            g.stroke();
        }
    }

    /** 按碎片布局绘制当前帧的飞散状态；碎片是"炸开"与"放大一张贴纸"的分界线。 */
    private strokeShards(
        g: Graphics,
        color: Readonly<Color>,
        shards: readonly ImpactShard[],
        progress: number,
        alphaScale: number,
    ): void {
        for (const shard of shards) {
            const travel = shardTravel(progress, shard.delay);
            if (travel <= 0) continue;
            const eased = impactExpansion(travel);
            const head = shard.distance * eased;
            const tail = Math.max(0, head - shard.length * (1 - eased * 0.55));
            const spin = shard.angle + shard.spin * eased * Math.PI / 180 * 0.02;
            const alpha = Math.round(alphaScale * (1 - travel) * 235);
            if (alpha <= 1) continue;
            g.strokeColor = new Color(color.r, color.g, color.b, alpha);
            g.lineWidth = shard.width;
            g.moveTo(Math.cos(spin) * tail, Math.sin(spin) * tail);
            g.lineTo(Math.cos(spin) * head, Math.sin(spin) * head);
            g.stroke();
        }
    }

    private createHitBurst(position: Readonly<Vec3>, color: Color, radius: number, slash: boolean): void {
        const node = new Node('HitBurst');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const g = node.addComponent(Graphics);
        const shards = impactShardLayout(
            this.vfxShardCount(slash ? 7 : 5),
            position.x * 7.1 + position.y * 3.3,
            { reach: radius * 1.25 },
        );
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.28,
            update: (progress) => {
                const expand = impactExpansion(progress);
                const fade = impactFade(progress, 0.18);
                g.clear();
                if (fade <= 0) return;
                // 冲击波环：起手瞬间就撑到接近最大，随后只剩变淡，读起来才"实"。
                this.strokeWithGlow(
                    g,
                    color,
                    (slash ? 4.5 : 3.4) * (1 - expand * 0.55),
                    235 * fade,
                    () => g.circle(0, 0, radius * (0.32 + expand * 0.78)),
                );
                this.strokeShards(g, color, shards, progress, fade);
                if (slash) {
                    // 斩击额外补一道偏心月牙，避免所有命中都是同一个对称星形。
                    this.strokeWithGlow(
                        g,
                        new Color(245, 250, 255),
                        6 * (1 - expand * 0.6),
                        215 * fade,
                        () => {
                            g.moveTo(-radius * 0.9, -radius * 0.34);
                            g.quadraticCurveTo(0, radius * 0.28 * (1 + expand), radius * 0.95, radius * 0.4);
                        },
                        this.prefersReducedMotion ? 0 : 1,
                    );
                }
            },
        });
    }

    private createDeathBurst(position: Readonly<Vec3>, radius: number): void {
        const node = new Node('DeathBurst');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const g = node.addComponent(Graphics);
        const core = new Color(214, 255, 240);
        const aura = new Color(110, 231, 183);
        const shards = impactShardLayout(
            this.vfxShardCount(11),
            position.x * 2.7 + position.y * 5.9,
            { reach: radius * 1.5 },
        );
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.52,
            update: (progress) => {
                const expand = impactExpansion(progress);
                const fade = impactFade(progress, 0.14);
                g.clear();
                if (fade <= 0) return;
                // 亮芯只在最初两帧存在，负责"这一下打死了"的爆点。
                const flash = Math.max(0, 1 - progress / 0.16);
                if (flash > 0) {
                    g.fillColor = new Color(core.r, core.g, core.b, Math.round(210 * flash));
                    g.circle(0, 0, radius * (0.3 + 0.35 * (1 - flash)));
                    g.fill();
                }
                // 外层是快速外扩、迅速变薄的冲击环。
                this.strokeWithGlow(
                    g,
                    aura,
                    5.5 * (1 - expand * 0.7),
                    230 * fade,
                    () => g.circle(0, 0, radius * (0.28 + expand * 1.15)),
                );
                this.strokeShards(g, core, shards, progress, fade);
            },
        });
    }

    private createGroundBurst(position: Readonly<Vec3>, radius: number): void {
        if (this.currentStage.mapId === 'frozen-ruins' && this.frostImpactAnimationFrames.length === 4) {
            this.createFrostGroundBurst(position, radius);
            return;
        }
        const node = new Node('GroundBurst');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const g = node.addComponent(Graphics);
        const ember = new Color(255, 190, 112);
        const dust = impactShardLayout(this.vfxShardCount(13), position.x * 4.4 + position.y * 1.7, { reach: radius * 1.35 });
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.42,
            update: (progress) => {
                const expand = impactExpansion(progress);
                const fade = impactFade(progress, 0.16);
                g.clear();
                if (fade <= 0) return;
                // 地面冲击压扁成椭圆，保住俯视视角的透视，不再像悬空的正圆。
                const rx = radius * (0.4 + expand * 0.92);
                const ry = rx * 0.62;
                this.strokeWithGlow(
                    g,
                    ember,
                    9 * (1 - expand * 0.72),
                    235 * fade,
                    () => g.ellipse(0, 0, rx, ry),
                );
                g.fillColor = new Color(255, 214, 158, Math.round(46 * fade * (1 - expand)));
                g.ellipse(0, 0, rx * 0.9, ry * 0.9);
                g.fill();
                this.strokeShards(g, ember, dust, progress, fade);
            },
        });
    }

    private createFrostGroundBurst(position: Readonly<Vec3>, radius: number): void {
        const node = new Node('FrostGroundBurst');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const opacity = node.addComponent(UIOpacity);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.RAW;
        sprite.spriteFrame = this.frostImpactAnimationFrames[0];
        const frameHeight = Math.max(this.frostImpactAnimationFrames[0].originalSize.height, 1);
        const baseScale = radius * 2.35 / frameHeight;
        node.setScale(baseScale, baseScale);
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.64,
            update: (progress) => {
                // 四帧严格表达预兆、裂纹、爆发、余霜，不再叠加旋转以免破坏地面透视。
                const frameIndex = resolveFrostImpactFrame(progress);
                sprite.spriteFrame = this.frostImpactAnimationFrames[frameIndex];
                const scale = baseScale * (0.82 + Math.min(1, progress * 2.6) * 0.22);
                node.setScale(scale, scale);
                opacity.opacity = progress < 0.72
                    ? 255
                    : Math.round(255 * (1 - progress) / 0.28);
            },
        });
    }

    private createDamageNumber(
        position: Readonly<Vec3>,
        damage: number,
        tier: CombatImpactTier,
        scale = 1,
    ): void {
        const finisher = tier === 'finisher';
        const heavy = tier === 'heavy';
        const label = this.makeLabel(
            finisher ? `斩 ${damage}` : `${damage}`,
            finisher ? 34 : heavy ? 29 : 24,
            new Color(finisher ? '#FFF0A8' : heavy ? '#BDF4FF' : '#E0F2FE'),
        );
        const node = label.node;
        node.name = 'DamageNumber';
        node.setPosition(position.x + this.random(-9, 9), position.y + 26);
        const opacity = node.addComponent(UIOpacity);
        const startX = node.position.x;
        const startY = node.position.y;
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: finisher ? 0.72 : heavy ? 0.62 : 0.55,
            update: (progress) => {
                node.setPosition(
                    startX + Math.sin(progress * Math.PI) * (finisher ? 4 : 7),
                    startY + progress * (finisher ? 68 : 54),
                );
                const pop = progress < 0.2 ? 0.7 + progress * 2 : 1.1 - (progress - 0.2) * 0.12;
                node.setScale(pop * scale, pop * scale);
                opacity.opacity = Math.round(255 * (1 - progress));
            },
        });
    }

    private createXpWisp(position: Readonly<Vec3>): void {
        const node = new Node('XpWisp');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const opacity = node.addComponent(UIOpacity);
        const g = node.addComponent(Graphics);
        g.fillColor = new Color(110, 231, 183, 220);
        g.circle(0, 0, 5);
        g.fill();
        g.strokeColor = new Color(209, 250, 229, 190);
        g.lineWidth = 2;
        g.circle(0, 0, 9);
        g.stroke();
        const start = new Vec3(position.x, position.y);
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.62,
            update: (progress) => {
                const eased = progress * progress;
                const target = this.player?.isValid ? this.player.position : start;
                node.setPosition(
                    start.x + (target.x - start.x) * eased + Math.sin(progress * Math.PI) * 18,
                    start.y + (target.y - start.y) * eased + Math.sin(progress * Math.PI) * 42,
                );
                const scale = 1 + Math.sin(progress * Math.PI) * 0.7;
                node.setScale(scale, scale);
                opacity.opacity = Math.round(255 * (1 - Math.max(0, progress - 0.72) / 0.28));
            },
        });
    }

    private stageEntryFramesFor(effect: StageEntryEffect): SpriteFrame[] {
        if (effect === 'bamboo-burn') return this.bambooBurnCommitAnimationFrames;
        if (effect === 'frost-tide') return this.frostTideCommitAnimationFrames;
        return this.qingshiSteleCommitAnimationFrames;
    }

    private showStageEntry(): void {
        const presentation = stageEntryPresentationFor(this.currentStage.mapId);
        this.platformFeedback.playCue('stage-entry', this.selectedStageIndex);
        const root = new Node('StageEntryReveal');
        root.layer = Layers.Enum.UI_2D;
        root.addComponent(UITransform).setContentSize(this.designWidth, this.designHeight);

        const veil = this.makeRect(
            this.designWidth,
            this.designHeight,
            new Color(2, 11, 14, 172),
        );
        const veilOpacity = veil.addComponent(UIOpacity);
        root.addChild(veil);

        const chapterGroup = new Node('StageEntryChapter');
        chapterGroup.layer = Layers.Enum.UI_2D;
        const chapterOpacity = chapterGroup.addComponent(UIOpacity);
        const eyebrow = this.makeLabel(presentation.eyebrow, 15, new Color(presentation.accent));
        eyebrow.node.setPosition(0, 56);
        eyebrow.node.getComponent(UITransform)?.setContentSize(470, 26);
        chapterGroup.addChild(eyebrow.node);
        const title = this.makeLabel(presentation.title, 40, new Color('#F7F1DC'));
        title.node.setPosition(0, 8);
        title.node.getComponent(UITransform)?.setContentSize(520, 58);
        chapterGroup.addChild(title.node);
        const divider = this.makeRect(
            176,
            2,
            new Color(presentation.accent),
        );
        divider.setPosition(0, -38);
        chapterGroup.addChild(divider);
        chapterGroup.setPosition(0, 230);
        root.addChild(chapterGroup);

        const route = this.makeLabel(presentation.route, 17, new Color('#D8E8E1'));
        route.node.setPosition(0, 145);
        route.node.getComponent(UITransform)?.setContentSize(580, 30);
        const routeOpacity = route.node.addComponent(UIOpacity);
        root.addChild(route.node);

        const objectiveGroup = this.makeRect(
            474,
            54,
            new Color(3, 18, 22, 218),
            new Color(presentation.accent),
            14,
            2,
        );
        objectiveGroup.setPosition(0, -404);
        const objectiveOpacity = objectiveGroup.addComponent(UIOpacity);
        const objective = this.makeLabel(presentation.objective, 17, new Color('#ECF7F2'));
        objective.node.getComponent(UITransform)?.setContentSize(438, 34);
        objectiveGroup.addChild(objective.node);
        root.addChild(objectiveGroup);

        const markerFrames = this.stageEntryFramesFor(presentation.effect);
        const marker = new Node('StageEntryMapMark');
        marker.layer = Layers.Enum.UI_2D;
        marker.setPosition(presentation.markerPosition.x, presentation.markerPosition.y);
        const markerOpacity = marker.addComponent(UIOpacity);
        const markerSprite = marker.addComponent(Sprite);
        markerSprite.sizeMode = Sprite.SizeMode.RAW;
        if (markerFrames[0]) {
            markerSprite.spriteFrame = markerFrames[0];
            const frameHeight = Math.max(markerFrames[0].originalSize.height, 1);
            const targetDiameter = presentation.effect === 'frost-tide' ? 194 : 164;
            const scale = targetDiameter / frameHeight;
            marker.setScale(scale, scale);
        }
        root.addChild(marker);
        this.screenFxLayer.addChild(root);

        const applyFrame = (elapsed: number): void => {
            const frame = stageEntryRevealFrameFor(elapsed);
            veilOpacity.opacity = frame.veilOpacity;
            chapterOpacity.opacity = frame.chapterOpacity;
            chapterGroup.setScale(frame.chapterScale, frame.chapterScale);
            routeOpacity.opacity = frame.routeOpacity;
            objectiveOpacity.opacity = frame.objectiveOpacity;
            markerOpacity.opacity = markerFrames.length > 0 ? frame.markerOpacity : 0;
            if (markerFrames.length > 0) {
                markerSprite.spriteFrame = markerFrames[Math.min(frame.markerFrame, markerFrames.length - 1)];
            }
            this.stageEntryCameraOffsetY = frame.worldOffsetY;
        };

        if (this.hasLocalQaFlag('qaStageEntry=1')) {
            // 固定在路线与首境目标同时可读的峰值，便于同尺寸视觉回归；正式流程仍完整播放后交权。
            applyFrame(1.18);
            return;
        }

        const handoff = (): void => {
            if (this.phase !== 'stage-entry') return;
            this.stageEntryCameraOffsetY = 0;
            this.phase = 'playing';
            this.showWaveAnnouncement();
        };
        if (this.prefersReducedMotion) {
            // 减少动态模式直接展示稳定信息帧，不播放纵向镜头和四帧序列，只保留必要的章节确认。
            applyFrame(1.18);
            this.scheduleOnce(() => {
                if (root.isValid) root.destroy();
                handoff();
            }, STAGE_ENTRY_REDUCED_MOTION_DURATION);
            return;
        }

        applyFrame(0);
        this.effects.push({
            node: root,
            elapsed: 0,
            life: STAGE_ENTRY_DURATION,
            update: (progress) => applyFrame(progress * STAGE_ENTRY_DURATION),
        });
        this.scheduleOnce(handoff, STAGE_ENTRY_DURATION);
    }

    private showWaveAnnouncement(): void {
        const wave = this.currentStage.waves[this.waveIndex];
        if (!wave) return;
        const eliteTrial = this.eliteEncounter.snapshot().active;
        const dangerous = eliteTrial || wave.danger === 'elite' || wave.danger === 'boss';
        const bossWave = wave.danger === 'boss';
        const banner = this.makeRect(
            bossWave ? 620 : dangerous ? 548 : 500,
            bossWave ? 202 : dangerous ? 122 : 94,
            new Color(3, 18, 22, dangerous ? 232 : 185),
            new Color(dangerous ? '#E9B55E' : '#7DD4B6'),
            16,
            dangerous ? 3 : 2,
        );
        if (dangerous) {
            const warning = this.makeLabel(
                bossWave
                    ? '关 底 将 启 · 二 相 首 领'
                    : eliteTrial
                        ? '境 中 试 炼 · 机 关 迎 敌'
                        : '精 英 伏 击 预 警',
                16,
                new Color('#F5C873'),
            );
            warning.node.setPosition(0, bossWave ? 78 : 44);
            warning.node.getComponent(UITransform)?.setContentSize(380, 26);
            banner.addChild(warning.node);
        }
        const title = this.makeLabel(
            `第 ${this.waveIndex + 1} 波  ·  ${wave.title}`,
            dangerous ? 32 : 29,
            new Color(dangerous ? '#FDE68A' : '#D1FAE5'),
        );
        title.node.setPosition(0, bossWave ? 40 : dangerous ? 8 : 17);
        banner.addChild(title.node);
        const qingshiRoute = this.currentStage.mapId === 'qingshi-road'
            ? this.mapEvent.choice()?.effect.qingshiRoute
            : undefined;
        const reward = qingshiRoute === 'sword-stele-array'
            ? '剑碑增伤'
            : qingshiRoute === 'spring-detour'
                ? '侧路灵泉'
                : wave.spiritVein === 'sword'
                    ? '剑脉增伤'
                    : '灵泉续战';
        const eventMark = this.mapEventModifierWaveIndex === this.waveIndex
            ? this.mapEvent.choice()?.title
            : undefined;
        const objective = this.makeLabel(
            bossWave
                ? bossEntranceRiskFor(this.currentStage.mapId)
                : eliteTrial
                    ? `${eliteEncounterPresentationFor(this.currentStage.mapId).instruction}  ·  ${reward}`
                    : [wave.objective, reward, eventMark ? `奇遇·${eventMark}` : ''].filter(Boolean).join('  ·  '),
            bossWave ? 16 : 18,
            new Color(168, 213, 199, 235),
        );
        objective.node.setPosition(0, bossWave ? 4 : dangerous ? -37 : -25);
        objective.node.getComponent(UITransform)?.setContentSize(bossWave ? 520 : 430, 30);
        banner.addChild(objective.node);
        if (bossWave) {
            const build = resolveCultivationBuild((id) => this.skills.getLevel(id));
            const readiness = resolveBossReadiness(build, this.hp / Math.max(this.maxHp, 1));
            const readinessLabel = this.makeLabel(
                `构筑检验 · ${readiness.title} · ${readiness.detail}`,
                15,
                new Color(build.tier >= 3 ? '#F5D98D' : build.tier >= 2 ? '#A7F3D0' : '#C7D8D1'),
            );
            readinessLabel.node.setPosition(0, -35);
            readinessLabel.node.getComponent(UITransform)?.setContentSize(580, 28);
            banner.addChild(readinessLabel.node);
            const routeTrial = this.makeLabel(this.mapEvent.bossTrialText(), 14, new Color('#B6D7CB'));
            routeTrial.node.setPosition(0, -69);
            routeTrial.node.getComponent(UITransform)?.setContentSize(560, 26);
            banner.addChild(routeTrial.node);
        }
        const node = banner;
        node.name = 'WaveAnnouncement';
        // 路线状态条占据 HUD 下沿，波次横幅下移到战场留白，避免两层动态信息重叠。
        node.setPosition(0, 380);
        const opacity = node.addComponent(UIOpacity);
        this.screenFxLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: bossWave ? 2.35 : dangerous ? 2 : 1.75,
            update: (progress) => {
                const fade = progress < 0.16 ? progress / 0.16 : progress > 0.68 ? (1 - progress) / 0.32 : 1;
                opacity.opacity = Math.round(255 * Math.max(0, fade));
                node.setPosition(0, 365 + Math.min(progress / 0.2, 1) * 15);
                const scale = 0.92 + Math.min(progress / 0.18, 1) * 0.08;
                node.setScale(scale, scale);
            },
        });
    }

    private showWaveClearedAnnouncement(): void {
        const nextWave = this.currentStage.waves[this.waveIndex + 1];
        const routeIncoming = this.mapEvent.shouldTriggerAfterWave(this.waveIndex);
        const banner = this.makeRect(
            456,
            76,
            new Color(3, 18, 22, 205),
            new Color('#7DD4B6'),
            15,
            2,
        );
        banner.name = 'WaveClearedAnnouncement';
        banner.setPosition(0, 350);
        const title = this.makeLabel(`第 ${this.waveIndex + 1} 境 已 清`, 25, new Color('#D1FAE5'));
        title.node.setPosition(0, 14);
        title.node.getComponent(UITransform)?.setContentSize(420, 34);
        banner.addChild(title.node);
        const next = this.makeLabel(
            routeIncoming
                ? '分岔将现 · 准备选择道途'
                : nextWave
                    ? `下一境 · ${nextWave.title}`
                    : '关底已破 · 战报凝成',
            15,
            new Color('#A8D5C7'),
        );
        next.node.setPosition(0, -18);
        next.node.getComponent(UITransform)?.setContentSize(410, 26);
        banner.addChild(next.node);
        const opacity = banner.addComponent(UIOpacity);
        this.screenFxLayer.addChild(banner);
        this.effects.push({
            node: banner,
            elapsed: 0,
            life: 1.35,
            update: (progress) => {
                const fade = progress < 0.14 ? progress / 0.14 : progress > 0.72 ? (1 - progress) / 0.28 : 1;
                opacity.opacity = Math.round(255 * Math.max(0, fade));
                banner.setPosition(0, 340 + Math.min(progress / 0.2, 1) * 10);
            },
        });
    }

    private clearBattle(): void {
        if (this.upgradePreviewFx?.isValid) this.upgradePreviewFx.destroy();
        this.upgradePreviewFx = undefined;
        this.clearMoveTarget();
        this.onTouchCancel();
        this.enemies = [];
        this.projectiles = [];
        this.bossPulses = [];
        this.bossPincers = [];
        this.bossCastIndex = 0;
        this.bossFinishEnemy = undefined;
        this.bossFinishStarted = false;
        this.effects = [];
        this.spiritVeinVisual = undefined;
        this.spiritVein.reset();
        this.mapObstacles.reset();
        this.obstacleVisuals.clear();
        this.qingshiRouteVisual = undefined;
        this.frostTideVisual = undefined;
        this.frostRouteVisual = undefined;
        this.openingObjectiveVisual = undefined;
        this.openingObjectiveState = undefined;
        this.openingObjective.reset();
        this.eliteEncounter.reset();
        this.eliteEncounterCompletionShown = false;
        this.frostTide.reset();
        this.frostVelocity.set(0, 0);
        this.frostTideEnemyHits.clear();
        this.bossArenaVisual = undefined;
        this.bossArenaActive = false;
        this.playerAuraNode = undefined;
        this.playerAuraFrontNode = undefined;
        this.playerAuraSwords = [];
        this.playerAuraSigil = undefined;
        this.recentUpgradePanel = undefined;
        this.recentUpgradeLabel = undefined;
        this.recentUpgradeTimer = 0;
        this.recentUpgradeText = '';
        this.comboPanel = undefined;
        this.comboLabel = undefined;
        this.breakthroughRing = undefined;
        this.breakthroughImminent = false;
        this.breakthroughPulse = 0;
        this.hitStop.reset();
        this.cultivationMomentum = undefined;
        this.cultivationMomentumTimer = 0;
        this.battleLayer.children.slice().forEach((child) => child.destroy());
        this.effectsLayer.children.slice().forEach((child) => child.destroy());
        this.screenFxLayer.children.slice().forEach((child) => child.destroy());
        this.canvas.getChildByName('HUD')?.destroy();
        this.world.setPosition(0, 0);
    }

    private clearOverlay(): void {
        this.overlay.removeAllChildren();
    }

    private bringOverlayToFront(): void {
        // HUD 会在开局后动态创建；弹窗出现时需重新提到最上层，避免摇杆与状态条穿透遮罩。
        this.overlay.setSiblingIndex(this.canvas.children.length - 1);
        // 横屏守卫必须始终高于菜单与战斗弹层，阻止不可读的横屏画面继续接收输入。
        if (this.orientationGuard?.isValid) {
            this.orientationGuard.setSiblingIndex(this.canvas.children.length - 1);
        }
    }

    private makeButton(text: string, border: Color, onClick: () => void, width = 300, height = 82, fill = new Color('#214F48')): Node {
        const shadow = this.makeRect(width, height, new Color(2, 8, 10, 155), undefined, 18);
        shadow.setPosition(0, -7);
        const node = this.makeRect(width, height, fill, border, 18, 3);
        node.addChild(shadow);
        shadow.setSiblingIndex(0);
        const sheen = new Node('ButtonSheen');
        sheen.layer = Layers.Enum.UI_2D;
        const sheenGraphics = sheen.addComponent(Graphics);
        sheenGraphics.strokeColor = new Color(255, 255, 255, 45);
        sheenGraphics.lineWidth = 2;
        sheenGraphics.moveTo(-width / 2 + 25, height / 2 - 12);
        sheenGraphics.lineTo(width / 2 - 25, height / 2 - 12);
        sheenGraphics.stroke();
        node.addChild(sheen);
        const label = this.makeLabel(text, 29, new Color('#FFF8E7'));
        node.addChild(label.node);
        node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(0.97, 0.97);
        });
        node.on(Node.EventType.TOUCH_CANCEL, () => node.setScale(1, 1));
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(1, 1);
            onClick();
        });
        return node;
    }

    private makeActionButton(
        text: string,
        variant: ButtonVariant,
        border: Color,
        onClick: () => void,
        width: number,
        height: number,
    ): Node {
        const style = BUTTON_STYLES[variant];
        const node = this.makeButton(
            text,
            border,
            onClick,
            width,
            height,
            new Color(style.fill),
        );
        const label = node.children.find((child) => child.getComponent(Label))?.getComponent(Label);
        if (label) label.color = new Color(style.label);
        return node;
    }

    private makeCompactButton(
        text: string,
        onClick: () => void,
        width: number,
        height: number,
        active = false,
    ): Node {
        const node = this.makeRect(
            width,
            height,
            new Color(active ? 39 : 4, active ? 88 : 25, active ? 74 : 30, 238),
            new Color(active ? '#7DD3B8' : '#829E95'),
            13,
            active ? 2 : 1,
        );
        const label = this.makeLabel(text, 17, new Color(active ? '#E6FFF5' : '#C5D8D1'));
        label.node.getComponent(UITransform)?.setContentSize(width - 10, height - 6);
        node.addChild(label.node);
        node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(0.96, 0.96);
        });
        node.on(Node.EventType.TOUCH_CANCEL, () => node.setScale(1, 1));
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(1, 1);
            onClick();
        });
        return node;
    }

    private makeThemedCard(
        width: number,
        height: number,
        variant: CardVariant,
        accent?: Color,
    ): Node {
        const style = CARD_STYLES[variant];
        const stroke = accent ? new Color(accent) : new Color(style.stroke);
        stroke.a = style.strokeAlpha;
        return this.makeRect(
            width,
            height,
            new Color(style.fill),
            stroke,
            style.radius,
            style.lineWidth,
        );
    }

    private makeRect(width: number, height: number, fill: Color, stroke?: Color, radius = 20, lineWidth = 4): Node {
        const node = new Node('Panel');
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform).setContentSize(width, height);
        const g = node.addComponent(Graphics);
        g.fillColor = fill;
        g.roundRect(-width / 2, -height / 2, width, height, radius);
        g.fill();
        if (stroke) {
            g.strokeColor = stroke;
            g.lineWidth = lineWidth;
            g.roundRect(-width / 2, -height / 2, width, height, radius);
            g.stroke();
        }
        return node;
    }

    private createResourceSprite(resourcePath: string, displayHeight: number): Node {
        const node = new Node('ResourceSprite');
        node.layer = Layers.Enum.UI_2D;
        const assign = (frame: SpriteFrame): void => {
            if (!node.isValid) return;
            const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
            sprite.spriteFrame = frame;
            sprite.sizeMode = Sprite.SizeMode.RAW;
            const scale = displayHeight / Math.max(frame.originalSize.height, 1);
            node.setScale(scale, scale);
        };
        const cached = this.spriteFrames.get(resourcePath);
        if (cached) {
            assign(cached);
        } else {
            // 菜单与 HUD 可在预加载完成前创建；异步补图失败时只缺装饰，不阻断战斗。
            void loadSpriteFrame(resourcePath)
                .then((frame) => {
                    this.spriteFrames.set(resourcePath, frame);
                    assign(frame);
                })
                .catch((error: unknown) => console.warn(`[art] UI 补图失败: ${resourcePath}`, error));
        }
        return node;
    }

    private createSpriteFromFrame(frame: SpriteFrame, scale: number, facing: number): Node {
        const node = new Node('ResourceSprite');
        node.layer = Layers.Enum.UI_2D;
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = frame;
        sprite.sizeMode = Sprite.SizeMode.RAW;
        node.setScale(scale * facing, scale);
        return node;
    }

    private makeLabel(text: string, size: number, color: Color): Label {
        // 750 宽设计稿会缩放到约 393px 手机画布；过小字号在实机上会低于 9px。
        // 统一托底后，局部仍可通过内容框的 SHRINK 约束避免溢出。
        const readableSize = Math.max(18, size);
        const node = new Node('Label');
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform).setContentSize(600, Math.max(70, readableSize * 2.5));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = readableSize;
        label.lineHeight = readableSize * 1.35;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private pickUpgrades(count: number): UpgradeConfig[] {
        return pickUpgradeChoices((id) => this.skills.getLevel(id), count);
    }

    private getRoadBounds(y: number, padding = 0): { minX: number; maxX: number } {
        const clampedY = Math.max(this.roadProfile[0].y, Math.min(this.roadProfile[this.roadProfile.length - 1].y, y));
        let lower = this.roadProfile[0];
        let upper = this.roadProfile[this.roadProfile.length - 1];
        for (let index = 1; index < this.roadProfile.length; index += 1) {
            if (clampedY <= this.roadProfile[index].y) {
                lower = this.roadProfile[index - 1];
                upper = this.roadProfile[index];
                break;
            }
        }
        const span = Math.max(upper.y - lower.y, 1);
        const t = (clampedY - lower.y) / span;
        const centerX = lower.centerX + (upper.centerX - lower.centerX) * t;
        const halfWidth = Math.max(36, lower.halfWidth + (upper.halfWidth - lower.halfWidth) * t - padding);
        return { minX: centerX - halfWidth, maxX: centerX + halfWidth };
    }

    private constrainToRoad(position: Readonly<Vec3>, padding: number): Vec3 {
        if (this.bossArenaActive) {
            const center = new Vec2(0, 260);
            const offset = new Vec2(position.x - center.x, position.y - center.y);
            const maxRadius = Math.max(72, 246 - padding);
            if (offset.length() > maxRadius) offset.normalize().multiplyScalar(maxRadius);
            return new Vec3(center.x + offset.x, center.y + offset.y, position.z);
        }
        const y = Math.max(this.arena.bottom + padding, Math.min(this.arena.top - padding, position.y));
        const bounds = this.getRoadBounds(y, padding);
        const roadPosition = {
            x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
            y,
        };
        const resolved = this.mapObstacles.resolveCircle(roadPosition, padding);
        const resolvedBounds = this.getRoadBounds(resolved.y, padding);
        return new Vec3(
            Math.max(resolvedBounds.minX, Math.min(resolvedBounds.maxX, resolved.x)),
            resolved.y,
            position.z,
        );
    }

    private random(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}

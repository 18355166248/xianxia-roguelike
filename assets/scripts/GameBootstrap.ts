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
    resources,
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
    PLAYER_ANIMATION_ASSET,
    PLAYER_ASSET,
    PRELOAD_SPRITE_PATHS,
    QINGSHI_SPRING_COMMIT_ANIMATION_ASSET,
    QINGSHI_STELE_COMMIT_ANIMATION_ASSET,
    SpriteAssetSpec,
} from './config/AssetCatalog';
import {
    type EnemyKind,
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
    resolveSwordGesture,
    shouldTriggerFlickDash,
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
    UPGRADE_PATH_DESCRIPTIONS,
    UPGRADE_PATH_LABELS,
    UPGRADE_PATH_ORDER,
} from './systems/UpgradeChoiceRuntime';
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

const { ccclass } = _decorator;

const UPGRADE_PATH_COLORS: Readonly<Record<UpgradePath, string>> = {
    edge: '#F0C879',
    mystic: '#72DDE8',
    vitality: '#82D7AC',
};

const MAP_EVENT_TONE_COLORS: Readonly<Record<MapEventTone, string>> = {
    gold: '#F0C879',
    jade: '#82D7AC',
    cyan: '#72DDE8',
    ember: '#E58B62',
};

const STAGE_PROGRESS_STORAGE_KEY = 'xianxia-roguelike.stage-progress.v1';

interface SpiritVeinVisual {
    node: Node;
    ring: Graphics;
    label: Label;
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
    private playerOpacity!: UIOpacity;
    private playerBaseScale = 1;
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
    private buildLabel!: Label;
    private hpBar!: Graphics;
    private xpBar!: Graphics;
    private bossHud!: Node;
    private bossHpBar!: Graphics;
    private bossHpLabel!: Label;
    private bossPhaseLabel!: Label;
    private attackHud!: Graphics;
    private attackHudLabel!: Label;
    private attackIconOpacity!: UIOpacity;
    private dashHud!: SkillHud;
    private formationHud!: SkillHud;
    private tribulationHud!: Graphics;
    private tribulationHudLabel!: Label;
    private tribulationHudNode!: Node;
    private joystick!: Node;
    private joystickKnob!: Node;
    private joystickOpacity!: UIOpacity;
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
    private touchDirection = new Vec2();
    private touchOrigin?: Vec2;
    private swordFrame?: SpriteFrame;
    private spriteFrames = new Map<string, SpriteFrame>();

    private hp = 100;
    private maxHp = 100;
    private moveSpeed = 235;
    private swordDamage = 18;
    private swordCount = 1;
    private attackInterval = 0.72;
    private attackTimer = 0;
    private level = 1;
    private xp = 0;
    private xpNeed = 50;
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
    private lastStageVictory?: StageVictoryResult;
    private mapEventModifierWaveIndex = -1;
    private mapEventAdvanceAfterChoice = false;
    private readonly frostVelocity = new Vec2();
    private frostTidePlayerHitCycle = -1;
    private frostTideEnemyHitCycle = -1;
    private readonly frostTideEnemyHits = new Set<Node>();
    private openingObjectiveState?: OpeningObjectiveSnapshot;
    private eliteEncounterCompletionShown = false;
    private joystickGestureStartedAt = 0;
    private joystickMaxDrag = 0;
    private attackGestureOrigin?: Vec2;
    private attackGestureCurrent?: Vec2;
    private attackGestureStartedAt = 0;
    private cameraShakeTimer = 0;
    private cameraShakeStrength = 0;
    private stageEntryCameraOffsetY = 0;
    private readonly prefersReducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    private qaResultConsumed = false;

    private get currentStage(): StageConfig {
        return STAGES[this.selectedStageIndex] ?? STAGES[0];
    }

    private get roadProfile(): ReadonlyArray<RoadProfilePoint> {
        if (this.currentStage.mapId === 'bamboo-ambush') return BAMBOO_AMBUSH_PROFILE;
        if (this.currentStage.mapId === 'frozen-ruins') return FROZEN_RUINS_PROFILE;
        return QINGSHI_ROAD_PROFILE;
    }

    protected override onLoad(): void {
        // 项目未依赖编辑器里的本机 View 配置，换设备时也固定按 750×1334 竖屏等比显示。
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.SHOW_ALL);
        // 调试构建也交付干净游戏画面；性能数据保留给开发工具，不在玩家视口叠加引擎统计面板。
        profiler.hideStats();
        this.buildRuntimeScene();
        this.bindInput();
        this.preloadArt();
        this.restoreStageProgress();
        resources.load('art/relics/xianxia-relics_00/spriteFrame', SpriteFrame, (error, frame) => {
            if (!error) this.swordFrame = frame;
        });
        this.showMenu();
    }

    protected override onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected override update(dt: number): void {
        this.elapsed += dt;
        this.updateAmbience(dt);
        this.updateEffects(dt);
        this.updateCameraFeedback(dt);
        if (this.phase !== 'playing') return;
        if (this.chapterBranchMemoryTimer > 0) {
            this.chapterBranchMemoryTimer = Math.max(0, this.chapterBranchMemoryTimer - dt);
        }
        this.runStats.tick(dt);
        this.updatePlayer(dt);
        this.updateFrostTide(dt);
        this.updateSpiritVein(dt);
        this.updateOpeningObjective(dt);
        this.updateAbilities(dt);
        this.updateSpawning(dt);
        this.updateEnemies(dt);
        this.updateBossPulses(dt);
        this.updateBossPincers(dt);
        this.updateAttacks(dt);
        this.updateProjectiles(dt);
        this.updateHud();
        this.checkStageProgress(dt);
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

    private preloadArt(): void {
        const paths = new Set<string>([
            ...PRELOAD_SPRITE_PATHS,
            ...UPGRADES.map((upgrade) => upgrade.iconResourcePath),
            'art/relics/xianxia-relics_19/spriteFrame',
        ]);
        for (const path of paths) {
            resources.load(path, SpriteFrame, (error, frame) => {
                if (error) {
                    console.warn(`[art] 资源加载失败，使用程序化占位: ${path}`, error);
                    return;
                }
                this.spriteFrames.set(path, frame);
                if (path === BACKGROUND_ASSETS[this.currentStage.mapId].resourcePath) {
                    this.applyStageVisual(this.phase === 'menu');
                }
                if (path === PLAYER_ANIMATION_ASSET.resourcePath) {
                    this.playerAnimationFrames = this.slicePlayerAnimationSheet(frame);
                    this.installPlayerAnimation();
                }
                if (path === BOSS_ANIMATION_ASSET.resourcePath) {
                    this.bossAnimationFrames = this.sliceAnimationSheet(
                        frame,
                        ENEMY_ANIMATION_COLUMNS,
                        ENEMY_ANIMATION_ROWS,
                        'shanxiao',
                    );
                }
                if (path === FROZEN_BOSS_ANIMATION_ASSET.resourcePath) {
                    this.frozenBossAnimationFrames = this.sliceAnimationSheet(
                        frame,
                        ENEMY_ANIMATION_COLUMNS,
                        ENEMY_ANIMATION_ROWS,
                        'hanyuan-shanxiao',
                    );
                }
                if (path === FROST_IMPACT_ANIMATION_ASSET.resourcePath) {
                    this.frostImpactAnimationFrames = this.sliceAnimationSheet(
                        frame,
                        FROST_IMPACT_ANIMATION_ASSET.columns,
                        FROST_IMPACT_ANIMATION_ASSET.rows,
                        'hanyuan-frost-impact',
                    );
                }
                if (path === QINGSHI_STELE_COMMIT_ANIMATION_ASSET.resourcePath) {
                    this.qingshiSteleCommitAnimationFrames = this.sliceAnimationSheet(
                        frame,
                        QINGSHI_STELE_COMMIT_ANIMATION_ASSET.columns,
                        QINGSHI_STELE_COMMIT_ANIMATION_ASSET.rows,
                        'qingshi-stele-commit',
                    );
                }
                if (path === QINGSHI_SPRING_COMMIT_ANIMATION_ASSET.resourcePath) {
                    this.qingshiSpringCommitAnimationFrames = this.sliceAnimationSheet(
                        frame,
                        QINGSHI_SPRING_COMMIT_ANIMATION_ASSET.columns,
                        QINGSHI_SPRING_COMMIT_ANIMATION_ASSET.rows,
                        'qingshi-spring-commit',
                    );
                }
                if (path === BAMBOO_BURN_COMMIT_ANIMATION_ASSET.resourcePath) {
                    this.bambooBurnCommitAnimationFrames = this.sliceAnimationSheet(
                        frame,
                        BAMBOO_BURN_COMMIT_ANIMATION_ASSET.columns,
                        BAMBOO_BURN_COMMIT_ANIMATION_ASSET.rows,
                        'bamboo-burn-commit',
                    );
                }
                if (path === BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET.resourcePath) {
                    this.bambooShadowCommitAnimationFrames = this.sliceAnimationSheet(
                        frame,
                        BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET.columns,
                        BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET.rows,
                        'bamboo-shadow-commit',
                    );
                }
                if (path === FROST_TIDE_COMMIT_ANIMATION_ASSET.resourcePath) {
                    this.frostTideCommitAnimationFrames = this.sliceAnimationSheet(
                        frame,
                        FROST_TIDE_COMMIT_ANIMATION_ASSET.columns,
                        FROST_TIDE_COMMIT_ANIMATION_ASSET.rows,
                        'frost-tide-commit',
                    );
                }
                if (path === FROST_SEAL_COMMIT_ANIMATION_ASSET.resourcePath) {
                    this.frostSealCommitAnimationFrames = this.sliceAnimationSheet(
                        frame,
                        FROST_SEAL_COMMIT_ANIMATION_ASSET.columns,
                        FROST_SEAL_COMMIT_ANIMATION_ASSET.rows,
                        'frost-seal-commit',
                    );
                }
                if (this.phase === 'menu' && path === this.activeChapterPreviewAssetPath(this.currentStage)) {
                    // 菜单早于异步素材加载完成时，只重建当前正在看的路线，避免已切到另一张卡却被旧资源回调覆盖。
                    this.renderMenu();
                }
            });
        }
    }

    private visibleDesignWidth(): number {
        const frame = screen.windowSize;
        if (frame.width <= 0 || frame.height <= 0) return this.designWidth;
        // SHOW_ALL 会固定设计高度并在横向暴露额外世界坐标，需由真实画布比例反推，而不是读取仍为 750 的设计宽。
        return Math.max(this.designWidth, this.designHeight * frame.width / frame.height);
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
        this.canvas.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.canvas.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.canvas.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.canvas.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private onKeyDown(event: EventKeyboard): void {
        const firstPress = !this.pressed.has(event.keyCode);
        this.pressed.add(event.keyCode);
        if (!firstPress || this.phase !== 'playing') return;
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
        const p = event.getUILocation();
        if (p.y > this.designHeight * 0.55) return;
        if (this.joystick?.isValid) {
            this.joystick.active = true;
            this.joystickOpacity.opacity = 220;
        }
        this.touchOrigin = new Vec2(p.x, p.y);
        this.joystickGestureStartedAt = this.elapsed;
        this.joystickMaxDrag = 0;
    }

    private onTouchMove(event: EventTouch): void {
        if (!this.touchOrigin || this.phase !== 'playing') return;
        const p = event.getUILocation();
        this.touchDirection.set(p.x - this.touchOrigin.x, p.y - this.touchOrigin.y);
        this.joystickMaxDrag = Math.max(this.joystickMaxDrag, this.touchDirection.length());
        if (this.touchDirection.length() > 1) this.touchDirection.normalize();
        this.joystickKnob.setPosition(this.touchDirection.x * 34, this.touchDirection.y * 34);
    }

    private onTouchEnd(): void {
        const gestureDuration = this.elapsed - this.joystickGestureStartedAt;
        const shouldDash = Boolean(this.touchOrigin)
            && shouldTriggerFlickDash(gestureDuration, this.joystickMaxDrag);
        this.touchOrigin = undefined;
        this.touchDirection.set(0, 0);
        if (this.joystickKnob?.isValid) this.joystickKnob.setPosition(0, 0);
        if (this.joystick?.isValid) this.joystick.active = false;
        if (this.joystickOpacity?.isValid) this.joystickOpacity.opacity = 185;
        this.joystickMaxDrag = 0;
        if (shouldDash) this.tryDash();
    }

    private showMenu(): void {
        this.chapterBriefOpen = false;
        this.chapterBriefPreviewChoiceId = undefined;
        this.renderMenu();
    }

    private renderMenu(): void {
        this.phase = 'menu';
        // 结算页返回路线图时必须清掉上一局 HUD 与战斗节点，否则菜单会叠在旧战场状态上。
        this.clearBattle();
        this.clearOverlay();
        this.applyStageVisual(true);
        this.bringOverlayToFront();
        const shade = this.makeRect(this.visibleDesignWidth(), 1334, new Color(3, 13, 16, 126));
        this.overlay.addChild(shade);

        const title = this.makeLabel('仙 途 劫', 58, new Color('#FFF0BE'));
        title.node.setPosition(0, 520);
        this.overlay.addChild(title.node);
        const titleRule = new Node('TitleRule');
        titleRule.layer = Layers.Enum.UI_2D;
        titleRule.setPosition(0, 477);
        const rule = titleRule.addComponent(Graphics);
        rule.strokeColor = new Color(239, 202, 118, 175);
        rule.lineWidth = 2;
        rule.moveTo(-178, 0);
        rule.lineTo(-34, 0);
        rule.moveTo(34, 0);
        rule.lineTo(178, 0);
        rule.stroke();
        rule.fillColor = new Color(239, 202, 118, 220);
        rule.circle(0, 0, 4);
        rule.fill();
        this.overlay.addChild(titleRule);

        const subtitle = this.makeLabel('御剑破劫 · 三境问道', 20, new Color('#CFE5DB'));
        subtitle.node.setPosition(0, 445);
        this.overlay.addChild(subtitle.node);

        const heroGlow = new Node('HeroGlow');
        heroGlow.layer = Layers.Enum.UI_2D;
        heroGlow.setPosition(0, 312);
        const glow = heroGlow.addComponent(Graphics);
        glow.fillColor = new Color(76, 190, 167, 28);
        glow.circle(0, 0, 101);
        glow.fill();
        glow.strokeColor = new Color(126, 224, 197, 62);
        glow.lineWidth = 2;
        glow.circle(0, 0, 88);
        glow.stroke();
        this.overlay.addChild(heroGlow);
        const hero = this.createResourceSprite(PLAYER_ASSET.resourcePath, 190);
        hero.setPosition(0, 305);
        this.overlay.addChild(hero);

        const routeTitle = this.makeLabel('试 炼 路 线', 20, new Color('#E8D9AF'));
        routeTitle.node.setPosition(0, 194);
        this.overlay.addChild(routeTitle.node);
        this.overlay.addChild(this.makeChapterRoute());
        this.overlay.addChild(this.makeStagePreview(this.currentStage));
    }

    private makeChapterRoute(): Node {
        const route = new Node('ChapterRoute');
        route.layer = Layers.Enum.UI_2D;
        route.setPosition(0, 108);
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
                selected ? 112 : 88,
                selected ? 112 : 88,
                new Color(4, 20, 24, selected ? 252 : 238),
                accent,
                selected ? 28 : 22,
                selected ? 3 : 1.5,
            );
            backing.name = `ChapterNode-${index + 1}`;
            backing.setPosition(x, 0);
            const thumbnail = this.createResourceSprite(
                BACKGROUND_ASSETS[stage.mapId].resourcePath,
                selected ? 92 : 70,
            );
            backing.addChild(thumbnail);
            const chapter = this.makeLabel(
                stage.chapter,
                selected ? 16 : 14,
                new Color(accent.r, accent.g, accent.b, selected ? 255 : 210),
            );
            chapter.node.setPosition(0, selected ? -69 : -57);
            chapter.node.getComponent(UITransform)?.setContentSize(110, 28);
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
                marker.setPosition(0, selected ? 68 : 54);
                const markerLabel = this.makeLabel(markerText, 11, new Color(cleared ? '#FFF0BE' : '#D5EEE3'));
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
        const panel = this.makeRect(646, 548, new Color(5, 25, 29, 246), accent, 26, 2);
        panel.name = 'StagePreview';
        panel.setPosition(0, -246);

        const thumbnailBacking = this.makeRect(168, 158, new Color(3, 14, 18, 240), accent, 20, 1.5);
        thumbnailBacking.setPosition(-210, 147);
        const thumbnail = this.createResourceSprite(BACKGROUND_ASSETS[stage.mapId].resourcePath, 154);
        thumbnailBacking.addChild(thumbnail);
        if (this.chapterBriefOpen && this.chapterBriefPreviewChoiceId) {
            this.createChapterRouteSpatialPreview(stage, thumbnailBacking);
        } else {
            this.createChapterMotionPreview(stage, thumbnailBacking);
        }
        panel.addChild(thumbnailBacking);

        const chapter = this.makeLabel(stage.chapter, 16, new Color(accent.r, accent.g, accent.b, 245));
        chapter.horizontalAlign = Label.HorizontalAlign.LEFT;
        chapter.node.setPosition(24, 190);
        chapter.node.getComponent(UITransform)?.setContentSize(220, 28);
        panel.addChild(chapter.node);
        const name = this.makeLabel(stage.stageName, 34, new Color('#FFF2CC'));
        name.horizontalAlign = Label.HorizontalAlign.LEFT;
        name.node.setPosition(46, 151);
        name.node.getComponent(UITransform)?.setContentSize(300, 50);
        panel.addChild(name.node);
        const tagline = this.makeLabel(stage.tagline, 18, new Color(184, 215, 204, 240));
        tagline.horizontalAlign = Label.HorizontalAlign.LEFT;
        tagline.node.setPosition(40, 111);
        tagline.node.getComponent(UITransform)?.setContentSize(300, 32);
        panel.addChild(tagline.node);

        const risk = this.makeRect(82, 30, new Color(111, 55, 35, 238), accent, 11, 1);
        risk.setPosition(255, 202);
        const riskLabel = this.makeLabel(stage.riskLabel, 14, new Color('#FFF0BE'));
        risk.addChild(riskLabel.node);
        panel.addChild(risk);

        const goal = this.makeLabel(`试炼目标 · ${stage.goal}`, 17, new Color(211, 232, 223, 245));
        goal.horizontalAlign = Label.HorizontalAlign.LEFT;
        goal.node.setPosition(0, 56);
        goal.node.getComponent(UITransform)?.setContentSize(560, 32);
        panel.addChild(goal.node);

        if (this.chapterBriefOpen) {
            this.addChapterRouteBrief(stage, panel, accent);
        } else {
            const routeLabel = this.makeLabel('本 章 道 途', 14, new Color(accent.r, accent.g, accent.b, 225));
            routeLabel.node.setPosition(0, 18);
            panel.addChild(routeLabel.node);
            const pathLine = new Node('StagePathLine');
            pathLine.layer = Layers.Enum.UI_2D;
            pathLine.setPosition(0, -66);
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
                const item = this.makeRect(
                    170,
                    92,
                    new Color(4, 21, 25, 248),
                    new Color(accent.r, accent.g, accent.b, index === 1 ? 205 : 130),
                    18,
                    index === 1 ? 2 : 1,
                );
                item.setPosition((index - 1) * 188, -66);
                const roleLabel = this.makeLabel(
                    index === 1 ? `${role} · 点此预览` : role,
                    13,
                    new Color(139, 172, 162, 235),
                );
                roleLabel.node.setPosition(0, 20);
                item.addChild(roleLabel.node);
                const valueLabel = this.makeLabel(value, 18, new Color(index === 1 ? '#FFF0BE' : '#DDF1E8'));
                valueLabel.node.setPosition(0, -13);
                valueLabel.node.getComponent(UITransform)?.setContentSize(154, 30);
                item.addChild(valueLabel.node);
                if (index === 1) {
                    item.name = 'ChapterRouteBriefTrigger';
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
                16,
                new Color(accent.r, accent.g, accent.b, 242),
            );
            mechanicText.node.setPosition(0, -126);
            panel.addChild(mechanicText.node);

            const stageRecord = this.stageProgress.recordFor(stage.mapId);
            const recordLabel = this.makeLabel(
                formatStageRecord(stageRecord),
                14,
                new Color(
                    stageRecord.clears > 0 ? accent.r : 137,
                    stageRecord.clears > 0 ? accent.g : 166,
                    stageRecord.clears > 0 ? accent.b : 158,
                    235,
                ),
            );
            recordLabel.node.setPosition(0, -151);
            recordLabel.node.getComponent(UITransform)?.setContentSize(430, 28);
            panel.addChild(recordLabel.node);

            const reward = STAGE_FIRST_CLEAR_REWARDS[stage.mapId];
            const rewardIconBacking = this.makeRect(
                30,
                30,
                new Color(3, 15, 18, 238),
                new Color(accent.r, accent.g, accent.b, 145),
                9,
                1,
            );
            rewardIconBacking.setPosition(-210, -188);
            rewardIconBacking.addChild(this.createResourceSprite(reward.iconResourcePath, 23));
            panel.addChild(rewardIconBacking);
            const rewardLabel = this.makeLabel(
                formatFirstClearReward(stage.mapId, stageRecord.clears > 0),
                13,
                new Color(
                    stageRecord.clears > 0 ? accent.r : 157,
                    stageRecord.clears > 0 ? accent.g : 181,
                    stageRecord.clears > 0 ? accent.b : 173,
                    235,
                ),
            );
            rewardLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            rewardLabel.node.setPosition(28, -188);
            rewardLabel.node.getComponent(UITransform)?.setContentSize(430, 26);
            panel.addChild(rewardLabel.node);
        }

        const enter = this.makeButton(
            `踏入${stage.stageName}`,
            accent,
            () => this.startStage(this.selectedStageIndex),
            530,
            70,
            new Color(16, 70, 62, 245),
        );
        enter.setPosition(0, -202);
        panel.addChild(enter);
        return panel;
    }

    private addChapterRouteBrief(stage: StageConfig, panel: Node, accent: Color): void {
        const scenario = mapEventScenarioFor(stage.mapId);
        const heading = this.makeLabel(
            `路线奇遇 · ${scenario.title}`,
            14,
            new Color(accent.r, accent.g, accent.b, 235),
        );
        heading.horizontalAlign = Label.HorizontalAlign.LEFT;
        heading.node.setPosition(-52, 18);
        heading.node.getComponent(UITransform)?.setContentSize(330, 26);
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
        close.setPosition(238, 18);
        const closeLabel = this.makeLabel('收起简报', 12, new Color('#D9EEE6'));
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
                176,
                selected
                    ? new Color(
                        Math.round(tone.r * 0.16),
                        Math.round(tone.g * 0.16),
                        Math.round(tone.b * 0.16),
                        252,
                    )
                    : new Color(4, 21, 25, 252),
                new Color(tone.r, tone.g, tone.b, selected ? 245 : 190),
                19,
                selected ? 3 : 1.5,
            );
            card.name = `ChapterRouteBrief-${choice.id}`;
            card.setPosition(index === 0 ? -145 : 145, -82);
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
                12,
                new Color(tone.r, tone.g, tone.b, 240),
            );
            role.horizontalAlign = Label.HorizontalAlign.LEFT;
            role.node.setPosition(-50, 60);
            role.node.getComponent(UITransform)?.setContentSize(150, 22);
            card.addChild(role.node);
            const risk = this.makeLabel(choice.riskLabel, 10, new Color(164, 190, 181, 230));
            risk.horizontalAlign = Label.HorizontalAlign.RIGHT;
            risk.node.setPosition(73, 60);
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

            const title = this.makeLabel(choice.title, 20, new Color('#FFF0C2'));
            title.horizontalAlign = Label.HorizontalAlign.LEFT;
            title.node.setPosition(42, 22);
            title.node.getComponent(UITransform)?.setContentSize(160, 32);
            card.addChild(title.node);
            const geometry = this.makeLabel(
                choice.geometryPreview ?? choice.title,
                14,
                new Color(tone.r, tone.g, tone.b, 245),
            );
            geometry.horizontalAlign = Label.HorizontalAlign.LEFT;
            geometry.node.setPosition(42, -5);
            geometry.node.getComponent(UITransform)?.setContentSize(160, 24);
            card.addChild(geometry.node);
            const commitment = this.makeLabel(choice.commitLine, 11, new Color(190, 216, 207, 235));
            commitment.horizontalAlign = Label.HorizontalAlign.LEFT;
            commitment.node.setPosition(42, -30);
            commitment.node.getComponent(UITransform)?.setContentSize(160, 24);
            card.addChild(commitment.node);

            const outcome = this.makeRect(
                238,
                30,
                new Color(tone.r, tone.g, tone.b, 22),
                new Color(tone.r, tone.g, tone.b, 76),
                10,
                1,
            );
            outcome.setPosition(0, -65);
            const outcomeLabel = this.makeLabel(choice.outcome, 11, new Color(tone.r, tone.g, tone.b, 245));
            outcomeLabel.node.getComponent(UITransform)?.setContentSize(224, 22);
            outcome.addChild(outcomeLabel.node);
            card.addChild(outcome);
            panel.addChild(card);
        });

        const note = this.makeLabel('点击路线切换地图落点 · 入场后于波次间正式抉择', 11, new Color(139, 168, 160, 225));
        note.node.setPosition(0, -190);
        note.node.getComponent(UITransform)?.setContentSize(420, 22);
        panel.addChild(note.node);
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
        if (this.hasLocalQaFlag('qaProgress=1')) {
            this.stageProgress.restore(JSON.stringify({
                'qingshi-road': { clears: 3, bestSeconds: 128.4 },
                'bamboo-ambush': { clears: 1, bestSeconds: 176.2 },
            }));
            return;
        }
        try {
            this.stageProgress.restore(globalThis.localStorage?.getItem(STAGE_PROGRESS_STORAGE_KEY) ?? undefined);
        } catch {
            // 隐私模式或宿主禁用存储时只退化为单次会话，不阻断章节选择和战斗。
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

    private startStage(stageIndex = this.selectedStageIndex): void {
        this.selectedStageIndex = Math.max(0, Math.min(STAGES.length - 1, stageIndex));
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
        this.attackTimer = this.shouldStartElitePreview()
            ? Number.POSITIVE_INFINITY
            : 0;
        this.level = 1;
        this.xp = 0;
        this.xpNeed = 50;
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
        this.mapEvent.begin(
            this.currentStage.mapId,
            this.hasLocalQaFlag('qaRouteHud=1') ? () => 0 : Math.random,
        );
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
        this.spiritVein.reset();
        this.mapObstacles.reset();
        this.frostTide.reset();
        this.frostVelocity.set(0, 0);
        this.frostTidePlayerHitCycle = -1;
        this.frostTideEnemyHitCycle = -1;
        this.frostTideEnemyHits.clear();
        this.attackGestureOrigin = undefined;
        this.attackGestureCurrent = undefined;
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
            this.showStageEntry();
        } else if (!this.hasLocalQaFlag('qaBossPhase=2')) {
            this.showWaveAnnouncement();
        }
        if (this.hasLocalQaFlag('qaRouteHud=1')) {
            // 固定首境分岔并暂停刷怪，便于检查 HUD 预告而不被升级页或随机触发时机打断。
            this.spawnTimer = Number.POSITIVE_INFINITY;
        }
        if (this.hasLocalQaFlag('qaUpgrade=1')) {
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
        this.playerOpacity = unit.opacity;
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
        this.createDamageNumber(new Vec3(obstacle.x, obstacle.y + 20), Math.round(damage), false);
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
        return this.swordDamage * this.spiritVein.damageMultiplier();
    }

    private createHud(): void {
        const hud = new Node('HUD');
        hud.layer = Layers.Enum.UI_2D;
        this.canvas.addChild(hud);

        const backing = this.makeRect(716, 124, new Color(3, 16, 20, 218), new Color(91, 151, 137, 130), 18, 2);
        backing.name = 'HudBacking';
        backing.setPosition(0, 592);
        hud.addChild(backing);

        const avatarBacking = this.makeRect(76, 82, new Color(12, 48, 48, 240), new Color('#DCC47C'), 18, 3);
        avatarBacking.setPosition(-310, 595);
        hud.addChild(avatarBacking);
        const portrait = this.createResourceSprite(PLAYER_ASSET.resourcePath, 62);
        portrait.setPosition(0, -3);
        avatarBacking.addChild(portrait);

        const hpBarNode = new Node('HpBar');
        hpBarNode.layer = Layers.Enum.UI_2D;
        hpBarNode.setPosition(-145, 600);
        this.hpBar = hpBarNode.addComponent(Graphics);
        hud.addChild(hpBarNode);

        const xpBarNode = new Node('XpBar');
        xpBarNode.layer = Layers.Enum.UI_2D;
        xpBarNode.setPosition(-145, 563);
        this.xpBar = xpBarNode.addComponent(Graphics);
        hud.addChild(xpBarNode);

        this.hpLabel = this.makeLabel('', 21, new Color('#FFD5C5'));
        this.hpLabel.node.setPosition(-145, 628);
        this.hpLabel.node.getComponent(UITransform)?.setContentSize(232, 42);
        hud.addChild(this.hpLabel.node);
        this.xpLabel = this.makeLabel('', 18, new Color('#A7F3D0'));
        this.xpLabel.node.setPosition(-145, 578);
        this.xpLabel.node.getComponent(UITransform)?.setContentSize(232, 32);
        hud.addChild(this.xpLabel.node);

        const waveBacking = this.makeRect(162, 82, new Color(19, 48, 45, 235), new Color(206, 177, 100, 175), 18, 2);
        waveBacking.setPosition(264, 594);
        hud.addChild(waveBacking);
        this.waveLabel = this.makeLabel('', 21, new Color('#FDE6A6'));
        this.waveLabel.node.setPosition(0, 0);
        this.waveLabel.node.getComponent(UITransform)?.setContentSize(150, 70);
        waveBacking.addChild(this.waveLabel.node);

        this.objectiveBacking = this.makeRect(
            570,
            46,
            new Color(3, 18, 22, 205),
            new Color(105, 205, 177, 115),
            18,
            2,
        );
        this.objectiveBacking.name = 'WaveObjective';
        this.objectiveBacking.setPosition(0, 510);
        hud.addChild(this.objectiveBacking);
        this.objectiveLabel = this.makeLabel('', 18, new Color('#D8F3E9'));
        this.objectiveLabel.node.getComponent(UITransform)?.setContentSize(548, 38);
        this.objectiveBacking.addChild(this.objectiveLabel.node);

        const waveRouteNode = new Node('WaveRoute');
        waveRouteNode.layer = Layers.Enum.UI_2D;
        waveRouteNode.setPosition(62, 542);
        this.waveRouteGraphics = waveRouteNode.addComponent(Graphics);
        hud.addChild(waveRouteNode);
        this.drawWaveRoute();

        this.routeChoiceBacking = this.makeRect(
            470,
            32,
            new Color(4, 23, 27, 218),
            new Color(this.currentStage.accent),
            12,
            1,
        );
        this.routeChoiceBacking.name = 'RouteChoiceStatus';
        this.routeChoiceBacking.setPosition(0, 470);
        this.routeChoiceLabel = this.makeLabel('', 14, new Color('#CDE9DF'));
        this.routeChoiceLabel.node.getComponent(UITransform)?.setContentSize(450, 26);
        this.routeChoiceBacking.addChild(this.routeChoiceLabel.node);
        hud.addChild(this.routeChoiceBacking);

        const bottomBacking = this.makeRect(750, 274, new Color(3, 14, 18, 32));
        bottomBacking.setPosition(0, -532);
        hud.addChild(bottomBacking);
        this.buildLabel = this.makeLabel('', 17, new Color('#D4E6DF'));
        this.buildLabel.node.setPosition(0, -638);
        this.buildLabel.node.getComponent(UITransform)?.setContentSize(310, 48);
        hud.addChild(this.buildLabel.node);

        this.createAttackHud(hud);
        this.createAbilityHud(hud);
        this.createBossHud(hud);
        this.createJoystick(hud);
        this.updateHud();
    }

    private createAttackHud(hud: Node): void {
        const node = new Node('AttackHud');
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform).setContentSize(144, 144);
        node.setPosition(286, -564);
        this.attackHud = node.addComponent(Graphics);
        hud.addChild(node);
        const sword = this.createResourceSprite('art/relics/xianxia-relics_00/spriteFrame', 68);
        sword.setRotationFromEuler(0, 0, -8);
        this.attackIconOpacity = sword.addComponent(UIOpacity);
        node.addChild(sword);
        this.attackHudLabel = this.makeLabel('', 17, new Color('#FFF0BE'));
        this.attackHudLabel.node.setPosition(0, -48);
        this.attackHudLabel.node.getComponent(UITransform)?.setContentSize(130, 30);
        node.addChild(this.attackHudLabel.node);
        node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            const point = event.getUILocation();
            this.attackGestureOrigin = new Vec2(point.x, point.y);
            this.attackGestureCurrent = this.attackGestureOrigin.clone();
            this.attackGestureStartedAt = this.elapsed;
            node.setScale(0.96, 0.96);
        });
        node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
            event.propagationStopped = true;
            if (!this.attackGestureOrigin) return;
            const point = event.getUILocation();
            this.attackGestureCurrent?.set(point.x, point.y);
        });
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(1, 1);
            this.releaseSwordGesture();
        });
        node.on(Node.EventType.TOUCH_CANCEL, () => {
            node.setScale(1, 1);
            this.cancelSwordGesture();
        });
    }

    private releaseSwordGesture(): void {
        if (!this.attackGestureOrigin || !this.attackGestureCurrent || this.phase !== 'playing') {
            this.cancelSwordGesture();
            return;
        }
        const delta = this.attackGestureCurrent.clone().subtract(this.attackGestureOrigin);
        const holdSeconds = this.elapsed - this.attackGestureStartedAt;
        const gesture = resolveSwordGesture(this.skills.getLevel('sword'), holdSeconds, delta.length());
        const direction = delta.lengthSqr() > 4
            ? delta.normalize()
            : this.lastMoveDirection.clone().normalize();
        this.cancelSwordGesture();

        if (gesture === 'charged') {
            this.performChargedSlash(direction);
        } else if (gesture === 'aimed') {
            this.performAimedVolley(direction);
        } else {
            this.performQuickStrike();
        }
    }

    private cancelSwordGesture(): void {
        this.attackGestureOrigin = undefined;
        this.attackGestureCurrent = undefined;
        this.attackGestureStartedAt = 0;
    }

    private performQuickStrike(): void {
        const target = this.findNearestEnemy();
        if (!target) return;
        this.actions.enter('quickStrike', 0.28);
        this.fireSword(target, 0);
        this.attackTimer = Math.max(this.attackTimer, this.attackInterval * 0.45);
    }

    private performAimedVolley(direction: Readonly<Vec2>): void {
        const target = this.findEnemyInDirection(direction) ?? this.findNearestEnemy();
        if (!target) return;
        this.actions.enter('aimedVolley', 0.42);
        const amount = Math.max(2, this.skills.getLevel('sword'));
        for (let index = 0; index < amount; index += 1) {
            this.fireSword(target, (index - (amount - 1) / 2) * 0.11);
        }
        this.attackTimer = Math.max(this.attackTimer, this.attackInterval * 0.7);
        this.createAbilityHint('御剑定向', new Color('#A5F3FC'));
    }

    private performChargedSlash(direction: Readonly<Vec2>): void {
        const normalized = direction.lengthSqr() > 0.01
            ? direction.clone().normalize()
            : this.lastMoveDirection.clone().normalize();
        this.actions.enter('chargedSlash', 0.72);
        this.playerFacing = Math.abs(normalized.x) > 0.08
            ? (normalized.x >= 0 ? 1 : -1)
            : this.playerFacing;
        const damage = this.currentSwordDamage() * 2.35;
        const radius = 235;
        for (const enemy of this.enemies) {
            if (!enemy.node.isValid || enemy.dead) continue;
            const offset = new Vec2(
                enemy.node.position.x - this.player.position.x,
                enemy.node.position.y - this.player.position.y,
            );
            const distance = offset.length();
            if (distance > radius + enemy.radius || distance <= 0.01) continue;
            if (offset.normalize().dot(normalized) < -0.1) continue;
            this.dealSkillDamage(enemy, damage, new Color('#CFFAFE'), enemy.elite ? 62 : enemy.champion ? 54 : 46);
        }
        this.damageMapObstaclesInRadius(this.player.position, radius, damage * 0.9);
        this.createChargedSlashEffect(normalized, radius);
        this.attackTimer = Math.max(this.attackTimer, this.attackInterval);
        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.22);
        this.cameraShakeTimer = 0.24;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 9);
        this.createAbilityHint('蓄力斩', new Color('#E0F2FE'));
    }

    private createAbilityHud(hud: Node): void {
        const connector = new Node('SkillArc');
        connector.layer = Layers.Enum.UI_2D;
        const arc = connector.addComponent(Graphics);
        arc.strokeColor = new Color(96, 224, 205, 90);
        arc.lineWidth = 3;
        arc.moveTo(286, -564);
        arc.bezierCurveTo(255, -500, 205, -462, 176, -410);
        arc.stroke();
        arc.fillColor = new Color(105, 235, 214, 145);
        arc.circle(246, -492, 5);
        arc.fill();
        arc.circle(205, -454, 5);
        arc.fill();
        hud.addChild(connector);

        this.dashHud = this.createSkillHud(
            hud,
            'DashHud',
            new Vec3(222, -484),
            43,
            '踏云',
            'art/relics/xianxia-relics_23/spriteFrame',
            () => this.tryDash(),
        );
        this.formationHud = this.createSkillHud(
            hud,
            'FormationHud',
            new Vec3(172, -395),
            48,
            '剑阵',
            'art/relics/xianxia-relics_05/spriteFrame',
            () => this.trySwordFormation(),
        );

        this.tribulationHudNode = new Node('TribulationHud');
        this.tribulationHudNode.layer = Layers.Enum.UI_2D;
        this.tribulationHudNode.addComponent(UITransform).setContentSize(350, 58);
        this.tribulationHudNode.setPosition(0, -594);
        this.tribulationHud = this.tribulationHudNode.addComponent(Graphics);
        this.tribulationHudLabel = this.makeLabel('', 20, new Color('#E9FFF8'));
        this.tribulationHudLabel.node.getComponent(UITransform)?.setContentSize(330, 48);
        this.tribulationHudNode.addChild(this.tribulationHudLabel.node);
        this.tribulationHudNode.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            this.startTribulationHold();
        });
        this.tribulationHudNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            this.releaseTribulationHold();
        });
        this.tribulationHudNode.on(Node.EventType.TOUCH_CANCEL, () => this.releaseTribulationHold());
        hud.addChild(this.tribulationHudNode);
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
        const icon = this.createResourceSprite(iconResourcePath, radius * 1.08);
        const iconOpacity = icon.addComponent(UIOpacity);
        icon.setPosition(0, 4);
        node.addChild(icon);
        const label = this.makeLabel(labelText, 16, new Color('#FFF0BE'));
        label.node.setPosition(0, -radius + 10);
        label.node.getComponent(UITransform)?.setContentSize(radius * 2, 26);
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

    private createJoystick(hud: Node): void {
        this.joystick = new Node('VirtualJoystick');
        this.joystick.layer = Layers.Enum.UI_2D;
        this.joystick.setPosition(-274, -560);
        this.joystick.active = false;
        this.joystickOpacity = this.joystick.addComponent(UIOpacity);
        this.joystickOpacity.opacity = 185;
        const ring = this.joystick.addComponent(Graphics);
        ring.fillColor = new Color(6, 24, 29, 165);
        ring.circle(0, 0, 72);
        ring.fill();
        ring.strokeColor = new Color(167, 221, 202, 190);
        ring.lineWidth = 3;
        ring.circle(0, 0, 72);
        ring.stroke();
        ring.strokeColor = new Color(139, 201, 183, 105);
        ring.lineWidth = 2;
        for (let index = 0; index < 4; index += 1) {
            const angle = index * Math.PI / 2;
            ring.moveTo(Math.cos(angle) * 53, Math.sin(angle) * 53);
            ring.lineTo(Math.cos(angle) * 64, Math.sin(angle) * 64);
            ring.stroke();
        }

        this.joystickKnob = new Node('Knob');
        this.joystickKnob.layer = Layers.Enum.UI_2D;
        const knob = this.joystickKnob.addComponent(Graphics);
        knob.fillColor = new Color(89, 190, 161, 205);
        knob.circle(0, 0, 27);
        knob.fill();
        knob.strokeColor = new Color(209, 250, 229, 195);
        knob.lineWidth = 3;
        knob.circle(0, 0, 27);
        knob.stroke();
        this.joystick.addChild(this.joystickKnob);
        const dashHint = new Node('DashGestureHint');
        dashHint.layer = Layers.Enum.UI_2D;
        dashHint.setPosition(91, 0);
        const hint = dashHint.addComponent(Graphics);
        hint.strokeColor = new Color(174, 237, 213, 150);
        hint.lineWidth = 5;
        hint.moveTo(-12, -15);
        hint.lineTo(3, 0);
        hint.lineTo(-12, 15);
        hint.moveTo(7, -15);
        hint.lineTo(22, 0);
        hint.lineTo(7, 15);
        hint.stroke();
        this.joystick.addChild(dashHint);
        const gestureLabel = this.makeLabel('滑动走位', 14, new Color(161, 203, 190, 195));
        gestureLabel.node.setPosition(0, -91);
        gestureLabel.node.getComponent(UITransform)?.setContentSize(150, 24);
        this.joystick.addChild(gestureLabel.node);
        hud.addChild(this.joystick);
    }

    private updatePlayer(dt: number): void {
        this.playerAttackTimer = Math.max(0, this.playerAttackTimer - dt);
        this.playerHitTimer = Math.max(0, this.playerHitTimer - dt);
        this.playerInvulnerableTimer = Math.max(0, this.playerInvulnerableTimer - dt);
        let x = this.touchDirection.x;
        let y = this.touchDirection.y;
        if (this.pressed.has(KeyCode.KEY_A) || this.pressed.has(KeyCode.ARROW_LEFT)) x -= 1;
        if (this.pressed.has(KeyCode.KEY_D) || this.pressed.has(KeyCode.ARROW_RIGHT)) x += 1;
        if (this.pressed.has(KeyCode.KEY_S) || this.pressed.has(KeyCode.ARROW_DOWN)) y -= 1;
        if (this.pressed.has(KeyCode.KEY_W) || this.pressed.has(KeyCode.ARROW_UP)) y += 1;
        const direction = new Vec2(x, y);
        if (direction.lengthSqr() > 1) direction.normalize();
        const p = this.player.position;
        const onIce = this.currentStage.mapId === 'frozen-ruins' && isOnFrostIce(p);
        const resolvedVelocity = resolveFrostVelocity(
            this.frostVelocity,
            direction,
            this.moveSpeed,
            dt,
            onIce,
        );
        this.frostVelocity.set(resolvedVelocity.x, resolvedVelocity.y);
        const movementAmount = Math.min(1, this.frostVelocity.length() / Math.max(this.moveSpeed, 1));
        this.actions.tick(dt, movementAmount > 0.04);
        if (direction.lengthSqr() > 0.04) this.lastMoveDirection.set(direction).normalize();
        this.playerMoveAmount += (movementAmount - this.playerMoveAmount) * Math.min(1, dt * 12);
        if (Math.abs(this.frostVelocity.x) > 18) this.playerFacing = this.frostVelocity.x >= 0 ? 1 : -1;
        this.player.setPosition(this.constrainToRoad(
            new Vec3(p.x + this.frostVelocity.x * dt, p.y + this.frostVelocity.y * dt),
            28,
        ));

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
        this.player.getChildByName('PlayerAura')?.setRotationFromEuler(0, 0, this.elapsed * 22);
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
            this.damagePlayer(12);
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

    private dealSkillDamage(enemy: EnemyState, damage: number, color: Color, burstRadius: number): void {
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
        this.runStats.recordDamageDealt(Math.min(enemy.hp, resolvedDamage));
        enemy.hp -= resolvedDamage;
        enemy.hitTimer = 0.18;
        this.createHitBurst(enemy.node.position, color, burstRadius, true);
        this.createDamageNumber(enemy.node.position, Math.round(resolvedDamage), enemy.elite || enemy.champion);
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

    private createChargedSlashEffect(direction: Readonly<Vec2>, radius: number): void {
        const slash = new Node('ChargedSwordSlash');
        slash.layer = Layers.Enum.UI_2D;
        slash.setPosition(this.player.position);
        const opacity = slash.addComponent(UIOpacity);
        const graphics = slash.addComponent(Graphics);
        const angle = Math.atan2(direction.y, direction.x);
        graphics.strokeColor = new Color(207, 250, 254, 225);
        graphics.lineWidth = 22;
        graphics.arc(0, 0, radius * 0.72, angle - 1.05, angle + 1.05, false);
        graphics.stroke();
        graphics.strokeColor = new Color(103, 232, 249, 115);
        graphics.lineWidth = 42;
        graphics.arc(0, 0, radius * 0.68, angle - 0.95, angle + 0.95, false);
        graphics.stroke();
        this.effectsLayer.addChild(slash);
        this.effects.push({
            node: slash,
            elapsed: 0,
            life: 0.42,
            update: (progress) => {
                opacity.opacity = Math.round(255 * (1 - progress));
                const scale = 0.72 + progress * 0.38;
                slash.setScale(scale, scale);
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
        const skillNames: Partial<Record<UpgradeId, string>> = {
            sword: '御剑',
            dash: '踏云',
            formation: '剑阵',
            tribulation: '天劫',
        };
        const node = new Node('UpgradeResonance');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(this.player.position);
        const opacity = node.addComponent(UIOpacity);
        const g = node.addComponent(Graphics);
        g.strokeColor = new Color(176, 242, 218, 210);
        g.lineWidth = 4;
        for (let ring = 0; ring < Math.min(level, 3); ring += 1) {
            g.circle(0, 0, 42 + ring * 20);
            g.stroke();
        }
        const name = skillNames[id];
        if (name) {
            const label = this.makeLabel(`${name} · ${level}阶`, 24, new Color('#FFF1B8'));
            label.node.setPosition(0, 92);
            node.addChild(label.node);
        }
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.72,
            update: (progress) => {
                const scale = 0.42 + progress * 1.15;
                node.setScale(scale, scale);
                opacity.opacity = Math.round(255 * (1 - progress));
            },
        });
        this.createScreenFlash(new Color(102, 226, 192, 36 + level * 8), 0.24);
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
        // 奇遇的风险与收益只作用于紧接着的一波，避免一次选择永久改写后续所有敌人数值。
        const eventModifiers = this.mapEvent.modifiersForWave(
            this.mapEventModifierWaveIndex === this.waveIndex,
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
        const hpBar = this.createEnemyHpBar(node, radius + (wave.elite ? 32 : champion ? 26 : 20));
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
            abilityDamage: wave.abilityDamage ?? 0,
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
        const width = enemy.elite ? 112 : enemy.champion ? 86 : 58;
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
                this.damagePlayer(enemy.damage * 0.5, enemy.node.position);
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

    private damagePlayer(amount: number, source?: Readonly<Vec3>): void {
        // 接触伤害改为带无敌帧的离散命中，避免贴身时每帧扣血，并统一触发震屏、闪红与击退。
        if (this.playerInvulnerableTimer > 0 || this.phase !== 'playing') return;
        const appliedDamage = Math.min(this.hp, amount);
        this.hp = Math.max(0, this.hp - amount);
        this.runStats.recordDamageTaken(appliedDamage);
        this.playerInvulnerableTimer = 0.42;
        this.playerHitTimer = 0.24;
        this.actions.enter('hit', 0.24);
        this.cameraShakeTimer = 0.2;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 8);
        this.createScreenFlash(new Color(190, 49, 45, 92), 0.18);
        this.createHitBurst(this.player.position, new Color('#FCA5A5'), 30, false);

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
        const node = this.makeRect(
            540,
            112,
            new Color(12, 7, 10, 232),
            new Color(presentation.tone),
            18,
            3,
        );
        node.name = 'BossPhaseTransition';
        node.setPosition(0, 205);
        const opacity = node.addComponent(UIOpacity);
        const title = this.makeLabel(presentation.transitionTitle, 28, new Color('#FFF1C8'));
        title.node.setPosition(0, 18);
        title.node.getComponent(UITransform)?.setContentSize(500, 42);
        node.addChild(title.node);
        const detail = this.makeLabel(presentation.transitionDetail, 17, new Color(presentation.tone));
        detail.node.setPosition(0, -24);
        detail.node.getComponent(UITransform)?.setContentSize(480, 30);
        node.addChild(detail.node);
        this.screenFxLayer.addChild(node);
        // 转相揭示与首领自身的一秒锁招同拍，不暂停玩家，也不会延长实际无敌或改变伤害结算。
        this.effects.push({
            node,
            elapsed: 0,
            // 本地视觉回归可固定峰值帧；正式流程仍严格维持 1.05 秒的非阻塞转场。
            life: holdForQa ? 30 : 1.05,
            update: (progress) => {
                if (holdForQa) {
                    opacity.opacity = 255;
                    node.setPosition(0, 205);
                    node.setScale(1, 1);
                    return;
                }
                const fade = progress < 0.14
                    ? progress / 0.14
                    : progress > 0.76
                        ? (1 - progress) / 0.24
                        : 1;
                opacity.opacity = Math.round(255 * Math.max(0, fade));
                node.setPosition(0, 188 + Math.min(progress / 0.22, 1) * 17);
                const scale = 0.92 + Math.min(progress / 0.2, 1) * 0.08;
                node.setScale(scale, scale);
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
                    this.damagePlayer(pulse.damage, pulse.node.position);
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
        this.attackTimer = this.attackInterval;
    }

    private fireSword(target: EnemyState, spread: number): void {
        this.actions.enter('autoAttack', 0.22);
        const node = new Node('FlyingSword');
        node.layer = Layers.Enum.UI_2D;
        const glow = new Node('SwordGlow');
        glow.layer = Layers.Enum.UI_2D;
        const glowGraphics = glow.addComponent(Graphics);
        glowGraphics.strokeColor = new Color(125, 211, 252, 95);
        glowGraphics.lineWidth = 13;
        glowGraphics.moveTo(-15, 0);
        glowGraphics.lineTo(18, 0);
        glowGraphics.stroke();
        node.addChild(glow);
        if (this.swordFrame) {
            const sprite = node.addComponent(Sprite);
            sprite.spriteFrame = this.swordFrame;
            node.setScale(0.42, 0.42);
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
            damage: this.currentSwordDamage(),
            radius: 16,
            life: 1.6,
            hit: new Set<Node>(),
            trailTimer: 0,
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
                const importantTarget = enemy.elite || enemy.champion;
                this.dealSkillDamage(enemy, projectile.damage, new Color('#BAE6FD'), enemy.elite ? 42 : enemy.champion ? 36 : 28);
                this.cameraShakeTimer = Math.max(this.cameraShakeTimer, importantTarget ? 0.12 : 0.07);
                this.cameraShakeStrength = Math.max(this.cameraShakeStrength, importantTarget ? 5 : 2.5);
                projectile.life = 0;
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

    private killEnemy(enemy: EnemyState): void {
        if (enemy.dead) return;
        const finalWave = this.waveIndex >= this.currentStage.waves.length - 1;
        const deferUpgrade = shouldDeferUpgradeForKill(enemy.behavior, finalWave);
        enemy.dead = true;
        this.runStats.recordEnemyDefeated();
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
        this.xp += value;
        if (this.xp < this.xpNeed || this.phase !== 'playing') return;
        this.xp -= this.xpNeed;
        this.level += 1;
        this.xpNeed = Math.floor(this.xpNeed * 1.5);
        this.showUpgrade();
    }

    private showUpgrade(): void {
        this.phase = 'upgrade';
        this.releaseTribulationHold();
        this.createScreenFlash(new Color(79, 209, 166, 58), 0.38);
        this.createDeathBurst(this.player.position, 58);
        this.clearOverlay();
        this.bringOverlayToFront();
        const shade = this.makeRect(750, 1334, new Color(2, 10, 14, 218), undefined, 0);
        this.overlay.addChild(shade);
        const halo = new Node('UpgradeHalo');
        halo.layer = Layers.Enum.UI_2D;
        halo.setPosition(0, 385);
        const haloGraphics = halo.addComponent(Graphics);
        haloGraphics.fillColor = new Color(86, 210, 174, 26);
        haloGraphics.circle(0, 0, 112);
        haloGraphics.fill();
        haloGraphics.strokeColor = new Color(244, 211, 126, 145);
        haloGraphics.lineWidth = 2;
        haloGraphics.circle(0, 0, 86);
        haloGraphics.stroke();
        this.overlay.addChild(halo);
        const title = this.makeLabel('破  境', 58, new Color('#FFE4A0'));
        title.node.setPosition(0, 402);
        this.overlay.addChild(title.node);
        const eyebrow = this.makeLabel('三 脉 择 一', 16, new Color('#D9C994'));
        eyebrow.node.setPosition(0, 474);
        eyebrow.node.getComponent(UITransform)?.setContentSize(180, 30);
        this.overlay.addChild(eyebrow.node);
        const subtitle = this.makeLabel(`境界提升至 ${this.level} 重  ·  定下一脉道途`, 23, new Color('#BFE0D4'));
        subtitle.node.setPosition(0, 334);
        this.overlay.addChild(subtitle.node);
        const choices = this.pickUpgrades(3);
        choices.forEach((choice, index) => {
            const button = this.makeUpgradeButton(choice, () => {
                this.applyUpgrade(choice.id);
                this.clearOverlay();
                this.phase = 'playing';
            });
            button.setPosition(0, 164 - index * 172);
            this.overlay.addChild(button);
        });
        this.overlay.addChild(this.makeUpgradePathSummary());
    }

    private showMapEvent(advanceAfterChoice: boolean, qa = false): void {
        this.phase = 'map-event';
        this.releaseTribulationHold();
        this.mapEventAdvanceAfterChoice = advanceAfterChoice;
        const scenario = qa ? this.mapEvent.openForQa() : this.mapEvent.open();
        const accent = new Color(this.currentStage.accent);
        this.clearOverlay();
        this.bringOverlayToFront();

        const shade = this.makeRect(750, 1334, new Color(2, 10, 14, 226), undefined, 0);
        this.overlay.addChild(shade);
        const panel = this.makeRect(
            642,
            1030,
            new Color(4, 23, 28, 248),
            new Color(accent.r, accent.g, accent.b, 200),
            30,
            2.5,
        );
        panel.setPosition(0, -12);
        this.overlay.addChild(panel);
        const inner = this.makeRect(
            618,
            1006,
            new Color(5, 24, 28, 0),
            new Color(244, 211, 126, 72),
            25,
            1,
        );
        panel.addChild(inner);

        const eyebrow = this.makeLabel(`${this.currentStage.chapter}  ·  ${scenario.eyebrow}`, 16, accent);
        eyebrow.node.setPosition(0, 435);
        eyebrow.node.getComponent(UITransform)?.setContentSize(390, 28);
        panel.addChild(eyebrow.node);
        const title = this.makeLabel(scenario.title, 52, new Color('#FFF0BE'));
        title.node.setPosition(0, 374);
        panel.addChild(title.node);
        const rule = new Node('MapEventRule');
        rule.layer = Layers.Enum.UI_2D;
        rule.setPosition(0, 330);
        const ruleGraphics = rule.addComponent(Graphics);
        ruleGraphics.strokeColor = new Color(accent.r, accent.g, accent.b, 145);
        ruleGraphics.lineWidth = 2;
        ruleGraphics.moveTo(-206, 0);
        ruleGraphics.lineTo(-26, 0);
        ruleGraphics.moveTo(26, 0);
        ruleGraphics.lineTo(206, 0);
        ruleGraphics.stroke();
        ruleGraphics.fillColor = new Color('#F1D587');
        ruleGraphics.circle(0, 0, 4);
        ruleGraphics.fill();
        panel.addChild(rule);
        const story = this.makeLabel(scenario.story, 21, new Color('#C9E1D8'));
        story.node.setPosition(0, 264);
        story.node.getComponent(UITransform)?.setContentSize(548, 86);
        panel.addChild(story.node);

        const nextWave = this.currentStage.waves[
            Math.min(this.currentStage.waves.length - 1, this.waveIndex + 1)
        ];
        scenario.choices.forEach((choice, index) => {
            const card = this.makeMapEventChoice(
                choice,
                nextWave?.title ?? '下一境',
                () => this.resolveMapEvent(choice),
            );
            card.setPosition(0, 90 - index * 246);
            panel.addChild(card);
        });

        const route = this.makeLabel(
            `下一境「${nextWave?.title ?? '关隘'}」 ·  效果立即生效  ·  本局仅择一次`,
            15,
            new Color(145, 181, 170, 225),
        );
        route.node.setPosition(0, -382);
        route.node.getComponent(UITransform)?.setContentSize(580, 30);
        panel.addChild(route.node);
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
            new Color(2, 12, 16, 112),
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

    private makeMapEventChoice(choice: MapEventChoice, nextWaveTitle: string, onClick: () => void): Node {
        const accent = new Color(MAP_EVENT_TONE_COLORS[choice.tone]);
        const node = this.makeRect(
            574,
            230,
            new Color(5, 31, 35, 250),
            new Color(accent.r, accent.g, accent.b, 210),
            24,
            2,
        );
        const iconBacking = this.makeRect(
            112,
            112,
            new Color(2, 16, 20, 245),
            new Color(accent.r, accent.g, accent.b, 185),
            24,
            1.5,
        );
        iconBacking.setPosition(-208, 9);
        const icon = this.createResourceSprite(choice.iconResourcePath, 84);
        iconBacking.addChild(icon);
        node.addChild(iconBacking);

        const role = this.makeLabel(choice.role, 15, accent);
        role.horizontalAlign = Label.HorizontalAlign.LEFT;
        role.node.setPosition(-28, 70);
        role.node.getComponent(UITransform)?.setContentSize(250, 28);
        node.addChild(role.node);
        const title = this.makeLabel(choice.title, 29, new Color('#FFF1C5'));
        title.horizontalAlign = Label.HorizontalAlign.LEFT;
        title.node.setPosition(-28, 35);
        title.node.getComponent(UITransform)?.setContentSize(250, 42);
        node.addChild(title.node);
        const description = this.makeLabel(choice.description, 17, new Color(193, 220, 211, 240));
        description.horizontalAlign = Label.HorizontalAlign.LEFT;
        description.node.setPosition(58, -6);
        description.node.getComponent(UITransform)?.setContentSize(350, 38);
        node.addChild(description.node);

        const outcomeBacking = this.makeRect(
            386,
            40,
            new Color(accent.r, accent.g, accent.b, 22),
            new Color(accent.r, accent.g, accent.b, 105),
            13,
            1,
        );
        outcomeBacking.setPosition(79, -54);
        const outcome = this.makeLabel(choice.outcome, 17, accent);
        outcome.node.getComponent(UITransform)?.setContentSize(368, 31);
        outcomeBacking.addChild(outcome.node);
        node.addChild(outcomeBacking);

        const nextWave = this.makeRect(
            386,
            32,
            new Color(2, 18, 22, 225),
            new Color(accent.r, accent.g, accent.b, 78),
            11,
            1,
        );
        nextWave.setPosition(79, -91);
        const nextWaveLabel = this.makeLabel(
            [
                `下境 · ${nextWaveTitle}`,
                choice.geometryPreview,
                describeNextWaveModifiers(choice.effect.nextWave),
            ].filter(Boolean).join(' · '),
            13,
            new Color('#CDE5DC'),
        );
        nextWaveLabel.node.getComponent(UITransform)?.setContentSize(372, 25);
        nextWave.addChild(nextWaveLabel.node);
        node.addChild(nextWave);

        const risk = this.makeRect(
            126,
            32,
            new Color(choice.tone === 'ember' ? '#5B2B24' : '#173A36'),
            new Color(accent.r, accent.g, accent.b, 170),
            11,
            1,
        );
        risk.setPosition(214, 72);
        const riskLabel = this.makeLabel(choice.riskLabel, 13, new Color('#F7E7C0'));
        riskLabel.node.getComponent(UITransform)?.setContentSize(118, 25);
        risk.addChild(riskLabel.node);
        node.addChild(risk);

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

        const prompt = this.makeLabel('战场已重构', 14, new Color(145, 177, 168, 220));
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

    private applyUpgrade(id: UpgradeId): void {
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
        this.createUpgradeResonance(id, nextLevel);
    }

    private checkStageProgress(dt: number): void {
        const wave = this.currentStage.waves[this.waveIndex];
        if (!wave || this.spawned < wave.count || this.enemies.length > 0) return;
        if (!this.waveFinished) {
            this.waveFinished = true;
            this.waveRestTimer = 1.5;
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
        this.bossFinishEnemy = undefined;
        this.bossFinishStarted = false;
        if (!victory) this.actions.enter('defeat', 0, true);
        if (victory) {
            // 只在真实胜利落印；失败和中途返回不会增加通关次数或覆盖最快记录。
            this.lastStageVictory = this.stageProgress.recordVictory(
                this.currentStage.mapId,
                this.runStats.snapshot().elapsedSeconds,
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
        const panel = this.makeRect(620, 980, new Color(4, 22, 27, 250), new Color(111, 151, 141, 180), 30, 2);
        const innerFrame = this.makeRect(594, 954, new Color(4, 22, 27, 0), new Color(accent.r, accent.g, accent.b, 72), 25, 1);
        panel.addChild(innerFrame);
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
        section.node.setPosition(-244, 216);
        section.node.getComponent(UITransform)?.setContentSize(220, 26);
        panel.addChild(section.node);

        const stats = this.runStats.snapshot();
        const healthRatio = Math.round(this.hp / Math.max(1, this.maxHp) * 100);
        const statItems: ReadonlyArray<readonly [string, string]> = [
            ['历时', formatRunDuration(stats.elapsedSeconds)],
            ['斩妖', `${stats.enemiesDefeated}`],
            ['总伤', `${Math.round(stats.damageDealt)}`],
            ['余命', `${healthRatio}%`],
        ];
        statItems.forEach(([label, value], index) => {
            const tile = this.makeResultStat(label, value, accent);
            tile.setPosition(-204 + index * 136, 153);
            panel.addChild(tile);
        });

        panel.addChild(this.makeResultJourneySummary(stats, accent));

        panel.addChild(this.makeResultBuildSummary());

        const rewardPanel = this.makeResultRewardSummary(victory, accent);
        panel.addChild(rewardPanel);

        const button = this.makeButton(
            victory ? '再 战 本 章' : '重 整 道 心',
            accent,
            () => this.startStage(this.selectedStageIndex),
            470,
            82,
            new Color(victory ? '#1C6758' : '#713A39'),
        );
        button.setPosition(0, -345);
        panel.addChild(button);
        const routeButton = this.makeButton(
            '返 回 试 炼 图',
            new Color('#8AB9A7'),
            () => this.showMenu(),
            360,
            60,
            new Color(14, 48, 47, 235),
        );
        routeButton.setPosition(0, -438);
        panel.addChild(routeButton);
        this.animateResultReveal(panel, rewardPanel);
        return panel;
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
        const panel = this.makeRect(
            548,
            124,
            new Color(5, 31, 34, 250),
            new Color(accent.r, accent.g, accent.b, milestone.kind === 'first-clear' ? 225 : 145),
            22,
            milestone.kind === 'first-clear' ? 2 : 1.25,
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
        const panel = this.makeRect(
            548,
            126,
            new Color(7, 35, 38, 245),
            new Color(accent.r, accent.g, accent.b, 135),
            18,
            1.5,
        );
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
            const replayLabel = this.makeLabel('回 放 ›', 12, eventAccent);
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
        const tile = this.makeRect(126, 88, new Color(3, 17, 22, 232), new Color(78, 113, 108, 175), 18, 1);
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
        const panel = this.makeRect(548, 132, new Color(3, 18, 23, 238), new Color(78, 113, 108, 155), 20, 1);
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
        title.node.setPosition(-150, 41);
        title.node.getComponent(UITransform)?.setContentSize(360, 30);
        panel.addChild(title.node);
        UPGRADE_PATH_ORDER.forEach((path, index) => {
            const chip = this.makeRect(
                150,
                46,
                new Color(6, 31, 34, 245),
                new Color(UPGRADE_PATH_COLORS[path]),
                14,
                1.25,
            );
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
            `御剑 ${this.skills.getLevel('sword')}  ·  踏云 ${this.skills.getLevel('dash')}  ·  剑阵 ${this.skills.getLevel('formation')}  ·  天劫 ${this.skills.getLevel('tribulation')}`,
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

    private findEnemyInDirection(direction: Readonly<Vec2>): EnemyState | undefined {
        const normalized = direction.lengthSqr() > 0.01 ? direction.clone().normalize() : new Vec2(0, 1);
        let best: EnemyState | undefined;
        let bestScore = -Infinity;
        for (const enemy of this.enemies) {
            if (!enemy.node.isValid || enemy.dead) continue;
            const offset = new Vec2(
                enemy.node.position.x - this.player.position.x,
                enemy.node.position.y - this.player.position.y,
            );
            const distance = Math.max(offset.length(), 1);
            const alignment = offset.normalize().dot(normalized);
            // 拖动瞄准优先方向一致的目标，并用距离做轻微衰减，避免吸附到远处边缘敌人。
            const score = alignment * 1.4 - distance / 1600;
            if (alignment < 0.2 || score <= bestScore) continue;
            best = enemy;
            bestScore = score;
        }
        return best;
    }

    private updateHud(): void {
        const wave = this.currentStage.waves[this.waveIndex];
        const alive = this.enemies.filter((enemy) => enemy.node.isValid && !enemy.dead).length;
        const remaining = wave ? Math.max(0, wave.count - this.spawned + alive) : 0;
        this.hpLabel.string = `气血  ${Math.ceil(this.hp)} / ${this.maxHp}`;
        this.xpLabel.string = `境界 ${this.level} 重    修为 ${this.xp} / ${this.xpNeed}`;
        this.waveLabel.string = `${wave?.title ?? this.currentStage.stageName}\n余敌 ${remaining} · ${this.waveIndex + 1}/${this.currentStage.waves.length}`;
        this.drawWaveRoute();
        if (this.objectiveLabel) {
            const openingObjectiveVisible = this.waveIndex === 0
                && this.openingObjectiveState?.visible
                && !this.mapEvent.choice();
            const eliteEncounterState = this.eliteEncounter.snapshot();
            const rememberingChapterBranch = this.waveIndex === 0
                && this.chapterBranchMemoryTimer > 0
                && !this.mapEvent.choice();
            if (openingObjectiveVisible) {
                const presentation = openingObjectivePresentationFor(this.currentStage.mapId);
                this.objectiveLabel.string = `${presentation.eyebrow}  ·  ${this.openingObjectiveState?.text ?? presentation.instruction}`;
                this.objectiveLabel.color = new Color(presentation.accent);
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
                this.objectiveLabel.string = [
                    wave?.objective ?? '肃清妖潮',
                    qingshiStatus,
                    obstacleStatus,
                    tideStatus,
                    veinStatus,
                ]
                    .filter(Boolean)
                    .join('  ·  ');
                this.objectiveLabel.color = new Color('#D8F3E9');
            }
        }
        if (this.routeChoiceLabel) {
            this.routeChoiceLabel.string = this.mapEvent.routeHudText(
                this.waveIndex,
                this.currentStage.waves.length,
            );
            const choice = this.mapEvent.choice();
            this.routeChoiceLabel.color = choice
                ? new Color(MAP_EVENT_TONE_COLORS[choice.tone])
                : new Color('#CDE9DF');
        }
        this.buildLabel.string = `飞剑 ${this.swordCount}柄  ·  剑伤 ${Math.round(this.currentSwordDamage())}  ·  间隔 ${this.attackInterval.toFixed(2)}秒`;
        const cooldownRatio = this.enemies.length === 0
            ? 1
            : 1 - Math.max(0, Math.min(1, this.attackTimer / this.attackInterval));
        const swordLevel = this.skills.getLevel('sword');
        const gestureHold = this.attackGestureOrigin ? this.elapsed - this.attackGestureStartedAt : 0;
        const gestureDrag = this.attackGestureOrigin && this.attackGestureCurrent
            ? Vec2.distance(this.attackGestureOrigin, this.attackGestureCurrent)
            : 0;
        if (this.attackGestureOrigin) {
            this.attackHudLabel.string = swordLevel >= 3 && gestureHold >= 0.18
                ? `蓄力 ${Math.min(100, Math.round(gestureHold / 0.55 * 100))}%`
                : swordLevel >= 2 && gestureDrag >= 30
                    ? '御剑定向'
                    : '御剑';
        } else {
            this.attackHudLabel.string = cooldownRatio < 0.99
                ? `${Math.max(0, this.attackTimer).toFixed(1)}`
                : swordLevel >= 3
                    ? '御剑·长按'
                    : swordLevel >= 2
                        ? '御剑·拖动'
                        : '御剑·自动';
        }
        this.attackIconOpacity.opacity = 245;
        this.attackHud.clear();
        this.attackHud.fillColor = new Color(5, 22, 27, 205);
        this.attackHud.circle(0, 0, 62);
        this.attackHud.fill();
        this.attackHud.strokeColor = new Color(241, 211, 134, 225);
        this.attackHud.lineWidth = 6;
        this.attackHud.arc(0, 0, 62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cooldownRatio, false);
        this.attackHud.stroke();
        this.attackHud.strokeColor = new Color(142, 207, 187, 85);
        this.attackHud.lineWidth = 2;
        this.attackHud.circle(0, 0, 52);
        this.attackHud.stroke();
        if (this.attackGestureOrigin && swordLevel >= 3) {
            const chargeRatio = Math.min(1, gestureHold / 0.55);
            this.attackHud.strokeColor = new Color(165, 243, 252, 235);
            this.attackHud.lineWidth = 8;
            this.attackHud.arc(
                0,
                0,
                48,
                -Math.PI / 2,
                -Math.PI / 2 + Math.PI * 2 * chargeRatio,
                false,
            );
            this.attackHud.stroke();
        }
        for (let index = 0; index < 3; index += 1) {
            this.attackHud.fillColor = index < swordLevel
                ? new Color(135, 238, 215, 235)
                : new Color(45, 76, 74, 190);
            this.attackHud.circle(-18 + index * 18, 68, 5.5);
            this.attackHud.fill();
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
        drawTribulationHud(this.tribulationHud, this.tribulationHudLabel, this.skills);

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

        const xpRatio = Math.max(0, Math.min(1, this.xp / this.xpNeed));
        this.xpBar.clear();
        this.xpBar.fillColor = new Color(2, 9, 12, 220);
        this.xpBar.roundRect(-116, -5, 232, 10, 5);
        this.xpBar.fill();
        this.xpBar.fillColor = new Color('#4BC8A7');
        this.xpBar.roundRect(-114, -3, 228 * xpRatio, 6, 3);
        this.xpBar.fill();

        const boss = this.enemies.find((enemy) => enemy.elite && enemy.node.isValid && !enemy.dead);
        this.bossHud.active = Boolean(boss);
        this.objectiveBacking.active = !boss;
        this.routeChoiceBacking.active = !boss;
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
        const aura = new Node('PlayerAura');
        aura.layer = Layers.Enum.UI_2D;
        aura.setPosition(0, -5);
        const g = aura.addComponent(Graphics);
        g.strokeColor = new Color(111, 225, 199, 105);
        g.lineWidth = 2.5;
        g.circle(0, 0, 36);
        g.stroke();
        for (let index = 0; index < 4; index += 1) {
            const angle = index * Math.PI / 2;
            g.moveTo(Math.cos(angle) * 29, Math.sin(angle) * 29);
            g.lineTo(Math.cos(angle) * 39, Math.sin(angle) * 39);
            g.stroke();
        }
        this.player.addChild(aura);
        aura.setSiblingIndex(1);
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
        const node = new Node('SwordCast');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        node.angle = angle * 180 / Math.PI;
        const opacity = node.addComponent(UIOpacity);
        const g = node.addComponent(Graphics);
        g.strokeColor = new Color(186, 230, 253, 205);
        g.lineWidth = 5;
        g.moveTo(8, -20);
        g.lineTo(52, 0);
        g.lineTo(8, 20);
        g.stroke();
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.2,
            update: (progress) => {
                node.setScale(0.7 + progress * 0.75, 0.7 + progress * 0.75);
                opacity.opacity = Math.round(255 * (1 - progress));
            },
        });
    }

    private createSwordTrail(from: Readonly<Vec3>, to: Readonly<Vec3>): void {
        const node = new Node('SwordTrail');
        node.layer = Layers.Enum.UI_2D;
        const opacity = node.addComponent(UIOpacity);
        const g = node.addComponent(Graphics);
        g.strokeColor = new Color(125, 211, 252, 155);
        g.lineWidth = 5;
        g.moveTo(from.x, from.y);
        g.lineTo(to.x, to.y);
        g.stroke();
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.16,
            update: (progress) => {
                opacity.opacity = Math.round(210 * (1 - progress));
            },
        });
    }

    private createHitBurst(position: Readonly<Vec3>, color: Color, radius: number, slash: boolean): void {
        const node = new Node('HitBurst');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const opacity = node.addComponent(UIOpacity);
        const g = node.addComponent(Graphics);
        g.strokeColor = color;
        g.lineWidth = slash ? 5 : 4;
        g.circle(0, 0, radius * 0.45);
        g.stroke();
        const rayCount = slash ? 6 : 4;
        for (let index = 0; index < rayCount; index += 1) {
            const angle = index * Math.PI * 2 / rayCount + (slash ? 0.35 : 0);
            g.moveTo(Math.cos(angle) * radius * 0.38, Math.sin(angle) * radius * 0.38);
            g.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            g.stroke();
        }
        if (slash) {
            g.lineWidth = 7;
            g.moveTo(-radius * 0.85, -radius * 0.38);
            g.lineTo(radius * 0.9, radius * 0.42);
            g.stroke();
        }
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.24,
            update: (progress) => {
                const scale = 0.55 + progress * 0.8;
                node.setScale(scale, scale);
                node.angle = progress * 18;
                opacity.opacity = Math.round(255 * (1 - progress));
            },
        });
    }

    private createDeathBurst(position: Readonly<Vec3>, radius: number): void {
        const node = new Node('DeathBurst');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(position);
        const opacity = node.addComponent(UIOpacity);
        const g = node.addComponent(Graphics);
        g.fillColor = new Color(91, 212, 170, 72);
        g.circle(0, 0, radius * 0.55);
        g.fill();
        g.strokeColor = new Color(167, 243, 208, 205);
        g.lineWidth = 4;
        for (let index = 0; index < 10; index += 1) {
            const angle = index * Math.PI * 0.2;
            g.moveTo(Math.cos(angle) * radius * 0.25, Math.sin(angle) * radius * 0.25);
            g.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            g.stroke();
        }
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.48,
            update: (progress) => {
                const scale = 0.4 + progress * 1.15;
                node.setScale(scale, scale);
                node.angle = progress * 42;
                opacity.opacity = Math.round(255 * (1 - progress));
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
        const opacity = node.addComponent(UIOpacity);
        const g = node.addComponent(Graphics);
        g.strokeColor = new Color(255, 190, 112, 205);
        g.lineWidth = 8;
        g.circle(0, 0, radius);
        g.stroke();
        for (let index = 0; index < 12; index += 1) {
            const angle = index * Math.PI / 6;
            g.moveTo(Math.cos(angle) * radius * 0.45, Math.sin(angle) * radius * 0.45);
            g.lineTo(Math.cos(angle) * radius * 0.96, Math.sin(angle) * radius * 0.96);
            g.stroke();
        }
        this.effectsLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 0.34,
            update: (progress) => {
                node.setScale(0.45 + progress * 0.75, 0.45 + progress * 0.75);
                opacity.opacity = Math.round(255 * (1 - progress));
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

    private createDamageNumber(position: Readonly<Vec3>, damage: number, elite: boolean): void {
        const label = this.makeLabel(`${damage}`, elite ? 30 : 24, new Color(elite ? '#FDE68A' : '#E0F2FE'));
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
            life: 0.55,
            update: (progress) => {
                node.setPosition(startX + Math.sin(progress * Math.PI) * 7, startY + progress * 54);
                const pop = progress < 0.2 ? 0.7 + progress * 2 : 1.1 - (progress - 0.2) * 0.12;
                node.setScale(pop, pop);
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
            bossWave ? 584 : dangerous ? 548 : 500,
            bossWave ? 136 : dangerous ? 122 : 94,
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
            warning.node.setPosition(0, bossWave ? 50 : 44);
            warning.node.getComponent(UITransform)?.setContentSize(380, 26);
            banner.addChild(warning.node);
        }
        const title = this.makeLabel(
            `第 ${this.waveIndex + 1} 波  ·  ${wave.title}`,
            dangerous ? 32 : 29,
            new Color(dangerous ? '#FDE68A' : '#D1FAE5'),
        );
        title.node.setPosition(0, dangerous ? 8 : 17);
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
        objective.node.setPosition(0, bossWave ? -43 : dangerous ? -37 : -25);
        objective.node.getComponent(UITransform)?.setContentSize(bossWave ? 520 : 430, 30);
        banner.addChild(objective.node);
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

    private clearBattle(): void {
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
    }

    private makePanel(titleText: string, bodyText: string, width: number, height: number): Node {
        const shadow = this.makeRect(width + 18, height + 18, new Color(2, 9, 12, 185), undefined, 28);
        const panel = this.makeRect(width, height, new Color(13, 48, 47, 246), new Color('#B5D0C4'), 24, 3);
        panel.addChild(shadow);
        shadow.setSiblingIndex(0);
        shadow.setPosition(0, -8);
        const inner = this.makeRect(width - 22, height - 22, new Color(13, 48, 47, 0), new Color(230, 198, 121, 80), 20, 1);
        panel.addChild(inner);
        const title = this.makeLabel(titleText, 49, new Color('#FFE6A5'));
        title.node.setPosition(0, 112);
        panel.addChild(title.node);
        const body = this.makeLabel(bodyText, 25, new Color('#D6E8E1'));
        body.node.setPosition(0, 20);
        panel.addChild(body.node);
        return panel;
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

    private makeUpgradeButton(choice: UpgradeConfig, onClick: () => void): Node {
        const pathColor = new Color(UPGRADE_PATH_COLORS[choice.path]);
        const node = this.makeRect(604, 148, new Color(7, 30, 35, 248), pathColor, 22, 2.5);
        const iconBacking = this.makeRect(104, 104, new Color(3, 17, 22, 238), new Color(choice.accent), 21, 1.5);
        iconBacking.setPosition(-232, 0);
        node.addChild(iconBacking);

        const icon = new Node(`UpgradeIcon-${choice.id}`);
        icon.layer = Layers.Enum.UI_2D;
        icon.addComponent(UITransform).setContentSize(86, 86);
        const sprite = icon.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        iconBacking.addChild(icon);
        // 图标是可选表现层；资源导入失败时保留带色边框，升级逻辑仍可继续。
        const cachedIcon = this.spriteFrames.get(choice.iconResourcePath);
        if (cachedIcon) {
            sprite.spriteFrame = cachedIcon;
        } else {
            resources.load(choice.iconResourcePath, SpriteFrame, (error, frame) => {
                if (!error && icon.isValid) sprite.spriteFrame = frame;
            });
        }

        const level = Math.min(choice.maxLevel, this.skills.getLevel(choice.id) + 1);
        const realm = level === 1 ? '初悟' : level === 2 ? '进阶' : '圆满';
        const activeIds: ReadonlyArray<UpgradeId> = ['sword', 'dash', 'formation', 'tribulation'];
        const category = activeIds.includes(choice.id) ? '功法' : '心法';
        const title = this.makeLabel(choice.title, 28, new Color('#FFF5DC'));
        title.horizontalAlign = Label.HorizontalAlign.LEFT;
        title.node.setPosition(-5, 18);
        title.node.getComponent(UITransform)?.setContentSize(285, 42);
        node.addChild(title.node);
        const role = this.makeLabel(`${category} · ${choice.role}`, 15, new Color(pathColor.r, pathColor.g, pathColor.b, 238));
        role.horizontalAlign = Label.HorizontalAlign.LEFT;
        role.node.setPosition(-5, 49);
        role.node.getComponent(UITransform)?.setContentSize(280, 28);
        node.addChild(role.node);
        const description = this.makeLabel(choice.descriptions[level - 1], 20, new Color(203, 228, 218, 245));
        description.horizontalAlign = Label.HorizontalAlign.LEFT;
        description.node.setPosition(-5, -24);
        description.node.getComponent(UITransform)?.setContentSize(320, 38);
        node.addChild(description.node);

        const tag = this.makeRect(108, 34, new Color(3, 17, 22, 225), pathColor, 12, 1.25);
        tag.setPosition(234, 45);
        const tagLabel = this.makeLabel(`${UPGRADE_PATH_LABELS[choice.path]} · ${realm}`, 15, pathColor);
        tagLabel.node.getComponent(UITransform)?.setContentSize(102, 28);
        tag.addChild(tagLabel.node);
        node.addChild(tag);

        const tier = new Node('UpgradeTier');
        tier.layer = Layers.Enum.UI_2D;
        tier.setPosition(215, -39);
        const tierGraphics = tier.addComponent(Graphics);
        for (let index = 0; index < choice.maxLevel; index += 1) {
            tierGraphics.fillColor = index < level
                ? pathColor
                : new Color(55, 82, 84, 205);
            tierGraphics.roundRect(index * 28 - 28, -3, 21, 6, 3);
            tierGraphics.fill();
        }
        node.addChild(tier);
        node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(0.975, 0.975);
        });
        node.on(Node.EventType.TOUCH_CANCEL, () => node.setScale(1, 1));
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            node.setScale(1, 1);
            onClick();
        });
        return node;
    }

    private makeUpgradePathSummary(): Node {
        const panel = this.makeRect(604, 58, new Color(4, 21, 26, 232), new Color(85, 129, 122, 145), 18, 1);
        panel.setPosition(0, -382);
        const totals = summarizeUpgradePaths((id) => this.skills.getLevel(id));
        const heading = this.makeLabel('当前道基', 15, new Color('#AFC7BE'));
        heading.horizontalAlign = Label.HorizontalAlign.LEFT;
        heading.node.setPosition(-246, 0);
        heading.node.getComponent(UITransform)?.setContentSize(110, 30);
        panel.addChild(heading.node);
        UPGRADE_PATH_ORDER.forEach((path, index) => {
            const label = this.makeLabel(
                `${UPGRADE_PATH_LABELS[path]} ${totals[path]}重`,
                16,
                new Color(UPGRADE_PATH_COLORS[path]),
            );
            label.node.setPosition(-88 + index * 132, 8);
            label.node.getComponent(UITransform)?.setContentSize(120, 28);
            panel.addChild(label.node);
            const description = this.makeLabel(
                UPGRADE_PATH_DESCRIPTIONS[path],
                12,
                new Color(134, 163, 157, 220),
            );
            description.node.setPosition(-88 + index * 132, -13);
            description.node.getComponent(UITransform)?.setContentSize(120, 22);
            panel.addChild(description.node);
        });
        return panel;
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
            resources.load(resourcePath, SpriteFrame, (error, frame) => {
                if (!error) assign(frame);
            });
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
        const node = new Node('Label');
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform).setContentSize(600, Math.max(70, size * 2.5));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size * 1.35;
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

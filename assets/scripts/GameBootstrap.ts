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
    Sprite,
    SpriteFrame,
    UIOpacity,
    UITransform,
    Vec2,
    Vec3,
    input,
    resources,
    ResolutionPolicy,
    view,
} from 'cc';
import {
    BACKGROUND_ASSET,
    ENEMY_ASSETS,
    PLAYER_ASSET,
    PRELOAD_SPRITE_PATHS,
    SpriteAssetSpec,
} from './config/AssetCatalog';
import {
    EnemyBehavior,
    EnemyKind,
    STAGES,
    UPGRADES,
    UpgradeConfig,
    UpgradeId,
    WaveConfig,
} from './config/GameConfig';

const { ccclass } = _decorator;

type Phase = 'menu' | 'playing' | 'upgrade' | 'victory' | 'defeat';

interface EnemyState {
    node: Node;
    visual: Node;
    opacity: UIOpacity;
    kind: EnemyKind;
    behavior: EnemyBehavior;
    hp: number;
    maxHp: number;
    speed: number;
    damage: number;
    radius: number;
    xp: number;
    elite: boolean;
    age: number;
    strafeSign: number;
    abilityTimer: number;
    abilityInterval: number;
    abilityDamage: number;
    hpBar: Graphics;
    baseScale: number;
    baseVisualY: number;
    hitTimer: number;
    deathTimer: number;
    spawnTimer: number;
    castTimer: number;
    dead: boolean;
}

interface ProjectileState {
    node: Node;
    velocity: Vec3;
    damage: number;
    radius: number;
    life: number;
    hit: Set<Node>;
    trailTimer: number;
}

interface BossPulseState {
    node: Node;
    graphics: Graphics;
    elapsed: number;
    triggerAt: number;
    life: number;
    radius: number;
    damage: number;
    applied: boolean;
}

interface VisualEffectState {
    node: Node;
    elapsed: number;
    life: number;
    update: (progress: number) => void;
}

interface AmbientState {
    node: Node;
    baseX: number;
    baseY: number;
    speed: number;
    phase: number;
    range: number;
}

interface UnitVisual {
    visual: Node;
    opacity: UIOpacity;
    baseScale: number;
}

interface RoadProfilePoint {
    y: number;
    centerX: number;
    halfWidth: number;
}

interface SkillHud {
    node: Node;
    graphics: Graphics;
    label: Label;
    iconOpacity: UIOpacity;
    radius: number;
}

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    private readonly designWidth = 750;
    private readonly designHeight = 1334;
    private readonly arena = { left: -365, right: 365, bottom: -620, top: 525 };
    // 对应青石山道图片中石板路的可行走轮廓；由下到上插值，避免单位穿进竹林与岩石。
    private readonly roadProfile: ReadonlyArray<RoadProfilePoint> = [
        { y: -620, centerX: 15, halfWidth: 160 },
        { y: -500, centerX: 0, halfWidth: 195 },
        { y: -360, centerX: -10, halfWidth: 235 },
        { y: -220, centerX: 0, halfWidth: 210 },
        { y: -80, centerX: 0, halfWidth: 230 },
        { y: 80, centerX: 20, halfWidth: 205 },
        { y: 220, centerX: 15, halfWidth: 235 },
        { y: 360, centerX: 5, halfWidth: 240 },
        { y: 500, centerX: 10, halfWidth: 270 },
        { y: 525, centerX: 8, halfWidth: 250 },
    ];

    private phase: Phase = 'menu';
    private canvas!: Node;
    private world!: Node;
    private battleLayer!: Node;
    private effectsLayer!: Node;
    private screenFxLayer!: Node;
    private overlay!: Node;
    private player!: Node;
    private playerVisual!: Node;
    private playerOpacity!: UIOpacity;
    private playerBaseScale = 1;
    private backgroundSprite!: Sprite;
    private hpLabel!: Label;
    private xpLabel!: Label;
    private waveLabel!: Label;
    private buildLabel!: Label;
    private hpBar!: Graphics;
    private xpBar!: Graphics;
    private bossHud!: Node;
    private bossHpBar!: Graphics;
    private bossHpLabel!: Label;
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
    private effects: VisualEffectState[] = [];
    private ambience: AmbientState[] = [];
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
    private dashCooldown = 0;
    private formationCooldown = 0;
    private tribulationCharge = 0;
    private tribulationHold = 0;
    private tribulationHolding = false;
    private dashActionTimer = 0;
    private formationActionTimer = 0;
    private tribulationActionTimer = 0;
    private cameraShakeTimer = 0;
    private cameraShakeStrength = 0;
    private upgradeLevels: Partial<Record<UpgradeId, number>> = {};

    protected override onLoad(): void {
        // 项目未依赖编辑器里的本机 View 配置，换设备时也固定按 750×1334 竖屏等比显示。
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.SHOW_ALL);
        this.buildRuntimeScene();
        this.bindInput();
        this.preloadArt();
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
        this.updatePlayer(dt);
        this.updateAbilities(dt);
        this.updateSpawning(dt);
        this.updateEnemies(dt);
        this.updateBossPulses(dt);
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
        const backdrop = new Node('Backdrop');
        backdrop.layer = Layers.Enum.UI_2D;
        const graphics = backdrop.addComponent(Graphics);
        graphics.fillColor = new Color('#071719');
        graphics.roundRect(-375, -667, 750, 1334, 0);
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
        const vignette = new Node('ArenaVignette');
        vignette.layer = Layers.Enum.UI_2D;
        const g = vignette.addComponent(Graphics);
        // 用宽描边与上下暗幕把全屏背景压回战斗中心，HUD 仍能保持稳定对比度。
        g.strokeColor = new Color(2, 10, 12, 155);
        g.lineWidth = 46;
        g.rect(-372, -664, 744, 1328);
        g.stroke();
        g.fillColor = new Color(3, 12, 15, 116);
        g.rect(-375, 515, 750, 152);
        g.fill();
        g.fillColor = new Color(3, 12, 15, 100);
        g.rect(-375, -667, 750, 190);
        g.fill();
        g.strokeColor = new Color(123, 215, 189, 46);
        g.lineWidth = 2;
        g.moveTo(-340, 508);
        g.lineTo(340, 508);
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
        for (const path of PRELOAD_SPRITE_PATHS) {
            resources.load(path, SpriteFrame, (error, frame) => {
                if (error) {
                    console.warn(`[art] 资源加载失败，使用程序化占位: ${path}`, error);
                    return;
                }
                this.spriteFrames.set(path, frame);
                if (path === BACKGROUND_ASSET.resourcePath) this.backgroundSprite.spriteFrame = frame;
            });
        }
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
        this.touchOrigin = new Vec2(p.x, p.y);
        this.joystickOpacity.opacity = 220;
    }

    private onTouchMove(event: EventTouch): void {
        if (!this.touchOrigin || this.phase !== 'playing') return;
        const p = event.getUILocation();
        this.touchDirection.set(p.x - this.touchOrigin.x, p.y - this.touchOrigin.y);
        if (this.touchDirection.length() > 1) this.touchDirection.normalize();
        this.joystickKnob.setPosition(this.touchDirection.x * 34, this.touchDirection.y * 34);
    }

    private onTouchEnd(): void {
        this.touchOrigin = undefined;
        this.touchDirection.set(0, 0);
        if (this.joystickKnob?.isValid) this.joystickKnob.setPosition(0, 0);
        if (this.joystickOpacity?.isValid) this.joystickOpacity.opacity = 125;
    }

    private showMenu(): void {
        this.phase = 'menu';
        this.clearOverlay();
        this.bringOverlayToFront();
        const shade = this.makeRect(750, 1334, new Color(3, 13, 16, 92));
        this.overlay.addChild(shade);

        const title = this.makeLabel('仙 途 劫', 76, new Color('#FFF0BE'));
        title.node.setPosition(0, 370);
        this.overlay.addChild(title.node);
        const titleRule = new Node('TitleRule');
        titleRule.layer = Layers.Enum.UI_2D;
        titleRule.setPosition(0, 318);
        const rule = titleRule.addComponent(Graphics);
        rule.strokeColor = new Color(239, 202, 118, 175);
        rule.lineWidth = 2;
        rule.moveTo(-205, 0);
        rule.lineTo(-42, 0);
        rule.moveTo(42, 0);
        rule.lineTo(205, 0);
        rule.stroke();
        rule.fillColor = new Color(239, 202, 118, 220);
        rule.circle(0, 0, 5);
        rule.fill();
        this.overlay.addChild(titleRule);

        const subtitle = this.makeLabel('御剑破劫 · 一念登仙', 25, new Color('#CFE5DB'));
        subtitle.node.setPosition(0, 278);
        this.overlay.addChild(subtitle.node);

        const heroGlow = new Node('HeroGlow');
        heroGlow.layer = Layers.Enum.UI_2D;
        heroGlow.setPosition(0, 30);
        const glow = heroGlow.addComponent(Graphics);
        glow.fillColor = new Color(76, 190, 167, 28);
        glow.circle(0, 0, 178);
        glow.fill();
        glow.strokeColor = new Color(126, 224, 197, 62);
        glow.lineWidth = 2;
        glow.circle(0, 0, 154);
        glow.stroke();
        this.overlay.addChild(heroGlow);
        const hero = this.createResourceSprite(PLAYER_ASSET.resourcePath, 355);
        hero.setPosition(0, 10);
        this.overlay.addChild(hero);

        const stage = this.makeLabel('第一章  ·  青石山道', 30, new Color('#FFE2A3'));
        stage.node.setPosition(0, -245);
        this.overlay.addChild(stage.node);
        const objective = this.makeLabel('肃清妖潮  ·  击败镇关山魈', 22, new Color('#BFD5CE'));
        objective.node.setPosition(0, -290);
        this.overlay.addChild(objective.node);

        const button = this.makeButton('踏 入 山 门', new Color('#E6C071'), () => this.startStage(), 460, 96, new Color(24, 91, 77, 242));
        button.setPosition(0, -395);
        this.overlay.addChild(button);
        const tip = this.makeLabel('摇杆走位  ·  主动功法随破境逐阶解锁', 20, new Color(157, 188, 177, 220));
        tip.node.setPosition(0, -492);
        this.overlay.addChild(tip.node);
    }

    private startStage(): void {
        this.phase = 'playing';
        this.clearOverlay();
        this.clearBattle();
        this.hp = this.maxHp = 100;
        this.moveSpeed = 235;
        this.swordDamage = 18;
        this.swordCount = 1;
        this.attackInterval = 0.72;
        this.attackTimer = 0;
        this.level = 1;
        this.xp = 0;
        this.xpNeed = 50;
        this.waveIndex = 0;
        this.spawned = 0;
        this.spawnTimer = 0.3;
        this.waveRestTimer = 0;
        this.waveFinished = false;
        this.playerAttackTimer = 0;
        this.playerHitTimer = 0;
        this.playerInvulnerableTimer = 0;
        this.lastMoveDirection.set(0, 1);
        this.dashCooldown = 0;
        this.formationCooldown = 0;
        this.tribulationCharge = 0;
        this.tribulationHold = 0;
        this.tribulationHolding = false;
        this.dashActionTimer = 0;
        this.formationActionTimer = 0;
        this.tribulationActionTimer = 0;
        this.cameraShakeTimer = 0;
        // 自动御剑是角色初始功法，其余主动技能在破境选择中逐步解锁到三阶。
        this.upgradeLevels = { sword: 1 };
        this.createPlayer();
        this.createHud();
        this.showWaveAnnouncement();
    }

    private createPlayer(): void {
        this.player = new Node('QingLan');
        this.player.layer = Layers.Enum.UI_2D;
        const unit = this.attachUnitVisual(this.player, PLAYER_ASSET, 27);
        this.playerVisual = unit.visual;
        this.playerOpacity = unit.opacity;
        this.playerBaseScale = unit.baseScale;
        this.player.setPosition(0, -260);
        this.battleLayer.addChild(this.player);
        this.createPlayerAura();
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

        const bottomBacking = this.makeRect(750, 274, new Color(3, 14, 18, 150), new Color(80, 145, 131, 55), 0, 2);
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
        this.bossHud.setPosition(0, 485);
        const backing = this.makeRect(520, 72, new Color(24, 8, 12, 222), new Color(211, 139, 65, 210), 18, 3);
        this.bossHud.addChild(backing);
        this.bossHpLabel = this.makeLabel('', 22, new Color('#F8D9A0'));
        this.bossHpLabel.node.setPosition(0, 14);
        this.bossHud.addChild(this.bossHpLabel.node);
        const barNode = new Node('BossHpBar');
        barNode.layer = Layers.Enum.UI_2D;
        barNode.setPosition(0, -17);
        this.bossHpBar = barNode.addComponent(Graphics);
        this.bossHud.addChild(barNode);
        this.bossHud.active = false;
        hud.addChild(this.bossHud);
    }

    private createJoystick(hud: Node): void {
        this.joystick = new Node('VirtualJoystick');
        this.joystick.layer = Layers.Enum.UI_2D;
        this.joystick.setPosition(-274, -560);
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
        if (direction.lengthSqr() > 0.04) this.lastMoveDirection.set(direction).normalize();
        this.playerMoveAmount += (Math.min(direction.length(), 1) - this.playerMoveAmount) * Math.min(1, dt * 12);
        if (Math.abs(direction.x) > 0.08) this.playerFacing = direction.x >= 0 ? 1 : -1;
        const p = this.player.position;
        this.player.setPosition(this.constrainToRoad(
            new Vec3(p.x + direction.x * this.moveSpeed * dt, p.y + direction.y * this.moveSpeed * dt),
            28,
        ));

        const idleBreath = Math.sin(this.elapsed * 3.2) * 0.025;
        const step = Math.sin(this.elapsed * 12);
        const bob = this.playerMoveAmount > 0.08 ? Math.abs(step) * 7 : Math.sin(this.elapsed * 2.4) * 2.5;
        let scaleX = 1 + idleBreath + this.playerMoveAmount * Math.abs(step) * 0.035;
        let scaleY = 1 - idleBreath - this.playerMoveAmount * Math.abs(step) * 0.025;
        let angle = -direction.x * 5.5;

        if (this.playerAttackTimer > 0) {
            const attackProgress = 1 - this.playerAttackTimer / 0.22;
            const snap = Math.sin(Math.min(1, attackProgress) * Math.PI);
            scaleX += snap * 0.12;
            scaleY -= snap * 0.07;
            angle -= this.playerFacing * snap * 10;
        }
        if (this.dashActionTimer > 0) {
            const dashPose = Math.sin((1 - this.dashActionTimer / 0.32) * Math.PI);
            scaleX += dashPose * 0.2;
            scaleY -= dashPose * 0.1;
            angle -= this.playerFacing * dashPose * 15;
        }
        if (this.formationActionTimer > 0) {
            const formationPose = Math.sin((1 - this.formationActionTimer / 0.58) * Math.PI);
            scaleX += formationPose * 0.08;
            scaleY += formationPose * 0.13;
            angle += this.playerFacing * formationPose * 8;
        }
        if (this.tribulationActionTimer > 0) {
            const channelPose = Math.sin(Math.min(1, (1 - this.tribulationActionTimer / 0.8) * 2) * Math.PI / 2);
            scaleX -= channelPose * 0.08;
            scaleY += channelPose * 0.18;
            angle *= 0.25;
        }

        const hitJitter = this.playerHitTimer > 0 ? Math.sin(this.playerHitTimer * 95) * 5 : 0;
        this.playerVisual.setPosition(hitJitter, bob);
        this.playerVisual.setScale(this.playerBaseScale * this.playerFacing * scaleX, this.playerBaseScale * scaleY);
        this.playerVisual.angle = angle;
        const playerSprite = this.playerVisual.getComponent(Sprite);
        if (playerSprite) {
            playerSprite.color = this.playerHitTimer > 0
                ? new Color(255, 150, 142, 255)
                : new Color(255, 255, 255, this.playerInvulnerableTimer > 0 && Math.floor(this.elapsed * 20) % 2 === 0 ? 155 : 255);
        }
        this.player.getChildByName('PlayerAura')?.setRotationFromEuler(0, 0, this.elapsed * 22);
    }

    private updateAbilities(dt: number): void {
        this.dashCooldown = Math.max(0, this.dashCooldown - dt);
        this.formationCooldown = Math.max(0, this.formationCooldown - dt);
        this.dashActionTimer = Math.max(0, this.dashActionTimer - dt);
        this.formationActionTimer = Math.max(0, this.formationActionTimer - dt);
        this.tribulationActionTimer = Math.max(0, this.tribulationActionTimer - dt);

        const tribulationLevel = this.upgradeLevels.tribulation ?? 0;
        if (tribulationLevel > 0 && !this.tribulationHolding) {
            // 天劫以战斗命中为主要充能来源，并保留少量自然回复，避免无敌人阶段卡死。
            this.tribulationCharge = Math.min(1, this.tribulationCharge + dt * (0.012 + tribulationLevel * 0.003));
        }
        if (!this.tribulationHolding) return;
        if (tribulationLevel <= 0 || this.tribulationCharge < 1) {
            this.releaseTribulationHold();
            return;
        }
        this.tribulationHold += dt;
        const requiredHold = 0.72 - (tribulationLevel - 1) * 0.12;
        if (this.tribulationHold >= requiredHold) this.castTribulation();
    }

    private tryDash(): void {
        const level = this.upgradeLevels.dash ?? 0;
        if (this.phase !== 'playing') return;
        if (level <= 0) {
            this.createAbilityHint('踏云尚未参悟', new Color('#A8C9BE'));
            return;
        }
        if (this.dashCooldown > 0) return;

        const distance = [150, 190, 230][level - 1];
        const direction = this.lastMoveDirection.lengthSqr() > 0.01
            ? this.lastMoveDirection.clone().normalize()
            : new Vec2(this.playerFacing, 0);
        const from = this.player.position.clone();
        const to = this.constrainToRoad(
            new Vec3(from.x + direction.x * distance, from.y + direction.y * distance),
            28,
        );
        this.player.setPosition(to);
        this.playerFacing = Math.abs(direction.x) > 0.08 ? (direction.x >= 0 ? 1 : -1) : this.playerFacing;
        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.18 + level * 0.08);
        this.dashCooldown = [5.2, 4.4, 3.5][level - 1];
        this.dashActionTimer = 0.32;
        this.createDashEffect(from, to, level);

        if (level >= 3) {
            for (const enemy of this.enemies) {
                if (!enemy.node.isValid || enemy.dead) continue;
                const distanceToPath = this.distanceToSegment(enemy.node.position, from, to);
                if (distanceToPath <= enemy.radius + 34) {
                    this.dealSkillDamage(enemy, this.swordDamage * 0.8, new Color('#A7F3D0'), 34);
                }
            }
        }
    }

    private trySwordFormation(): void {
        const level = this.upgradeLevels.formation ?? 0;
        if (this.phase !== 'playing') return;
        if (level <= 0) {
            this.createAbilityHint('剑阵尚未参悟', new Color('#A8C9BE'));
            return;
        }
        if (this.formationCooldown > 0) return;

        const radius = [145, 182, 220][level - 1];
        const swordAmount = [5, 7, 9][level - 1];
        const damage = this.swordDamage * [1.15, 1.48, 1.82][level - 1];
        this.formationCooldown = [12, 10, 8][level - 1];
        this.formationActionTimer = 0.58;
        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.16);
        this.createSwordFormationEffect(this.player.position, radius, swordAmount);
        for (const enemy of this.enemies) {
            if (!enemy.node.isValid || enemy.dead) continue;
            if (Vec3.distance(enemy.node.position, this.player.position) <= radius + enemy.radius) {
                this.dealSkillDamage(enemy, damage, new Color('#67E8F9'), enemy.elite ? 48 : 34);
            }
        }
        this.cameraShakeTimer = 0.18;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 6 + level);
    }

    private startTribulationHold(): void {
        const level = this.upgradeLevels.tribulation ?? 0;
        if (this.phase !== 'playing') return;
        if (level <= 0) {
            this.createAbilityHint('天劫尚未参悟', new Color('#A8C9BE'));
            return;
        }
        if (this.tribulationCharge < 1 || this.tribulationHolding) return;
        this.tribulationHolding = true;
        this.tribulationHold = 0;
        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.12);
    }

    private releaseTribulationHold(): void {
        this.tribulationHolding = false;
        this.tribulationHold = 0;
    }

    private castTribulation(): void {
        const level = this.upgradeLevels.tribulation ?? 0;
        if (level <= 0 || this.tribulationCharge < 1) return;
        const alive = this.enemies
            .filter((enemy) => enemy.node.isValid && !enemy.dead)
            .sort((a, b) => Vec3.distance(a.node.position, this.player.position) - Vec3.distance(b.node.position, this.player.position));
        const fallback = this.constrainToRoad(
            new Vec3(this.player.position.x, this.player.position.y + 170),
            20,
        );
        const strikeRadius = 72 + level * 12;
        const damage = this.swordDamage * (1.75 + level * 0.55);

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
                    this.dealSkillDamage(enemy, damage, new Color('#E0F2FE'), enemy.elite ? 58 : 42);
                }
            }
        }
        this.tribulationCharge = 0;
        this.tribulationHolding = false;
        this.tribulationHold = 0;
        this.tribulationActionTimer = 0.8;
        this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 0.45);
        this.createScreenFlash(new Color(154, 230, 255, 46), 0.28);
        this.cameraShakeTimer = 0.34;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 10 + level * 2);
    }

    private dealSkillDamage(enemy: EnemyState, damage: number, color: Color, burstRadius: number): void {
        if (!enemy.node.isValid || enemy.dead) return;
        enemy.hp -= damage;
        enemy.hitTimer = 0.18;
        this.createHitBurst(enemy.node.position, color, burstRadius, true);
        this.createDamageNumber(enemy.node.position, Math.round(damage), enemy.elite);
        if ((this.upgradeLevels.tribulation ?? 0) > 0) {
            this.tribulationCharge = Math.min(1, this.tribulationCharge + (enemy.elite ? 0.07 : 0.035));
        }
        if (enemy.hp <= 0) this.killEnemy(enemy);
        else this.drawEnemyHp(enemy);
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

        const afterimage = this.createResourceSprite(PLAYER_ASSET.resourcePath, PLAYER_ASSET.displayHeight);
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
        const wave = STAGES[0].waves[this.waveIndex];
        if (!wave || this.waveFinished || this.spawned >= wave.count) return;
        this.spawnTimer -= dt;
        if (this.spawnTimer > 0) return;
        this.spawnEnemy(wave);
        this.spawned += 1;
        this.spawnTimer = wave.spawnInterval;
    }

    private spawnEnemy(wave: WaveConfig): void {
        const node = new Node(wave.elite ? `Boss-${wave.enemyKind}` : `Enemy-${wave.enemyKind}`);
        node.layer = Layers.Enum.UI_2D;
        const radius = wave.radius;
        const unit = this.attachUnitVisual(node, ENEMY_ASSETS[wave.enemyKind], radius);
        const hpBar = this.createEnemyHpBar(node, radius + (wave.elite ? 32 : 20));
        const edge = Math.floor(Math.random() * 3);
        const y = edge < 2 ? this.random(-80, this.arena.top - 70) : this.arena.top - radius;
        const road = this.getRoadBounds(y, radius + 4);
        const x = edge === 0 ? road.minX : edge === 1 ? road.maxX : this.random(road.minX, road.maxX);
        node.setPosition(x, y);
        this.battleLayer.addChild(node);
        const enemy: EnemyState = {
            node,
            visual: unit.visual,
            opacity: unit.opacity,
            kind: wave.enemyKind,
            behavior: wave.behavior,
            hp: wave.hp,
            maxHp: wave.hp,
            speed: wave.speed,
            damage: wave.damage,
            radius,
            xp: wave.xp,
            elite: Boolean(wave.elite),
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
            dead: false,
        };
        this.enemies.push(enemy);
        this.drawEnemyHp(enemy);
        if (enemy.elite) this.createBossAura(enemy);
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
        const width = enemy.elite ? 112 : 58;
        const ratio = Math.max(0, enemy.hp / enemy.maxHp);
        enemy.hpBar.clear();
        enemy.hpBar.fillColor = new Color(8, 15, 20, 210);
        enemy.hpBar.roundRect(-width / 2, -4, width, 8, 4);
        enemy.hpBar.fill();
        enemy.hpBar.fillColor = new Color(enemy.elite ? '#E6A244' : '#C65855');
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
            }
            enemy.node.setPosition(this.constrainToRoad(
                enemy.node.position.clone().add(delta.clone().multiplyScalar(enemy.speed * speedMultiplier * dt)),
                enemy.radius,
            ));

            if (enemy.behavior === 'boss') {
                enemy.abilityTimer -= dt;
                if (enemy.abilityTimer <= 0) {
                    this.createBossPulse(enemy);
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

        if (enemy.kind === 'mountainSpirit') {
            bob = Math.abs(Math.sin(phase)) * 4;
            lean += Math.sin(phase * 0.5) * 2.5;
            scaleX += Math.sin(phase) * 0.035;
            scaleY -= Math.sin(phase) * 0.025;
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
            enemy.node.getChildByName('BossAura')?.setRotationFromEuler(0, 0, -this.elapsed * 15);
        }

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
        if (sprite) sprite.color = enemy.hitTimer > 0 ? new Color(255, 128, 112, 255) : Color.WHITE;
    }

    private updateEnemyDeath(enemy: EnemyState, dt: number): void {
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
        this.hp = Math.max(0, this.hp - amount);
        this.playerInvulnerableTimer = 0.42;
        this.playerHitTimer = 0.24;
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

    private createBossPulse(enemy: EnemyState): void {
        if (!enemy.node.isValid) return;
        const node = new Node('BossPulse');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(enemy.node.position);
        const graphics = node.addComponent(Graphics);
        this.battleLayer.addChild(node);
        this.bossPulses.push({
            node,
            graphics,
            elapsed: 0,
            triggerAt: 0.85,
            life: 1.18,
            radius: 170,
            damage: enemy.abilityDamage,
            applied: false,
        });
    }

    private updateBossPulses(dt: number): void {
        for (const pulse of this.bossPulses) {
            pulse.elapsed += dt;
            const progress = Math.min(pulse.elapsed / pulse.triggerAt, 1);
            pulse.graphics.clear();
            pulse.graphics.fillColor = new Color(195, 57, 45, Math.round((pulse.applied ? 32 : 12) + progress * 28));
            pulse.graphics.circle(0, 0, Math.max(8, pulse.radius * progress));
            pulse.graphics.fill();
            pulse.graphics.strokeColor = new Color(224, 87, 64, pulse.applied ? 90 : 210);
            pulse.graphics.lineWidth = pulse.applied ? 7 : 4;
            pulse.graphics.circle(0, 0, Math.max(8, pulse.radius * progress));
            pulse.graphics.stroke();
            if (!pulse.applied) {
                pulse.graphics.strokeColor = new Color(255, 210, 138, 150);
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
                    this.playerInvulnerableTimer = 0;
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
            damage: this.swordDamage,
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
            for (const enemy of this.enemies) {
                // 同帧可能有多把飞剑命中；前一把已销毁敌人时，后续飞剑必须跳过失效节点。
                if (!enemy.node.isValid || enemy.dead) continue;
                if (projectile.hit.has(enemy.node)) continue;
                if (Vec3.distance(projectile.node.position, enemy.node.position) > projectile.radius + enemy.radius) continue;
                projectile.hit.add(enemy.node);
                this.dealSkillDamage(enemy, projectile.damage, new Color('#BAE6FD'), enemy.elite ? 42 : 28);
                this.cameraShakeTimer = Math.max(this.cameraShakeTimer, enemy.elite ? 0.12 : 0.07);
                this.cameraShakeStrength = Math.max(this.cameraShakeStrength, enemy.elite ? 5 : 2.5);
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
        enemy.dead = true;
        enemy.hp = 0;
        enemy.hpBar.node.active = false;
        this.gainXp(enemy.xp);
        this.createDeathBurst(enemy.node.position, enemy.elite ? 74 : 42);
        this.createXpWisp(enemy.node.position);
        if ((this.upgradeLevels.tribulation ?? 0) > 0) {
            this.tribulationCharge = Math.min(1, this.tribulationCharge + (enemy.elite ? 0.22 : 0.08));
        }
        this.cameraShakeTimer = enemy.elite ? 0.42 : 0.1;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, enemy.elite ? 14 : 4);
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
        const subtitle = this.makeLabel(`境界提升至 ${this.level} 重  ·  选择一项天命`, 23, new Color('#BFE0D4'));
        subtitle.node.setPosition(0, 337);
        this.overlay.addChild(subtitle.node);
        const choices = this.pickUpgrades(3);
        choices.forEach((choice, index) => {
            const button = this.makeUpgradeButton(choice, () => {
                this.applyUpgrade(choice.id);
                this.clearOverlay();
                this.phase = 'playing';
            });
            button.setPosition(0, 172 - index * 170);
            this.overlay.addChild(button);
        });
        const currentBuild = this.makeLabel(
            `御剑 ${this.upgradeLevels.sword ?? 1}阶  ·  踏云 ${this.upgradeLevels.dash ?? 0}阶  ·  剑阵 ${this.upgradeLevels.formation ?? 0}阶  ·  天劫 ${this.upgradeLevels.tribulation ?? 0}阶`,
            19,
            new Color(144, 180, 170, 230),
        );
        currentBuild.node.setPosition(0, -388);
        this.overlay.addChild(currentBuild.node);
    }

    private applyUpgrade(id: UpgradeId): void {
        const nextLevel = Math.min(3, (this.upgradeLevels[id] ?? 0) + 1);
        this.upgradeLevels[id] = nextLevel;
        if (id === 'sword') this.swordCount = nextLevel;
        if (id === 'dash') {
            this.dashCooldown = 0;
            this.moveSpeed *= 1.04;
        }
        if (id === 'formation') this.formationCooldown = 0;
        if (id === 'tribulation') this.tribulationCharge = 1;
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
        const wave = STAGES[0].waves[this.waveIndex];
        if (!wave || this.spawned < wave.count || this.enemies.length > 0) return;
        if (!this.waveFinished) {
            this.waveFinished = true;
            this.waveRestTimer = 1.5;
        }
        this.waveRestTimer -= dt;
        if (this.waveRestTimer > 0) return;
        if (this.waveIndex >= STAGES[0].waves.length - 1) {
            this.finish(true);
            return;
        }
        this.waveIndex += 1;
        this.spawned = 0;
        this.spawnTimer = 0.3;
        this.waveFinished = false;
        this.showWaveAnnouncement();
    }

    private finish(victory: boolean): void {
        this.phase = victory ? 'victory' : 'defeat';
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
        this.clearOverlay();
        this.bringOverlayToFront();
        const shade = this.makeRect(750, 1334, new Color(2, 10, 14, 205), undefined, 0);
        this.overlay.addChild(shade);
        const panel = this.makePanel(
            victory ? '渡 劫 成 功' : '道 途 未 竟',
            victory
                ? `青石山道已肃清\n御剑 ${this.upgradeLevels.sword ?? 1}阶  ·  踏云 ${this.upgradeLevels.dash ?? 0}阶\n剑阵 ${this.upgradeLevels.formation ?? 0}阶  ·  天劫 ${this.upgradeLevels.tribulation ?? 0}阶`
                : `本次修至 ${this.level} 重\n重新组合功法，再战山门`,
            560,
            420,
        );
        panel.setPosition(0, 25);
        this.overlay.addChild(panel);
        const button = this.makeButton(
            victory ? '再 入 山 门' : '重 整 道 心',
            new Color(victory ? '#E3C06F' : '#E29A7F'),
            () => this.startStage(),
            390,
            92,
            new Color(victory ? '#1C6758' : '#713A39'),
        );
        button.setPosition(0, -135);
        panel.addChild(button);
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
        this.hpLabel.string = `气血  ${Math.ceil(this.hp)} / ${this.maxHp}`;
        this.xpLabel.string = `境界 ${this.level} 重    修为 ${this.xp} / ${this.xpNeed}`;
        this.waveLabel.string = `青石山道\n第 ${this.waveIndex + 1} / ${STAGES[0].waves.length} 波`;
        this.buildLabel.string = `飞剑 ${this.swordCount}柄  ·  剑伤 ${Math.round(this.swordDamage)}  ·  间隔 ${this.attackInterval.toFixed(2)}秒`;
        const cooldownRatio = this.enemies.length === 0
            ? 1
            : 1 - Math.max(0, Math.min(1, this.attackTimer / this.attackInterval));
        const swordLevel = this.upgradeLevels.sword ?? 1;
        this.attackHudLabel.string = cooldownRatio >= 0.99 ? '御剑' : `${Math.max(0, this.attackTimer).toFixed(1)}`;
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
        for (let index = 0; index < 3; index += 1) {
            this.attackHud.fillColor = index < swordLevel
                ? new Color(135, 238, 215, 235)
                : new Color(45, 76, 74, 190);
            this.attackHud.circle(-18 + index * 18, 68, 5.5);
            this.attackHud.fill();
        }

        const dashLevel = this.upgradeLevels.dash ?? 0;
        const formationLevel = this.upgradeLevels.formation ?? 0;
        this.drawSkillHud(
            this.dashHud,
            '踏云',
            dashLevel,
            this.dashCooldown,
            dashLevel > 0 ? [5.2, 4.4, 3.5][dashLevel - 1] : 1,
        );
        this.drawSkillHud(
            this.formationHud,
            '剑阵',
            formationLevel,
            this.formationCooldown,
            formationLevel > 0 ? [12, 10, 8][formationLevel - 1] : 1,
        );
        this.drawTribulationHud();

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
        if (boss) {
            const ratio = Math.max(0, boss.hp / boss.maxHp);
            this.bossHpLabel.string = `镇关山魈  ${Math.ceil(boss.hp)}/${boss.maxHp}`;
            this.bossHpBar.clear();
            this.bossHpBar.fillColor = new Color(5, 4, 6, 230);
            this.bossHpBar.roundRect(-218, -6, 436, 12, 6);
            this.bossHpBar.fill();
            this.bossHpBar.fillColor = new Color(ratio < 0.3 ? '#D45745' : '#B97738');
            this.bossHpBar.roundRect(-216, -4, 432 * ratio, 8, 4);
            this.bossHpBar.fill();
        }
    }

    private drawSkillHud(hud: SkillHud, title: string, level: number, cooldown: number, maxCooldown: number): void {
        const readyRatio = level <= 0 ? 0 : 1 - Math.max(0, Math.min(1, cooldown / Math.max(maxCooldown, 0.01)));
        hud.graphics.clear();
        hud.graphics.fillColor = new Color(level > 0 ? 5 : 9, level > 0 ? 27 : 18, level > 0 ? 31 : 23, 220);
        hud.graphics.circle(0, 0, hud.radius);
        hud.graphics.fill();
        hud.graphics.strokeColor = new Color(level > 0 ? 220 : 94, level > 0 ? 195 : 111, level > 0 ? 117 : 108, level > 0 ? 205 : 100);
        hud.graphics.lineWidth = 4;
        hud.graphics.circle(0, 0, hud.radius);
        hud.graphics.stroke();
        if (level > 0) {
            hud.graphics.strokeColor = new Color(112, 231, 211, 220);
            hud.graphics.lineWidth = 5;
            hud.graphics.arc(
                0,
                0,
                hud.radius - 5,
                -Math.PI / 2,
                -Math.PI / 2 + Math.PI * 2 * readyRatio,
                false,
            );
            hud.graphics.stroke();
        }
        for (let index = 0; index < 3; index += 1) {
            hud.graphics.fillColor = index < level
                ? new Color(135, 238, 215, 235)
                : new Color(45, 76, 74, 190);
            hud.graphics.circle(-14 + index * 14, hud.radius + 5, 4.5);
            hud.graphics.fill();
        }
        hud.iconOpacity.opacity = level > 0 ? 235 : 58;
        hud.label.color = new Color(level > 0 ? '#FFF0BE' : '#79958E');
        hud.label.string = level <= 0 ? `${title}·未悟` : cooldown > 0 ? cooldown.toFixed(1) : title;
    }

    private drawTribulationHud(): void {
        const level = this.upgradeLevels.tribulation ?? 0;
        const charge = level > 0 ? this.tribulationCharge : 0;
        const requiredHold = level > 0 ? 0.72 - (level - 1) * 0.12 : 1;
        const holdRatio = this.tribulationHolding ? Math.min(1, this.tribulationHold / requiredHold) : 0;
        this.tribulationHud.clear();
        this.tribulationHud.fillColor = new Color(level > 0 ? 4 : 8, level > 0 ? 24 : 17, level > 0 ? 29 : 21, 232);
        this.tribulationHud.roundRect(-175, -25, 350, 50, 25);
        this.tribulationHud.fill();
        if (charge > 0) {
            this.tribulationHud.fillColor = new Color(77, 204, 190, 105 + Math.round(charge * 65));
            this.tribulationHud.roundRect(-169, -19, 338 * charge, 38, 19);
            this.tribulationHud.fill();
        }
        if (holdRatio > 0) {
            this.tribulationHud.fillColor = new Color(221, 248, 255, 135);
            this.tribulationHud.roundRect(-169, -19, 338 * holdRatio, 38, 19);
            this.tribulationHud.fill();
        }
        this.tribulationHud.strokeColor = new Color(level > 0 ? 232 : 87, level > 0 ? 207 : 109, level > 0 ? 132 : 105, level > 0 ? 220 : 100);
        this.tribulationHud.lineWidth = level > 0 ? 3 : 2;
        this.tribulationHud.roundRect(-175, -25, 350, 50, 25);
        this.tribulationHud.stroke();
        for (let index = 0; index < 3; index += 1) {
            this.tribulationHud.fillColor = index < level
                ? new Color(155, 242, 226, 240)
                : new Color(42, 72, 70, 210);
            this.tribulationHud.circle(-24 + index * 24, 31, 5);
            this.tribulationHud.fill();
        }
        const realm = level >= 3 ? '三重' : level === 2 ? '二重' : level === 1 ? '初劫' : '未悟';
        this.tribulationHudLabel.color = new Color(level > 0 ? '#E9FFF8' : '#738B85');
        this.tribulationHudLabel.string = level <= 0
            ? '天劫 · 未悟'
            : this.tribulationHolding
                ? `引劫 ${(holdRatio * 100).toFixed(0)}%`
                : charge >= 1
                    ? `天劫 · ${realm}  长按释放`
                    : `天劫 · ${realm}  劫力 ${(charge * 100).toFixed(0)}%`;
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
        g.strokeColor = new Color(238, 174, 76, 125);
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
        } else if (this.world.position.lengthSqr() > 0.01) {
            this.world.setPosition(0, 0);
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

    private showWaveAnnouncement(): void {
        const wave = STAGES[0].waves[this.waveIndex];
        if (!wave) return;
        const enemyName: Record<EnemyKind, string> = {
            mountainSpirit: '山精来袭',
            foxSpirit: '狐影迷踪',
            jiangshi: '尸潮压境',
            shanxiao: '山魈镇关',
        };
        const banner = this.makeRect(
            wave.elite ? 520 : 470,
            wave.elite ? 76 : 66,
            new Color(3, 18, 22, wave.elite ? 220 : 185),
            new Color(wave.elite ? '#E9B55E' : '#7DD4B6'),
            16,
            wave.elite ? 3 : 2,
        );
        const label = this.makeLabel(
            `第 ${this.waveIndex + 1} 波  ·  ${enemyName[wave.enemyKind]}`,
            wave.elite ? 35 : 30,
            new Color(wave.elite ? '#FDE68A' : '#D1FAE5'),
        );
        banner.addChild(label.node);
        const node = banner;
        node.name = 'WaveAnnouncement';
        node.setPosition(0, 430);
        const opacity = node.addComponent(UIOpacity);
        this.screenFxLayer.addChild(node);
        this.effects.push({
            node,
            elapsed: 0,
            life: 1.75,
            update: (progress) => {
                const fade = progress < 0.16 ? progress / 0.16 : progress > 0.68 ? (1 - progress) / 0.32 : 1;
                opacity.opacity = Math.round(255 * Math.max(0, fade));
                node.setPosition(0, 415 + Math.min(progress / 0.2, 1) * 15);
                const scale = 0.92 + Math.min(progress / 0.18, 1) * 0.08;
                node.setScale(scale, scale);
            },
        });
    }

    private clearBattle(): void {
        this.enemies = [];
        this.projectiles = [];
        this.bossPulses = [];
        this.effects = [];
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
        const node = this.makeRect(580, 142, new Color(8, 34, 38, 245), new Color(choice.accent), 22, 3);
        const iconBacking = this.makeRect(104, 104, new Color(3, 17, 22, 230), new Color(choice.accent), 22, 2);
        iconBacking.setPosition(-220, 0);
        node.addChild(iconBacking);

        const icon = new Node(`UpgradeIcon-${choice.id}`);
        icon.layer = Layers.Enum.UI_2D;
        icon.addComponent(UITransform).setContentSize(86, 86);
        const sprite = icon.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        iconBacking.addChild(icon);
        // 图标是可选表现层；资源导入失败时保留带色边框，升级逻辑仍可继续。
        resources.load(choice.iconResourcePath, SpriteFrame, (error, frame) => {
            if (!error && icon.isValid) sprite.spriteFrame = frame;
        });

        const level = Math.min(choice.maxLevel, (this.upgradeLevels[choice.id] ?? 0) + 1);
        const realm = level === 1 ? '初悟' : level === 2 ? '进阶' : '圆满';
        const label = this.makeLabel(
            `${choice.title}   ·   ${realm}\n${choice.descriptions[level - 1]}`,
            27,
            new Color('#FFF5DC'),
        );
        label.node.setPosition(52, 0);
        label.node.getComponent(UITransform)?.setContentSize(400, 112);
        node.addChild(label.node);
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
        const pool = UPGRADES.filter((choice) => (this.upgradeLevels[choice.id] ?? 0) < choice.maxLevel);
        const result: UpgradeConfig[] = [];
        const activeIds: UpgradeId[] = ['dash', 'formation', 'tribulation', 'sword'];
        const activePool = pool.filter((choice) => activeIds.includes(choice.id));
        const lockedActivePool = activePool.filter((choice) => (this.upgradeLevels[choice.id] ?? 0) === 0);
        // 未参悟的主动功法优先出现，保证一局前几次破境就能体验完整动作组合。
        while (result.length < Math.min(2, count) && lockedActivePool.length > 0) {
            const choice = lockedActivePool.splice(Math.floor(Math.random() * lockedActivePool.length), 1)[0];
            result.push(choice);
            activePool.splice(activePool.indexOf(choice), 1);
            pool.splice(pool.indexOf(choice), 1);
        }
        // 解锁齐全后仍至少提供两个功法成长方向，避免纯数值强化把动作升级挤出选项。
        while (result.length < Math.min(2, count) && activePool.length > 0) {
            const choice = activePool.splice(Math.floor(Math.random() * activePool.length), 1)[0];
            result.push(choice);
            pool.splice(pool.indexOf(choice), 1);
        }
        while (result.length < count && pool.length > 0) {
            result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        return result;
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
        const y = Math.max(this.arena.bottom + padding, Math.min(this.arena.top - padding, position.y));
        const bounds = this.getRoadBounds(y, padding);
        return new Vec3(Math.max(bounds.minX, Math.min(bounds.maxX, position.x)), y, position.z);
    }

    private random(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}

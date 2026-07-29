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

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    private readonly designWidth = 750;
    private readonly designHeight = 1334;
    private readonly arena = { left: -350, right: 350, bottom: -520, top: 430 };

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
        graphics.fillColor = new Color('#102A2A');
        graphics.roundRect(-375, -667, 750, 1334, 0);
        graphics.fill();
        graphics.fillColor = new Color('#163838');
        graphics.roundRect(this.arena.left, this.arena.bottom, 700, 950, 24);
        graphics.fill();
        this.world.addChild(backdrop);

        const art = new Node('ArenaArt');
        art.layer = Layers.Enum.UI_2D;
        art.setPosition(0, (this.arena.bottom + this.arena.top) / 2);
        art.addComponent(UITransform).setContentSize(BACKGROUND_ASSET.displayWidth, BACKGROUND_ASSET.displayHeight);
        this.backgroundSprite = art.addComponent(Sprite);
        this.backgroundSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.world.addChild(art);

        const border = new Node('ArenaBorder');
        border.layer = Layers.Enum.UI_2D;
        const borderGraphics = border.addComponent(Graphics);
        borderGraphics.strokeColor = new Color('#6B8F83');
        borderGraphics.lineWidth = 4;
        borderGraphics.roundRect(this.arena.left, this.arena.bottom, 700, 950, 24);
        borderGraphics.stroke();
        this.world.addChild(border);

        this.createArenaAmbience();
    }

    private createArenaAmbience(): void {
        const vignette = new Node('ArenaVignette');
        vignette.layer = Layers.Enum.UI_2D;
        const g = vignette.addComponent(Graphics);
        g.strokeColor = new Color(3, 12, 16, 150);
        g.lineWidth = 26;
        g.roundRect(this.arena.left + 8, this.arena.bottom + 8, 684, 934, 18);
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
        this.pressed.add(event.keyCode);
    }

    private onKeyUp(event: EventKeyboard): void {
        this.pressed.delete(event.keyCode);
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
        const panel = this.makePanel('仙途劫', '第一章 · 青石山道\n御剑杀敌，破境渡劫', 430, 370);
        this.overlay.addChild(panel);
        const button = this.makeButton('开始闯关', new Color('#2F7D68'), () => this.startStage());
        button.setPosition(0, -105);
        panel.addChild(button);
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
        this.cameraShakeTimer = 0;
        this.upgradeLevels = {};
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

        const backing = this.makeRect(710, 104, new Color(5, 18, 23, 205), new Color(72, 118, 108, 170));
        backing.name = 'HudBacking';
        backing.setPosition(0, 590);
        hud.addChild(backing);

        const hpBarNode = new Node('HpBar');
        hpBarNode.layer = Layers.Enum.UI_2D;
        hpBarNode.setPosition(-235, 561);
        this.hpBar = hpBarNode.addComponent(Graphics);
        hud.addChild(hpBarNode);

        const xpBarNode = new Node('XpBar');
        xpBarNode.layer = Layers.Enum.UI_2D;
        xpBarNode.setPosition(0, 551);
        this.xpBar = xpBarNode.addComponent(Graphics);
        hud.addChild(xpBarNode);

        this.hpLabel = this.makeLabel('', 24, new Color('#FCA5A5'));
        this.hpLabel.node.setPosition(-235, 603);
        hud.addChild(this.hpLabel.node);
        this.xpLabel = this.makeLabel('', 22, new Color('#A7F3D0'));
        this.xpLabel.node.setPosition(0, 603);
        hud.addChild(this.xpLabel.node);
        this.waveLabel = this.makeLabel('', 23, new Color('#FDE68A'));
        this.waveLabel.node.setPosition(245, 603);
        hud.addChild(this.waveLabel.node);
        this.buildLabel = this.makeLabel('', 20, new Color('#C7DAD2'));
        this.buildLabel.node.setPosition(180, -485);
        this.buildLabel.node.getComponent(UITransform)?.setContentSize(330, 56);
        hud.addChild(this.buildLabel.node);
        this.createBossHud(hud);
        this.createJoystick(hud);
        this.updateHud();
    }

    private createBossHud(hud: Node): void {
        this.bossHud = new Node('BossHud');
        this.bossHud.layer = Layers.Enum.UI_2D;
        this.bossHud.setPosition(0, 486);
        const backing = this.makeRect(500, 66, new Color(18, 10, 13, 225), new Color(178, 112, 61, 210));
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
        this.joystick.setPosition(-265, -462);
        this.joystickOpacity = this.joystick.addComponent(UIOpacity);
        this.joystickOpacity.opacity = 125;
        const ring = this.joystick.addComponent(Graphics);
        ring.fillColor = new Color(6, 21, 27, 105);
        ring.circle(0, 0, 66);
        ring.fill();
        ring.strokeColor = new Color(139, 201, 183, 150);
        ring.lineWidth = 3;
        ring.circle(0, 0, 66);
        ring.stroke();
        ring.strokeColor = new Color(139, 201, 183, 90);
        ring.lineWidth = 2;
        for (let index = 0; index < 4; index += 1) {
            const angle = index * Math.PI / 2;
            ring.moveTo(Math.cos(angle) * 49, Math.sin(angle) * 49);
            ring.lineTo(Math.cos(angle) * 59, Math.sin(angle) * 59);
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
        this.playerMoveAmount += (Math.min(direction.length(), 1) - this.playerMoveAmount) * Math.min(1, dt * 12);
        if (Math.abs(direction.x) > 0.08) this.playerFacing = direction.x >= 0 ? 1 : -1;
        const p = this.player.position;
        this.player.setPosition(
            Math.max(this.arena.left + 28, Math.min(this.arena.right - 28, p.x + direction.x * this.moveSpeed * dt)),
            Math.max(this.arena.bottom + 28, Math.min(this.arena.top - 28, p.y + direction.y * this.moveSpeed * dt)),
        );

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
        const x = edge === 0 ? this.arena.left + radius : edge === 1 ? this.arena.right - radius : this.random(this.arena.left + 50, this.arena.right - 50);
        const y = edge < 2 ? this.random(-100, this.arena.top - 40) : this.arena.top - radius;
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
            enemy.node.setPosition(enemy.node.position.clone().add(delta.clone().multiplyScalar(enemy.speed * speedMultiplier * dt)));

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
                this.player.setPosition(
                    Math.max(this.arena.left + 28, Math.min(this.arena.right - 28, this.player.position.x + knockback.x)),
                    Math.max(this.arena.bottom + 28, Math.min(this.arena.top - 28, this.player.position.y + knockback.y)),
                );
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
                enemy.hp -= projectile.damage;
                enemy.hitTimer = 0.14;
                this.createHitBurst(projectile.node.position, new Color('#BAE6FD'), enemy.elite ? 42 : 28, true);
                this.createDamageNumber(enemy.node.position, Math.round(projectile.damage), enemy.elite);
                this.cameraShakeTimer = Math.max(this.cameraShakeTimer, enemy.elite ? 0.12 : 0.07);
                this.cameraShakeStrength = Math.max(this.cameraShakeStrength, enemy.elite ? 5 : 2.5);
                if (enemy.hp <= 0) {
                    this.killEnemy(enemy);
                } else {
                    this.drawEnemyHp(enemy);
                }
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
        this.createScreenFlash(new Color(79, 209, 166, 58), 0.38);
        this.createDeathBurst(this.player.position, 58);
        this.clearOverlay();
        const shade = this.makeRect(750, 1334, new Color(4, 12, 18, 220));
        this.overlay.addChild(shade);
        const title = this.makeLabel(`破境 · ${this.level} 重`, 40, new Color('#FDE68A'));
        title.node.setPosition(0, 300);
        this.overlay.addChild(title.node);
        const choices = this.pickUpgrades(3);
        choices.forEach((choice, index) => {
            const button = this.makeUpgradeButton(choice, () => {
                this.applyUpgrade(choice.id);
                this.clearOverlay();
                this.phase = 'playing';
            });
            button.setPosition(0, 140 - index * 155);
            this.overlay.addChild(button);
        });
    }

    private applyUpgrade(id: UpgradeId): void {
        this.upgradeLevels[id] = (this.upgradeLevels[id] ?? 0) + 1;
        if (id === 'sword') this.swordCount += 1;
        if (id === 'damage') this.swordDamage *= 1.35;
        if (id === 'haste') this.attackInterval = Math.max(0.2, this.attackInterval * 0.82);
        if (id === 'speed') this.moveSpeed *= 1.15;
        if (id === 'guard') {
            this.maxHp += 30;
            this.hp = Math.min(this.maxHp, this.hp + 45);
        }
        if (id === 'heal') this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.35);
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
        const panel = this.makePanel(victory ? '渡劫成功' : '道途未竟', victory ? `青石山道已肃清\n境界：${this.level} 重` : `本次修至 ${this.level} 重\n调整构筑，再战一次`, 470, 390);
        this.overlay.addChild(panel);
        const button = this.makeButton(victory ? '再次闯关' : '重新挑战', new Color(victory ? '#2F7D68' : '#8B4545'), () => this.startStage());
        button.setPosition(0, -115);
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
        this.hpLabel.string = `气血 ${Math.ceil(this.hp)}/${this.maxHp}`;
        this.xpLabel.string = `境界 ${this.level} 重  ·  修为 ${this.xp}/${this.xpNeed}`;
        this.waveLabel.string = `第 ${this.waveIndex + 1}/${STAGES[0].waves.length} 波`;
        this.buildLabel.string = `飞剑 ${this.swordCount}  ·  伤害 ${Math.round(this.swordDamage)}  ·  剑诀 ${this.attackInterval.toFixed(2)}秒`;

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        this.hpBar.clear();
        this.hpBar.fillColor = new Color(2, 9, 12, 210);
        this.hpBar.roundRect(-100, -6, 200, 12, 6);
        this.hpBar.fill();
        this.hpBar.fillColor = new Color(hpRatio < 0.3 ? '#DC5A55' : '#D98272');
        this.hpBar.roundRect(-98, -4, 196 * hpRatio, 8, 4);
        this.hpBar.fill();

        const xpRatio = Math.max(0, Math.min(1, this.xp / this.xpNeed));
        this.xpBar.clear();
        this.xpBar.fillColor = new Color(2, 9, 12, 220);
        this.xpBar.roundRect(-205, -4, 410, 8, 4);
        this.xpBar.fill();
        this.xpBar.fillColor = new Color('#55BFA1');
        this.xpBar.roundRect(-203, -2, 406 * xpRatio, 4, 2);
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
        const label = this.makeLabel(
            `第 ${this.waveIndex + 1} 波  ·  ${enemyName[wave.enemyKind]}`,
            wave.elite ? 35 : 30,
            new Color(wave.elite ? '#FDE68A' : '#D1FAE5'),
        );
        const node = label.node;
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

    private makePanel(titleText: string, bodyText: string, width: number, height: number): Node {
        const panel = this.makeRect(width, height, new Color('#173A38'), new Color('#8DB7A8'));
        const title = this.makeLabel(titleText, 50, new Color('#F8E7B0'));
        title.node.setPosition(0, 105);
        panel.addChild(title.node);
        const body = this.makeLabel(bodyText, 27, new Color('#D2E6DE'));
        body.node.setPosition(0, 20);
        panel.addChild(body.node);
        return panel;
    }

    private makeButton(text: string, border: Color, onClick: () => void, width = 300, height = 82, fill = new Color('#214F48')): Node {
        const node = this.makeRect(width, height, fill, border);
        const label = this.makeLabel(text, 28, new Color('#F5F3E8'));
        node.addChild(label.node);
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            onClick();
        });
        return node;
    }

    private makeUpgradeButton(choice: UpgradeConfig, onClick: () => void): Node {
        const node = this.makeRect(520, 125, new Color('#102A2A'), new Color(choice.accent));
        const iconBacking = this.makeRect(88, 88, new Color(5, 18, 23, 210), new Color(choice.accent));
        iconBacking.setPosition(-195, 0);
        node.addChild(iconBacking);

        const icon = new Node(`UpgradeIcon-${choice.id}`);
        icon.layer = Layers.Enum.UI_2D;
        icon.addComponent(UITransform).setContentSize(74, 74);
        const sprite = icon.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        iconBacking.addChild(icon);
        // 图标是可选表现层；资源导入失败时保留带色边框，升级逻辑仍可继续。
        resources.load(choice.iconResourcePath, SpriteFrame, (error, frame) => {
            if (!error && icon.isValid) sprite.spriteFrame = frame;
        });

        const label = this.makeLabel(`${choice.title}\n${choice.description}`, 28, new Color('#F5F3E8'));
        label.node.setPosition(50, 0);
        label.node.getComponent(UITransform)?.setContentSize(380, 102);
        node.addChild(label.node);
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            onClick();
        });
        return node;
    }

    private makeRect(width: number, height: number, fill: Color, stroke?: Color): Node {
        const node = new Node('Panel');
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform).setContentSize(width, height);
        const g = node.addComponent(Graphics);
        g.fillColor = fill;
        g.roundRect(-width / 2, -height / 2, width, height, 20);
        g.fill();
        if (stroke) {
            g.strokeColor = stroke;
            g.lineWidth = 4;
            g.roundRect(-width / 2, -height / 2, width, height, 20);
            g.stroke();
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
        const pool = [...UPGRADES];
        const result: UpgradeConfig[] = [];
        while (result.length < count && pool.length > 0) {
            result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        return result;
    }

    private random(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}

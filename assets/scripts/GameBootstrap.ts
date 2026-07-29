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
}

interface ProjectileState {
    node: Node;
    velocity: Vec3;
    damage: number;
    radius: number;
    life: number;
    hit: Set<Node>;
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

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    private readonly designWidth = 750;
    private readonly designHeight = 1334;
    private readonly arena = { left: -350, right: 350, bottom: -520, top: 430 };

    private phase: Phase = 'menu';
    private canvas!: Node;
    private world!: Node;
    private battleLayer!: Node;
    private overlay!: Node;
    private player!: Node;
    private backgroundSprite!: Sprite;
    private hpLabel!: Label;
    private xpLabel!: Label;
    private waveLabel!: Label;
    private enemies: EnemyState[] = [];
    private projectiles: ProjectileState[] = [];
    private bossPulses: BossPulseState[] = [];
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
    private xpNeed = 32;
    private waveIndex = 0;
    private spawned = 0;
    private spawnTimer = 0;
    private waveRestTimer = 0;
    private waveFinished = false;

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
    }

    private onTouchMove(event: EventTouch): void {
        if (!this.touchOrigin || this.phase !== 'playing') return;
        const p = event.getUILocation();
        this.touchDirection.set(p.x - this.touchOrigin.x, p.y - this.touchOrigin.y);
        if (this.touchDirection.length() > 1) this.touchDirection.normalize();
    }

    private onTouchEnd(): void {
        this.touchOrigin = undefined;
        this.touchDirection.set(0, 0);
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
        this.xpNeed = 32;
        this.waveIndex = 0;
        this.spawned = 0;
        this.spawnTimer = 0.3;
        this.waveRestTimer = 0;
        this.waveFinished = false;
        this.createPlayer();
        this.createHud();
    }

    private createPlayer(): void {
        this.player = new Node('QingLan');
        this.player.layer = Layers.Enum.UI_2D;
        this.attachUnitVisual(this.player, PLAYER_ASSET, 27);
        this.player.setPosition(0, -260);
        this.battleLayer.addChild(this.player);
    }

    private createHud(): void {
        const hud = new Node('HUD');
        hud.layer = Layers.Enum.UI_2D;
        this.canvas.addChild(hud);
        this.hpLabel = this.makeLabel('', 26, new Color('#FCA5A5'));
        this.hpLabel.node.setPosition(-245, 590);
        hud.addChild(this.hpLabel.node);
        this.xpLabel = this.makeLabel('', 24, new Color('#A7F3D0'));
        this.xpLabel.node.setPosition(0, 590);
        hud.addChild(this.xpLabel.node);
        this.waveLabel = this.makeLabel('', 24, new Color('#FDE68A'));
        this.waveLabel.node.setPosition(245, 590);
        hud.addChild(this.waveLabel.node);
        this.updateHud();
    }

    private updatePlayer(dt: number): void {
        let x = this.touchDirection.x;
        let y = this.touchDirection.y;
        if (this.pressed.has(KeyCode.KEY_A) || this.pressed.has(KeyCode.ARROW_LEFT)) x -= 1;
        if (this.pressed.has(KeyCode.KEY_D) || this.pressed.has(KeyCode.ARROW_RIGHT)) x += 1;
        if (this.pressed.has(KeyCode.KEY_S) || this.pressed.has(KeyCode.ARROW_DOWN)) y -= 1;
        if (this.pressed.has(KeyCode.KEY_W) || this.pressed.has(KeyCode.ARROW_UP)) y += 1;
        const direction = new Vec2(x, y);
        if (direction.lengthSqr() > 1) direction.normalize();
        const p = this.player.position;
        this.player.setPosition(
            Math.max(this.arena.left + 28, Math.min(this.arena.right - 28, p.x + direction.x * this.moveSpeed * dt)),
            Math.max(this.arena.bottom + 28, Math.min(this.arena.top - 28, p.y + direction.y * this.moveSpeed * dt)),
        );
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
        this.attachUnitVisual(node, ENEMY_ASSETS[wave.enemyKind], radius);
        const hpBar = this.createEnemyHpBar(node, radius + (wave.elite ? 32 : 20));
        const edge = Math.floor(Math.random() * 3);
        const x = edge === 0 ? this.arena.left + radius : edge === 1 ? this.arena.right - radius : this.random(this.arena.left + 50, this.arena.right - 50);
        const y = edge < 2 ? this.random(-100, this.arena.top - 40) : this.arena.top - radius;
        node.setPosition(x, y);
        this.battleLayer.addChild(node);
        const enemy: EnemyState = {
            node,
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
        };
        this.enemies.push(enemy);
        this.drawEnemyHp(enemy);
    }

    private attachUnitVisual(node: Node, asset: SpriteAssetSpec, fallbackRadius: number): void {
        const frame = this.spriteFrames.get(asset.resourcePath);
        if (frame) {
            const sprite = node.addComponent(Sprite);
            sprite.spriteFrame = frame;
            sprite.sizeMode = Sprite.SizeMode.RAW;
            const sourceHeight = Math.max(frame.originalSize.height, 1);
            const scale = asset.displayHeight / sourceHeight;
            node.setScale(scale, scale);
            return;
        }

        // 资源在慢设备上尚未加载完时仍保证可玩，下一局会自动使用正式图片。
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(asset.fallbackFill);
        graphics.circle(0, 0, fallbackRadius);
        graphics.fill();
        graphics.strokeColor = new Color(asset.fallbackStroke);
        graphics.lineWidth = 5;
        graphics.circle(0, 0, fallbackRadius);
        graphics.stroke();
    }

    private createEnemyHpBar(owner: Node, y: number): Graphics {
        const node = new Node('HpBar');
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(0, y / Math.max(owner.scale.y, 0.001));
        const graphics = node.addComponent(Graphics);
        owner.addChild(node);
        node.setScale(1 / owner.scale.x, 1 / owner.scale.y);
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
            enemy.age += dt;
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
            enemy.node.setPosition(enemy.node.position.clone().add(delta.multiplyScalar(enemy.speed * speedMultiplier * dt)));

            if (enemy.behavior === 'boss') {
                enemy.abilityTimer -= dt;
                if (enemy.abilityTimer <= 0) {
                    this.createBossPulse(enemy);
                    enemy.abilityTimer = enemy.abilityInterval;
                }
            }

            if (distance < enemy.radius + 27) {
                this.hp -= enemy.damage * dt;
                if (this.hp <= 0) {
                    this.hp = 0;
                    this.finish(false);
                    return;
                }
            }
        }
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
            pulse.graphics.strokeColor = new Color(224, 87, 64, pulse.applied ? 90 : 210);
            pulse.graphics.lineWidth = pulse.applied ? 7 : 4;
            pulse.graphics.circle(0, 0, Math.max(8, pulse.radius * progress));
            pulse.graphics.stroke();

            if (!pulse.applied && pulse.elapsed >= pulse.triggerAt) {
                pulse.applied = true;
                if (Vec3.distance(this.player.position, pulse.node.position) <= pulse.radius + 27) {
                    this.hp = Math.max(0, this.hp - pulse.damage);
                    if (this.hp <= 0) this.finish(false);
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
        node.angle = angle * 180 / Math.PI - 45;
        this.battleLayer.addChild(node);
        this.projectiles.push({
            node,
            velocity: new Vec3(Math.cos(angle) * 520, Math.sin(angle) * 520),
            damage: this.swordDamage,
            radius: 16,
            life: 1.6,
            hit: new Set<Node>(),
        });
    }

    private updateProjectiles(dt: number): void {
        for (const projectile of this.projectiles) {
            projectile.life -= dt;
            projectile.node.setPosition(projectile.node.position.clone().add(projectile.velocity.clone().multiplyScalar(dt)));
            for (const enemy of this.enemies) {
                // 同帧可能有多把飞剑命中；前一把已销毁敌人时，后续飞剑必须跳过失效节点。
                if (!enemy.node.isValid) continue;
                if (projectile.hit.has(enemy.node)) continue;
                if (Vec3.distance(projectile.node.position, enemy.node.position) > projectile.radius + enemy.radius) continue;
                projectile.hit.add(enemy.node);
                enemy.hp -= projectile.damage;
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
        this.gainXp(enemy.xp);
        enemy.node.destroy();
    }

    private gainXp(value: number): void {
        this.xp += value;
        if (this.xp < this.xpNeed || this.phase !== 'playing') return;
        this.xp -= this.xpNeed;
        this.level += 1;
        this.xpNeed = Math.floor(this.xpNeed * 1.35);
        this.showUpgrade();
    }

    private showUpgrade(): void {
        this.phase = 'upgrade';
        this.clearOverlay();
        const shade = this.makeRect(750, 1334, new Color(4, 12, 18, 220));
        this.overlay.addChild(shade);
        const title = this.makeLabel(`破境 · ${this.level} 重`, 40, new Color('#FDE68A'));
        title.node.setPosition(0, 300);
        this.overlay.addChild(title.node);
        const choices = this.pickUpgrades(3);
        choices.forEach((choice, index) => {
            const button = this.makeButton(`${choice.title}\n${choice.description}`, new Color(choice.accent), () => {
                this.applyUpgrade(choice.id);
                this.clearOverlay();
                this.phase = 'playing';
            }, 500, 125, new Color('#102A2A'));
            button.setPosition(0, 140 - index * 155);
            this.overlay.addChild(button);
        });
    }

    private applyUpgrade(id: UpgradeId): void {
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
    }

    private finish(victory: boolean): void {
        this.phase = victory ? 'victory' : 'defeat';
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
            if (!enemy.node.isValid) return nearest;
            if (!nearest) return enemy;
            return Vec3.distance(this.player.position, enemy.node.position) < Vec3.distance(this.player.position, nearest.node.position) ? enemy : nearest;
        }, undefined);
    }

    private updateHud(): void {
        this.hpLabel.string = `气血 ${Math.ceil(this.hp)}/${this.maxHp}`;
        this.xpLabel.string = `境界 ${this.level}  ·  修为 ${this.xp}/${this.xpNeed}`;
        this.waveLabel.string = `第 ${this.waveIndex + 1}/${STAGES[0].waves.length} 波`;
    }

    private clearBattle(): void {
        this.enemies = [];
        this.projectiles = [];
        this.bossPulses = [];
        this.battleLayer.children.slice().forEach((child) => child.destroy());
        this.canvas.getChildByName('HUD')?.destroy();
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

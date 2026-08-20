import type { Graphics, Label, Node, UIOpacity, Vec3 } from 'cc';
import type { EnemyBehavior, EnemyKind } from '../config/GameConfig';
import type { BossAbilityKind } from '../systems/BossAbilityRuntime';

export type Phase =
    | 'menu'
    | 'stage-entry'
    | 'playing'
    | 'tutorial'
    | 'paused'
    | 'cultivation-sheet'
    | 'boss-finish'
    | 'upgrade'
    | 'map-event-prelude'
    | 'map-event'
    | 'route-commit'
    | 'victory'
    | 'defeat';

export interface EnemyState {
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
    champion: boolean;
    age: number;
    strafeSign: number;
    abilityTimer: number;
    abilityInterval: number;
    abilityDamage: number;
    hpBar: Graphics;
    baseScale: number;
    baseVisualY: number;
    hitTimer: number;
    hitReactionTier?: 'normal' | 'heavy' | 'finisher';
    hitReactionDirection?: number;
    deathTimer: number;
    spawnTimer: number;
    castTimer: number;
    bossPhase: 1 | 2;
    enrageTimer: number;
    encounterStaggerTimer: number;
    encounterCollisionCooldown: number;
    animationFrameIndex: number;
    swordMarkStacks?: number;
    thunderMarkTimer?: number;
    dead: boolean;
}

export interface ProjectileState {
    node: Node;
    velocity: Vec3;
    damage: number;
    radius: number;
    life: number;
    hit: Set<Node>;
    trailTimer: number;
    piercesRemaining?: number;
    canReturn?: boolean;
}

export interface BossPulseState {
    node: Node;
    graphics: Graphics;
    kind: BossAbilityKind;
    sequenceIndex: number;
    elapsed: number;
    triggerAt: number;
    life: number;
    radius: number;
    damage: number;
    applied: boolean;
}

export interface BossPincerState {
    node: Node;
    graphics: Graphics;
    opacity: UIOpacity;
    elapsed: number;
    triggerAt: number;
    life: number;
    gapCenterX: number;
    gapHalfWidth: number;
    minY: number;
    maxY: number;
    damage: number;
    applied: boolean;
}

export interface VisualEffectState {
    node: Node;
    elapsed: number;
    life: number;
    update: (progress: number) => void;
    complete?: () => void;
}

export interface AmbientState {
    node: Node;
    baseX: number;
    baseY: number;
    speed: number;
    phase: number;
    range: number;
}

export interface UnitVisual {
    visual: Node;
    opacity: UIOpacity;
    baseScale: number;
}

export interface SkillHud {
    node: Node;
    graphics: Graphics;
    label: Label;
    iconOpacity: UIOpacity;
    radius: number;
}

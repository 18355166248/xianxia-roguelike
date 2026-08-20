import { Color, Graphics, Label, Node, Sprite, UIOpacity, Vec3 } from 'cc';
import type { VisualEffectState } from './GameRuntimeTypes';
import {
    CombatPresentationRuntime,
    type VfxAdmission,
    type VfxDensity,
    type VfxPriority,
} from '../systems/CombatPresentationRuntime';

export interface TransientEffectLease {
    node: Node;
    admission: VfxAdmission;
    complete: () => void;
}

/** Owns short-lived node reuse, admission control and effect timeline cleanup. */
export class TransientEffectController {
    public readonly effects: VisualEffectState[] = [];
    private readonly budget = new CombatPresentationRuntime();
    private readonly pools = new Map<string, Node[]>();
    private density: VfxDensity = 'balanced';

    public setDensity(density: VfxDensity): void {
        this.density = density;
    }

    public update(timelineDt: number, frameDt = timelineDt): void {
        this.budget.updateFrameTime(frameDt);
        for (let index = this.effects.length - 1; index >= 0; index -= 1) {
            const effect = this.effects[index];
            if (effect.node.isValid) {
                effect.elapsed += timelineDt;
                effect.update(Math.min(effect.elapsed / Math.max(effect.life, 0.001), 1));
            }
            if (effect.elapsed < effect.life && effect.node.isValid) continue;
            effect.complete?.();
            if (!effect.complete && effect.node.isValid) effect.node.destroy();
            this.effects.splice(index, 1);
        }
    }

    public acquire(
        key: string,
        priority: VfxPriority,
        reducedMotion: boolean,
        factory: () => Node,
    ): TransientEffectLease | undefined {
        const admission = this.budget.request(priority, reducedMotion, this.density);
        if (!admission) return undefined;
        const pool = this.pools.get(key);
        const node = pool?.pop() ?? factory();
        node.active = true;
        let completed = false;
        return {
            node,
            admission,
            complete: () => {
                if (completed) return;
                completed = true;
                this.budget.release(admission);
                this.releaseNode(key, node);
            },
        };
    }

    public reset(): void {
        for (const effect of this.effects) {
            effect.complete?.();
            if (!effect.complete && effect.node.isValid) effect.node.destroy();
        }
        this.effects.splice(0, this.effects.length);
        this.budget.reset();
    }

    public dispose(): void {
        this.reset();
        for (const nodes of this.pools.values()) {
            for (const node of nodes) if (node.isValid) node.destroy();
        }
        this.pools.clear();
    }

    private releaseNode(key: string, node: Node): void {
        if (!node.isValid) return;
        node.removeFromParent();
        node.active = false;
        node.setPosition(Vec3.ZERO);
        node.setScale(1, 1, 1);
        node.angle = 0;
        node.getComponent(Graphics)?.clear();
        const opacity = node.getComponent(UIOpacity);
        if (opacity) opacity.opacity = 255;
        const label = node.getComponent(Label);
        if (label) label.string = '';
        const sprite = node.getComponent(Sprite);
        if (sprite) sprite.color = new Color(255, 255, 255, 255);
        const pool = this.pools.get(key) ?? [];
        // Per-kind caps prevent a single pathological encounter from becoming retained memory.
        if (pool.length < 16) {
            pool.push(node);
            this.pools.set(key, pool);
        } else {
            node.destroy();
        }
    }
}

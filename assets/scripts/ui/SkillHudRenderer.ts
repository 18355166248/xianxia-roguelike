import { Color, Graphics, Label } from 'cc';
import type { SkillHud } from '../runtime/GameRuntimeTypes';
import { getTribulationRequiredHold, type SkillRuntime } from '../systems/SkillRuntime';

export function drawSkillHud(
    hud: SkillHud,
    title: string,
    level: number,
    cooldown: number,
    maxCooldown: number,
): void {
    const readyRatio = level <= 0 ? 0 : 1 - Math.max(0, Math.min(1, cooldown / Math.max(maxCooldown, 0.01)));
    hud.graphics.clear();
    hud.graphics.fillColor = new Color(level > 0 ? 5 : 9, level > 0 ? 27 : 18, level > 0 ? 31 : 23, 220);
    hud.graphics.circle(0, 0, hud.radius);
    hud.graphics.fill();
    hud.graphics.strokeColor = new Color(
        level > 0 ? 220 : 94,
        level > 0 ? 195 : 111,
        level > 0 ? 117 : 108,
        level > 0 ? 205 : 100,
    );
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

export function drawTribulationHud(graphics: Graphics, label: Label, skills: SkillRuntime): void {
    const level = skills.getLevel('tribulation');
    const charge = level > 0 ? skills.tribulationCharge : 0;
    const requiredHold = level > 0 ? getTribulationRequiredHold(level) : 1;
    const holdRatio = skills.tribulationHolding
        ? Math.min(1, skills.tribulationHold / requiredHold)
        : 0;
    graphics.clear();
    graphics.fillColor = new Color(level > 0 ? 4 : 8, level > 0 ? 24 : 17, level > 0 ? 29 : 21, 232);
    graphics.roundRect(-175, -25, 350, 50, 25);
    graphics.fill();
    if (charge > 0) {
        graphics.fillColor = new Color(77, 204, 190, 105 + Math.round(charge * 65));
        graphics.roundRect(-169, -19, 338 * charge, 38, 19);
        graphics.fill();
    }
    if (holdRatio > 0) {
        graphics.fillColor = new Color(221, 248, 255, 135);
        graphics.roundRect(-169, -19, 338 * holdRatio, 38, 19);
        graphics.fill();
    }
    graphics.strokeColor = new Color(
        level > 0 ? 232 : 87,
        level > 0 ? 207 : 109,
        level > 0 ? 132 : 105,
        level > 0 ? 220 : 100,
    );
    graphics.lineWidth = level > 0 ? 3 : 2;
    graphics.roundRect(-175, -25, 350, 50, 25);
    graphics.stroke();
    for (let index = 0; index < 3; index += 1) {
        graphics.fillColor = index < level
            ? new Color(155, 242, 226, 240)
            : new Color(42, 72, 70, 210);
        graphics.circle(-24 + index * 24, 31, 5);
        graphics.fill();
    }
    const realm = level >= 3 ? '三重' : level === 2 ? '二重' : level === 1 ? '初劫' : '未悟';
    label.color = new Color(level > 0 ? '#E9FFF8' : '#738B85');
    label.string = level <= 0
        ? '天劫 · 未悟'
        : skills.tribulationHolding
            ? `引劫 ${(holdRatio * 100).toFixed(0)}%`
            : charge >= 1
                ? `天劫 · ${realm}  长按释放`
                : `天劫 · ${realm}  劫力 ${(charge * 100).toFixed(0)}%`;
}

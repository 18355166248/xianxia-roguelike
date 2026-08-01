import { Color } from 'cc';
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
    hud.graphics.fillColor = new Color(level > 0 ? 4 : 8, level > 0 ? 31 : 20, level > 0 ? 36 : 25, level > 0 ? 238 : 225);
    hud.graphics.circle(0, 0, hud.radius);
    hud.graphics.fill();
    hud.graphics.strokeColor = new Color(
        level > 0 ? 231 : 105,
        level > 0 ? 205 : 123,
        level > 0 ? 127 : 116,
        level > 0 ? 225 : 135,
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
    hud.iconOpacity.opacity = level > 0 ? 255 : 148;
    hud.label.color = new Color(level > 0 ? '#FFF0BE' : '#9BB7AE');
    hud.label.string = level <= 0 ? title : cooldown > 0 ? cooldown.toFixed(1) : title;
}

export function drawTribulationHud(hud: SkillHud, skills: SkillRuntime): void {
    const level = skills.getLevel('tribulation');
    const charge = level > 0 ? skills.tribulationCharge : 0;
    const requiredHold = level > 0 ? getTribulationRequiredHold(level) : 1;
    const holdRatio = skills.tribulationHolding
        ? Math.min(1, skills.tribulationHold / requiredHold)
        : 0;
    hud.graphics.clear();
    hud.graphics.fillColor = new Color(level > 0 ? 4 : 8, level > 0 ? 31 : 19, level > 0 ? 36 : 24, level > 0 ? 238 : 225);
    hud.graphics.circle(0, 0, hud.radius);
    hud.graphics.fill();
    hud.graphics.strokeColor = new Color(
        level > 0 ? 232 : 87,
        level > 0 ? 207 : 109,
        level > 0 ? 132 : 105,
        level > 0 ? 220 : 100,
    );
    hud.graphics.lineWidth = level > 0 ? 3 : 2;
    hud.graphics.circle(0, 0, hud.radius);
    hud.graphics.stroke();
    hud.graphics.strokeColor = new Color(112, 231, 211, level > 0 ? 92 : 42);
    hud.graphics.lineWidth = 1.5;
    hud.graphics.circle(0, 0, hud.radius - 8);
    hud.graphics.stroke();
    hud.graphics.strokeColor = new Color(112, 231, 211, level > 0 ? 92 : 42);
    hud.graphics.lineWidth = 1.5;
    hud.graphics.circle(0, 0, hud.radius - 8);
    hud.graphics.stroke();
    if (charge > 0) {
        hud.graphics.strokeColor = new Color(112, 231, 211, 210);
        hud.graphics.lineWidth = 5;
        hud.graphics.arc(
            0,
            0,
            hud.radius - 5,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * charge,
            false,
        );
        hud.graphics.stroke();
    }
    if (holdRatio > 0) {
        hud.graphics.strokeColor = new Color(221, 248, 255, 240);
        hud.graphics.lineWidth = 7;
        hud.graphics.arc(
            0,
            0,
            hud.radius - 11,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * holdRatio,
            false,
        );
        hud.graphics.stroke();
    }
    for (let index = 0; index < 3; index += 1) {
        hud.graphics.fillColor = index < level
            ? new Color(155, 242, 226, 240)
            : new Color(42, 72, 70, 210);
        hud.graphics.circle(-14 + index * 14, hud.radius + 5, 4.5);
        hud.graphics.fill();
    }
    const realm = level >= 3 ? '三重' : level === 2 ? '二重' : level === 1 ? '初劫' : '未悟';
    hud.iconOpacity.opacity = level > 0 ? 255 : 148;
    hud.label.color = new Color(level > 0 ? '#E9FFF8' : '#91AAA2');
    hud.label.string = level <= 0
        ? '天劫'
        : skills.tribulationHolding
            ? `引劫 ${(holdRatio * 100).toFixed(0)}%`
            : charge >= 1
                ? `天劫·${realm}`
                : `劫力 ${(charge * 100).toFixed(0)}%`;
}

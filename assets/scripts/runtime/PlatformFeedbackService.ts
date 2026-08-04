import type { UpgradePath } from '../config/GameConfig';
import type { UpgradeShowcaseKind } from '../systems/CultivationBuildRuntime';

type BrowserAudioContext = AudioContext & { resume(): Promise<void> };
type BrowserAudioContextConstructor = new () => BrowserAudioContext;

interface FeedbackGlobals {
    AudioContext?: BrowserAudioContextConstructor;
    webkitAudioContext?: BrowserAudioContextConstructor;
    navigator?: Navigator;
}

/** Web 与原生壳都允许无声降级；反馈能力缺失时绝不能阻断升级状态机。 */
export class PlatformFeedbackService {
    private context?: BrowserAudioContext;

    public dispose(): void {
        const context = this.context;
        this.context = undefined;
        if (context && context.state !== 'closed') void context.close().catch(() => undefined);
    }

    public playUpgradeCommit(path: UpgradePath, tier: number, milestone: boolean): void {
        const base = path === 'edge' ? 440 : path === 'mystic' ? 330 : 392;
        const notes = milestone
            ? [base, base * 1.25, base * 1.5]
            : [base, base * 1.25];
        this.playNotes(notes, tier >= 3 ? 'sawtooth' : 'triangle', 0.32, 0.045);
        this.vibrate(milestone ? [22, 28, 42] : [18]);
    }

    public playUpgradeImpact(kind: UpgradeShowcaseKind, tier: number): void {
        if (kind === 'sword-volley') {
            this.playNotes([620, 760, 920], 'triangle', 0.18, 0.035);
        } else if (kind === 'thunder-chain') {
            this.playNotes([118, 86, 62], 'sawtooth', 0.3, 0.055);
        } else {
            this.playNotes([260, 330, 420], 'sine', 0.34, 0.045);
        }
        this.vibrate(tier >= 3 ? [28, 24, 54] : [24]);
    }

    public playComboMilestone(tier: number): void {
        const base = 520 + tier * 90;
        this.playNotes([base, base * 1.22], tier >= 3 ? 'sawtooth' : 'triangle', 0.14, 0.028);
        this.vibrate(tier >= 3 ? [18, 18, 30] : [14]);
    }

    private audioContext(): BrowserAudioContext | undefined {
        if (this.context) return this.context;
        const globals = globalThis as unknown as FeedbackGlobals;
        const Constructor = globals.AudioContext ?? globals.webkitAudioContext;
        if (!Constructor) return undefined;
        try {
            this.context = new Constructor();
            return this.context;
        } catch {
            return undefined;
        }
    }

    private playNotes(
        frequencies: readonly number[],
        wave: OscillatorType,
        duration: number,
        volume: number,
    ): void {
        const context = this.audioContext();
        if (!context) return;
        // 自动播放策略可能异步拒绝恢复音频；忽略拒绝并继续走无声反馈，避免产生未处理 Promise。
        if (context.state === 'suspended') void context.resume().catch(() => undefined);
        const start = context.currentTime + 0.012;
        frequencies.forEach((frequency, index) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const noteStart = start + index * 0.055;
            const noteEnd = noteStart + duration;
            oscillator.type = wave;
            oscillator.frequency.setValueAtTime(frequency, noteStart);
            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(volume, noteStart + 0.018);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteEnd + 0.02);
        });
    }

    private vibrate(pattern: number | number[]): void {
        try {
            const navigator = (globalThis as unknown as FeedbackGlobals).navigator;
            navigator?.vibrate?.(pattern);
        } catch {
            // 微信 WebView、桌面浏览器和无权限环境均可能拒绝震动，保持静默降级。
        }
    }
}

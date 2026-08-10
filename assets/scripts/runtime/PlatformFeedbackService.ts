import type { UpgradePath } from '../config/GameConfig';
import type { UpgradeShowcaseKind } from '../systems/CultivationBuildRuntime';
import {
    AudioCueGate,
    audioCueSpecFor,
    soundscapeFor,
    type GameAudioCue,
    type SoundscapeScene,
} from '../systems/AudioCueRuntime';

type BrowserAudioContext = AudioContext & { resume(): Promise<void> };
type BrowserAudioContextConstructor = new () => BrowserAudioContext;

interface FeedbackGlobals {
    AudioContext?: BrowserAudioContextConstructor;
    webkitAudioContext?: BrowserAudioContextConstructor;
    navigator?: Navigator;
}

interface AmbientGraph {
    scene: SoundscapeScene;
    gain: GainNode;
    oscillators: OscillatorNode[];
    targetGain: number;
}

/** Web 与原生壳都允许无声降级；反馈能力缺失时绝不能阻断升级状态机。 */
export class PlatformFeedbackService {
    private context?: BrowserAudioContext;
    private audioEnabled = true;
    private vibrationEnabled = true;
    private desiredAmbience?: SoundscapeScene;
    private ambience?: AmbientGraph;
    private readonly cueGate = new AudioCueGate();

    public configure(preferences: Readonly<{ audioEnabled: boolean; vibrationEnabled: boolean }>): void {
        const audioChanged = this.audioEnabled !== preferences.audioEnabled;
        this.audioEnabled = preferences.audioEnabled;
        this.vibrationEnabled = preferences.vibrationEnabled;
        if (audioChanged) {
            if (!this.audioEnabled) this.stopAmbience();
            else if (this.desiredAmbience) this.startAmbience(this.desiredAmbience);
        }
    }

    public dispose(): void {
        this.stopAmbience();
        const context = this.context;
        this.context = undefined;
        if (context && context.state !== 'closed') void context.close().catch(() => undefined);
    }

    public playCue(cue: GameAudioCue, variant = 0): void {
        if (!this.audioEnabled) return;
        const now = globalThis.performance?.now() ?? Date.now();
        if (!this.cueGate.allow(cue, now)) return;
        const spec = audioCueSpecFor(cue, variant);
        const context = this.audioContext();
        if (!context) return;
        if (context.state === 'suspended') void context.resume().catch(() => undefined);
        const start = context.currentTime + 0.012;
        spec.notes.forEach((item) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const noteStart = start + item.offset;
            const noteEnd = noteStart + item.duration;
            oscillator.type = item.wave;
            oscillator.frequency.setValueAtTime(item.frequency, noteStart);
            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(item.gain, noteStart + Math.min(0.025, item.duration * 0.25));
            gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteEnd + 0.02);
        });
        if (spec.vibration !== undefined) this.vibrate(spec.vibration);
    }

    public setAmbience(scene: SoundscapeScene): void {
        this.desiredAmbience = scene;
        if (!this.audioEnabled || this.ambience?.scene === scene) return;
        this.startAmbience(scene);
    }

    public setAmbiencePaused(paused: boolean): void {
        const context = this.context;
        const ambience = this.ambience;
        if (!context || !ambience) return;
        const now = context.currentTime;
        ambience.gain.gain.cancelScheduledValues(now);
        ambience.gain.gain.setTargetAtTime(paused ? 0.0001 : ambience.targetGain, now, paused ? 0.12 : 0.45);
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

    private startAmbience(scene: SoundscapeScene): void {
        this.stopAmbience();
        if (!this.audioEnabled) return;
        const context = this.audioContext();
        if (!context) return;
        const spec = soundscapeFor(scene);
        const master = context.createGain();
        master.gain.setValueAtTime(0.0001, context.currentTime);
        master.gain.exponentialRampToValueAtTime(spec.gain, context.currentTime + 1.8);
        master.connect(context.destination);
        const oscillators = spec.frequencies.map((frequency, index) => {
            const oscillator = context.createOscillator();
            const partial = context.createGain();
            oscillator.type = index === 0 ? spec.wave : 'sine';
            oscillator.frequency.setValueAtTime(frequency, context.currentTime);
            partial.gain.setValueAtTime(1 / (index + 1.5), context.currentTime);
            oscillator.connect(partial);
            partial.connect(master);
            oscillator.start();
            return oscillator;
        });
        this.ambience = { scene, gain: master, oscillators, targetGain: spec.gain };
    }

    private stopAmbience(): void {
        const ambience = this.ambience;
        this.ambience = undefined;
        if (!ambience) return;
        ambience.oscillators.forEach((oscillator) => {
            try {
                oscillator.stop();
                oscillator.disconnect();
            } catch {
                // 声音上下文可能已被宿主回收；停止失败不应影响页面销毁或切换场景。
            }
        });
        ambience.gain.disconnect();
    }

    private playNotes(
        frequencies: readonly number[],
        wave: OscillatorType,
        duration: number,
        volume: number,
    ): void {
        if (!this.audioEnabled) return;
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
        if (!this.vibrationEnabled) return;
        try {
            const navigator = (globalThis as unknown as FeedbackGlobals).navigator;
            navigator?.vibrate?.(pattern);
        } catch {
            // 微信 WebView、桌面浏览器和无权限环境均可能拒绝震动，保持静默降级。
        }
    }
}

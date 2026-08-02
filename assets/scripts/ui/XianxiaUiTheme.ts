export type CardVariant = 'chapter' | 'choice' | 'summary' | 'reward';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export interface CardStyle {
    readonly fill: string;
    readonly stroke: string;
    readonly strokeAlpha: number;
    readonly radius: number;
    readonly lineWidth: number;
}

export interface ButtonStyle {
    readonly fill: string;
    readonly label: string;
    readonly radius: number;
    readonly lineWidth: number;
}

/**
 * Shared visual language for the in-game interface.
 *
 * Values are expressed in the 750 x 1334 design coordinate system used by
 * GameBootstrap so layout measurements remain predictable on every viewport.
 */
export const UI_THEME = {
    colors: {
        ink: '#061416',
        surface: '#0B2427',
        elevated: '#103238',
        jade: '#6FCAB1',
        celadon: '#B7D8CB',
        gold: '#D9B86C',
        ivory: '#F3E7C8',
        muted: '#9CB8AE',
        danger: '#C56E5A',
    },
    spacing: {
        grid: 8,
        pageInset: 36,
        compact: 16,
        content: 24,
        section: 32,
    },
    radius: {
        compact: 16,
        panel: 24,
    },
    typography: {
        caption: 18,
        body: 20,
        emphasis: 24,
        heading: 30,
        display: 42,
    },
    motion: {
        press: 0.12,
        reveal: 0.26,
        ceremony: 0.58,
    },
    opacity: {
        panel: 244,
        card: 232,
        quietStroke: 82,
        modalHud: 64,
    },
} as const;

export const CARD_STYLES: Readonly<Record<CardVariant, CardStyle>> = {
    chapter: {
        fill: UI_THEME.colors.surface,
        stroke: UI_THEME.colors.jade,
        strokeAlpha: 150,
        radius: UI_THEME.radius.panel,
        lineWidth: 1.5,
    },
    choice: {
        fill: UI_THEME.colors.elevated,
        stroke: UI_THEME.colors.jade,
        strokeAlpha: 112,
        radius: UI_THEME.radius.compact,
        lineWidth: 1,
    },
    summary: {
        fill: UI_THEME.colors.ink,
        stroke: UI_THEME.colors.celadon,
        strokeAlpha: UI_THEME.opacity.quietStroke,
        radius: UI_THEME.radius.compact,
        lineWidth: 1,
    },
    reward: {
        fill: UI_THEME.colors.elevated,
        stroke: UI_THEME.colors.gold,
        strokeAlpha: 190,
        radius: UI_THEME.radius.panel,
        lineWidth: 2,
    },
};

export const BUTTON_STYLES: Readonly<Record<ButtonVariant, ButtonStyle>> = {
    primary: {
        fill: '#123C37',
        label: UI_THEME.colors.ivory,
        radius: UI_THEME.radius.compact,
        lineWidth: 2,
    },
    secondary: {
        fill: '#0B292B',
        label: UI_THEME.colors.celadon,
        radius: UI_THEME.radius.compact,
        lineWidth: 1,
    },
    quiet: {
        fill: UI_THEME.colors.ink,
        label: UI_THEME.colors.muted,
        radius: UI_THEME.radius.compact,
        lineWidth: 1,
    },
};

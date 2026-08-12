import type { EnemyKind, StageMapId } from './GameConfig';

export interface SpriteAssetSpec {
    resourcePath: string;
    displayHeight: number;
    fallbackFill: string;
    fallbackStroke: string;
}

export interface SpriteAnimationAssetSpec {
    resourcePath: string;
    displayHeight: number;
    columns: number;
    rows: number;
}

export const BACKGROUND_ASSETS: Record<StageMapId, {
    resourcePath: string;
    displayWidth: number;
    displayHeight: number;
}> = {
    'qingshi-road': {
        resourcePath: 'art/backgrounds/qingshi-road/spriteFrame',
        // 原图保持比例放大并由竖屏视口裁掉左右边缘，避免战场看起来像嵌在页面里的卡片。
        displayWidth: 984,
        displayHeight: 1334,
    },
    'bamboo-ambush': {
        resourcePath: 'art/backgrounds/bamboo-ambush/spriteFrame',
        displayWidth: 982,
        displayHeight: 1334,
    },
    'frozen-ruins': {
        resourcePath: 'art/backgrounds/frozen-ruins/spriteFrame',
        displayWidth: 750,
        displayHeight: 1334,
    },
};

export const BACKGROUND_ASSET = BACKGROUND_ASSETS['qingshi-road'];
export const BAMBOO_BARRICADE_ASSET: SpriteAssetSpec = {
    resourcePath: 'art/obstacles/bamboo-barricade/spriteFrame',
    displayHeight: 96,
    fallbackFill: '#173F38',
    fallbackStroke: '#82B79C',
};

export const PLAYER_ASSET: SpriteAssetSpec = {
    resourcePath: 'art/characters/qinglan/spriteFrame',
    displayHeight: 126,
    fallbackFill: '#D9F1E8',
    fallbackStroke: '#4A9EAA',
};

export const PLAYER_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/characters/qinglan-actions/spriteFrame',
    displayHeight: 126,
    columns: 4,
    rows: 4,
};

export const HUD_PORTRAIT_ASSET: SpriteAssetSpec = {
    resourcePath: 'art/ui/qinglan-hud-portrait-transparent-v2/spriteFrame',
    displayHeight: 122,
    fallbackFill: '#07171C',
    fallbackStroke: '#8AB8A9',
};

export const WAVE_CREST_ASSET: SpriteAssetSpec = {
    resourcePath: 'art/ui/wave-crest-v1/spriteFrame',
    displayHeight: 106,
    fallbackFill: '#0B292B',
    fallbackStroke: '#78CDBB',
};

// 首页重构资源保持独立命名，便于后续继续迭代其他页面时按版本替换，不影响战斗场景素材。
export const HOME_UI_ASSETS = {
    background: 'art/ui/home-redesign-v1/home-journey-bg-v1/spriteFrame',
    title: 'art/ui/home-redesign-v1/title-calligraphy-transparent-v1/spriteFrame',
    infoPanel: 'art/ui/home-redesign-v1/home-info-panel-v1/spriteFrame',
    // 三章共用同一张透明圆章底图，章名与选中态由运行时绘制，
    // 不再依赖各自带背景的切图，任何机型比例都不会与山水底图错位。
    chapterMedallion: 'art/ui/home-redesign-v1/chapter-selected-halo-compact-v1/spriteFrame',
    codexMedallion: 'art/ui/home-redesign-v1/top-codex-medallion-transparent-v2/spriteFrame',
    settingsMedallion: 'art/ui/home-redesign-v1/top-settings-medallion-transparent-v2/spriteFrame',
} as const;

// 首页三枚机制徽记统一使用同系列法宝资源，避免把带大面积透明边缘的战斗立绘缩进圆章后显得又小又偏。
export const HOME_STAGE_FEATURE_ICONS: Record<StageMapId, readonly [string, string, string]> = {
    'qingshi-road': [
        'art/relics/xianxia-relics_00/spriteFrame',
        'art/relics/xianxia-relics_19/spriteFrame',
        'art/relics/xianxia-relics_04/spriteFrame',
    ],
    'bamboo-ambush': [
        'art/relics/xianxia-relics_11/spriteFrame',
        'art/relics/xianxia-relics_23/spriteFrame',
        'art/relics/xianxia-relics_21/spriteFrame',
    ],
    'frozen-ruins': [
        'art/relics/xianxia-relics_05/spriteFrame',
        'art/relics/xianxia-relics_04/spriteFrame',
        'art/relics/xianxia-relics_20/spriteFrame',
    ],
};

export const BOSS_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/bosses/shanxiao-actions/spriteFrame',
    displayHeight: 164,
    columns: 4,
    rows: 4,
};

export const FROZEN_BOSS_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/bosses/hanyuan-shanxiao-actions/spriteFrame',
    displayHeight: 178,
    columns: 4,
    rows: 4,
};

export const FROST_IMPACT_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/effects/hanyuan-frost-impact/spriteFrame',
    displayHeight: 420,
    columns: 2,
    rows: 2,
};

export const QINGSHI_STELE_COMMIT_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/effects/qingshi-stele-commit/spriteFrame',
    displayHeight: 164,
    columns: 2,
    rows: 2,
};

export const QINGSHI_SPRING_COMMIT_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/effects/qingshi-spring-commit/spriteFrame',
    displayHeight: 190,
    columns: 2,
    rows: 2,
};

export const BAMBOO_BURN_COMMIT_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/effects/bamboo-burn-commit/spriteFrame',
    displayHeight: 220,
    columns: 2,
    rows: 2,
};

export const BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/effects/bamboo-shadow-commit/spriteFrame',
    displayHeight: 176,
    columns: 2,
    rows: 2,
};

export const FROST_TIDE_COMMIT_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/effects/frost-tide-commit/spriteFrame',
    displayHeight: 230,
    columns: 2,
    rows: 2,
};

export const FROST_SEAL_COMMIT_ANIMATION_ASSET: SpriteAnimationAssetSpec = {
    resourcePath: 'art/effects/frost-seal-commit/spriteFrame',
    displayHeight: 224,
    columns: 2,
    rows: 2,
};

// 资源路径与战斗配置解耦：以后替换立绘或调整显示尺寸，不需要改状态机。
export const ENEMY_ASSETS: Record<EnemyKind, SpriteAssetSpec> = {
    mountainSpirit: {
        resourcePath: 'art/enemies/mountain-spirit/spriteFrame',
        displayHeight: 110,
        fallbackFill: '#365C43',
        fallbackStroke: '#86A873',
    },
    bambooWarden: {
        resourcePath: 'art/enemies/bamboo-warden/spriteFrame',
        displayHeight: 134,
        fallbackFill: '#314C3E',
        fallbackStroke: '#D8B45D',
    },
    foxSpirit: {
        resourcePath: 'art/enemies/fox-spirit/spriteFrame',
        displayHeight: 98,
        fallbackFill: '#9A4B2E',
        fallbackStroke: '#F2B36F',
    },
    jiangshi: {
        resourcePath: 'art/enemies/jiangshi/spriteFrame',
        displayHeight: 116,
        fallbackFill: '#283A56',
        fallbackStroke: '#8AA4B8',
    },
    shanxiao: {
        resourcePath: 'art/bosses/shanxiao/spriteFrame',
        displayHeight: 164,
        fallbackFill: '#4B2A28',
        fallbackStroke: '#D69B45',
    },
};

export const PRELOAD_SPRITE_PATHS = [
    ...Object.values(BACKGROUND_ASSETS).map((asset) => asset.resourcePath),
    BAMBOO_BARRICADE_ASSET.resourcePath,
    PLAYER_ASSET.resourcePath,
    PLAYER_ANIMATION_ASSET.resourcePath,
    HUD_PORTRAIT_ASSET.resourcePath,
    WAVE_CREST_ASSET.resourcePath,
    HOME_UI_ASSETS.background,
    HOME_UI_ASSETS.title,
    HOME_UI_ASSETS.infoPanel,
    HOME_UI_ASSETS.chapterMedallion,
    HOME_UI_ASSETS.codexMedallion,
    HOME_UI_ASSETS.settingsMedallion,
    ...Object.values(HOME_STAGE_FEATURE_ICONS).flat(),
    BOSS_ANIMATION_ASSET.resourcePath,
    FROZEN_BOSS_ANIMATION_ASSET.resourcePath,
    FROST_IMPACT_ANIMATION_ASSET.resourcePath,
    QINGSHI_STELE_COMMIT_ANIMATION_ASSET.resourcePath,
    QINGSHI_SPRING_COMMIT_ANIMATION_ASSET.resourcePath,
    BAMBOO_BURN_COMMIT_ANIMATION_ASSET.resourcePath,
    BAMBOO_SHADOW_COMMIT_ANIMATION_ASSET.resourcePath,
    FROST_TIDE_COMMIT_ANIMATION_ASSET.resourcePath,
    FROST_SEAL_COMMIT_ANIMATION_ASSET.resourcePath,
    ...Object.values(ENEMY_ASSETS).map((asset) => asset.resourcePath),
] as const;

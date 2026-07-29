import type { EnemyKind } from './GameConfig';

export interface SpriteAssetSpec {
    resourcePath: string;
    displayHeight: number;
    fallbackFill: string;
    fallbackStroke: string;
}

export const BACKGROUND_ASSET = {
    resourcePath: 'art/backgrounds/qingshi-road/spriteFrame',
    displayWidth: 700,
    displayHeight: 950,
} as const;

export const PLAYER_ASSET: SpriteAssetSpec = {
    resourcePath: 'art/characters/qinglan/spriteFrame',
    displayHeight: 104,
    fallbackFill: '#D9F1E8',
    fallbackStroke: '#4A9EAA',
};

// 资源路径与战斗配置解耦：以后替换立绘或调整显示尺寸，不需要改状态机。
export const ENEMY_ASSETS: Record<EnemyKind, SpriteAssetSpec> = {
    mountainSpirit: {
        resourcePath: 'art/enemies/mountain-spirit/spriteFrame',
        displayHeight: 84,
        fallbackFill: '#365C43',
        fallbackStroke: '#86A873',
    },
    foxSpirit: {
        resourcePath: 'art/enemies/fox-spirit/spriteFrame',
        displayHeight: 76,
        fallbackFill: '#9A4B2E',
        fallbackStroke: '#F2B36F',
    },
    jiangshi: {
        resourcePath: 'art/enemies/jiangshi/spriteFrame',
        displayHeight: 94,
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
    BACKGROUND_ASSET.resourcePath,
    PLAYER_ASSET.resourcePath,
    ...Object.values(ENEMY_ASSETS).map((asset) => asset.resourcePath),
] as const;

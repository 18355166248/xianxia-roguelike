import {
    assetManager,
    ImageAsset,
    resources,
    SpriteFrame,
    Texture2D,
} from 'cc';
import { REMOTE_SPRITE_URLS } from '../config/RemoteAssetCatalog';

const pendingLoads = new Map<string, Promise<SpriteFrame>>();

function loadLocalSpriteFrame(resourcePath: string): Promise<SpriteFrame> {
    return new Promise((resolve, reject) => {
        resources.load(resourcePath, SpriteFrame, (error, frame) => {
            if (error || !frame) {
                reject(error ?? new Error(`本地资源不存在: ${resourcePath}`));
                return;
            }
            resolve(frame);
        });
    });
}

function loadRemoteSpriteFrame(resourcePath: string, url: string): Promise<SpriteFrame> {
    return new Promise((resolve, reject) => {
        // CDN URL 带扩展名，同时显式指定 ext，避免中间跳转导致 Cocos 选错下载器。
        assetManager.loadRemote<ImageAsset>(url, {
            ext: '.png',
            maxRetryCount: 2,
            xhrTimeout: 15_000,
        }, (error, image) => {
            if (error || !image) {
                reject(error ?? new Error(`CDN 资源不可用: ${resourcePath}`));
                return;
            }
            const texture = new Texture2D();
            texture.image = image;
            const frame = new SpriteFrame();
            frame.name = resourcePath;
            frame.texture = texture;
            resolve(frame);
        });
    });
}

/**
 * 所有动态精灵统一走这个适配层：大图走 CDN，小图仍走 resources。
 * Promise 缓存可避免初始化和 UI 补图同时触发重复请求；失败后移除缓存，便于网络恢复后重试。
 */
export function loadSpriteFrame(resourcePath: string): Promise<SpriteFrame> {
    const pending = pendingLoads.get(resourcePath);
    if (pending) return pending;

    const remoteUrl = REMOTE_SPRITE_URLS[resourcePath];
    const request = (remoteUrl
        ? loadRemoteSpriteFrame(resourcePath, remoteUrl)
        : loadLocalSpriteFrame(resourcePath))
        .catch((error: unknown) => {
            pendingLoads.delete(resourcePath);
            throw error;
        });
    pendingLoads.set(resourcePath, request);
    return request;
}

export function isRemoteSprite(resourcePath: string): boolean {
    return Boolean(REMOTE_SPRITE_URLS[resourcePath]);
}

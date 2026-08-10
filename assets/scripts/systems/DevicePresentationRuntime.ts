export type DeviceOrientation = 'portrait' | 'landscape';

export function resolveDeviceOrientation(width: number, height: number): DeviceOrientation {
    if (width <= 0 || height <= 0) return 'portrait';
    return width > height ? 'landscape' : 'portrait';
}

export function shouldShowPortraitGuard(width: number, height: number): boolean {
    return resolveDeviceOrientation(width, height) === 'landscape';
}

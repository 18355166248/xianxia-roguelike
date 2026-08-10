import {
    resolveDeviceOrientation,
    shouldShowPortraitGuard,
} from '../assets/scripts/systems/DevicePresentationRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

assert(resolveDeviceOrientation(393, 852) === 'portrait', 'phone portrait should remain playable');
assert(resolveDeviceOrientation(852, 393) === 'landscape', 'phone landscape should be guarded');
assert(resolveDeviceOrientation(1024, 1366) === 'portrait', 'tablet portrait should remain playable');
assert(!shouldShowPortraitGuard(800, 800), 'square embedded viewport should not be blocked');
assert(!shouldShowPortraitGuard(0, 0), 'unknown startup size should default to playable portrait');

console.log('DevicePresentationRuntime tests passed');

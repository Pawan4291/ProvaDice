/**
 * Sphere wallet detection utilities (browser-only)
 * Mirrors the detection logic from sphere-sdk-connect-example
 */

/**
 * Check if we're running inside a Sphere iframe
 */
export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true; // Cross-origin frame — treat as iframe
  }
}

/**
 * Check if the Sphere browser extension is installed
 */
export function hasExtension(): boolean {
  if (typeof window === 'undefined') return false;
  // The Sphere extension injects window.sphere or sets a flag
  return !!(
    (window as unknown as { sphere?: unknown }).sphere ||
    (window as unknown as { __SPHERE_EXT__?: boolean }).__SPHERE_EXT__
  );
}

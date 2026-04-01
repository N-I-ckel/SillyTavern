/**
 * Zero-hardcoding environment helper.
 * All config flows: values.yaml → Helm → ConfigMap → env vars → env()
 */

/**
 * Get environment variable with optional default.
 * Throws if required and not set.
 */
export function env(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value !== undefined) return value;
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Required environment variable ${key} is not set`);
}

/**
 * Get environment variable as integer.
 */
export function envInt(key: string, defaultValue?: number): number {
  const raw = process.env[key];
  if (raw !== undefined) {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) throw new Error(`Environment variable ${key} is not a valid integer: ${raw}`);
    return parsed;
  }
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Required environment variable ${key} is not set`);
}

/**
 * Get environment variable as boolean.
 */
export function envBool(key: string, defaultValue?: boolean): boolean {
  const raw = process.env[key];
  if (raw !== undefined) return raw === 'true' || raw === '1';
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Required environment variable ${key} is not set`);
}

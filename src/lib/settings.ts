import type { ExtensionSettings } from './types.js'

export const DEFAULT_SETTINGS: ExtensionSettings = {
  algorithm: 'chronological',
  appearance: 'system',
  colorScheme: 'default',
}

export function normalizeSettings(
  settings?: Partial<ExtensionSettings> | null
): ExtensionSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
  }
}

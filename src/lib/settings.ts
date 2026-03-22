import type { ExtensionSettings } from './types.js'

export const DEFAULT_SETTINGS: ExtensionSettings = {
  algorithm: 'chronological',
  appearance: 'system',
  colorScheme: 'default',
  toolbarAction: 'auto-save',
  linkTarget: 'same-tab',
}

export function normalizeSettings(
  settings?: Partial<ExtensionSettings> | null
): ExtensionSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
  }
}

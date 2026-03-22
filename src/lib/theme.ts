import { getAll } from './storage.js'
import { normalizeSettings } from './settings.js'
import type { ExtensionSettings, ThemeAppearance } from './types.js'

type ThemeSettings = Pick<ExtensionSettings, 'appearance' | 'colorScheme'>
type ResolvedAppearance = Exclude<ThemeAppearance, 'system'>

function getResolvedAppearance(appearance: ThemeAppearance): ResolvedAppearance {
  if (appearance === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return appearance
}

export function applyThemeSettings(
  settings: ThemeSettings,
  root: HTMLElement = document.documentElement
): void {
  const resolvedAppearance = getResolvedAppearance(settings.appearance)

  root.dataset.colorScheme = settings.colorScheme
  root.classList.toggle('dark', resolvedAppearance === 'dark')
  root.style.colorScheme = resolvedAppearance
}

export async function initializeTheme(
  root: HTMLElement = document.documentElement
): Promise<() => void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }

  let currentSettings = normalizeSettings((await getAll()).settings)
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const applyCurrentTheme = () => {
    applyThemeSettings(currentSettings, root)
  }

  const handleMediaChange = () => {
    if (currentSettings.appearance === 'system') {
      applyCurrentTheme()
    }
  }

  const handleStorageChange: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
    changes,
    areaName
  ) => {
    if (areaName !== 'sync' || !changes.settings) return

    currentSettings = normalizeSettings(
      changes.settings.newValue as Partial<ExtensionSettings> | undefined
    )
    applyCurrentTheme()
  }

  applyCurrentTheme()

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleMediaChange)
  } else {
    mediaQuery.addListener(handleMediaChange)
  }

  chrome.storage.onChanged.addListener(handleStorageChange)

  return () => {
    if (typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', handleMediaChange)
    } else {
      mediaQuery.removeListener(handleMediaChange)
    }

    chrome.storage.onChanged.removeListener(handleStorageChange)
  }
}

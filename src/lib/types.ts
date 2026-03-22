export type SuggestionAlgorithm = 'chronological' | 'reverse-chronological' | 'random'
export type ThemeAppearance = 'system' | 'light' | 'dark'
export type ColorScheme =
  | 'default'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'rose'
  | 'violet'
  | 'yellow'

export interface ReadLaterItem {
  id: string
  url: string
  title: string
  favicon: string
  savedAt: number
  readAt: number | null
}

export interface ExtensionSettings {
  algorithm: SuggestionAlgorithm
  appearance: ThemeAppearance
  colorScheme: ColorScheme
}

export interface StorageSchema {
  items: ReadLaterItem[]
  settings: ExtensionSettings
}

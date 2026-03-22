export type SuggestionAlgorithm = 'chronological' | 'reverse-chronological' | 'random'

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
}

export interface StorageSchema {
  items: ReadLaterItem[]
  settings: ExtensionSettings
}

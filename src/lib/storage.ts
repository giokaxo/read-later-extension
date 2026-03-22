import type { ReadLaterItem, ExtensionSettings, StorageSchema } from './types'

const DEFAULTS: StorageSchema = {
  items: [],
  settings: { algorithm: 'chronological' },
}

export async function getAll(): Promise<StorageSchema> {
  const data = await chrome.storage.sync.get(['items', 'settings'])
  return {
    items: data.items ?? DEFAULTS.items,
    settings: data.settings ?? DEFAULTS.settings,
  }
}

export async function saveItem(item: ReadLaterItem): Promise<void> {
  const { items } = await getAll()
  items.push(item)
  await chrome.storage.sync.set({ items })
}

export async function markAsRead(id: string): Promise<void> {
  const { items } = await getAll()
  const idx = items.findIndex((i) => i.id === id)
  if (idx !== -1) {
    items[idx].readAt = Date.now()
    await chrome.storage.sync.set({ items })
  }
}

export async function removeItem(id: string): Promise<void> {
  const { items } = await getAll()
  await chrome.storage.sync.set({ items: items.filter((i) => i.id !== id) })
}

export async function updateSettings(s: Partial<ExtensionSettings>): Promise<void> {
  const { settings } = await getAll()
  await chrome.storage.sync.set({ settings: { ...settings, ...s } })
}

export async function bumpItem(id: string): Promise<void> {
  const { items } = await getAll()
  const idx = items.findIndex((i) => i.id === id)
  if (idx !== -1) {
    items[idx].savedAt = Date.now()
    await chrome.storage.sync.set({ items })
  }
}

export function isItemSaved(items: ReadLaterItem[], url: string): ReadLaterItem | undefined {
  return items.find((i) => i.url === url && i.readAt === null)
}

export function selectSuggestion(
  items: ReadLaterItem[],
  algorithm: ExtensionSettings['algorithm']
): ReadLaterItem | null {
  const unread = items
    .filter((i) => i.readAt === null)
    .sort((a, b) => a.savedAt - b.savedAt)

  if (!unread.length) return null
  if (algorithm === 'chronological') return unread[0]
  if (algorithm === 'reverse-chronological') return unread[unread.length - 1]
  return unread[Math.floor(Math.random() * unread.length)]
}

export function relativeTime(timestamp: number): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = timestamp - Date.now()
  const seconds = Math.round(diff / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)

  if (Math.abs(days) >= 1) return rtf.format(days, 'day')
  if (Math.abs(hours) >= 1) return rtf.format(hours, 'hour')
  if (Math.abs(minutes) >= 1) return rtf.format(minutes, 'minute')
  return rtf.format(seconds, 'second')
}

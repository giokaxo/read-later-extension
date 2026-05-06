import type { ReadLaterItem, ExtensionSettings, StorageSchema } from './types'
import { DEFAULT_SETTINGS, normalizeSettings } from './settings.js'

const EXPORT_FORMAT = 'read-later-extension-tabs'
const EXPORT_VERSION = 1
const ITEMS_KEY = 'items'
const SETTINGS_KEY = 'settings'

const DEFAULTS: StorageSchema = {
  items: [],
  settings: DEFAULT_SETTINGS,
}

export interface StoredTabsExport {
  format: typeof EXPORT_FORMAT
  version: typeof EXPORT_VERSION
  exportedAt: string
  items: ReadLaterItem[]
}

export interface ImportStoredTabsResult {
  imported: number
  skipped: number
  total: number
}

export async function getAll(): Promise<StorageSchema> {
  const [localData, syncData] = await Promise.all([
    chrome.storage.local.get(ITEMS_KEY) as Promise<{ items?: ReadLaterItem[] }>,
    chrome.storage.sync.get([ITEMS_KEY, SETTINGS_KEY]) as Promise<{
      items?: ReadLaterItem[]
      settings?: Partial<ExtensionSettings>
    }>,
  ])

  const items = localData.items ?? syncData.items ?? DEFAULTS.items

  if (!localData.items && syncData.items) {
    await chrome.storage.local.set({ items: syncData.items })
    await chrome.storage.sync.remove(ITEMS_KEY)
  }

  return {
    items,
    settings: normalizeSettings(syncData.settings),
  }
}

async function saveItems(items: ReadLaterItem[]): Promise<void> {
  await chrome.storage.local.set({ items })
}

export async function getSettings(): Promise<ExtensionSettings> {
  const storageData = (await chrome.storage.sync.get(SETTINGS_KEY)) as {
    items?: ReadLaterItem[]
    settings?: Partial<ExtensionSettings>
  }
  return normalizeSettings(storageData.settings)
}

export async function saveItem(item: ReadLaterItem): Promise<void> {
  const { items } = await getAll()
  items.push(item)
  await saveItems(items)
}

export async function markAsRead(id: string): Promise<void> {
  const { items } = await getAll()
  const idx = items.findIndex((i) => i.id === id)
  if (idx !== -1) {
    items[idx].readAt = Date.now()
    await saveItems(items)
  }
}

export async function removeItem(id: string): Promise<void> {
  const { items } = await getAll()
  await saveItems(items.filter((i) => i.id !== id))
}

export async function updateSettings(s: Partial<ExtensionSettings>): Promise<void> {
  const { settings } = await getAll()
  await chrome.storage.sync.set({ settings: normalizeSettings({ ...settings, ...s }) })
}

export async function getStoredTabsExport(): Promise<StoredTabsExport> {
  const { items } = await getAll()

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    items,
  }
}

export async function importStoredTabsFromText(text: string): Promise<ImportStoredTabsResult> {
  const importedItems = parseStoredTabsImport(text)
  const { items } = await getAll()
  const seenUrls = new Set(items.map((item) => item.url))
  const seenIds = new Set(items.map((item) => item.id))
  const nextItems = [...items]
  let imported = 0
  let skipped = 0

  for (const item of importedItems) {
    if (seenUrls.has(item.url)) {
      skipped += 1
      continue
    }

    const nextItem = seenIds.has(item.id) ? { ...item, id: crypto.randomUUID() } : item

    seenUrls.add(item.url)
    seenIds.add(nextItem.id)
    nextItems.push(nextItem)
    imported += 1
  }

  if (imported > 0) {
    await saveItems(nextItems)
  }

  return {
    imported,
    skipped,
    total: importedItems.length,
  }
}

function parseStoredTabsImport(text: string): ReadLaterItem[] {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Choose a valid JSON export file.')
  }

  const rawItems = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.items)
      ? parsed.items
      : null

  if (!rawItems) {
    throw new Error('This file does not contain exported tabs.')
  }

  return rawItems.map((item, index) => normalizeImportedItem(item, index))
}

function normalizeImportedItem(item: unknown, index: number): ReadLaterItem {
  if (!isRecord(item)) {
    throw new Error(`Tab ${index + 1} is not a valid item.`)
  }

  const url = typeof item.url === 'string' ? item.url.trim() : ''
  if (!url) {
    throw new Error(`Tab ${index + 1} is missing a URL.`)
  }

  try {
    new URL(url)
  } catch {
    throw new Error(`Tab ${index + 1} has an invalid URL.`)
  }

  const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : url
  const favicon = typeof item.favicon === 'string' ? item.favicon : ''
  const savedAt = normalizeTimestamp(item.savedAt, Date.now())
  const readAt = item.readAt === null || item.readAt === undefined
    ? null
    : normalizeTimestamp(item.readAt, Date.now())

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : crypto.randomUUID(),
    url,
    title,
    favicon,
    savedAt,
    readAt,
  }
}

function normalizeTimestamp(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function bumpItem(id: string): Promise<void> {
  const { items } = await getAll()
  const idx = items.findIndex((i) => i.id === id)
  if (idx !== -1) {
    items[idx].savedAt = Date.now()
    await saveItems(items)
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

export function savedAgeColorClass(timestamp: number): string {
  const ageDays = Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24))

  if (ageDays >= 60) return 'text-red-600 dark:text-red-400'
  if (ageDays >= 30) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

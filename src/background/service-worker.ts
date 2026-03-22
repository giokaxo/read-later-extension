import { getAll, isItemSaved, saveItem } from '../lib/storage'
import type { ReadLaterItem } from '../lib/types'

async function updateBadge(url: string) {
  const { items } = await getAll()
  const saved = isItemSaved(items, url)
  if (saved) {
    await chrome.action.setBadgeText({ text: '✓' })
    await chrome.action.setBadgeBackgroundColor({ color: '#22c55e' })
  } else {
    await chrome.action.setBadgeText({ text: '' })
  }
}

async function applyToolbarAction() {
  const { settings } = await getAll()
  if (settings.toolbarAction === 'auto-save') {
    await chrome.action.setPopup({ popup: '' })
  } else {
    await chrome.action.setPopup({ popup: 'popup.html' })
  }
}

chrome.runtime.onInstalled.addListener(applyToolbarAction)
chrome.runtime.onStartup.addListener(applyToolbarAction)

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    if (tab.url) await updateBadge(tab.url)
  } catch {
    // tab may not be accessible
  }
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url) {
    await updateBadge(tab.url)
  }
})

chrome.storage.onChanged.addListener(async (changes) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.url) await updateBadge(tab.url)

  if (changes.settings) {
    await applyToolbarAction()
  }
})

// Fires only when popup is disabled (auto-save mode)
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return

  const { items } = await getAll()
  if (isItemSaved(items, tab.url)) return // already saved

  const newItem: ReadLaterItem = {
    id: crypto.randomUUID(),
    url: tab.url,
    title: tab.title ?? tab.url,
    favicon: tab.favIconUrl ?? '',
    savedAt: Date.now(),
    readAt: null,
  }
  await saveItem(newItem)

  await chrome.action.setBadgeText({ text: '✓' })
  await chrome.action.setBadgeBackgroundColor({ color: '#22c55e' })
})

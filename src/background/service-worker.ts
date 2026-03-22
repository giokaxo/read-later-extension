import { getAll, isItemSaved } from '../lib/storage'

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

chrome.storage.onChanged.addListener(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.url) await updateBadge(tab.url)
})

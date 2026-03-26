import { getAll, isItemSaved } from '../lib/storage'

function formatUnreadCount(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}

async function updateBadge(url: string) {
  const { items } = await getAll()
  const saved = isItemSaved(items, url)
  if (saved) {
    await chrome.action.setBadgeText({ text: '✓' })
    await chrome.action.setBadgeBackgroundColor({ color: '#22c55e' })
  } else {
    const unreadCount = items.filter((item) => item.readAt === null).length
    await chrome.action.setBadgeText({ text: formatUnreadCount(unreadCount) })
    await chrome.action.setBadgeBackgroundColor({ color: '#2563eb' })
  }
}

async function refreshActiveTabBadge() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.url) await updateBadge(tab.url)
  } catch {
    // active tab may not be accessible
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
  await refreshActiveTabBadge()
})

void refreshActiveTabBadge()

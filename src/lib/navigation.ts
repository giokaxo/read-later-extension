export const SETTINGS_PANEL_QUERY_KEY = 'settings'
export const SETTINGS_PANEL_QUERY_VALUE = 'open'

export function getSettingsPanelUrl() {
  const url = new URL(chrome.runtime.getURL('newtab.html'))
  url.searchParams.set(SETTINGS_PANEL_QUERY_KEY, SETTINGS_PANEL_QUERY_VALUE)
  return url.toString()
}

export function hasSettingsPanelQuery(url: string) {
  return new URL(url).searchParams.get(SETTINGS_PANEL_QUERY_KEY) === SETTINGS_PANEL_QUERY_VALUE
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function isRestrictedUrl(url?: string): boolean {
  return !url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')
}

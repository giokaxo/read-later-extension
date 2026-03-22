<script lang="ts">
  import { onMount } from 'svelte'
  import { BookmarkPlus, ExternalLink, RefreshCw, Settings } from 'lucide-svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Card, CardContent } from '$lib/components/ui/card/index.js'
  import {
    getAll,
    markAsRead,
    bumpItem,
    selectSuggestion,
    relativeTime,
  } from '$lib/storage.js'
  import type { ReadLaterItem, ExtensionSettings } from '$lib/types.js'

  let items = $state<ReadLaterItem[]>([])
  let settings = $state<ExtensionSettings>({ algorithm: 'chronological' })
  let loading = $state(true)
  let skippedIds = $state<Set<string>>(new Set())

  let suggestion = $derived(
    selectSuggestion(
      items.filter((i) => !skippedIds.has(i.id)),
      settings.algorithm
    )
  )
  let unreadCount = $derived(items.filter((i) => i.readAt === null).length)

  onMount(async () => {
    const data = await getAll()
    items = data.items
    settings = data.settings
    loading = false
  })

  async function handleReadNow() {
    if (!suggestion) return
    await markAsRead(suggestion.id)
    const data = await getAll()
    items = data.items
    skippedIds = new Set()
  }

  async function handleSkip() {
    if (!suggestion) return
    if (settings.algorithm === 'random') {
      skippedIds = new Set([...skippedIds, suggestion.id])
    } else {
      await bumpItem(suggestion.id)
      const data = await getAll()
      items = data.items
    }
  }

  function openOptions() {
    chrome.runtime.openOptionsPage()
  }

  function formatDate(ts: number) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(ts))
  }
</script>

<div class="relative flex min-h-screen flex-col items-center justify-center bg-background p-8">
  <!-- Top-right settings -->
  <button
    onclick={openOptions}
    class="absolute right-6 top-6 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    title="Settings"
  >
    <Settings class="h-5 w-5" />
  </button>

  {#if loading}
    <div class="flex flex-col items-center gap-4">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
    </div>
  {:else if suggestion}
    <div class="w-full max-w-lg">
      <!-- Prompt -->
      <p class="mb-6 text-center text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Time to read
      </p>

      <Card class="shadow-md">
        <CardContent class="p-6">
          <div class="flex items-start gap-3">
            {#if suggestion.favicon}
              <img
                src={suggestion.favicon}
                alt=""
                class="mt-0.5 h-5 w-5 flex-shrink-0 rounded"
                onerror="this.style.display='none'"
              />
            {:else}
              <div class="mt-0.5 h-5 w-5 flex-shrink-0 rounded bg-muted"></div>
            {/if}
            <div class="min-w-0 flex-1">
              <h2 class="text-base font-semibold leading-snug text-foreground line-clamp-2">
                {suggestion.title || suggestion.url}
              </h2>
              <p class="mt-1 truncate text-xs text-muted-foreground">
                {suggestion.url}
              </p>
              <p class="mt-2 text-xs text-muted-foreground">
                Saved {formatDate(suggestion.savedAt)} &middot; {relativeTime(suggestion.savedAt)}
              </p>
            </div>
          </div>

          <div class="mt-5 flex gap-2">
            <Button
              class="flex-1 gap-2"
              onclick={handleReadNow}
            >
              <ExternalLink class="h-4 w-4" />
              Read Now
            </Button>
            <Button
              variant="outline"
              class="gap-2"
              onclick={handleSkip}
              title="Skip — suggest another"
            >
              <RefreshCw class="h-4 w-4" />
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>

      {#if unreadCount > 1}
        <p class="mt-4 text-center text-xs text-muted-foreground">
          {unreadCount - 1} more saved {unreadCount - 1 === 1 ? 'item' : 'items'}
        </p>
      {/if}
    </div>
  {:else}
    <div class="flex flex-col items-center gap-3 text-center">
      <BookmarkPlus class="h-12 w-12 text-muted-foreground/40" />
      <p class="text-lg font-medium text-foreground">Nothing to read yet</p>
      <p class="max-w-xs text-sm text-muted-foreground">
        Click the extension icon in your toolbar to save tabs for later.
      </p>
    </div>
  {/if}
</div>

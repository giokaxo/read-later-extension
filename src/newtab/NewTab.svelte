<script lang="ts">
  import { onMount } from 'svelte'
  import { BookmarkPlus, ExternalLink, RefreshCw, Settings, Check, X } from 'lucide-svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    getAll,
    markAsRead,
    removeItem,
    bumpItem,
    selectSuggestion,
    relativeTime,
  } from '$lib/storage.js'
  import type { ReadLaterItem, ExtensionSettings } from '$lib/types.js'

  let items = $state<ReadLaterItem[]>([])
  let settings = $state<ExtensionSettings>({ algorithm: 'chronological' })
  let loading = $state(true)
  let skippedIds = $state<Set<string>>(new Set())

  let unread = $derived(
    items.filter((i) => i.readAt === null).sort((a, b) => a.savedAt - b.savedAt)
  )

  let suggestion = $derived(
    selectSuggestion(
      unread.filter((i) => !skippedIds.has(i.id)),
      settings.algorithm
    )
  )

  let otherItems = $derived(unread.filter((i) => i.id !== suggestion?.id))

  onMount(async () => {
    const data = await getAll()
    items = data.items
    settings = data.settings
    loading = false
  })

  async function handleReadNow(item: ReadLaterItem) {
    await markAsRead(item.id)
    window.location.href = item.url
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

  async function handleMarkRead(id: string) {
    await markAsRead(id)
    const data = await getAll()
    items = data.items
  }

  async function handleRemove(id: string) {
    await removeItem(id)
    const data = await getAll()
    items = data.items
  }

  function openOptions() {
    chrome.runtime.openOptionsPage()
  }

  function formatDate(ts: number) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ts))
  }

  function getDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return url
    }
  }

  // Slight rotation for paper stack effect, alternates and varies by index
  function paperRotation(i: number): string {
    const rotations = [0.6, -0.5, 0.8, -0.7, 0.4, -0.6, 0.5]
    return `rotate(${rotations[i % rotations.length]}deg)`
  }
</script>

<div class="min-h-screen bg-stone-100 dark:bg-stone-900">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 py-5">
    <div class="flex items-center gap-2">
      <BookmarkPlus class="h-4 w-4 text-stone-500" />
      <span class="text-sm font-medium text-stone-600 dark:text-stone-400">Read Later</span>
      {#if unread.length > 0}
        <span class="rounded-full bg-stone-700 px-2 py-0.5 text-xs font-semibold text-white dark:bg-stone-300 dark:text-stone-900">
          {unread.length}
        </span>
      {/if}
    </div>
    <button
      onclick={openOptions}
      class="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-800"
      title="Settings"
    >
      <Settings class="h-4 w-4" />
    </button>
  </div>

  <div class="flex flex-col items-center px-6 pb-16 pt-8">
    {#if loading}
      <div class="flex justify-center pt-32">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-stone-400 border-t-transparent"></div>
      </div>

    {:else if unread.length === 0}
      <div class="flex flex-col items-center gap-3 pt-32 text-center">
        <BookmarkPlus class="h-10 w-10 text-stone-300" />
        <p class="font-medium text-stone-500">Nothing saved yet</p>
        <p class="max-w-xs text-sm text-stone-400">
          Click the extension icon to save tabs for later.
        </p>
      </div>

    {:else}
      <!-- ── MAIN SUGGESTION (large paper on top) ── -->
      {#if suggestion}
        <div class="relative w-full max-w-lg">
          <!-- Stack depth papers (behind the main card) -->
          {#if otherItems.length >= 2}
            <div
              class="absolute inset-x-0 top-0 h-full rounded-2xl border border-stone-300 bg-stone-200 dark:border-stone-700 dark:bg-stone-800"
              style="transform: translate(8px, 9px) rotate(2.5deg);"
            ></div>
          {/if}
          {#if otherItems.length >= 1}
            <div
              class="absolute inset-x-0 top-0 h-full rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-850"
              style="transform: translate(-5px, 5px) rotate(-1.5deg);"
            ></div>
          {/if}

          <!-- Main card -->
          <div class="relative z-10 rounded-2xl border border-stone-200 bg-white p-8 shadow-md dark:border-stone-700 dark:bg-stone-800">
            <!-- Label -->
            <p class="mb-5 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Suggested for you
            </p>

            <!-- Favicon + domain + title -->
            <div class="flex items-start gap-4">
              {#if suggestion.favicon}
                <img
                  src={suggestion.favicon}
                  alt=""
                  class="mt-1 h-10 w-10 shrink-0 rounded-lg"
                  onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                />
              {:else}
                <div class="mt-1 h-10 w-10 shrink-0 rounded-lg bg-stone-100 dark:bg-stone-700"></div>
              {/if}
              <div class="min-w-0 flex-1">
                <span class="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500 dark:bg-stone-700 dark:text-stone-400">
                  {getDomain(suggestion.url)}
                </span>
                <h2 class="mt-2 text-2xl font-semibold leading-snug text-stone-900 dark:text-stone-100 line-clamp-3">
                  {suggestion.title || suggestion.url}
                </h2>
                <p class="mt-2 text-sm text-stone-400 line-clamp-2 break-all">{suggestion.url}</p>
              </div>
            </div>

            <!-- Meta row -->
            <div class="mt-5 flex items-center gap-4 border-t border-stone-100 pt-4 text-xs text-stone-400 dark:border-stone-700">
              <span>Saved {formatDate(suggestion.savedAt)}</span>
              <span>·</span>
              <span>{relativeTime(suggestion.savedAt)}</span>
              {#if unread.length > 1}
                <span>·</span>
                <span>{unread.length - 1} other {unread.length - 1 === 1 ? 'item' : 'items'} waiting</span>
              {/if}
            </div>

            <!-- Actions -->
            <div class="mt-5 flex gap-2">
              <Button class="flex-1 gap-2 h-11 text-base" onclick={() => handleReadNow(suggestion!)}>
                <ExternalLink class="h-4 w-4" />
                Read Now
              </Button>
              <Button variant="outline" class="gap-2 h-11" onclick={handleSkip}>
                <RefreshCw class="h-4 w-4" />
                Skip
              </Button>
            </div>
          </div>
        </div>
      {/if}

      <!-- ── OTHER ITEMS (smaller papers below) ── -->
      {#if otherItems.length > 0}
        <div class="mt-8 w-full max-w-lg space-y-2">
          {#each otherItems as item, i (item.id)}
            <div
              class="group relative rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-800"
              style="transform: {paperRotation(i)};"
            >
              <div class="flex items-center gap-3">
                {#if item.favicon}
                  <img
                    src={item.favicon}
                    alt=""
                    class="h-4 w-4 shrink-0 rounded"
                    onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                  />
                {:else}
                  <div class="h-4 w-4 shrink-0 rounded bg-stone-100"></div>
                {/if}

                <button
                  onclick={() => handleReadNow(item)}
                  class="min-w-0 flex-1 text-left"
                >
                  <p class="truncate text-sm font-medium text-stone-800 group-hover:text-stone-900 dark:text-stone-200">
                    {item.title || item.url}
                  </p>
                  <p class="truncate text-xs text-stone-400">{relativeTime(item.savedAt)}</p>
                </button>

                <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onclick={() => handleMarkRead(item.id)}
                    class="rounded p-1 text-stone-400 hover:bg-green-50 hover:text-green-600"
                    title="Mark as read"
                  >
                    <Check class="h-3.5 w-3.5" />
                  </button>
                  <button
                    onclick={() => handleRemove(item.id)}
                    class="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
                    title="Remove"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

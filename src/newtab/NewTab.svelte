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
    updateSettings,
  } from '$lib/storage.js'
  import { normalizeSettings } from '$lib/settings.js'
  import type { ReadLaterItem, ExtensionSettings, SuggestionAlgorithm } from '$lib/types.js'

  let items = $state<ReadLaterItem[]>([])
  let settings = $state<ExtensionSettings>({ algorithm: 'chronological' })
  let loading = $state(true)
  let skippedIds = $state<Set<string>>(new Set())
  let hoveredId = $state<string | null>(null)
  let stackExpanded = $state(false)

  const COLLAPSED_STEP = 28   // px per card when stacked
  const EXPANDED_STEP  = 68   // px per card when spread (full card visible + gap)

  let settingsOpen = $state(false)
  let settingsAlgorithm = $state<SuggestionAlgorithm>('chronological')
  let settingsSaved = $state(false)

  const algorithms: { value: SuggestionAlgorithm; label: string; description: string }[] = [
    { value: 'chronological', label: 'Oldest First', description: 'Suggest items in the order they were saved' },
    { value: 'reverse-chronological', label: 'Newest First', description: 'Suggest the most recently saved items first' },
    { value: 'random', label: 'Random', description: 'Pick a random saved item each time' },
  ]

  function openSettings() {
    settingsAlgorithm = settings.algorithm
    settingsSaved = false
    settingsOpen = true
  }

  async function handleSaveSettings() {
    await updateSettings({ algorithm: settingsAlgorithm })
    settings = { ...settings, algorithm: settingsAlgorithm }
    settingsSaved = true
    setTimeout(() => {
      settingsSaved = false
      settingsOpen = false
    }, 1200)
  }

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

    function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>) {
      if (changes.items) items = changes.items.newValue ?? []
      if (changes.settings) settings = normalizeSettings(changes.settings.newValue)
    }

    chrome.storage.onChanged.addListener(onStorageChanged)
    return () => chrome.storage.onChanged.removeListener(onStorageChanged)
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
      onclick={openSettings}
      class="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-800"
      title="Settings"
    >
      <Settings class="h-4 w-4" />
    </button>
  </div>

  <!-- Settings modal -->
  {#if settingsOpen}
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onclick={() => (settingsOpen = false)}
      onkeydown={(e) => e.key === 'Escape' && (settingsOpen = false)}
      role="presentation"
      tabindex="-1"
    >
      <!-- Panel -->
      <div
        class="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-700 dark:bg-stone-900"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-base font-semibold text-stone-900 dark:text-stone-100">Settings</h2>
          <button
            onclick={() => (settingsOpen = false)}
            class="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <p class="mb-1 text-sm font-medium text-stone-700 dark:text-stone-300">Suggestion Algorithm</p>
        <p class="mb-3 text-xs text-stone-400">How items are selected to show on new tab.</p>

        <div class="space-y-2">
          {#each algorithms as option (option.value)}
            <button
              class="w-full rounded-lg border px-4 py-3 text-left transition-colors {settingsAlgorithm === option.value
                ? 'border-stone-700 bg-stone-700/5 dark:border-stone-300 dark:bg-stone-300/10'
                : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700'}"
              onclick={() => (settingsAlgorithm = option.value)}
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-stone-800 dark:text-stone-200">{option.label}</span>
                {#if settingsAlgorithm === option.value}
                  <Check class="h-4 w-4 text-stone-700 dark:text-stone-300" />
                {/if}
              </div>
              <p class="mt-0.5 text-xs text-stone-400">{option.description}</p>
            </button>
          {/each}
        </div>

        <div class="mt-5">
          <Button onclick={handleSaveSettings} class="w-full gap-2">
            {#if settingsSaved}
              <Check class="h-4 w-4" />
              Saved
            {:else}
              Save Settings
            {/if}
          </Button>
        </div>
      </div>
    </div>
  {/if}

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

      <!-- ── STACK OF PAPERS (below main card) ── -->
      {#if otherItems.length > 0}
        <div class="mt-12 w-full max-w-lg">
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
            Reading pile · {otherItems.length}
          </p>

          <!-- Container: hover spreads the pile -->
          <div
            class="relative"
            onmouseenter={() => (stackExpanded = true)}
            onmouseleave={() => { stackExpanded = false; hoveredId = null }}
            role="list"
          >
            {#each otherItems as item, i (item.id)}
              {@const isHovered = hoveredId === item.id}
              {@const step = stackExpanded ? EXPANDED_STEP : COLLAPSED_STEP}
              <div
                class="absolute w-full cursor-pointer rounded-2xl border bg-white dark:bg-stone-800"
                style="
                  top: {i * step}px;
                  z-index: {isHovered ? 100 : otherItems.length - i};
                  border-color: {isHovered ? 'rgb(214 211 209)' : 'rgb(231 229 228)'};
                  transform: {isHovered
                    ? 'translateY(-20px) scale(1.025)'
                    : stackExpanded ? 'none' : paperRotation(i)};
                  box-shadow: {isHovered
                    ? '0 24px 48px -8px rgba(0,0,0,0.20), 0 8px 16px -4px rgba(0,0,0,0.10)'
                    : stackExpanded
                      ? '0 2px 8px rgba(0,0,0,0.08)'
                      : '0 1px 4px rgba(0,0,0,0.06)'};
                  transition:
                    top    0.28s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
                    box-shadow 0.22s ease,
                    border-color 0.15s ease;
                "
                onmouseenter={() => (hoveredId = item.id)}
                onmouseleave={() => (hoveredId = null)}
                role="listitem"
              >
                <!-- Always-visible strip -->
                <div class="flex items-center gap-3 px-5 py-3.5">
                  {#if item.favicon}
                    <img
                      src={item.favicon}
                      alt=""
                      class="h-4 w-4 shrink-0 rounded"
                      onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                    />
                  {:else}
                    <div class="h-4 w-4 shrink-0 rounded bg-stone-100 dark:bg-stone-700"></div>
                  {/if}
                  <p class="min-w-0 flex-1 truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                    {item.title || item.url}
                  </p>
                  <span class="shrink-0 text-xs text-stone-400">{relativeTime(item.savedAt)}</span>
                </div>

                <!-- Expanded section: smooth via grid-rows trick -->
                <div
                  style="
                    display: grid;
                    grid-template-rows: {isHovered ? '1fr' : '0fr'};
                    overflow: hidden;
                    transition: grid-template-rows 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
                  "
                >
                  <div style="min-height: 0" class="overflow-hidden">
                    <div class="border-t border-stone-100 px-5 pb-4 pt-3 dark:border-stone-700">
                      <p class="mb-0.5 text-xs font-medium text-stone-500">{getDomain(item.url)}</p>
                      <p class="truncate text-xs text-stone-400">{item.url}</p>
                      <p class="mt-1 text-xs text-stone-400">Saved {formatDate(item.savedAt)}</p>
                      <div class="mt-3 flex gap-2">
                        <Button class="h-8 flex-1 gap-1.5 text-xs" onclick={() => handleReadNow(item)}>
                          <ExternalLink class="h-3.5 w-3.5" />
                          Read Now
                        </Button>
                        <button
                          onclick={() => handleMarkRead(item.id)}
                          class="flex h-8 items-center gap-1.5 rounded-md border border-stone-200 px-3 text-xs text-stone-500 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-600 dark:border-stone-600"
                          title="Mark as read"
                        >
                          <Check class="h-3.5 w-3.5" />
                          Done
                        </button>
                        <button
                          onclick={() => handleRemove(item.id)}
                          class="flex h-8 items-center rounded-md border border-stone-200 px-2.5 text-stone-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-stone-600"
                          title="Remove"
                        >
                          <X class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/each}

            <!-- Reactive spacer matches current step -->
            <div style="height: {otherItems.length * (stackExpanded ? EXPANDED_STEP : COLLAPSED_STEP) + 52}px;
                        transition: height 0.28s cubic-bezier(0.4, 0, 0.2, 1);"></div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

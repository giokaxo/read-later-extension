<script lang="ts">
  import { onMount } from 'svelte'
  import { BookmarkPlus, ExternalLink, RefreshCw, Settings, Check, X, Archive } from 'lucide-svelte'
  import SettingsEditor from '$lib/components/settings-editor.svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    getAll,
    markAsRead,
    removeItem,
    bumpItem,
    selectSuggestion,
    relativeTime,
  } from '$lib/storage.js'
  import { normalizeSettings } from '$lib/settings.js'
  import type { ReadLaterItem, ExtensionSettings } from '$lib/types.js'

  let items = $state<ReadLaterItem[]>([])
  let settings = $state<ExtensionSettings>(normalizeSettings())
  let loading = $state(true)
  let skippedIds = $state<Set<string>>(new Set())
  let hoveredId = $state<string | null>(null)
  let stackExpanded = $state(false)
  let settingsOpen = $state(false)

  const COLLAPSED_STEP = 28   // px per card when stacked
  const EXPANDED_STEP  = 68   // px per card when spread (full card visible + gap)

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

  $effect(() => {
    if (typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight

    if (settingsOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      document.body.style.overflow = 'hidden'

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
    }
  })

  function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>) {
    if (changes.items) {
      items = (changes.items.newValue as ReadLaterItem[] | undefined) ?? []
    }

    if (changes.settings) {
      settings = normalizeSettings(
        changes.settings.newValue as Partial<ExtensionSettings> | undefined
      )
    }
  }

  onMount(() => {
    chrome.storage.onChanged.addListener(onStorageChanged)

    void (async () => {
      const data = await getAll()
      items = data.items
      settings = data.settings
      loading = false
    })()

    return () => chrome.storage.onChanged.removeListener(onStorageChanged)
  })

  async function handleReadNow(item: ReadLaterItem) {
    await markAsRead(item.id)
    if (settings.linkTarget === 'new-tab') {
      window.open(item.url, '_blank')
    } else {
      window.location.href = item.url
    }
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

  function openSettings() {
    settingsOpen = true
  }

  // Slight rotation for paper stack effect, alternates and varies by index
  function paperRotation(i: number): string {
    const rotations = [0.6, -0.5, 0.8, -0.7, 0.4, -0.6, 0.5]
    return `rotate(${rotations[i % rotations.length]}deg)`
  }
</script>

<div class="min-h-screen bg-background">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 py-5">
    <div class="flex items-center gap-2">
      <BookmarkPlus class="h-4 w-4 text-primary" />
      <span class="text-sm font-medium text-muted-foreground">Read Later</span>
      {#if unread.length > 0}
        <span class="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {unread.length}
        </span>
      {/if}
    </div>
    <div class="flex items-center gap-1">
      <a
        href="archive.html"
        class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        title="Archive"
      >
        <Archive class="h-3.5 w-3.5" />
        Archive
      </a>
      <button
        onclick={openSettings}
        class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        title="Settings"
      >
        <Settings class="h-4 w-4" />
      </button>
    </div>
  </div>

  {#if settingsOpen}
    <div
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:items-center"
      onclick={() => (settingsOpen = false)}
      onkeydown={(e) => e.key === 'Escape' && (settingsOpen = false)}
      role="presentation"
      tabindex="-1"
    >
      <div
        class="flex h-[calc(100dvh-2rem)] max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div class="z-10 shrink-0 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 class="text-base font-semibold text-foreground">Settings</h2>
          </div>
          <button
            onclick={() => (settingsOpen = false)}
            class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Close settings"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <ScrollArea class="min-h-0 flex-1 overscroll-contain" type="always">
          <div class="px-5 pt-5">
            <SettingsEditor layout="panel" />
          </div>
        </ScrollArea>
      </div>
    </div>
  {/if}

  <div class="flex flex-col items-center px-6 pb-16 pt-8">
    {#if loading}
      <div class="flex justify-center pt-32">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>

    {:else if unread.length === 0}
      <div class="flex flex-col items-center gap-3 pt-32 text-center">
        <BookmarkPlus class="h-10 w-10 text-muted-foreground/30" />
        <p class="font-medium text-foreground">Nothing saved yet</p>
        <p class="max-w-xs text-sm text-muted-foreground">
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
              class="absolute inset-x-0 top-0 h-full rounded-2xl border border-border bg-muted/80"
              style="transform: translate(8px, 9px) rotate(2.5deg);"
            ></div>
          {/if}
          {#if otherItems.length >= 1}
            <div
              class="absolute inset-x-0 top-0 h-full rounded-2xl border border-border bg-background/80"
              style="transform: translate(-5px, 5px) rotate(-1.5deg);"
            ></div>
          {/if}

          <!-- Main card -->
          <div class="relative z-10 rounded-2xl border border-border bg-card p-8 shadow-md">
            <!-- Label -->
            <p class="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
                <div class="mt-1 h-10 w-10 shrink-0 rounded-lg bg-muted"></div>
              {/if}
              <div class="min-w-0 flex-1">
                <span class="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {getDomain(suggestion.url)}
                </span>
                <h2 class="mt-2 line-clamp-3 text-2xl font-semibold leading-snug text-foreground">
                  {suggestion.title || suggestion.url}
                </h2>
                <p class="mt-2 line-clamp-2 break-all text-sm text-muted-foreground">{suggestion.url}</p>
              </div>
            </div>

            <!-- Meta row -->
            <div class="mt-5 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
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
                {#if settings.linkTarget === 'new-tab'}
                  <ExternalLink class="h-4 w-4" />
                {/if}
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
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
                class="absolute w-full cursor-pointer rounded-2xl border bg-card"
                style="
                  top: {i * step}px;
                  z-index: {isHovered ? 100 : otherItems.length - i};
                  border-color: {isHovered ? 'hsl(var(--ring) / 0.45)' : 'hsl(var(--border))'};
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
                    <div class="h-4 w-4 shrink-0 rounded bg-muted"></div>
                  {/if}
                  <p class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {item.title || item.url}
                  </p>
                  <span class="shrink-0 text-xs text-muted-foreground">{relativeTime(item.savedAt)}</span>
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
                    <div class="border-t border-border px-5 pb-4 pt-3">
                      <p class="mb-0.5 text-xs font-medium text-secondary-foreground">{getDomain(item.url)}</p>
                      <p class="truncate text-xs text-muted-foreground">{item.url}</p>
                      <p class="mt-1 text-xs text-muted-foreground">Saved {formatDate(item.savedAt)}</p>
                      <div class="mt-3 flex gap-2">
                        <Button class="h-8 flex-1 gap-1.5 text-xs" onclick={() => handleReadNow(item)}>
                          {#if settings.linkTarget === 'new-tab'}
                            <ExternalLink class="h-3.5 w-3.5" />
                          {/if}
                          Read Now
                        </Button>
                        <button
                          onclick={() => handleMarkRead(item.id)}
                          class="flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                          title="Mark as read"
                        >
                          <Check class="h-3.5 w-3.5" />
                          Done
                        </button>
                        <button
                          onclick={() => handleRemove(item.id)}
                          class="flex h-8 items-center rounded-md border border-border px-2.5 text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
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

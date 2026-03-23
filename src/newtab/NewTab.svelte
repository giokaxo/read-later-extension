<script lang="ts">
  import { onMount } from 'svelte'
  import { Archive, BookmarkPlus, Settings } from 'lucide-svelte'
  import EmptyState from '$lib/components/empty-state.svelte'
  import LoadingState from '$lib/components/loading-state.svelte'
  import PageHeader from '$lib/components/page-header.svelte'
  import ReadingPile from '$lib/components/reading-pile.svelte'
  import SettingsEditor from '$lib/components/settings-editor.svelte'
  import SettingsModal from '$lib/components/settings-modal.svelte'
  import SuggestionCard from '$lib/components/suggestion-card.svelte'
  import {
    getAll,
    markAsRead,
    removeItem,
    bumpItem,
    selectSuggestion,
  } from '$lib/storage.js'
  import {
    hasSettingsPanelQuery,
    SETTINGS_PANEL_QUERY_KEY,
  } from '$lib/navigation.js'
  import { normalizeSettings } from '$lib/settings.js'
  import type { ReadLaterItem, ExtensionSettings } from '$lib/types.js'

  let items = $state<ReadLaterItem[]>([])
  let settings = $state<ExtensionSettings>(normalizeSettings())
  let loading = $state(true)
  let skippedIds = $state<Set<string>>(new Set())
  let hoveredId = $state<string | null>(null)
  let stackExpanded = $state(false)
  let stackContainer = $state<HTMLDivElement | null>(null)
  let stackViewportHeight = $state(0)
  let settingsOpen = $state(false)
  let suggestionId = $state<string | null>(null)
  let pileSortOrder = $state<'oldest-first' | 'newest-first'>('oldest-first')

  const STACK_CARD_STRIP_HEIGHT = 56
  const STACK_LIST_GAP = 12
  const STACK_PREVIEW_LIMIT = 6
  const STACK_BOTTOM_MARGIN = 24

  let unread = $derived(
    items.filter((i) => i.readAt === null).sort((a, b) => a.savedAt - b.savedAt)
  )

  let suggestionPool = $derived(unread.filter((i) => !skippedIds.has(i.id)))
  let suggestion = $derived(
    suggestionId ? suggestionPool.find((item) => item.id === suggestionId) ?? null : null
  )

  let otherItemsBase = $derived(unread.filter((i) => i.id !== suggestion?.id))
  let otherItems = $derived(
    pileSortOrder === 'oldest-first' ? otherItemsBase : [...otherItemsBase].reverse()
  )
  let pileSortLabel = $derived(pileSortOrder === 'oldest-first' ? 'Oldest first' : 'Newest first')
  let previewItems = $derived(otherItems.slice(0, STACK_PREVIEW_LIMIT))
  let hiddenStackCount = $derived(Math.max(otherItems.length - previewItems.length, 0))
  let collapsedStackHeight = $derived(
    previewItems.length === 0
      ? 0
      : previewItems.length * STACK_CARD_STRIP_HEIGHT + (previewItems.length - 1) * STACK_LIST_GAP
  )
  let stackContainerHeight = $derived(
    stackViewportHeight > 0 ? Math.max(collapsedStackHeight, stackViewportHeight) : collapsedStackHeight
  )

  $effect(() => {
    const nextSuggestion =
      settings.algorithm === 'random'
        ? suggestion && suggestionPool.some((item) => item.id === suggestion.id)
          ? suggestion
          : selectSuggestion(suggestionPool, settings.algorithm)
        : selectSuggestion(suggestionPool, settings.algorithm)

    const nextSuggestionId = nextSuggestion?.id ?? null
    if (suggestionId !== nextSuggestionId) {
      suggestionId = nextSuggestionId
    }
  })

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
    if (hasSettingsPanelQuery(window.location.href)) {
      settingsOpen = true
    }

    chrome.storage.onChanged.addListener(onStorageChanged)

    const handleResize = () => updateStackViewportHeight()
    window.addEventListener('resize', handleResize)
    updateStackViewportHeight()

    void (async () => {
      const data = await getAll()
      items = data.items
      settings = data.settings
      loading = false
    })()

    return () => {
      window.removeEventListener('resize', handleResize)
      chrome.storage.onChanged.removeListener(onStorageChanged)
    }
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

  function openSettings() {
    settingsOpen = true
    syncSettingsUrl(true)
  }

  function closeSettings() {
    settingsOpen = false
    syncSettingsUrl(false)
  }

  function syncSettingsUrl(open: boolean) {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)

    if (open) {
      url.searchParams.set(SETTINGS_PANEL_QUERY_KEY, 'open')
    } else {
      url.searchParams.delete(SETTINGS_PANEL_QUERY_KEY)
    }

    window.history.replaceState({}, '', url)
  }

  function updateStackViewportHeight() {
    if (!stackContainer || typeof window === 'undefined') return

    const { top } = stackContainer.getBoundingClientRect()
    stackViewportHeight = Math.max(
      collapsedStackHeight,
      Math.floor(window.innerHeight - top - STACK_BOTTOM_MARGIN)
    )
  }

  function togglePileSortOrder() {
    pileSortOrder = pileSortOrder === 'oldest-first' ? 'newest-first' : 'oldest-first'
  }

  $effect(() => {
    otherItems.length
    if (!stackContainer || typeof window === 'undefined') return

    const frame = requestAnimationFrame(() => updateStackViewportHeight())
    return () => cancelAnimationFrame(frame)
  })
</script>

<div class="flex h-dvh flex-col overflow-hidden bg-background">
  <PageHeader title="Read Later" count={unread.length} icon={BookmarkPlus}>
    {#snippet actions()}
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
    {/snippet}
  </PageHeader>

  {#if settingsOpen}
    <SettingsModal onClose={closeSettings}>
      {#snippet children()}
        <SettingsEditor layout="panel" />
      {/snippet}
    </SettingsModal>
  {/if}

  <div class="flex min-h-0 flex-1 flex-col items-center overflow-hidden px-6 pb-8 pt-8">
    {#if loading}
      <LoadingState />
    {:else if unread.length === 0}
      <EmptyState
        icon={BookmarkPlus}
        title="Nothing saved yet"
        description="Click the extension icon to save tabs for later."
        class="pt-32"
      />
    {:else}
      {#if suggestion}
        <SuggestionCard
          item={suggestion}
          unreadCount={unread.length}
          linkTarget={settings.linkTarget}
          stackedCount={otherItems.length}
          onReadNow={handleReadNow}
          onSkip={handleSkip}
        />
      {/if}

      {#if otherItems.length > 0}
        <ReadingPile
          items={otherItems}
          expanded={stackExpanded}
          containerHeight={stackContainerHeight}
          hiddenCount={hiddenStackCount}
          bind:stackContainer
          bind:hoverId={hoveredId}
          sortLabel={pileSortLabel}
          showSortToggle={otherItems.length > 1}
          linkTarget={settings.linkTarget}
          onExpandChange={(expanded) => {
            stackExpanded = expanded
          }}
          onToggleSort={togglePileSortOrder}
          onReadNow={handleReadNow}
          onMarkRead={handleMarkRead}
          onRemove={handleRemove}
          onMeasure={updateStackViewportHeight}
        />
      {/if}
    {/if}
  </div>
</div>

<script lang="ts">
  import { onMount } from 'svelte'
  import { BookmarkPlus, CheckCheck, Check, Settings, X } from 'lucide-svelte'
  import PageHeader from '$lib/components/page-header.svelte'
  import PopupRecentItem from '$lib/components/popup-recent-item.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import {
    getAll,
    saveItem,
    markAsRead,
    removeItem,
    isItemSaved,
    relativeTime,
  } from '$lib/storage.js'
  import { isRestrictedUrl } from '$lib/format.js'
  import type { ReadLaterItem } from '$lib/types.js'

  let items = $state<ReadLaterItem[]>([])
  let currentTab = $state<chrome.tabs.Tab | null>(null)
  let loading = $state(true)
  let saving = $state(false)
  // null = not in auto-save mode; 'saved' = just saved; 'already-saved' = was already in list
  let autoSaveResult = $state<'saved' | 'already-saved' | null>(null)
  let autoSavedItemId = $state<string | null>(null)

  let currentItem = $derived(
    currentTab?.url ? isItemSaved(items, currentTab.url) : undefined
  )
  let isSaved = $derived(!!currentItem)
  let unreadCount = $derived(items.filter((i) => i.readAt === null).length)
  let recentItems = $derived(
    items
      .filter((i) => i.readAt === null)
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, 5)
  )

  async function closeCurrentTab() {
    const tabId = currentTab?.id
    if (tabId === undefined) {
      window.close()
      return
    }

    try {
      await chrome.tabs.remove(tabId)
    } catch {
      window.close()
    }
  }

  onMount(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentTab = tab ?? null
    const data = await getAll()
    items = data.items

    if (data.settings.toolbarAction === 'auto-save') {
      const url = tab?.url
      if (url && !isRestrictedUrl(url)) {
        const existing = isItemSaved(data.items, url)
        if (existing) {
          autoSavedItemId = existing.id
          autoSaveResult = 'already-saved'
        } else {
          const newItem: ReadLaterItem = {
            id: crypto.randomUUID(),
            url,
            title: tab?.title ?? url,
            favicon: tab?.favIconUrl ?? '',
            savedAt: Date.now(),
            readAt: null,
          }
          await saveItem(newItem)
          autoSavedItemId = newItem.id
          autoSaveResult = 'saved'
          await closeCurrentTab()
          return
        }
      } else {
        autoSaveResult = 'already-saved' // extension page, show neutral state
      }
      return
    }

    loading = false
  })

  async function handleMainAction() {
    if (saving) return
    saving = true

    if (isSaved && currentItem) {
      await markAsRead(currentItem.id)
      const data = await getAll()
      items = data.items
    } else if (currentTab?.url) {
      const newItem: ReadLaterItem = {
        id: crypto.randomUUID(),
        url: currentTab.url,
        title: currentTab.title ?? currentTab.url,
        favicon: currentTab.favIconUrl ?? '',
        savedAt: Date.now(),
        readAt: null,
      }
      await saveItem(newItem)
      await closeCurrentTab()
      return
    }

    saving = false
  }

  async function handleRemove(id: string) {
    await removeItem(id)
    const data = await getAll()
    items = data.items
  }

  function openOptions() {
    chrome.runtime.openOptionsPage()
  }
</script>

<div class="relative flex flex-col">
  <PageHeader title="Read Later" count={unreadCount} icon={BookmarkPlus}>
    {#snippet actions()}
      <button
        onclick={openOptions}
        class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        title="Settings"
      >
        <Settings class="h-4 w-4" />
      </button>
    {/snippet}
  </PageHeader>

  <Separator />

  <div class="px-4 py-3">
    {#if loading}
      <div class="h-10 rounded-md bg-muted animate-pulse"></div>
    {:else if isRestrictedUrl(currentTab?.url)}
      <p class="text-sm text-muted-foreground text-center py-1">
        Can't save this page.
      </p>
    {:else if isSaved}
      <Button
        class="w-full gap-2 border-green-500 text-green-600 hover:bg-green-50"
        variant="outline"
        onclick={handleMainAction}
        disabled={saving}
      >
        <CheckCheck class="h-4 w-4" />
        Mark as Read
      </Button>
    {:else}
      <Button
        class="w-full gap-2"
        onclick={handleMainAction}
        disabled={saving}
      >
        <BookmarkPlus class="h-4 w-4" />
        Save for Later
      </Button>
    {/if}
  </div>

  {#if recentItems.length > 0}
    <Separator />
    <div class="px-4 py-2">
      <p class="mb-2 text-xs font-medium text-muted-foreground">Saved</p>
      <ul class="space-y-1">
        {#each recentItems as item (item.id)}
          <PopupRecentItem {item} onRemove={handleRemove} />
        {/each}
      </ul>
    </div>
  {:else if !loading}
    <div class="px-4 pb-4 text-center">
      <p class="text-xs text-muted-foreground">No saved items yet.</p>
    </div>
  {/if}

  {#if autoSaveResult !== null}
    <div class="absolute inset-0 flex flex-col rounded-[inherit] bg-background">
      <div class="h-0.5 w-full rounded-t-[inherit] {autoSaveResult === 'saved' ? 'bg-green-500' : 'bg-border'}"></div>

      <div class="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
        {#if autoSaveResult === 'saved'}
          <div class="relative">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600 ring-1 ring-green-200">
              <Check class="h-7 w-7 stroke-[2.5]" />
            </div>
          </div>

          <div class="space-y-1">
            <p class="text-sm font-semibold text-foreground">Saved for later</p>
            <p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{currentTab?.title ?? currentTab?.url}</p>
          </div>

          <div class="flex w-full flex-col gap-2 pt-1">
            {#if autoSavedItemId}
              <button
                onclick={async () => { await handleRemove(autoSavedItemId!); window.close() }}
                class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
              >
                <X class="h-3.5 w-3.5" />
                Remove
              </button>
            {/if}
            <button
              onclick={() => window.close()}
              class="flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        {:else}
          <!-- Icon -->
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border">
            <BookmarkPlus class="h-7 w-7" />
          </div>

          <!-- Text -->
          <div class="space-y-1">
            <p class="text-sm font-semibold text-foreground">Already in your list</p>
            <p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{currentTab?.title ?? currentTab?.url}</p>
          </div>

          <!-- Actions -->
          <div class="flex w-full flex-col gap-2 pt-1">
            {#if autoSavedItemId}
              <button
                onclick={async () => { await handleRemove(autoSavedItemId!); window.close() }}
                class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
              >
                <X class="h-3.5 w-3.5" />
                Remove
              </button>
            {/if}
            <button
              onclick={() => window.close()}
              class="flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

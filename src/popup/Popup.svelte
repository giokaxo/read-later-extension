<script lang="ts">
  import { onMount } from 'svelte'
  import { BookmarkPlus, CheckCheck, Check, Settings, X } from 'lucide-svelte'
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

  onMount(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentTab = tab ?? null
    const data = await getAll()
    items = data.items

    if (data.settings.toolbarAction === 'auto-save') {
      const url = tab?.url
      if (url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://')) {
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
          const refreshed = await getAll()
          items = refreshed.items
          autoSavedItemId = newItem.id
          autoSaveResult = 'saved'
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
      const data = await getAll()
      items = data.items
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

  function isExtensionPage(url?: string) {
    return !url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')
  }
</script>

<div class="relative flex flex-col">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3">
    <div class="flex items-center gap-2">
      <BookmarkPlus class="h-4 w-4 text-primary" />
      <span class="text-sm font-semibold">Read Later</span>
      {#if unreadCount > 0}
        <span class="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {unreadCount}
        </span>
      {/if}
    </div>
    <button
      onclick={openOptions}
      class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      title="Settings"
    >
      <Settings class="h-4 w-4" />
    </button>
  </div>

  <Separator />

  <!-- Main action -->
  <div class="px-4 py-3">
    {#if loading}
      <div class="h-10 rounded-md bg-muted animate-pulse"></div>
    {:else if isExtensionPage(currentTab?.url)}
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

  <!-- Saved list -->
  {#if recentItems.length > 0}
    <Separator />
    <div class="px-4 py-2">
      <p class="mb-2 text-xs font-medium text-muted-foreground">Saved</p>
      <ul class="space-y-1">
        {#each recentItems as item (item.id)}
          <li class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent group">
            {#if item.favicon}
              <img src={item.favicon} alt="" class="h-4 w-4 flex-shrink-0 rounded-sm" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
            {:else}
              <div class="h-4 w-4 flex-shrink-0 rounded-sm bg-muted"></div>
            {/if}
            <a
              href={item.url}
              onclick={(e) => { e.preventDefault(); chrome.tabs.update({ url: item.url }) }}
              class="min-w-0 flex-1 truncate text-xs text-foreground hover:underline"
              title={item.title}
            >
              {item.title || item.url}
            </a>
            <span class="flex-shrink-0 text-xs text-muted-foreground">
              {relativeTime(item.savedAt)}
            </span>
            <button
              onclick={() => handleRemove(item.id)}
              class="flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              title="Remove"
            >
              <X class="h-3 w-3" />
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {:else if !loading}
    <div class="px-4 pb-4 text-center">
      <p class="text-xs text-muted-foreground">No saved items yet.</p>
    </div>
  {/if}

  <!-- Auto-save confirmation overlay -->
  {#if autoSaveResult !== null}
    <div class="absolute inset-0 flex flex-col rounded-[inherit] bg-background">
      <!-- Top accent bar -->
      <div class="h-0.5 w-full rounded-t-[inherit] {autoSaveResult === 'saved' ? 'bg-green-500' : 'bg-border'}"></div>

      <div class="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
        {#if autoSaveResult === 'saved'}
          <!-- Icon -->
          <div class="relative">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600 ring-1 ring-green-200">
              <Check class="h-7 w-7 stroke-[2.5]" />
            </div>
          </div>

          <!-- Text -->
          <div class="space-y-1">
            <p class="text-sm font-semibold text-foreground">Saved for later</p>
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

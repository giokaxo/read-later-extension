<script lang="ts">
  import { onMount } from 'svelte'
  import { BookmarkPlus, ArrowLeft, ExternalLink, Trash2 } from 'lucide-svelte'
  import { getAll, removeItem } from '$lib/storage.js'
  import type { ReadLaterItem } from '$lib/types.js'

  let items = $state<ReadLaterItem[]>([])
  let loading = $state(true)

  let archived = $derived(
    items.filter((i) => i.readAt !== null).sort((a, b) => b.readAt! - a.readAt!)
  )

    function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>) {
      if (changes.items) {
        items = (changes.items.newValue as ReadLaterItem[] | undefined) ?? []
      }
    }

    chrome.storage.onChanged.addListener(onStorageChanged)

  onMount(() => {
    void (async () => {
      const data = await getAll()
      items = data.items
      loading = false
    })()

    return () => chrome.storage.onChanged.removeListener(onStorageChanged)
  })

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
</script>

<div class="min-h-screen bg-stone-100 dark:bg-stone-900">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 py-5">
    <div class="flex items-center gap-3">
      <a
        href="newtab.html"
        class="flex items-center gap-1.5 rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-800"
        title="Back to new tab"
      >
        <ArrowLeft class="h-4 w-4" />
      </a>
      <div class="flex items-center gap-2">
        <BookmarkPlus class="h-4 w-4 text-stone-500" />
        <span class="text-sm font-medium text-stone-600 dark:text-stone-400">Archive</span>
        {#if archived.length > 0}
          <span class="rounded-full bg-stone-700 px-2 py-0.5 text-xs font-semibold text-white dark:bg-stone-300 dark:text-stone-900">
            {archived.length}
          </span>
        {/if}
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-2xl px-6 pb-16 pt-4">
    {#if loading}
      <div class="flex justify-center pt-32">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-stone-400 border-t-transparent"></div>
      </div>

    {:else if archived.length === 0}
      <div class="flex flex-col items-center gap-3 pt-32 text-center">
        <BookmarkPlus class="h-10 w-10 text-stone-300" />
        <p class="font-medium text-stone-500">Nothing archived yet</p>
        <p class="max-w-xs text-sm text-stone-400">
          Items you mark as read will appear here.
        </p>
      </div>

    {:else}
      <div class="space-y-2">
        {#each archived as item (item.id)}
          <div class="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
            {#if item.favicon}
              <img
                src={item.favicon}
                alt=""
                class="h-5 w-5 shrink-0 rounded"
                onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
              />
            {:else}
              <div class="h-5 w-5 shrink-0 rounded bg-stone-100 dark:bg-stone-700"></div>
            {/if}

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                {item.title || item.url}
              </p>
              <p class="text-xs text-stone-400">
                {getDomain(item.url)} · Read {formatDate(item.readAt!)}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                class="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700"
                title="Open"
              >
                <ExternalLink class="h-3.5 w-3.5" />
              </a>
              <button
                onclick={() => handleRemove(item.id)}
                class="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                title="Delete"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

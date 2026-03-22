<script lang="ts">
  import { onMount } from 'svelte'
  import { BookmarkPlus, ArrowLeft } from 'lucide-svelte'
  import ArchiveItemRow from '$lib/components/archive-item-row.svelte'
  import EmptyState from '$lib/components/empty-state.svelte'
  import LoadingState from '$lib/components/loading-state.svelte'
  import PageHeader from '$lib/components/page-header.svelte'
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

  onMount(() => {
    chrome.storage.onChanged.addListener(onStorageChanged)

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
</script>

<div class="min-h-screen bg-background">
  <PageHeader title="Archive" count={archived.length} icon={BookmarkPlus}>
    {#snippet prefix()}
      <a
        href="newtab.html"
        class="flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        title="Back to new tab"
      >
        <ArrowLeft class="h-4 w-4" />
      </a>
    {/snippet}
  </PageHeader>

  <div class="mx-auto max-w-2xl px-6 pb-16 pt-4">
    {#if loading}
      <LoadingState />
    {:else if archived.length === 0}
      <EmptyState
        icon={BookmarkPlus}
        title="Nothing archived yet"
        description="Items you mark as read will appear here."
        class="pt-32"
      />
    {:else}
      <div class="space-y-2">
        {#each archived as item (item.id)}
          <ArchiveItemRow {item} onRemove={handleRemove} />
        {/each}
      </div>
    {/if}
  </div>
</div>

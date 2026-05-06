<script lang="ts">
  import { X } from 'lucide-svelte'
  import ItemFavicon from '$lib/components/item-favicon.svelte'
  import { relativeTime, savedAgeColorClass } from '$lib/storage.js'
  import type { ReadLaterItem } from '$lib/types.js'

  let {
    item,
    onRemove,
  }: {
    item: ReadLaterItem
    onRemove: (id: string) => void | Promise<void>
  } = $props()

  function handleOpen(event: MouseEvent) {
    event.preventDefault()
    chrome.tabs.update({ url: item.url })
  }
</script>

<li class="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
  <ItemFavicon src={item.favicon} />
  <a
    href={item.url}
    onclick={handleOpen}
    class="min-w-0 flex-1 truncate text-xs text-foreground hover:underline"
    title={item.title}
  >
    {item.title || item.url}
  </a>
  <span class={['flex-shrink-0 text-xs font-medium', savedAgeColorClass(item.savedAt)]}>
    {relativeTime(item.savedAt)}
  </span>
  <button
    onclick={() => onRemove(item.id)}
    class="flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
    title="Remove"
  >
    <X class="h-3 w-3" />
  </button>
</li>

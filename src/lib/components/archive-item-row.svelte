<script lang="ts">
  import { ExternalLink, Trash2 } from 'lucide-svelte'
  import ItemFavicon from '$lib/components/item-favicon.svelte'
  import { formatDate, getDomain } from '$lib/format.js'
  import type { ReadLaterItem } from '$lib/types.js'

  let {
    item,
    onRemove,
  }: {
    item: ReadLaterItem
    onRemove: (id: string) => void | Promise<void>
  } = $props()
</script>

<div class="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
  <ItemFavicon src={item.favicon} sizeClass="h-5 w-5" roundedClass="rounded" />

  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-medium text-foreground">
      {item.title || item.url}
    </p>
    <p class="text-xs text-muted-foreground">
      {getDomain(item.url)} · Read {formatDate(item.readAt!)}
    </p>
  </div>

  <div class="flex shrink-0 items-center gap-1">
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      title="Open"
    >
      <ExternalLink class="h-3.5 w-3.5" />
    </a>
    <button
      onclick={() => onRemove(item.id)}
      class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      title="Delete"
    >
      <Trash2 class="h-3.5 w-3.5" />
    </button>
  </div>
</div>

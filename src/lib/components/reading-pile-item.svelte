<script lang="ts">
  import { Check, ExternalLink, X } from 'lucide-svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import ItemFavicon from '$lib/components/item-favicon.svelte'
  import { formatDate, getDomain } from '$lib/format.js'
  import { relativeTime, savedAgeColorClass } from '$lib/storage.js'
  import type { ReadLaterItem, LinkTarget } from '$lib/types.js'

  let {
    item,
    expanded,
    hovered,
    linkTarget,
    onReadNow,
    onMarkRead,
    onRemove,
    onHoverChange,
  }: {
    item: ReadLaterItem
    expanded: boolean
    hovered: boolean
    linkTarget: LinkTarget
    onReadNow: (item: ReadLaterItem) => void | Promise<void>
    onMarkRead: (id: string) => void | Promise<void>
    onRemove: (id: string) => void | Promise<void>
    onHoverChange: (hovered: boolean) => void
  } = $props()
</script>

<div
  class="rounded-2xl border bg-card"
  style="
    border-color: {hovered ? 'hsl(var(--ring) / 0.45)' : 'hsl(var(--border))'};
    transform: {hovered ? 'translateY(-2px)' : 'none'};
    box-shadow: {hovered
      ? '0 18px 36px -16px rgba(0,0,0,0.28), 0 8px 16px -10px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.08)'};
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.15s ease;
  "
  onmouseenter={() => onHoverChange(true)}
  onmouseleave={() => onHoverChange(false)}
  role="listitem"
>
  <div class="flex items-center gap-3 px-5 py-3.5">
    <ItemFavicon src={item.favicon} />
    <p class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
      {item.title || item.url}
    </p>
    <span class={['shrink-0 text-xs font-medium', savedAgeColorClass(item.savedAt)]}>
      {relativeTime(item.savedAt)}
    </span>
  </div>

  <div
    style="
      display: grid;
      grid-template-rows: {expanded ? '1fr' : '0fr'};
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
          <Button class="h-8 flex-1 gap-1.5 text-xs" onclick={() => onReadNow(item)}>
            {#if linkTarget === 'new-tab'}
              <ExternalLink class="h-3.5 w-3.5" />
            {/if}
            Read Now
          </Button>
          <button
            onclick={() => onMarkRead(item.id)}
            class="flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            title="Mark as read"
          >
            <Check class="h-3.5 w-3.5" />
            Done
          </button>
          <button
            onclick={() => onRemove(item.id)}
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

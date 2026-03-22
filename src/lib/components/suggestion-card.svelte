<script lang="ts">
  import { ExternalLink, RefreshCw } from 'lucide-svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import ItemFavicon from '$lib/components/item-favicon.svelte'
  import { formatDate, getDomain } from '$lib/format.js'
  import { relativeTime } from '$lib/storage.js'
  import type { ReadLaterItem, LinkTarget } from '$lib/types.js'

  let {
    item,
    unreadCount,
    linkTarget,
    onReadNow,
    onSkip,
    stackedCount,
  }: {
    item: ReadLaterItem
    unreadCount: number
    linkTarget: LinkTarget
    onReadNow: (item: ReadLaterItem) => void | Promise<void>
    onSkip: () => void | Promise<void>
    stackedCount: number
  } = $props()
</script>

<div class="relative w-full max-w-lg shrink-0">
  {#if stackedCount >= 2}
    <div
      class="absolute inset-x-0 top-0 h-full rounded-2xl border border-border bg-muted/80"
      style="transform: translate(8px, 9px) rotate(2.5deg);"
    ></div>
  {/if}
  {#if stackedCount >= 1}
    <div
      class="absolute inset-x-0 top-0 h-full rounded-2xl border border-border bg-background/80"
      style="transform: translate(-5px, 5px) rotate(-1.5deg);"
    ></div>
  {/if}

  <div class="relative z-10 flex h-112 flex-col overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-md">
    <p class="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      Suggested for you
    </p>

    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex min-h-0 items-start gap-4">
        <ItemFavicon src={item.favicon} sizeClass="mt-1 h-10 w-10" roundedClass="rounded-lg" />
        <div class="min-h-0 min-w-0 flex-1">
          <span class="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {getDomain(item.url)}
          </span>
          <h2 class="mt-2 line-clamp-4 text-2xl font-semibold leading-snug text-foreground">
            {item.title || item.url}
          </h2>
          <p class="mt-2 line-clamp-4 break-all text-sm text-muted-foreground">
            {item.url}
          </p>
        </div>
      </div>

      <div class="mt-auto flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Saved {formatDate(item.savedAt)}</span>
        <span>·</span>
        <span>{relativeTime(item.savedAt)}</span>
        {#if unreadCount > 1}
          <span>·</span>
          <span>{unreadCount - 1} other {unreadCount - 1 === 1 ? 'item' : 'items'} waiting</span>
        {/if}
      </div>

      <div class="mt-5 flex gap-2">
        <Button class="h-11 flex-1 gap-2 text-base" onclick={() => onReadNow(item)}>
          {#if linkTarget === 'new-tab'}
            <ExternalLink class="h-4 w-4" />
          {/if}
          Read Now
        </Button>
        <Button variant="outline" class="h-11 gap-2" onclick={onSkip}>
          <RefreshCw class="h-4 w-4" />
          Skip
        </Button>
      </div>
    </div>
  </div>
</div>

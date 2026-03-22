<script lang="ts">
  import { ArrowUpDown } from 'lucide-svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area/index.js'
  import ReadingPileItem from '$lib/components/reading-pile-item.svelte'
  import type { ReadLaterItem, LinkTarget } from '$lib/types.js'

  let {
    items,
    expanded = false,
    containerHeight,
    hiddenCount,
    stackContainer = $bindable<HTMLDivElement | null>(null),
    hoverId = $bindable<string | null>(null),
    sortLabel,
    showSortToggle,
    linkTarget,
    onExpandChange,
    onToggleSort,
    onReadNow,
    onMarkRead,
    onRemove,
    onMeasure,
  }: {
    items: ReadLaterItem[]
    expanded?: boolean
    containerHeight: number
    hiddenCount: number
    stackContainer?: HTMLDivElement | null
    hoverId?: string | null
    sortLabel: string
    showSortToggle: boolean
    linkTarget: LinkTarget
    onExpandChange: (expanded: boolean) => void
    onToggleSort: () => void
    onReadNow: (item: ReadLaterItem) => void | Promise<void>
    onMarkRead: (id: string) => void | Promise<void>
    onRemove: (id: string) => void | Promise<void>
    onMeasure: () => void
  } = $props()
</script>

<div class="group/pile mt-12 flex min-h-0 w-full max-w-lg flex-1 flex-col">
  <div class="mb-3 flex items-center justify-between gap-3">
    <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      Reading pile · {items.length}
    </p>
    {#if showSortToggle}
      <button
        type="button"
        onclick={onToggleSort}
        class="pointer-events-none inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground opacity-0 transition-all duration-200 group-hover/pile:pointer-events-auto group-hover/pile:opacity-100 group-focus-within/pile:pointer-events-auto group-focus-within/pile:opacity-100 hover:border-primary/40 hover:bg-background hover:text-foreground focus-visible:pointer-events-auto focus-visible:opacity-100"
        title={`Sort reading pile: ${sortLabel}`}
        aria-label={`Sort reading pile: ${sortLabel}. Click to toggle.`}
      >
        <ArrowUpDown class="h-3.5 w-3.5" />
        {sortLabel}
      </button>
    {/if}
  </div>

  <div
    class="relative min-h-0 flex-1 overflow-x-visible overflow-y-hidden bg-background/95"
    bind:this={stackContainer}
    onmouseenter={() => {
      onMeasure()
      onExpandChange(true)
    }}
    onmouseleave={() => {
      onExpandChange(false)
      hoverId = null
    }}
    style={`height: ${containerHeight}px;`}
    role="group"
    aria-label="Reading pile"
  >
    <ScrollArea
      class="h-full overflow-x-visible"
      type={expanded ? 'always' : 'auto'}
      orientation="vertical"
      showScrollbar={expanded}
      rootClass="overflow-x-visible overflow-y-hidden"
      viewportClass="overflow-x-visible"
    >
      <div class="h-full py-3" class:overscroll-contain={expanded} class:pointer-events-none={!expanded}>
        <div class="flex flex-col gap-3" role="list" aria-label="Reading pile">
          {#each items as item (item.id)}
            <ReadingPileItem
              {item}
              hovered={hoverId === item.id}
              {linkTarget}
              onReadNow={onReadNow}
              onMarkRead={onMarkRead}
              onRemove={onRemove}
              onHoverChange={(hovered) => {
                hoverId = hovered ? item.id : null
              }}
              expanded={expanded}
            />
          {/each}
        </div>
      </div>
    </ScrollArea>

    {#if hiddenCount > 0 && !expanded}
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background via-background/95 to-transparent"></div>
      <div class="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full border border-border bg-background/95 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
        +{hiddenCount} more
      </div>
    {/if}
  </div>
</div>

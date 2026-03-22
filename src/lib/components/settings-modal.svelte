<script lang="ts">
  import { X } from 'lucide-svelte'
  import type { Snippet } from 'svelte'
  import { ScrollArea } from '$lib/components/ui/scroll-area/index.js'

  let {
    title = 'Settings',
    onClose,
    children,
  }: {
    title?: string
    onClose: () => void
    children: Snippet
  } = $props()

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose()
    }
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:items-center"
  onclick={onClose}
  onkeydown={handleKeydown}
  role="presentation"
  tabindex="-1"
>
  <div
    class="flex h-[calc(100dvh-2rem)] max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
    onclick={(event) => event.stopPropagation()}
    role="presentation"
  >
    <div class="z-10 flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
      <h2 class="text-base font-semibold text-foreground">{title}</h2>
      <button
        onclick={onClose}
        class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        title="Close settings"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <ScrollArea class="min-h-0 flex-1 overscroll-contain" type="always">
      <div class="px-5 pt-5">
        {@render children()}
      </div>
    </ScrollArea>
  </div>
</div>

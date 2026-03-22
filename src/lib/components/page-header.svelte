<script lang="ts">
  import { BookmarkPlus } from 'lucide-svelte'
  import type { Snippet } from 'svelte'

  let {
    title,
    count = 0,
    actions,
    prefix,
    icon: Icon = BookmarkPlus,
  }: {
    title: string
    count?: number
    actions?: Snippet
    prefix?: Snippet
    icon?: typeof BookmarkPlus
  } = $props()
</script>

<div class="flex items-center justify-between px-8 py-5">
  <div class="flex items-center gap-3">
    {#if prefix}
      {@render prefix()}
    {/if}
    <div class="flex items-center gap-2">
      <Icon class="h-4 w-4 text-primary" />
      <span class="text-sm font-medium text-muted-foreground">{title}</span>
      {#if count > 0}
        <span class="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {count}
        </span>
      {/if}
    </div>
  </div>

  {#if actions}
    <div class="flex items-center gap-1">
      {@render actions()}
    </div>
  {/if}
</div>

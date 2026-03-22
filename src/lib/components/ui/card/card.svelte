<script lang="ts">
  import { cn } from '$lib/utils.js'
  import type { HTMLAttributes } from 'svelte/elements'

  let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props()
</script>

<div class={cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)} {...restProps} />

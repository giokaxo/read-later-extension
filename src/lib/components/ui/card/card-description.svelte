<script lang="ts">
  import { cn } from '$lib/utils.js'
  import type { HTMLAttributes } from 'svelte/elements'

  let { class: className, ...restProps }: HTMLAttributes<HTMLParagraphElement> = $props()
</script>

<p class={cn('text-muted-foreground text-sm', className)} {...restProps} />

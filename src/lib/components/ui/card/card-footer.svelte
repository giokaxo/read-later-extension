<script lang="ts">
  import { cn } from '$lib/utils.js'
  import type { HTMLAttributes } from 'svelte/elements'

  let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props()
</script>

<div class={cn('flex items-center p-6 pt-0', className)} {...restProps} />

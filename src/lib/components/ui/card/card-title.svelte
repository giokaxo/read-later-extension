<script lang="ts">
  import { cn } from '$lib/utils.js'
  import type { HTMLAttributes } from 'svelte/elements'

  let { class: className, ...restProps }: HTMLAttributes<HTMLHeadingElement> = $props()
</script>

<h3 class={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...restProps}></h3>

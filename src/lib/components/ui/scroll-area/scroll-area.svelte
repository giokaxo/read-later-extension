<script lang="ts">
  import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils.js'
  import Scrollbar from './scrollbar.svelte'

  let {
    class: className,
    orientation = 'vertical',
    ref = $bindable(null),
    children,
    ...restProps
  }: ScrollAreaPrimitive.RootProps & {
    class?: string
    orientation?: 'vertical' | 'horizontal' | 'both'
  } = $props()
</script>

<ScrollAreaPrimitive.Root
  bind:ref
  class={cn('relative overflow-hidden', className)}
  {...restProps}
>
  <ScrollAreaPrimitive.Viewport class="h-full w-full rounded-[inherit]">
    {@render children?.()}
  </ScrollAreaPrimitive.Viewport>

  {#if orientation === 'vertical' || orientation === 'both'}
    <Scrollbar orientation="vertical" />
  {/if}

  {#if orientation === 'horizontal' || orientation === 'both'}
    <Scrollbar orientation="horizontal" />
  {/if}

  <ScrollAreaPrimitive.Corner />
</ScrollAreaPrimitive.Root>

<style>
  :global([data-scroll-area-viewport]) {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  :global([data-scroll-area-viewport]::-webkit-scrollbar) {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    background: transparent !important;
  }
</style>

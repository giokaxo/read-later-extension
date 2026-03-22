<script lang="ts">
  import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils.js'
  import Scrollbar from './scrollbar.svelte'

  let {
    class: className,
    orientation = 'vertical',
    showScrollbar = true,
    rootClass = '',
    viewportClass = '',
    ref = $bindable(null),
    children,
    ...restProps
  }: ScrollAreaPrimitive.RootProps & {
    class?: string
    orientation?: 'vertical' | 'horizontal' | 'both'
    showScrollbar?: boolean
    rootClass?: string
    viewportClass?: string
  } = $props()
</script>

<ScrollAreaPrimitive.Root
  bind:ref
  class={cn('relative overflow-hidden', rootClass, className)}
  {...restProps}
>
  <ScrollAreaPrimitive.Viewport class={cn('h-full w-full rounded-[inherit]', viewportClass)}>
    {@render children?.()}
  </ScrollAreaPrimitive.Viewport>

  {#if showScrollbar && (orientation === 'vertical' || orientation === 'both')}
    <Scrollbar orientation="vertical" />
  {/if}

  {#if showScrollbar && (orientation === 'horizontal' || orientation === 'both')}
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

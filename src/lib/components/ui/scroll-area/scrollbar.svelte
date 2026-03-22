<script lang="ts">
  import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils.js'

  let {
    class: className,
    orientation = 'vertical',
    ref = $bindable(null),
    ...restProps
  }: ScrollAreaPrimitive.ScrollbarProps & { class?: string } = $props()
</script>

<ScrollAreaPrimitive.Scrollbar
  bind:ref
  {orientation}
  class={cn(
    'flex touch-none select-none p-px transition-colors',
    orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
    orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
    className
  )}
  {...restProps}
>
  <ScrollAreaPrimitive.Thumb class="relative flex-1 rounded-full bg-border" />
</ScrollAreaPrimitive.Scrollbar>

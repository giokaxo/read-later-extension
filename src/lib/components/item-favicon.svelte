<script lang="ts">
  let {
    src = '',
    sizeClass = 'h-4 w-4',
    roundedClass = 'rounded-sm',
    fallbackClass = 'bg-muted',
  }: {
    src?: string
    sizeClass?: string
    roundedClass?: string
    fallbackClass?: string
  } = $props()

  let hidden = $state(false)

  $effect(() => {
    src
    hidden = false
  })
</script>

{#if src && !hidden}
  <img
    {src}
    alt=""
    class={`${sizeClass} shrink-0 ${roundedClass}`}
    onerror={() => {
      hidden = true
    }}
  />
{:else}
  <div class={`${sizeClass} shrink-0 ${roundedClass} ${fallbackClass}`}></div>
{/if}

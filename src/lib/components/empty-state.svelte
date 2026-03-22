<script lang="ts">
  let {
    icon: Icon,
    title,
    description,
    class: className = '',
  }: {
    icon: any
    title: string
    description: string
    class?: string
  } = $props()
</script>

<div class={`flex flex-col items-center gap-3 text-center ${className}`}>
  <Icon class="h-10 w-10 text-muted-foreground/30" />
  <p class="font-medium text-foreground">{title}</p>
  <p class="max-w-xs text-sm text-muted-foreground">{description}</p>
</div>

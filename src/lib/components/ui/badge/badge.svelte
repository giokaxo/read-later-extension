<script lang="ts">
  import { cn } from '$lib/utils.js'
  import { badgeVariants, type Props } from './index.js'

  let { class: className, variant = 'default', ...restProps }: Props = $props()
</script>

<div class={cn(badgeVariants({ variant }), className)} {...restProps} />

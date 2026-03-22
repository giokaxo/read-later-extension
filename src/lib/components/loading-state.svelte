<script lang="ts">
  let { centered = false }: { centered?: boolean } = $props()
</script>

<div class:centered class="flex justify-center pt-32">
  <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
</div>

<style>
  .centered {
    min-height: 100%;
    align-items: flex-start;
  }
</style>

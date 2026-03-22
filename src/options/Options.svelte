<script lang="ts">
  import { onMount } from 'svelte'
  import { BookmarkPlus, Check } from 'lucide-svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { getAll, updateSettings } from '$lib/storage.js'
  import type { SuggestionAlgorithm } from '$lib/types.js'

  let algorithm = $state<SuggestionAlgorithm>('chronological')
  let saved = $state(false)
  let loading = $state(true)

  const algorithms: { value: SuggestionAlgorithm; label: string; description: string }[] = [
    {
      value: 'chronological',
      label: 'Oldest First',
      description: 'Suggest items in the order they were saved',
    },
    {
      value: 'reverse-chronological',
      label: 'Newest First',
      description: 'Suggest the most recently saved items first',
    },
    {
      value: 'random',
      label: 'Random',
      description: 'Pick a random saved item each time',
    },
  ]

  onMount(async () => {
    const data = await getAll()
    algorithm = data.settings.algorithm
    loading = false
  })

  async function handleSave() {
    await updateSettings({ algorithm })
    saved = true
    setTimeout(() => (saved = false), 2000)
  }
</script>

<div class="mx-auto max-w-md px-6 py-8">
  <div class="mb-6 flex items-center gap-2">
    <BookmarkPlus class="h-5 w-5 text-primary" />
    <h1 class="text-xl font-semibold">Read Later</h1>
  </div>

  <Separator class="mb-6" />

  <section>
    <h2 class="mb-1 text-sm font-medium">Suggestion Algorithm</h2>
    <p class="mb-4 text-sm text-muted-foreground">
      How items are selected to show on new tab.
    </p>

    {#if loading}
      <div class="space-y-2">
        {#each [1, 2, 3] as _}
          <div class="h-16 animate-pulse rounded-lg bg-muted"></div>
        {/each}
      </div>
    {:else}
      <div class="space-y-2">
        {#each algorithms as option (option.value)}
          <button
            class="w-full rounded-lg border px-4 py-3 text-left transition-colors {algorithm === option.value
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background hover:bg-accent'}"
            onclick={() => (algorithm = option.value)}
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{option.label}</span>
              {#if algorithm === option.value}
                <Check class="h-4 w-4 text-primary" />
              {/if}
            </div>
            <p class="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
          </button>
        {/each}
      </div>
    {/if}
  </section>

  <div class="mt-6">
    <Button onclick={handleSave} disabled={loading} class="gap-2">
      {#if saved}
        <Check class="h-4 w-4" />
        Saved
      {:else}
        Save Settings
      {/if}
    </Button>
  </div>
</div>

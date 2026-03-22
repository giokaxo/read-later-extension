<script lang="ts">
  import { onMount } from 'svelte'
  import { BookmarkPlus, Check, Monitor, Moon, Palette, Sun } from 'lucide-svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { DEFAULT_SETTINGS } from '$lib/settings.js'
  import { getAll, updateSettings } from '$lib/storage.js'
  import { applyThemeSettings } from '$lib/theme.js'
  import type {
    ColorScheme,
    ExtensionSettings,
    SuggestionAlgorithm,
    ThemeAppearance,
  } from '$lib/types.js'

  type AppearanceOption = {
    value: ThemeAppearance
    label: string
    description: string
  }

  type ColorSchemeOption = {
    value: ColorScheme
    label: string
    description: string
    primary: string
    accent: string
  }

  let algorithm = $state<SuggestionAlgorithm>(DEFAULT_SETTINGS.algorithm)
  let appearance = $state<ThemeAppearance>(DEFAULT_SETTINGS.appearance)
  let colorScheme = $state<ColorScheme>(DEFAULT_SETTINGS.colorScheme)
  let initialSettings = $state<ExtensionSettings>({ ...DEFAULT_SETTINGS })
  let saved = $state(false)
  let loading = $state(true)

  const appearanceOptions: AppearanceOption[] = [
    {
      value: 'system',
      label: 'System',
      description: 'Match your browser or OS appearance preference.',
    },
    {
      value: 'light',
      label: 'Light',
      description: 'Always use the light interface.',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Always use the dark interface.',
    },
  ]

  const colorSchemeOptions: ColorSchemeOption[] = [
    {
      value: 'default',
      label: 'Default',
      description: 'The neutral shadcn look.',
      primary: '240 5.9% 10%',
      accent: '240 4.8% 95.9%',
    },
    {
      value: 'blue',
      label: 'Blue',
      description: 'Cool and crisp.',
      primary: '221.2 83.2% 53.3%',
      accent: '213.3 96.9% 87.3%',
    },
    {
      value: 'green',
      label: 'Green',
      description: 'Fresh and calm.',
      primary: '142.1 76.2% 36.3%',
      accent: '141 78.9% 85.1%',
    },
    {
      value: 'orange',
      label: 'Orange',
      description: 'Warm and energetic.',
      primary: '20.5 90.2% 48.2%',
      accent: '32.1 97.7% 83.1%',
    },
    {
      value: 'red',
      label: 'Red',
      description: 'Bold and urgent.',
      primary: '0 72.2% 50.6%',
      accent: '0 96.3% 89.4%',
    },
    {
      value: 'rose',
      label: 'Rose',
      description: 'Soft and vivid.',
      primary: '346.8 77.2% 49.8%',
      accent: '352.7 96.1% 90%',
    },
    {
      value: 'violet',
      label: 'Violet',
      description: 'Punchy and playful.',
      primary: '262.1 83.3% 57.8%',
      accent: '250.5 95.2% 91.8%',
    },
    {
      value: 'yellow',
      label: 'Yellow',
      description: 'Bright and high-contrast.',
      primary: '45.4 93.4% 47.5%',
      accent: '52.8 98.3% 76.9%',
    },
  ]

  const algorithms: { value: SuggestionAlgorithm; label: string; description: string }[] = [
    {
      value: 'chronological',
      label: 'Oldest First',
      description: 'Suggest items in the order they were saved.',
    },
    {
      value: 'reverse-chronological',
      label: 'Newest First',
      description: 'Suggest the most recently saved items first.',
    },
    {
      value: 'random',
      label: 'Random',
      description: 'Pick a random saved item each time.',
    },
  ]

  const dirty = $derived(
    !loading &&
      (algorithm !== initialSettings.algorithm ||
        appearance !== initialSettings.appearance ||
        colorScheme !== initialSettings.colorScheme)
  )

  $effect(() => {
    if (loading) return
    applyThemeSettings({ appearance, colorScheme })
  })

  onMount(async () => {
    const data = await getAll()
    algorithm = data.settings.algorithm
    appearance = data.settings.appearance
    colorScheme = data.settings.colorScheme
    initialSettings = { ...data.settings }
    loading = false
  })

  function selectAppearance(value: ThemeAppearance) {
    appearance = value
    saved = false
  }

  function selectColorScheme(value: ColorScheme) {
    colorScheme = value
    saved = false
  }

  function selectAlgorithm(value: SuggestionAlgorithm) {
    algorithm = value
    saved = false
  }

  async function handleSave() {
    await updateSettings({ algorithm, appearance, colorScheme })
    initialSettings = { ...initialSettings, algorithm, appearance, colorScheme }
    saved = true
    setTimeout(() => (saved = false), 2000)
  }
</script>

<div class="mx-auto max-w-4xl px-6 py-8">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div class="flex items-center gap-2">
        <BookmarkPlus class="h-5 w-5 text-primary" />
        <h1 class="text-xl font-semibold">Read Later</h1>
      </div>
      <p class="mt-2 max-w-2xl text-sm text-muted-foreground">
        Choose the shadcn-inspired color scheme and appearance mode used across the popup,
        new tab, and settings screen.
      </p>
    </div>
  </div>

  <Separator class="my-6" />

  {#if loading}
    <div class="space-y-6">
      {#each [1, 2, 3] as section}
        <div class="rounded-2xl border bg-card p-5">
          <div class="h-4 w-32 animate-pulse rounded bg-muted"></div>
          <div class="mt-2 h-3 w-56 animate-pulse rounded bg-muted"></div>
          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            {#each [1, 2, 3] as _}
              <div class="h-28 animate-pulse rounded-xl bg-muted"></div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="space-y-6">
      <section class="rounded-2xl border bg-card p-5 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="rounded-xl bg-primary/10 p-2 text-primary">
            <Sun class="h-4 w-4" />
          </div>
          <div>
            <h2 class="text-sm font-semibold">Appearance</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Pick whether the extension follows your system appearance or stays fixed.
            </p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          {#each appearanceOptions as option (option.value)}
            <button
              class="rounded-xl border px-4 py-4 text-left transition-colors {appearance === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:bg-accent'}"
              onclick={() => selectAppearance(option.value)}
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {#if option.value === 'system'}
                      <Monitor class="h-4 w-4" />
                    {:else if option.value === 'light'}
                      <Sun class="h-4 w-4" />
                    {:else}
                      <Moon class="h-4 w-4" />
                    {/if}
                  </div>
                  <p class="text-sm font-medium">{option.label}</p>
                  <p class="mt-1 text-xs text-muted-foreground">{option.description}</p>
                </div>
                {#if appearance === option.value}
                  <Check class="h-4 w-4 text-primary" />
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </section>

      <section class="rounded-2xl border bg-card p-5 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="rounded-xl bg-primary/10 p-2 text-primary">
            <Palette class="h-4 w-4" />
          </div>
          <div>
            <h2 class="text-sm font-semibold">Color Scheme</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              These presets follow the theme names shown on the shadcn themes page.
            </p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {#each colorSchemeOptions as option (option.value)}
            <button
              class="rounded-xl border px-4 py-4 text-left transition-colors {colorScheme === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:bg-accent'}"
              onclick={() => selectColorScheme(option.value)}
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-medium">{option.label}</p>
                  <p class="mt-1 text-xs text-muted-foreground">{option.description}</p>
                </div>
                {#if colorScheme === option.value}
                  <Check class="h-4 w-4 text-primary" />
                {/if}
              </div>

              <div class="mt-4 flex items-center gap-2">
                <span
                  class="h-6 w-6 rounded-full border shadow-sm"
                  style={`background-color: hsl(${option.primary}); border-color: hsl(${option.primary});`}
                ></span>
                <span
                  class="h-6 w-6 rounded-full border shadow-sm"
                  style={`background-color: hsl(${option.accent}); border-color: hsl(${option.accent});`}
                ></span>
                <div class="flex flex-1 items-center gap-1 rounded-lg border border-border bg-background px-2 py-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-foreground/20"></span>
                  <span class="h-2 flex-1 rounded bg-muted"></span>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </section>

      <section class="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 class="text-sm font-semibold">Suggestion Algorithm</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Control how the new tab picks what to surface next.
        </p>

        <div class="mt-5 space-y-3">
          {#each algorithms as option (option.value)}
            <button
              class="w-full rounded-xl border px-4 py-4 text-left transition-colors {algorithm === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:bg-accent'}"
              onclick={() => selectAlgorithm(option.value)}
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-medium">{option.label}</p>
                  <p class="mt-1 text-xs text-muted-foreground">{option.description}</p>
                </div>
                {#if algorithm === option.value}
                  <Check class="h-4 w-4 text-primary" />
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </section>

      <div class="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-muted-foreground">
          Preview updates instantly here. Saving persists the appearance and color scheme across
          the whole extension.
        </p>

        <Button onclick={handleSave} disabled={!dirty} class="gap-2 sm:self-start">
          {#if saved}
            <Check class="h-4 w-4" />
            Saved
          {:else if dirty}
            Save Settings
          {:else}
            All Set
          {/if}
        </Button>
      </div>
    </div>
  {/if}
</div>

<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import {
    Check,
    Link,
    Monitor,
    Moon,
    MousePointerClick,
    Palette,
    Shuffle,
    Sun,
  } from 'lucide-svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { DEFAULT_SETTINGS } from '$lib/settings.js'
  import { getAll, updateSettings } from '$lib/storage.js'
  import { applyThemeSettings } from '$lib/theme.js'
  import { cn } from '$lib/utils.js'
  import type {
    ColorScheme,
    ExtensionSettings,
    LinkTarget,
    SuggestionAlgorithm,
    ThemeAppearance,
    ToolbarAction,
  } from '$lib/types.js'

  type Layout = 'page' | 'panel'
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
  type ChoiceOption<T extends string> = {
    value: T
    label: string
    description: string
  }

  let { layout = 'page' }: { layout?: Layout } = $props()

  let algorithm = $state<SuggestionAlgorithm>(DEFAULT_SETTINGS.algorithm)
  let appearance = $state<ThemeAppearance>(DEFAULT_SETTINGS.appearance)
  let colorScheme = $state<ColorScheme>(DEFAULT_SETTINGS.colorScheme)
  let toolbarAction = $state<ToolbarAction>(DEFAULT_SETTINGS.toolbarAction)
  let linkTarget = $state<LinkTarget>(DEFAULT_SETTINGS.linkTarget)
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

  const algorithms: ChoiceOption<SuggestionAlgorithm>[] = [
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

  const toolbarActionOptions: ChoiceOption<ToolbarAction>[] = [
    {
      value: 'popup',
      label: 'Show Popup',
      description: 'Open the popup panel to manage or save the current page.',
    },
    {
      value: 'auto-save',
      label: 'Auto-Save',
      description: 'Instantly save the current tab without showing any popup.',
    },
  ]

  const linkTargetOptions: ChoiceOption<LinkTarget>[] = [
    {
      value: 'same-tab',
      label: 'Same Tab',
      description: 'Navigate to the link in the current tab.',
    },
    {
      value: 'new-tab',
      label: 'New Tab',
      description: 'Open the link in a new browser tab.',
    },
  ]

  const dirty = $derived(
    !loading &&
      (algorithm !== initialSettings.algorithm ||
        appearance !== initialSettings.appearance ||
        colorScheme !== initialSettings.colorScheme ||
        toolbarAction !== initialSettings.toolbarAction ||
        linkTarget !== initialSettings.linkTarget)
  )

  let selectedAppearance = $derived(
    appearanceOptions.find((option) => option.value === appearance) ?? appearanceOptions[0]
  )
  let selectedColorScheme = $derived(
    colorSchemeOptions.find((option) => option.value === colorScheme) ?? colorSchemeOptions[0]
  )
  let selectedAlgorithm = $derived(
    algorithms.find((option) => option.value === algorithm) ?? algorithms[0]
  )
  let selectedToolbarAction = $derived(
    toolbarActionOptions.find((option) => option.value === toolbarAction) ?? toolbarActionOptions[0]
  )
  let selectedLinkTarget = $derived(
    linkTargetOptions.find((option) => option.value === linkTarget) ?? linkTargetOptions[0]
  )

  function shellClass() {
    return layout === 'panel' ? 'space-y-8' : 'space-y-10'
  }

  function heroClass() {
    return layout === 'panel'
      ? 'grid gap-5 sm:grid-cols-2'
      : 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:items-end'
  }

  function sectionClass() {
    return layout === 'panel'
      ? 'space-y-5 border-t border-border/60 pt-5'
      : 'grid gap-6 border-t border-border/70 pt-8 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-10'
  }

  function appearanceGridClass() {
    return layout === 'panel' ? 'grid grid-cols-3 gap-4' : 'grid grid-cols-3 gap-5'
  }

  function compactGroupClass(optionCount: 2 | 3) {
    if (layout === 'panel') {
      return optionCount === 2 ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 gap-4'
    }

    return optionCount === 2 ? 'grid grid-cols-2 gap-5' : 'grid grid-cols-3 gap-5'
  }

  function appearanceChoiceClass(isActive: boolean) {
    return cn(
      'group flex h-full items-start justify-between gap-4 border-b pb-4 text-left transition',
      isActive
        ? 'border-primary text-foreground'
        : 'border-border/60 text-muted-foreground hover:border-foreground/25 hover:text-foreground'
    )
  }

  function colorSchemeClass(isActive: boolean) {
    return cn(
      'group flex min-w-[170px] flex-1 items-center gap-3 border-b pb-3 pr-2 text-left transition',
      isActive
        ? 'border-primary text-foreground'
        : 'border-border/60 text-muted-foreground hover:border-foreground/25 hover:text-foreground'
    )
  }

  function compactChoiceClass(isActive: boolean) {
    return cn(
      'group flex h-full items-start justify-between gap-4 border-b pb-4 text-left transition',
      isActive
        ? 'border-primary text-foreground'
        : 'border-border/60 text-muted-foreground hover:border-foreground/25 hover:text-foreground'
    )
  }

  function markerClass(isActive: boolean) {
    return cn(
      'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition',
      isActive
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-background text-transparent group-hover:border-foreground/25 group-hover:text-muted-foreground'
    )
  }

  function appearanceIconClass(isActive: boolean) {
    return cn(
      'mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground'
    )
  }

  function footerClass() {
    return layout === 'panel'
      ? 'sticky bottom-0 z-20 -mx-5 mt-8 flex flex-col gap-4 border-t border-border/80 bg-card/95 px-5 py-4 shadow-[0_-18px_40px_-28px_hsl(var(--foreground)/0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'
      : 'sticky bottom-0 z-20 mt-8 flex flex-col gap-4 rounded-t-2xl border-x border-t border-border/80 bg-background/92 px-5 py-4 shadow-[0_-18px_40px_-28px_hsl(var(--foreground)/0.35)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'
  }

  $effect(() => {
    if (loading) return
    applyThemeSettings({ appearance, colorScheme })
  })

  onMount(() => {
    void (async () => {
      const data = await getAll()
      algorithm = data.settings.algorithm
      appearance = data.settings.appearance
      colorScheme = data.settings.colorScheme
      toolbarAction = data.settings.toolbarAction
      linkTarget = data.settings.linkTarget
      initialSettings = { ...data.settings }
      loading = false
    })()
  })

  onDestroy(() => {
    if (loading) return

    applyThemeSettings({
      appearance: initialSettings.appearance,
      colorScheme: initialSettings.colorScheme,
    })
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

  function selectToolbarAction(value: ToolbarAction) {
    toolbarAction = value
    saved = false
  }

  function selectLinkTarget(value: LinkTarget) {
    linkTarget = value
    saved = false
  }

  async function handleSave() {
    await updateSettings({ algorithm, appearance, colorScheme, toolbarAction, linkTarget })
    initialSettings = { ...initialSettings, algorithm, appearance, colorScheme, toolbarAction, linkTarget }
    saved = true
    setTimeout(() => (saved = false), 2000)
  }
</script>

{#if loading}
  <div class={shellClass()}>
    <div class={heroClass()}>
      <div class="space-y-3">
        <div class="h-3 w-24 animate-pulse rounded bg-muted"></div>
        <div class="h-8 w-64 animate-pulse rounded bg-muted"></div>
        <div class="h-4 w-full max-w-xl animate-pulse rounded bg-muted"></div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        {#each [1, 2] as _}
          <div class="space-y-3 border-l border-border/70 pl-4">
            <div class="h-3 w-16 animate-pulse rounded bg-muted"></div>
            <div class="h-4 w-28 animate-pulse rounded bg-muted"></div>
            <div class="h-3 w-24 animate-pulse rounded bg-muted"></div>
          </div>
        {/each}
      </div>
    </div>

    {#each [1, 2, 3, 4, 5] as _}
      <div class={sectionClass()}>
        <div class="space-y-2">
          <div class="h-4 w-32 animate-pulse rounded bg-muted"></div>
          <div class="h-3 w-56 animate-pulse rounded bg-muted"></div>
        </div>

        <div class="space-y-3">
          {#each [1, 2, 3] as __}
            <div class="h-14 animate-pulse rounded bg-muted/70"></div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class={shellClass()}>
    <div class={heroClass()}>
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Live Preview</p>
        <h2 class={cn('mt-3 font-semibold tracking-tight text-foreground', layout === 'panel' ? 'text-xl' : 'text-2xl sm:text-3xl')}>
          Shape the extension around your reading flow.
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Theme changes preview instantly while you edit. Save once to apply the whole setup
          across the popup, new tab, and options page.
        </p>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <div class="border-l border-border/70 pl-4">
          <p class="text-xs uppercase tracking-[0.24em] text-muted-foreground">Theme</p>
          <p class="mt-2 text-sm font-medium text-foreground">
            {selectedAppearance.label} / {selectedColorScheme.label}
          </p>
          <div class="mt-3 flex items-center gap-2">
            <span
              class="h-3 w-3 rounded-full border shadow-sm"
              style={`background-color: hsl(${selectedColorScheme.primary}); border-color: hsl(${selectedColorScheme.primary});`}
            ></span>
            <span
              class="h-3 w-3 rounded-full border shadow-sm"
              style={`background-color: hsl(${selectedColorScheme.accent}); border-color: hsl(${selectedColorScheme.accent});`}
            ></span>
            <span class="text-sm text-muted-foreground">Updates preview immediately</span>
          </div>
        </div>

        <div class="border-l border-border/70 pl-4">
          <p class="text-xs uppercase tracking-[0.24em] text-muted-foreground">Behavior</p>
          <p class="mt-2 text-sm font-medium text-foreground">{selectedToolbarAction.label}</p>
          <p class="mt-1 text-sm text-muted-foreground">
            {selectedAlgorithm.label} suggestions, {selectedLinkTarget.label.toLowerCase()} links
          </p>
        </div>
      </div>
    </div>

    <section class={sectionClass()}>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <div class="rounded-full bg-primary/10 p-2.5 text-primary ring-1 ring-primary/15">
            <Sun class="h-4 w-4" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Appearance</p>
            <h3 class="mt-2 text-base font-semibold text-foreground">Choose how the interface is lit</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Pick whether Read Later matches the system appearance or stays fixed.
            </p>
          </div>
        </div>
      </div>

      <div class={appearanceGridClass()}>
        {#each appearanceOptions as option (option.value)}
          <button
            type="button"
            class={appearanceChoiceClass(appearance === option.value)}
            onclick={() => selectAppearance(option.value)}
            aria-pressed={appearance === option.value}
          >
            <div class="flex min-w-0 items-start gap-3">
              <span class={appearanceIconClass(appearance === option.value)}>
                {#if option.value === 'system'}
                  <Monitor class="h-4 w-4" />
                {:else if option.value === 'light'}
                  <Sun class="h-4 w-4" />
                {:else}
                  <Moon class="h-4 w-4" />
                {/if}
              </span>

              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground">{option.label}</p>
                <p class="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
              </div>
            </div>

            <span class={markerClass(appearance === option.value)}>
              <Check class="h-3.5 w-3.5" />
            </span>
          </button>
        {/each}
      </div>
    </section>

    <section class={sectionClass()}>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <div class="rounded-full bg-primary/10 p-2.5 text-primary ring-1 ring-primary/15">
            <Palette class="h-4 w-4" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Color Scheme</p>
            <h3 class="mt-2 text-base font-semibold text-foreground">Pick the accent personality</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              These presets follow the theme names shown on the shadcn themes page.
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-x-5 gap-y-4">
        {#each colorSchemeOptions as option (option.value)}
          <button
            type="button"
            class={colorSchemeClass(colorScheme === option.value)}
            onclick={() => selectColorScheme(option.value)}
            aria-pressed={colorScheme === option.value}
          >
            <span class="flex items-center gap-2">
              <span
                class="h-6 w-6 rounded-full border shadow-sm"
                style={`background-color: hsl(${option.primary}); border-color: hsl(${option.primary});`}
              ></span>
              <span
                class="h-6 w-6 rounded-full border shadow-sm"
                style={`background-color: hsl(${option.accent}); border-color: hsl(${option.accent});`}
              ></span>
            </span>

            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-foreground">{option.label}</span>
              <span class="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
            </span>

            <span
              class={cn(
                'inline-flex h-2.5 w-2.5 shrink-0 rounded-full transition',
                colorScheme === option.value ? 'bg-primary' : 'bg-border group-hover:bg-foreground/20'
              )}
            ></span>
          </button>
        {/each}
      </div>
    </section>

    <section class={sectionClass()}>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <div class="rounded-full bg-primary/10 p-2.5 text-primary ring-1 ring-primary/15">
            <Shuffle class="h-4 w-4" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Suggestion Algorithm</p>
            <h3 class="mt-2 text-base font-semibold text-foreground">Control what rises to the top</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Decide how the new tab chooses the next saved item to surface.
            </p>
          </div>
        </div>
      </div>

      <div class={compactGroupClass(3)}>
        {#each algorithms as option (option.value)}
          <button
            type="button"
            class={compactChoiceClass(algorithm === option.value)}
            onclick={() => selectAlgorithm(option.value)}
            aria-pressed={algorithm === option.value}
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-foreground">{option.label}</p>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
            </div>

            <span class={markerClass(algorithm === option.value)}>
              <Check class="h-3.5 w-3.5" />
            </span>
          </button>
        {/each}
      </div>
    </section>

    <section class={sectionClass()}>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <div class="rounded-full bg-primary/10 p-2.5 text-primary ring-1 ring-primary/15">
            <MousePointerClick class="h-4 w-4" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Toolbar Button</p>
            <h3 class="mt-2 text-base font-semibold text-foreground">Choose the default action</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Set what happens when you click the extension icon in the browser toolbar.
            </p>
          </div>
        </div>
      </div>

      <div class={compactGroupClass(2)}>
        {#each toolbarActionOptions as option (option.value)}
          <button
            type="button"
            class={compactChoiceClass(toolbarAction === option.value)}
            onclick={() => selectToolbarAction(option.value)}
            aria-pressed={toolbarAction === option.value}
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-foreground">{option.label}</p>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
            </div>

            <span class={markerClass(toolbarAction === option.value)}>
              <Check class="h-3.5 w-3.5" />
            </span>
          </button>
        {/each}
      </div>
    </section>

    <section class={sectionClass()}>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <div class="rounded-full bg-primary/10 p-2.5 text-primary ring-1 ring-primary/15">
            <Link class="h-4 w-4" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Link Behavior</p>
            <h3 class="mt-2 text-base font-semibold text-foreground">Set where reading opens</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Choose whether links reuse the current tab or open a fresh one.
            </p>
          </div>
        </div>
      </div>

      <div class={compactGroupClass(2)}>
        {#each linkTargetOptions as option (option.value)}
          <button
            type="button"
            class={compactChoiceClass(linkTarget === option.value)}
            onclick={() => selectLinkTarget(option.value)}
            aria-pressed={linkTarget === option.value}
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-foreground">{option.label}</p>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
            </div>

            <span class={markerClass(linkTarget === option.value)}>
              <Check class="h-3.5 w-3.5" />
            </span>
          </button>
        {/each}
      </div>
    </section>

    <div class={footerClass()}>
      <div>
        <p class="text-sm font-medium text-foreground">
          {#if saved}
            Settings saved.
          {:else if dirty}
            Unsaved changes ready.
          {:else}
            Everything is up to date.
          {/if}
        </p>
        <p class="mt-1 text-sm leading-6 text-muted-foreground">
          Theme changes preview instantly while behavior stays staged until you save.
        </p>
      </div>

      <Button type="button" onclick={handleSave} disabled={!dirty} class="gap-2 sm:self-start">
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

<script lang="ts">
  import { BookmarkPlus, Palette, SlidersHorizontal } from 'lucide-svelte'
  import SettingsEditor from '$lib/components/settings-editor.svelte'
</script>

<div class="relative min-h-screen bg-background text-foreground">
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div class="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
    <div class="absolute right-0 top-20 h-80 w-80 rounded-full bg-accent/60 blur-3xl"></div>
  </div>

  <main class="relative mx-auto max-w-5xl px-6 py-10 sm:px-8 lg:py-12">
    <header class="border-b border-border/70 pb-8">
      <div class="flex items-center gap-3">
        <div class="rounded-full bg-primary/10 p-2.5 text-primary ring-1 ring-primary/15">
          <BookmarkPlus class="h-4 w-4" />
        </div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
          Read Later Settings
        </p>
      </div>

      <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)] lg:items-end">
        <div>
          <h1 class="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Shape the extension around your reading rhythm.
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Tune appearance and behavior in one calmer place. Theme changes preview instantly
            here before you save them across the popup and new tab.
          </p>
        </div>

        <div class="grid gap-5 text-sm">
          <div class="border-l border-border/70 pl-4">
            <div class="flex items-center gap-2 text-foreground">
              <Palette class="h-4 w-4 text-primary" />
              <span class="font-medium">Live theme preview</span>
            </div>
            <p class="mt-2 leading-6 text-muted-foreground">
              Switch appearance modes and color schemes without leaving the page.
            </p>
          </div>

          <div class="border-l border-border/70 pl-4">
            <div class="flex items-center gap-2 text-foreground">
              <SlidersHorizontal class="h-4 w-4 text-primary" />
              <span class="font-medium">Behavior controls</span>
            </div>
            <p class="mt-2 leading-6 text-muted-foreground">
              Choose how suggestions are picked and what the toolbar button should do.
            </p>
          </div>
        </div>
      </div>
    </header>

    <div class="mt-10">
      <SettingsEditor />
    </div>
  </main>
</div>

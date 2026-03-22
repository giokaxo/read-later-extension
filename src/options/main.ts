import '../app.css'
import { mount } from 'svelte'
import { initializeTheme } from '$lib/theme.js'
import Options from './Options.svelte'

async function bootstrap() {
  const cleanupTheme = await initializeTheme()

  window.addEventListener('unload', cleanupTheme, { once: true })
  mount(Options, { target: document.getElementById('app')! })
}

void bootstrap()

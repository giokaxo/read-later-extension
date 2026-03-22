import '../app.css'
import { mount } from 'svelte'
import { initializeTheme } from '$lib/theme.js'
import Archive from './Archive.svelte'

async function bootstrap() {
  const cleanupTheme = await initializeTheme()

  window.addEventListener('unload', cleanupTheme, { once: true })
  mount(Archive, { target: document.getElementById('app')! })
}

void bootstrap()

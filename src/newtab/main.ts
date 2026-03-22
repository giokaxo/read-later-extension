import '../app.css'
import { mount } from 'svelte'
import { initializeTheme } from '$lib/theme.js'
import NewTab from './NewTab.svelte'

async function bootstrap() {
  const cleanupTheme = await initializeTheme()

  window.addEventListener('unload', cleanupTheme, { once: true })
  mount(NewTab, { target: document.getElementById('app')! })
}

void bootstrap()

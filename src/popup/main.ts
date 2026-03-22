import '../app.css'
import { mount } from 'svelte'
import { initializeTheme } from '$lib/theme.js'
import Popup from './Popup.svelte'

async function bootstrap() {
  const cleanupTheme = await initializeTheme()

  window.addEventListener('unload', cleanupTheme, { once: true })
  mount(Popup, { target: document.getElementById('app')! })
}

void bootstrap()

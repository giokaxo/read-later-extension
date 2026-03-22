import '../app.css'
import { mount } from 'svelte'
import NewTab from './NewTab.svelte'

mount(NewTab, { target: document.getElementById('app')! })

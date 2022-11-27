import { browser } from '$app/environment'
import { writable, type Writable } from 'svelte/store'

export const word = writable('')

export const input = writable('')
export const lastInput = writable('')

export const start = writable(-1)

export const isDisabled = writable(false)
export const sessionStatus: Writable<number> = writable(0)

export const isAlwaysShowHintEnabled = writable(stored('always_show_hint', 'true') === 'true')
export const isAlwaysPlayAudioEnabled = writable(stored('always_play_audio', 'false') === 'true')
export const isQuickEndEnabled = writable(stored('quick_end', 'true') === 'true')
export const isQuickNextEnabled = writable(stored('quick_next', 'true') === 'true')

if (browser) {
    isAlwaysPlayAudioEnabled.subscribe((value) => localStorage.setItem('always_play_audio', String(value)))
    isAlwaysShowHintEnabled.subscribe((value) => localStorage.setItem('always_show_hint', String(value)))
    isQuickEndEnabled.subscribe((value) => localStorage.setItem('quick_end', String(value)))
    isQuickNextEnabled.subscribe((value) => localStorage.setItem('quick_next', String(value)))
}

function stored(key: string, def: string) {
    if (browser) {
        return (localStorage.getItem(key) ?? def)
    }

    return def;
}
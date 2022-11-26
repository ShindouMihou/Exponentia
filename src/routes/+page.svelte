<script lang="ts">
	import { onDestroy, onMount } from "svelte";
    import { Icon } from '@steeze-ui/svelte-icon'
    import { ArrowPath, SpeakerWave, ChevronDown } from '@steeze-ui/heroicons'
    import terminal from '$lib/logging'
    import { reduce, hide, diff } from '$lib/word'
	import ToggleableSetting from "$lib/components/settings/ToggleableSetting.svelte";
	import { fade } from "svelte/transition";
	import Hint from "$lib/components/Hint.svelte";
	import IconButton from "$lib/components/shared/IconButton.svelte";
	import Title from "$lib/components/Title.svelte";
	import ShowSettings from "$lib/components/ShowSettings.svelte";
	import Loading from "$lib/components/screens/Loading.svelte";
	import Settings from "$lib/components/screens/Settings.svelte";

    let dataset: string[] = []

    let word: string = '';
    $: reduced = reduce(word);
    $: hidden = hide(word);
    let input: string = '';

    let definition: string = 'Looking for the definition...';

    let hintShown = false;
    let disabled = false;

    let start: number = -1;
    let end: number = -1;

    let throttle = false;
    let offline = false;

    let alwaysShowHint = true;
    let alwaysPlayAudio = false;
    let quickEnd = true;

    let lastInput = '';
    let autoSuggestedDetected = false
    let hideSettings = true

    let speech: SpeechSynthesisUtterance;

    let offlineTimer = setInterval(() => 
       {
           if (navigator.onLine) {
                fetch('/hello.txt')
                    .then((response) => { if (response.ok)  { offline = false } else { if (!offline) { setOffline() } } })
                    .catch((e) => { if (!offline) { setOffline() } })
           } else {
               if (!offline) {
                setOffline();
               }
           }
       },
        15 * 1000
    )
    let fasterOfflineTimer = setInterval(() => { if (!navigator.onLine && !offline) { setOffline() } }, 2 * 1000)
    onDestroy(() => { clearInterval(offlineTimer); clearInterval(fasterOfflineTimer); });

    onMount(async () => {
        alwaysPlayAudio = localStorage.getItem('always_play_audio') === 'true'
        alwaysShowHint = (localStorage.getItem('always_show_hint') ?? 'true') === 'true'
        hintShown = alwaysShowHint;

        quickEnd = (localStorage.getItem('quick_end') ?? 'true') === 'true'
        if (localStorage.getItem('version') == null) {
            if (localStorage.getItem('dataset') != null) { localStorage.removeItem('dataset') }
        }

        terminal.network('version.json')
        await fetch('/dataset/version.json')
                .then((response) => response.json())
                .then((data) => {
                    const current = localStorage.getItem('version')
                    if (current == null) {
                        localStorage.setItem('version', data.version)
                        return
                    }

                    const currentVersion =  Number.parseFloat(current)
                    if (data.version > currentVersion) {
                        terminal.event({ ev: 'new_ver', from: currentVersion, to: data.version })
                        localStorage.setItem('version', data.version); localStorage.removeItem('dataset');
                    }
                })

        terminal.info({ name: 'Exponentia', version: localStorage.getItem('version'), scm: 'https://github.com/ShindouMihou/Exponentia'})
        if (localStorage.getItem('dataset') == null) {
            terminal.network('words.txt')
            await fetch('/dataset/words.txt')
                .then((response) => response.text())
                .then((text) => localStorage.setItem('dataset', text));
        }

        dataset = localStorage.getItem('dataset')!!.split('\n');

        if (!navigator.onLine) {
            setOffline()
        }

        speech = new SpeechSynthesisUtterance()
        speech.lang = 'en'
        speech.rate = 1.05

        reset();
    });

    function setOffline() {
        offline = true;
        hintShown = true;
    }

    function toggle(key: string, value: boolean) {
        localStorage.setItem(key, (value).toString())
        terminal.event({ ev: 'tog', opt: key  })
    }

    function toggleAlwaysShowHint() {
        alwaysShowHint = !alwaysShowHint;
        toggle('always_show_hint', alwaysShowHint)

        if (!offline) {
            hintShown = alwaysShowHint;
        }
    }

    function toggleAlwaysPlayAudio() {
        alwaysPlayAudio = !alwaysPlayAudio; toggle('always_play_audio', alwaysPlayAudio);
    }

    function toggleQuickEnd() {
        quickEnd = !quickEnd; toggle('quick_end', quickEnd);
    }

    function toggleSettings() {
        hideSettings = !hideSettings;
    }

    function random(): string {
        return dataset[Math.floor(Math.random() * dataset.length)].toLowerCase();
    }

    function define(word: string) {
        terminal.network(word)
        return fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
            .then((response) => response.ok === true ? response.json() : null)
            .then((data: Array<any>) => {
                if (data != null) {
                    definition = data.at(0).meanings[0].definitions[0].definition
                } else {
                    definition = 'No definition found.';
                    throw { error: 'No definition found, this exception is intentional.' }
                }
            })
    }

    function audio() {
        if (window.speechSynthesis.speaking) return
        
        if (speech) {
            speech.text = word

            if (definition) {
                speech.text = speech.text + '. ' + definition + ' ' + word;
            }

            window.speechSynthesis.speak(speech); terminal.event({ ev: 'pl_au', text: speech.text })
        }
    }

    async function reset() {
        if (throttle) {
            terminal.event('throttled()')
            return;
        }

        throttle = true;
        document.getElementById('container')?.classList.add('animate-pulse');
        
        try {
            start = -1;
            end = -1;
            input = '';
            lastInput = '';
            hintShown = alwaysShowHint;
            let n = random()

            if (!offline) {
                await define(n);
            }

            word = n;
            const inputField = document.getElementById('input')
            disabled = false;

            if (inputField) {
                inputField.classList.add('text-white')
                inputField.classList.remove('text-green-500', 'text-red-500')
                //@ts-ignore
                inputField.value = '';
                inputField.focus()

                // important: Subsequent focus is for mobile purposes since mobile requires two focuses for some reason.
                setTimeout(() => inputField.focus(), 500)
            }

            if (alwaysPlayAudio) {
                if (window.speechSynthesis.speaking) window.speechSynthesis.cancel()
                setTimeout(() => audio(), 150)
            }

            setTimeout(() => { throttle = false; document.getElementById('container')?.classList.remove('animate-pulse'); }, 150);
            terminal.event({ ev: 'res', word: word, def: definition })
        } catch (e) {
            throttle = false;
            await reset()
        }
    }

    function hint() {
        if (!offline) {
            hintShown = !hintShown;
        }

        terminal.event({ ev: 'tog', opt: 'hint' })
    }

    async function enter(event: KeyboardEvent) {
        if (event.key === 'Enter' && input.length !== 0) {
            event.preventDefault(); complete(); terminal.event({ ev: 'compl', input: input });
        }

        if (event.ctrlKey && (event.key === 'a' || event.key === 'A')) {
            event.preventDefault(); input = ''; lastInput = ''; terminal.event({ ev: 'q_er' });
        }
    }

    async function timeAndQuickEnd(event: Event) {
        input = input.trim()
        if (start === -1) {
            start = Date.now(); terminal.event({ ev: 'tme', s: start });
        }

        let difference = diff(input, lastInput)
        if (difference >= 2 && input != '') {
            event.preventDefault(); input = lastInput; autoSuggestedDetected = true; terminal.event({ ev: 'ac', diff: difference });
            return
        }

        lastInput = input;

        if (autoSuggestedDetected) {
            autoSuggestedDetected = false;
        }

        if ((quickEnd === true && input.toLowerCase() === word)) {
            event.preventDefault(); complete(); terminal.event({ ev: 'qe', word: word})
        }
    }

    async function complete() {
        disabled = true;
        hintShown = true;

        reduced = word;
        end = Date.now();

        if (input.toLowerCase() === word) {
            document.getElementById('input')?.classList.replace('text-white', 'text-green-500');
            terminal.event({ ev: 'compl', s: true })
            return;
        }

        document.getElementById('input')?.classList.replace('text-white','text-red-500');
        terminal.event({ ev: 'compl', s: false })
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
        if (event.key === 'Tab') {
            event.preventDefault();
            document.getElementById('reset')?.focus();
        }

        if (event.key === '!') {
            event.preventDefault();
            toggleAlwaysShowHint();
        }

        if (event.key === '@') {
            event.preventDefault();
            toggleQuickEnd();
        }
        
        if (event.key === '#') {
            event.preventDefault();
            toggleAlwaysPlayAudio();
        }
    } 

    async function handleResetKeyDown(event: any) {
        if (event.key === 'Enter') {
            event.preventDefault();
            await reset();

            document.getElementById('input')!!.focus();
        }
    }
</script>

<svelte:window on:keydown={handleGlobalKeyDown}/>

{#if word === ''}
<Loading/>
{:else}
<div class="w-full flex flex-col gap-2">
    {#if hideSettings}
    <div class="w-full m-auto" id="container" in:fade>
        <div class="flex flex-col gap-2 w-full items-center justify-center m-auto">
            {#if autoSuggestedDetected}
            <div class="bg-red-500 font-white p-2 text-xs" in:fade out:fade>Auto-correct, or similar was detected and prevented.</div>
            {/if}
            <Hint on:click={hint} hidden={hidden} reduced={reduced} hintShown={hintShown}/>
            {#if !offline}
            <p class="font-light text-sm lowercase text-center max-w-xl">{definition}</p>
            {/if}
            <!-- svelte-ignore a11y-autofocus -->
            <input 
                id="input"
                type="text"
                inputmode="email"
                class="outline-none max-w-lg my-6 bg-black text-white duration-300 ease-in-out font-bold placeholder:text-gray-500 w-full text-2xl text-center" 
                placeholder="word"
                readonly={disabled}
                bind:value={input}
                on:input={timeAndQuickEnd}
                on:keydown={enter}
                on:paste={(event) => event.preventDefault()}
                spellcheck={false}
                autocapitalize={'off'}
                autocomplete={'off'}
                autocorrect={'off'}
                enterkeyhint={'done'}
            />
            <div class="flex flex-row gap-4">
                <IconButton id="reset" icon={ArrowPath} on:click={reset} on:keydown={handleResetKeyDown}/>
                <IconButton id="speak" icon={SpeakerWave} on:click={audio}/>
            </div>
            {#if end !== -1}
            <p class="font-light text-sm max-w-xl pt-4">{(end - start) / 1000} seconds</p>
            {/if}
        </div>
     </div>
     <div class="pt-18 flex flex-col gap-2 text-xs">
        <div class="flex flex-row gap-1 items-center">
            <Title/>
            <ShowSettings on:click={toggleSettings}/>
            {#if offline}<p class="bg-red p-1 text-black text-xs font-light bg-red-500 hover:opacity-80 duration-300 ease-in-out" transition:fade>OFFLINE</p>{/if}
        </div>
    </div>
    {:else}
    <Settings 
        alwaysPlayAudio={alwaysPlayAudio} 
        alwaysShowHint={alwaysShowHint} 
        quickEnd={quickEnd}
        on:audio={toggleAlwaysPlayAudio}
        on:hint={toggleAlwaysShowHint}
        on:quickend={toggleQuickEnd}
        on:settings={toggleSettings}/>
    {/if}
</div>
{/if}
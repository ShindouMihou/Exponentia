<script lang="ts">
	import { onDestroy, onMount } from "svelte";
    import { ArrowPath, SpeakerWave, ChevronDown } from '@steeze-ui/heroicons'
    import terminal from '$lib/logging'
    import { reduce, hide, diff } from '$lib/word'
	import { fade } from "svelte/transition";
    import Hint from "$lib/components/Hint.svelte";
	import IconButton from "$lib/components/shared/IconButton.svelte";
	import Title from "$lib/components/Title.svelte";
	import ShowSettings from "$lib/components/ShowSettings.svelte";
	import Loading from "$lib/components/screens/Loading.svelte";
	import Settings from "$lib/components/screens/Settings.svelte";
	import InputField from "$lib/components/InputField.svelte";
	import Info from "$lib/components/screens/Info.svelte";
	import MountError from "$lib/components/screens/MountError.svelte";

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

    let isTracking = false

    let screen = 'PLAY';

    let speech: SpeechSynthesisUtterance;
    let mountErrors: string[] = []

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
        try {
            if (window.umami == null) {
                window.umami = {
                    trackEvent: (event: string, data: any = {}) => {  },
                    trackView: (url: string, referrer: string = '') => {  },
                }
            }
            alwaysPlayAudio = localStorage.getItem('always_play_audio') === 'true'
            isTracking = ( localStorage.getItem('is_tracking') ?? 'true') === 'true'
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

                        window.umami.trackEvent('Version Re-check', { current: current, server: data.version});
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
                window.umami.trackEvent('Dataset Collect');
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
        } catch (ex) {
            mountErrors = [...mountErrors, JSON.stringify(ex)]
        }
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
        toggle('always_show_hint', alwaysShowHint);

        if (!offline) {
            hintShown = alwaysShowHint;
        }

        window.umami.trackEvent('Toggle Always Show Hint', { value: alwaysShowHint });
    }

    function toggleAlwaysPlayAudio() {
        alwaysPlayAudio = !alwaysPlayAudio; 
        toggle('always_play_audio', alwaysPlayAudio);

        window.umami.trackEvent('Toggle Always Play Audio', { value: alwaysPlayAudio });
    }

    function toggleQuickEnd() {
        quickEnd = !quickEnd; 
        toggle('quick_end', quickEnd);

        window.umami.trackEvent('Toggle Quick End', { value: quickEnd });
    }

    function navigate(to: 'PLAY' | 'SETTINGS' | 'INFO') {
        screen = to;
        window.umami.trackEvent('Navigate', { screen: to });
    }

    function toggleSettings() {
        if (screen === 'SETTINGS') navigate('PLAY'); else navigate('SETTINGS');
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

            window.speechSynthesis.speak(speech); 
            terminal.event({ ev: 'pl_au', text: speech.text });
            window.umami.trackEvent('Text-To-Speech', { text: word });
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
            window.umami.trackEvent('New Word', { new: word });
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

    function cheated() {
        input = lastInput; 
        autoSuggestedDetected = true;

        window.umami.trackEvent('Anti-Cheat Triggered')
    }

    function erase() {
        input = ''; 
        lastInput = '';

        window.umami.trackEvent('Quick Erase')
    }

    function hideAutoSuggestionWarning() {
        autoSuggestedDetected = false;
    }

    async function complete() {
        disabled = true;
        hintShown = true;
        reduced = word;
        end = Date.now();

        if (input === word) {
            document.getElementById('input')?.classList.replace('text-white', 'text-green-500');

            terminal.event({ ev: 'compl', s: true })
            window.umami.trackEvent('Spelled Correctly', { word: word, input: input })
            return;
        }

        document.getElementById('input')?.classList.replace('text-white','text-red-500');

        terminal.event({ ev: 'compl', s: false })
        window.umami.trackEvent('Spelled Incorrectly', { word: word, input: input })
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
        if (event.key === 'Tab') {
            event.preventDefault();
            document.getElementById('reset')?.focus();

            window.umami.trackEvent('Short Reset Focus')
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
    {#if mountErrors.length === 0}
        <Loading/>
    {:else}
        <MountError errors={mountErrors}/>
    {/if}
{:else}
<div class="w-full flex flex-col gap-2">
    {#if screen === 'PLAY'}
    <div class="w-full m-auto" id="container" in:fade>
        <div class="flex flex-col gap-2 w-full items-center justify-center m-auto">
            {#if autoSuggestedDetected}
            <div class="bg-red-500 font-white p-2 text-xs" in:fade out:fade>Auto-correct, or similar was detected and prevented.</div>
            {/if}
            <Hint on:click={hint} hidden={hidden} reduced={reduced} hintShown={hintShown}/>
            {#if !offline}
            <p class="font-light text-sm lowercase text-center max-w-xl">{definition}</p>
            {/if}
            <InputField
                isDisabled={disabled}
                isQuickEndEnabled={quickEnd}
                word={word}
                bind:input={input}
                bind:lastInput={lastInput}
                bind:start={start}
                on:cheated={cheated}
                on:complete={complete}
                on:erase={erase}
                on:input={hideAutoSuggestionWarning}
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
            <Title on:show={() => navigate('INFO')}/>
            <ShowSettings on:click={toggleSettings}/>
            {#if offline}<p class="bg-red p-1 text-black text-xs font-light bg-red-500 hover:opacity-80 duration-300 ease-in-out" transition:fade>OFFLINE</p>{/if}
        </div>
    </div>
    {:else if screen === 'SETTINGS'}
        <Settings 
            alwaysPlayAudio={alwaysPlayAudio} 
            alwaysShowHint={alwaysShowHint} 
            quickEnd={quickEnd}
            on:audio={toggleAlwaysPlayAudio}
            on:hint={toggleAlwaysShowHint}
            on:quickend={toggleQuickEnd}
            on:hide={toggleSettings}/>
    {:else if screen === 'INFO'}
        <Info on:hide={() => navigate('PLAY')}/>
    {/if}
</div>
{/if}
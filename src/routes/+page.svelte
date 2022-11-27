<script lang="ts">
	import { onDestroy, onMount } from "svelte";
    import { ArrowPath, SpeakerWave, ChevronDown } from '@steeze-ui/heroicons'
    import terminal from '$lib/logging'
    import { reduce, hide } from '$lib/word'
    import { 
        word, 
        isAlwaysPlayAudioEnabled, 
        isAlwaysShowHintEnabled, 
        isQuickEndEnabled, 
        isQuickNextEnabled, 
        input, 
        lastInput,
        start,
        isDisabled,
        sessionStatus
    } from '$lib/store'
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

    $: reduced = reduce($word);
    $: hidden = hide($word);

    const DEFAULT_DEFINITION = 'Looking for the definition...';
    let definition: string = DEFAULT_DEFINITION;

    let hintShown = false;

    let end: number = -1;

    let throttle = false;
    let offline = false;

    let autoSuggestedDetected = false

    let screen = 'PLAY';

    let speech: SpeechSynthesisUtterance;
    let mountErrors: string[] = []

    let offlineTimer = setInterval(() => 
       {
           if (navigator.onLine) {
                fetch('/hello.txt')
                    .then((response) => { 
                        if (response.ok)  { 
                            offline = false; 
                            if (definition === DEFAULT_DEFINITION) {
                                define($word); 
                            } 
                        } else { 
                            if (!offline) { 
                                setOffline() 
                            } 
                        } 
                    })
                    .catch((e) => { 
                        if (!offline) { 
                            setOffline() 
                        } 
                    })
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

            hintShown = $isAlwaysShowHintEnabled;
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

            if (window.speechSynthesis != null) {
                speech = new SpeechSynthesisUtterance()
                speech.lang = 'en'
                speech.rate = 1.05
            }

            reset();
        } catch (ex) {
            if ((ex as string).includes('speechsynthesisutterance')) {
                mountErrors = ['Your current browser is unsupported due to not supporting text-to-speech.'
                 + 'If this happens in an in-app browser such as Facebooka\'s, please open the site in your browser such as Firefox or Google Chrome.']
                return
            }
            mountErrors = [...mountErrors, (ex as string)]
        }
    });

    function setOffline() {
        offline = true;
        hintShown = true;
    }

    function toggleAlwaysShowHint() {
        $isAlwaysShowHintEnabled = !$isAlwaysShowHintEnabled;

        if (!offline) {
            hintShown = $isAlwaysShowHintEnabled;
        }

        window.umami.trackEvent('Toggle Always Show Hint', { value: $isAlwaysShowHintEnabled });
    }

    function toggleAlwaysPlayAudio() {
        $isAlwaysPlayAudioEnabled = !$isAlwaysPlayAudioEnabled
        window.umami.trackEvent('Toggle Always Play Audio', { value: $isAlwaysPlayAudioEnabled });
    }

    function toggleQuickEnd() {
        $isQuickEndEnabled = !$isQuickEndEnabled;
        window.umami.trackEvent('Toggle Quick End', { value: $isQuickEndEnabled });
    }

    function toggleQuickNext() {
        $isQuickNextEnabled = !$isQuickNextEnabled;
        window.umami.trackEvent('Toggle Quick Next', { value: $isQuickNextEnabled });
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
        if (window.speechSynthesis == null) return
        if (window.speechSynthesis.speaking) return
        
        if (speech) {
            speech.text = $word

            if (definition) {
                speech.text = speech.text + '. ' + definition + ' ' + $word;
            }

            window.speechSynthesis.speak(speech); 

            terminal.event({ ev: 'pl_au', text: speech.text });
            window.umami.trackEvent('Text-To-Speech', { text: $word });
        }
    }

    async function reset() {
        if (throttle) {
            terminal.event('throttled')
            return;
        }

        throttle = true;
        document.getElementById('container')?.classList.add('animate-pulse');
        
        try {
            $start = -1;
            end = -1;

            $input = '';
            $lastInput = '';

            hintShown = $isAlwaysShowHintEnabled;
            let n = random()

            if (!offline) {
                await define(n);
            }

            $word = n;
            const inputField = document.getElementById('input')
            $isDisabled = false;

            if (inputField) {
                $sessionStatus = 0
                //@ts-ignore
                inputField.value = '';
                inputField.focus()

                // important: Subsequent focus is for mobile purposes since mobile requires two focuses for some reason.
                setTimeout(() => inputField.focus(), 500)
            }

            if ($isAlwaysPlayAudioEnabled) {
                if (window.speechSynthesis.speaking) window.speechSynthesis.cancel()
                setTimeout(() => audio(), 150)
            }

            setTimeout(() => { throttle = false; document.getElementById('container')?.classList.remove('animate-pulse'); }, 150);
            terminal.event({ ev: 'res', word: $word, def: definition })
            window.umami.trackEvent('New Word', { new: $word });
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
        $input = $lastInput; 
        autoSuggestedDetected = true;

        window.umami.trackEvent('Anti-Cheat Triggered')
    }

    function erase() {
        $input = ''; 
        $lastInput = '';

        window.umami.trackEvent('Quick Erase')
    }

    function hideAutoSuggestionWarning() {
        autoSuggestedDetected = false;
    }

    async function complete() {
        if (end !== -1) return

        $isDisabled = true;
        hintShown = true;

        reduced = $word;
        end = Date.now();

        if ($input === $word) {
            $sessionStatus = 1
            terminal.event({ ev: 'compl', s: true })
            window.umami.trackEvent('Spelled Correctly', { word: $word, input: $input })
            return;
        }

        $sessionStatus = 2
        terminal.event({ ev: 'compl', s: false })
        window.umami.trackEvent('Spelled Incorrectly', { word: $word, input: $input })
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
        if (event.key === 'Tab') {
            event.preventDefault();
            document.getElementById('reset')?.focus();

            window.umami.trackEvent('Short Reset Focus')
        }

        if (event.key === 'Enter' && $isQuickNextEnabled === true && end !== -1 && ((end + 100) < Date.now())) {
            event.preventDefault();
            reset();

            window.umami.trackEvent('Quick Next')
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

        if (event.key === '$') {
            event.preventDefault();
            toggleQuickNext();
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

{#if $word === ''}
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
                on:cheated={cheated}
                on:complete={complete}
                on:erase={erase}
                on:input={hideAutoSuggestionWarning}
            />
            <div class="flex flex-row gap-4">
                <IconButton id="reset" icon={ArrowPath} on:click={reset} on:keydown={handleResetKeyDown}/>
                {#if window.speechSynthesis != null} <IconButton id="speak" icon={SpeakerWave} on:click={audio}/> {/if}
            </div>
            {#if end !== -1}
            <p class="font-light text-sm max-w-xl pt-4">{(end - $start) / 1000} seconds</p>
            {/if}
        </div>
     </div>
     <div class="pt-18 flex flex-col gap-2 text-xs">
        <div class="flex flex-row gap-1 items-center">
            <Title on:show={() => navigate('INFO')}/>
            <ShowSettings on:click={toggleSettings}/>
            {#if offline}<p class="bg-red p-1 text-black text-xs font-light bg-red-500 hover:opacity-80 duration-300 ease-in-out" in:fade>OFFLINE</p>{/if}
        </div>
    </div>
    {:else if screen === 'SETTINGS'}
        <Settings 
            on:audio={toggleAlwaysPlayAudio}
            on:hint={toggleAlwaysShowHint}
            on:quickend={toggleQuickEnd}
            on:hide={toggleSettings}
            on:quicknext={toggleQuickNext}
            />
    {:else if screen === 'INFO'}
        <Info on:hide={() => navigate('PLAY')}/>
    {/if}
</div>
{/if}
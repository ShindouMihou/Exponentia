<script lang="ts">
	import { onDestroy, onMount } from "svelte";
    import { Icon } from '@steeze-ui/svelte-icon'
    import { Eye, EyeSlash, ArrowPath, SpeakerWave } from '@steeze-ui/heroicons'

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

    let alwaysShowHint = false;
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

    let fasterOfflineTimer = setInterval(() => {
        if (!navigator.onLine && !offline) {
            setOffline()
        }
    }, 2 * 1000)

    onDestroy(() => { clearInterval(offlineTimer); clearInterval(fasterOfflineTimer); });

    onMount(async () => {
        alwaysPlayAudio = localStorage.getItem('always_play_audio') === 'true'
        alwaysShowHint = localStorage.getItem('always_show_hint') === 'true'
        hideSettings = localStorage.getItem('hide_settings') === 'true'
        hintShown = alwaysShowHint;

        quickEnd = (localStorage.getItem('quick_end') ?? 'true') === 'true'

        if (localStorage.getItem('dataset') == null) {
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

    function toggleAlwaysShowHint() {
        localStorage.setItem('always_show_hint', (!alwaysShowHint).toString())
        alwaysShowHint = !alwaysShowHint;

        if (!offline) {
            hintShown = alwaysShowHint;
        }
    }

    function toggleAlwaysPlayAudio() {
        localStorage.setItem('always_play_audio', (!alwaysPlayAudio).toString())
        alwaysPlayAudio = !alwaysPlayAudio;
    }

    function toggleQuickEnd() {
        localStorage.setItem('quick_end', (!quickEnd).toString())
        quickEnd = !quickEnd;
    }

    function toggleHideSettings() {
        localStorage.setItem('hide_settings', (!hideSettings).toString())
        hideSettings = !hideSettings;
    }

    function random(): string {
        return dataset[Math.floor(Math.random() * dataset.length)].toLowerCase();
    }

    function reduce(content: string): string {
        let newContents = '';
        for (let i = 0; i < content.length; i++) {
            if (i % (Math.floor(Math.random() * 2)) == 0) { newContents += content.charAt(i); } else { newContents += '•'; }
        }

        return newContents
    }

    function define(word: string) {
        return fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
            .then((response) => response.ok === true ? response.json() : null)
            .then((data: Array<any>) => {
                if (data != null) {
                    definition = data.at(0).meanings[0].definitions[0].definition
                } else {
                    definition = "No definition found.";
                    throw { error: "No definition found, this exception is intentional." }
                }
            })
    }

    function audio() {
        if (window.speechSynthesis.speaking) return
        
        if (speech) {
            speech.text = word

            if (definition) {
                speech.text = speech.text + ". " + definition + " " + word;
            }

            window.speechSynthesis.speak(speech)
        }
    }

    function hide(word: string): string {
        let result = '';
        for (let i = 0; i < word.length; i++) {
            result += '•';
        }

        return result;
    }

    async function reset() {
        if (throttle) {
            return;
        }

        throttle = true;
        document.getElementById('container')?.classList.add('animate-pulse');
        
        try {
            // Reset time statistics.
            start = -1;
            end = -1;

            // Reset input.
            input = '';
            lastInput = '';
            
            // Find a new word and get the definition of it.
            let n = random()

            if (!offline) {
                await define(n);
            }

            word = n;

            // Reset the input field to its original state.
            const inputField = document.getElementById('input')
            disabled = false;

            if (inputField) {
                inputField.classList.add('text-white')
                inputField.classList.remove('text-green-500', 'text-red-500')
                //@ts-ignore
                inputField.value = '';
                // Focus on the input field.
                inputField.focus()
            }

            if (alwaysPlayAudio) {
                if (window.speechSynthesis.speaking) window.speechSynthesis.cancel()
                setTimeout(() => audio(), 150)
            }

            setTimeout(() => { throttle = false; document.getElementById('container')?.classList.remove('animate-pulse'); }, 150);
        } catch (e) {
            throttle = false;
            await reset()
        }
    }

    function hint() {
        if (!offline) {
            hintShown = !hintShown;
        }
    }

    async function enter(event: any) {
        if (event.key === 'Enter' && input.length !== 0) {
            event.preventDefault();
            complete();
        }
    }

    async function timeAndQuickEnd(event: any) {
        input = input.trim()
        if (start === -1) {
            start = Date.now();
        }

        let difference = input.length > lastInput.length ? input.length - lastInput.length : lastInput.length - input.length;
        if (difference >= 2) {
            event.preventDefault(); input = lastInput; autoSuggestedDetected = true;
            return
        }

        lastInput = input;

        if (autoSuggestedDetected) {
            autoSuggestedDetected = false;
        }

        if ((quickEnd === true && input.toLowerCase() === word)) {
            event.preventDefault();
            complete();
        }
    }

    async function complete() {
        disabled = true;
        hintShown = true;

        reduced = word;
        end = Date.now();

        if (input.toLowerCase() === word) {
            document.getElementById('input')?.classList.replace('text-white', 'text-green-500');
            return;
        }

        document.getElementById('input')?.classList.replace('text-white','text-red-500');
    }

    function handleGlobalKeyDown(event: any) {
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
<div class="w-full m-auto">
   <div class="flex w-full items-center justify-center m-auto">
        <p class="font-light text-2xl uppercase text-black bg-white p-1 animate-pulse animate-bounce">EXPONENTIA</p>
   </div>
</div>
{:else}
<div class="w-full flex flex-col gap-2">
    <div class="w-full m-auto" id="container">
        <div class="flex flex-col gap-2 w-full items-center justify-center m-auto">
            {#if autoSuggestedDetected}
            <div class="bg-red-500 font-white p-2 text-xs">Auto-correct, or similar was detected and prevented.</div>
            {/if}
            <button 
                class="outline-none flex flex-row gap-2 hover:opacity-70 text-gray-300 text-lg items-center duration-300 ease-in-out p-2" 
                on:click={hint} 
                id="hint"
            >
                <p class="text-white">
                    {#if hintShown} {reduced} {:else} {hidden} {/if}
                </p>
                {#if hintShown} <Icon src={EyeSlash} size="18"></Icon> {:else} <Icon src={Eye} size="18"></Icon> {/if}
            </button>
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
                <button id="reset" 
                    on:keydown={handleResetKeyDown} 
                    class="focus:bg-white focus:text-black duration-300 ease-in-out p-2 outline-none flex flex-row gap-2 hover:opacity-70 text-gray-300 text-lg items-center" 
                    on:click={reset}>
                    <Icon src={ArrowPath} size="18"></Icon>
                </button>
                <button id="speak" 
                on:keydown={handleResetKeyDown} 
                class="focus:bg-white focus:text-black duration-300 ease-in-out p-2 outline-none flex flex-row gap-2 hover:opacity-70 text-gray-300 text-lg items-center" 
                on:click={audio}>
                    <Icon src={SpeakerWave} size="18"></Icon>
                </button>
            </div>
            {#if end !== -1}
            <p class="font-light text-sm max-w-xl pt-4">{(end - start) / 1000} seconds</p>
            {/if}
        </div>
     </div>
     <div class="pt-18 flex flex-col gap-2 text-xs">
        <div class="flex flex-row gap-1 items-center">
            <a class="font-light uppercase text-black bg-white w-fit p-1 px-[0.27rem] hover:opacity-80 duration-300 ease-in-out"
                href="https://github.com/ShindouMihou/Exponentia" 
                alt="Exponentia GitHub"
            >
            EXPONENTIA
            </a>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <p on:click={toggleHideSettings} class="hover:opacity-80 duration-300 ease-in-out"><span class="p-1 px-[0.93rem] font-light bg-white text-black uppercase">{#if hideSettings} Show Settings {:else} Hide Settings {/if}</span></p>
        </div>
        {#if !hideSettings}
        <p class="hidden xl:inline"><span class="p-1 bg-white text-black">TAB + ENTER</span> : next word</p>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <p on:click={toggleAlwaysShowHint} class="lg:mt-1 hover:opacity-80 duration-300 ease-in-out"><span class="p-1 px-[0.93rem] bg-white text-black hidden lg:inline uppercase">Shift + 1</span><span class="p-1 px-6 bg-white text-black lg:hidden inline uppercase">Click</span> : {#if alwaysShowHint} disable {:else} enable {/if} always show hint.</p>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <p on:click={toggleQuickEnd} class="mt-1 hover:opacity-80 duration-300 ease-in-out" ><span class="p-1 px-[0.87rem] bg-white text-black hidden lg:inline uppercase">Shift + 2</span><span class="p-1 px-6 bg-white text-black lg:hidden inline uppercase">Click</span> : {#if quickEnd} disable {:else} enable {/if} quick end.</p>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <p on:click={toggleAlwaysPlayAudio} class="mt-1 hover:opacity-80 duration-300 ease-in-out" ><span class="p-1 px-[0.87rem] bg-white text-black hidden lg:inline uppercase">Shift + 3</span><span class="p-1 px-6 bg-white text-black lg:hidden inline uppercase">Click</span> : {#if alwaysPlayAudio} disable {:else} enable {/if} always play audio.</p>
        {/if}
        {#if offline}
        <p class="mt-1"><span class="p-1 px-[1.07rem] bg-red-500 text-black">OFFLINE</span> : definitions are disabled, hint is shown.</p>
        {/if}
    </div>
</div>
{/if}
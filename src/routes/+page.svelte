<script lang="ts">
	import { onDestroy, onMount } from "svelte";
    import { Icon } from '@steeze-ui/svelte-icon'
    import { Eye, EyeSlash, ArrowPath } from '@steeze-ui/heroicons'

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
    let quickEnd = true;
    
    let offlineTimer = setInterval(() => 
       {
           if (navigator.onLine) {
                fetch('/hello.txt')
                    .then((response) => { if (response.ok)  { offline = false } else { setOffline() } })
                    .catch((e) => offline = false)
           } else {
               offline = true;
           }
       },
        15 * 1000
    )

    onDestroy(() => clearInterval(offlineTimer));

    onMount(async () => {
        alwaysShowHint = localStorage.getItem('always_show_hint') === 'true'
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

    function toggleQuickEnd() {
        localStorage.setItem('quick_end', (!quickEnd).toString())
        quickEnd = !quickEnd;
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
            .then((response) => response.json())
            .then((data: Array<any>) => definition = data?.at(0).meanings[0].definitions[0].definition)
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
            
            // Find a new word and get the definition of it.
            let n = random()

            if (!offline) {
                await define(n);
            }

            word = n;

            // Reset the input field to its original state.
            document.getElementById('input')?.classList.add('text-white');
            document.getElementById('input')?.classList.remove('text-green-500', 'text-red-500');
            disabled = false;

            // Focus on the input field.
            document.getElementById('input')?.focus();
            setTimeout(() => { throttle = false; document.getElementById('container')?.classList.remove('animate-pulse'); }, 150);
        } catch (e) {
            throttle = false;
            console.error(e);

            await reset()
        }
    }

    function hint() {
        if (!offline) {
            hintShown = !hintShown;
        }
    }

    async function compare(event: any) {
        if (start === -1) {
            start = Date.now();
        }

        if ((quickEnd === true && input.toLowerCase() === word) || (event.key === 'Enter' && input.length !== 0)) {
            event.preventDefault();
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
                class="outline-none max-w-lg my-6 bg-black text-white duration-300 ease-in-out font-bold placeholder:text-gray-500 w-full text-2xl text-center" 
                placeholder="word"
                disabled={disabled}
                autofocus
                bind:value={input}
                on:keyup={compare}
            />
            <button id="reset" 
                on:keydown={handleResetKeyDown} 
                class="focus:bg-white focus:text-black duration-300 ease-in-out p-2 outline-none flex flex-row gap-2 hover:opacity-70 text-gray-300 text-lg items-center" 
                on:click={reset}>
                <Icon src={ArrowPath} size="18"></Icon>
            </button>
            {#if end !== -1}
            <p class="font-light text-sm max-w-xl pt-4">{(end - start) / 1000} seconds</p>
            {/if}
        </div>
     </div>
     <div class="pt-18 flex flex-col gap-2 text-xs">
        <a class="font-light uppercase text-black bg-white w-fit p-1 px-[0.27rem] hover:opacity-80 duration-300 ease-in-out"
            href="https://github.com/ShindouMihou/Exponentia" 
            alt="Exponentia GitHub"
        >EXPONENTIA</a>
        <p><span class="p-1 bg-white text-black hidden xl:inline">TAB + ENTER</span> : next word</p>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <p on:click={toggleAlwaysShowHint} class="mt-1 hover:opacity-80 duration-300 ease-in-out" ><span class="p-1 px-[0.93rem] bg-white text-black hidden lg:inline">SHIFT + 1</span><span class="p-1 px-6 bg-white text-black lg:hidden inline">CLICK</span> : {#if alwaysShowHint} disable {:else} enable {/if} always show hint.</p>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <p on:click={toggleQuickEnd} class="mt-1 hover:opacity-80 duration-300 ease-in-out" ><span class="p-1 px-[0.87rem] bg-white text-black hidden lg:inline">SHIFT + 2</span><span class="p-1 px-6 bg-white text-black lg:hidden inline">CLICK</span> : {#if quickEnd} disable {:else} enable {/if} quick end.</p>
        {#if offline}
        <p class="mt-1"><span class="p-1 px-[1.07rem] bg-red-500 text-black">OFFLINE</span> : definitions are disabled, hint is always shown.</p>
        {/if}
    </div>
</div>
{/if}
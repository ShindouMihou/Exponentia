<script lang="ts">
    import terminal from '$lib/logging'
	import { diff } from '$lib/word';
	import { createEventDispatcher } from 'svelte';
    import { 
        word,
        isQuickEndEnabled, 
        input, 
        lastInput,
        isDisabled,
        start,
        sessionStatus
    } from '$lib/store'

    const dispatch = createEventDispatcher()

    async function enter(event: KeyboardEvent) {
        if (event.key === 'Enter' && $input.length !== 0) {
            event.preventDefault(); 

            dispatch('complete')
            terminal.event({ ev: 'compl', input: $input });
        }

        if (event.ctrlKey && (event.key === 'a' || event.key === 'A')) {
            event.preventDefault(); 
            
            dispatch('erase')
            terminal.event({ ev: 'q_er' });
        }
    }

    async function timeAndQuickEnd(event: Event) {
        $input = $input.toLowerCase().trim()
        if ($start === -1) {
            $start = Date.now(); 
            terminal.event({ ev: 'tme', s: start });
        }

        let difference = diff($input, $lastInput)
        if (difference >= 2 && $input != '') {
            event.preventDefault();

            dispatch('cheated')
            terminal.event({ ev: 'ac', diff: difference });
            return
        }

        $lastInput = $input;
        dispatch('input')

        if (($isQuickEndEnabled === true && $input.toLowerCase() === $word)) {
            event.preventDefault(); 

            dispatch('complete')
            terminal.event({ ev: 'qe', word: $word})
        }
    }

    function colorized(status: number): string {
        if (status === 1) {
            return 'text-green-500'
        }

        if (status === 2) {
            return 'text-red-500'
        }

        return 'text-white'
    }
</script>

<!-- svelte-ignore a11y-autofocus -->
<input 
    id="input"
    type="text"
    inputmode="email"
    class="outline-none max-w-lg my-6 bg-black caret-white {colorized($sessionStatus)} duration-300 ease-in-out font-bold placeholder:text-gray-500 w-full text-2xl text-center" 
    placeholder="word"
    readonly={$isDisabled}
    bind:value={$input}
    on:input={timeAndQuickEnd}
    on:keydown={enter}
    on:paste={(event) => event.preventDefault()}
    spellcheck={false}
    autocapitalize={'off'}
    autocomplete={'off'}
    autocorrect={'off'}
    enterkeyhint={'done'}
    autofocus
/>
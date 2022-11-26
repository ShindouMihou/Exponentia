<script lang="ts">
	import { ChevronDown } from "@steeze-ui/heroicons";
	import { Icon } from "@steeze-ui/svelte-icon";
	import { createEventDispatcher } from "svelte";
	import { fade } from "svelte/transition";
	import ToggleableSetting from "../settings/ToggleableSetting.svelte";

    const dispatch = createEventDispatcher()

    export let alwaysShowHint: boolean;
    export let quickEnd: boolean;
    export let alwaysPlayAudio: boolean;

    function escape(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            dispatch('hide')
        }
    }
</script>
<svelte:window on:keydown={escape}/>
<div class="flex flex-col" in:fade>
    <div class="flex flex-row gap-2 items-center justify-between">
        <h1 class="text-2xl font-light text-pink-300 w-fit uppercase">Settings</h1>
        <button on:click={() => dispatch('hide')} class="text-black bg-red-300 rounded-full hover:bg-white duration-300 ease-in-out">
            <Icon src={ChevronDown} size={'20'}></Icon>
        </button>
    </div>
    <p class="text-xs hidden lg:block">all the settings are also configureable on-the-go with the key combinations beside the setting name.</p>
    <div class="my-1">
        <ToggleableSetting 
            on:click={() => dispatch('hint')}
            name="Always Show Hint"
            description="hint will be shown on every word, but can still be hidden with the hide button."
            option={alwaysShowHint}
            keyCombination={'SHIFT + 1'}/>
        <ToggleableSetting 
            on:click={() => dispatch('quickend')}
            name="Quick End"
            description="completes the test upon the correct spelling of the word."
            option={quickEnd}
            keyCombination={'SHIFT + 2'}/>
        <ToggleableSetting 
            on:click={() => dispatch('audio')}
            name="Always Play Audio"
            description="plays the audio hint upon the start of the test."
            option={alwaysPlayAudio}
            keyCombination={'SHIFT + 3'}
            supported={window.speechSynthesis != null}/>
    </div>
</div>
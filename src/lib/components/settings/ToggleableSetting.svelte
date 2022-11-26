<script lang="ts">
	import { Check, XMark } from "@steeze-ui/heroicons";
	import { Icon } from "@steeze-ui/svelte-icon";
	import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";

    const dispatch = createEventDispatcher()
    const onClick = () => dispatch('click')
    
    export let option: Boolean;
    export let name: string;
    export let description: string;
    export let keyCombination: string = '';
</script>

<div class="flex flex-row gap-4 text-white font-light lowercase items-center my-3">
    <button on:click={onClick} class="px-6 h-7 rounded-lg text-black bg-pink-300 hover:bg-white duration-300 ease-in-out">
        {#if option} <div in:fade><Icon src={Check} size={'18'}></Icon> </div>
        {:else} <div in:fade><Icon src={XMark} size={'18'}></Icon></div>
        {/if}
    </button>
    <div class="flex flex-col">
        <h2 class="text-sm text-pink-300 font-medium">{name} {#if keyCombination !== ''} <span class="text-white font-normal hidden lg:inline">[{keyCombination}]</span> {/if}</h2>
        <p class="text-sm leading-none">{description}</p>
    </div>
</div>
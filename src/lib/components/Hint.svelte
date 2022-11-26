<script lang="ts">
	import { Eye, EyeSlash } from "@steeze-ui/heroicons";
	import { Icon } from "@steeze-ui/svelte-icon";
	import { createEventDispatcher } from "svelte";
	import { fade } from "svelte/transition";

    const dispatcher = createEventDispatcher();
    const hint = () => dispatcher('click')

    export let hintShown: boolean;
    export let reduced: string;
    export let hidden: string;
</script>
<button 
    class="outline-none flex flex-row gap-2 hover:opacity-70 text-gray-300 text-lg items-center duration-300 ease-in-out p-2" 
    on:click={hint} 
    id="hint">
    <p class="text-white">
        {#if hintShown} 
            <p in:fade>{reduced}</p> 
        {:else} 
            <p in:fade>{hidden}</p> 
        {/if}
    </p>
    {#if hintShown} 
        <i in:fade><Icon src={EyeSlash} size="18"></Icon></i> 
    {:else} 
        <i in:fade><Icon src={Eye} size="18"></Icon></i> 
    {/if}
</button>
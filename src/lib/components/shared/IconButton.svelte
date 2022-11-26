<script lang="ts">
	import { Icon } from "@steeze-ui/svelte-icon";
	import type { IconSource } from "@steeze-ui/svelte-icon/types";
	import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher()
    
    export let id: string;
    export let icon: IconSource;
</script>
<button id={id}
    on:keydown={() => dispatch('keydown')} 
    class="focus:bg-white focus:text-black duration-300 ease-in-out p-2 outline-none flex flex-row gap-2 hover:opacity-70 text-gray-300 text-lg items-center" 
    on:click={() => dispatch('click')}>
    <Icon src={icon} size="18"></Icon>
</button>
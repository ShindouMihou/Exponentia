<script lang="ts">
	import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher()
</script>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<p on:click={() => dispatch('show')}
    class="font-bold uppercase text-black bg-white w-fit p-1 px-[0.84rem] hover:opacity-80 duration-300 ease-in-out text-xs">EX</p>
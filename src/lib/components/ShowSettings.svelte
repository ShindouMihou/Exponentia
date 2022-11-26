<script>
	import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher()

</script>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<p on:click={() => dispatch('click')} class="hover:opacity-80 duration-300 ease-in-out">
    <span class="p-1 px-[0.93rem] font-light bg-white text-black uppercase">Show Settings</span>
</p>
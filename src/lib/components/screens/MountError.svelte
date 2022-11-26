<script lang="ts">
	import { fade } from "svelte/transition";
    export let errors: string[];
</script>
<div class="flex flex-col" in:fade>
    <div class="flex flex-row gap-2 items-center justify-between">
        <h1 class="text-2xl font-light text-pink-300 w-fit uppercase">Error</h1>
    </div>
    <div class="max-w-[64rem]">
        <p class="text-sm lowercase text-justify">
            there was some sort of mishap that happened while mounting, please report this issue.
        </p>
        <hr class="my-2"/>
        <div class="flex flex-col gap-2">
            {#each errors as error}
            <p class="text-sm lowercase text-justify">{error}</p>
            {/each}
        </div>
    </div>
</div>
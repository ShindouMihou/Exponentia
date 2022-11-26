<script lang="ts">
	import { AtSymbol, ChevronDown } from "@steeze-ui/heroicons";
	import { Icon } from "@steeze-ui/svelte-icon";
	import { createEventDispatcher } from "svelte";
	import { fade } from "svelte/transition";
    import { Github, Producthunt } from "@steeze-ui/simple-icons";
	import OtherLink from "../info/OtherLink.svelte";

    const dispatch = createEventDispatcher()
</script>
<div class="flex flex-col" in:fade>
    <div class="flex flex-row gap-2 items-center justify-between">
        <h1 class="text-2xl font-light text-pink-300 w-fit uppercase">Exponentia</h1>
        <button on:click={() => dispatch('hide')} class="text-black bg-red-300 rounded-full hover:bg-white duration-300 ease-in-out">
            <Icon src={ChevronDown} size={'20'}></Icon>
        </button>
    </div>
    <div class="max-w-[64rem]">
        <p class="text-sm lowercase text-justify">
            There was a lack of proper applications to help spelling contentants. Some were full of ads, lacked capabilities or 
            weren't fit, and knowing that there might be a time when i will need one... i built one. it's that simple of a history.
        </p>
        <h1 class="text-2xl font-light text-pink-300 w-fit uppercase mt-4 mb-2">Privacy Policy</h1>
        <div class="text-sm lowercase text-justify" id="privacy-policy">
            <p>
                exponentia uses umami.is and cloudflare analytics to provide some form of analytics; we use umami.is to provide 
                us with anonymized information such as what words are the most difficult to the majority, what words are the easiest and how many 
                have attempted to use some form of corrections or suggestions.
            </p>
            <p class="my-2">
                other than those indicated, no other data is collected. all of these are verifiable from the official source code, deployments are 
                automated to ensure that what is in our official source code is what you are seeing as well (no hidden tricks).
            </p>
        </div>
        <div class="flex flex-row gap-2 mt-4">
            <OtherLink href="https://github.com/ShindouMihou" alt="GitHub" icon={Github}/>
            <OtherLink href="https://producthunt.com/posts/Exponentia" alt="ProductHunt" color="text-[#DA552F]" icon={Producthunt}/>
            <OtherLink href="mailto:hello@mihou.pw" alt="Email" icon={AtSymbol} color="bg-white text-black rounded-full"/>
        </div>
    </div>
</div>
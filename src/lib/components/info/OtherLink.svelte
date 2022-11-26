<script lang="ts">
	import type { IconSource } from "@steeze-ui/heroicons/types";
	import { Icon } from "@steeze-ui/svelte-icon";

    export let icon: IconSource;
    export let href: string;
    export let alt: string;
    export let color: string = "text-white";
</script>
<a href="{href}" alt="{alt}" rel="noreferrer" target="_blank" class="{color}">
    <Icon src={icon} size={'24'}/>
</a>

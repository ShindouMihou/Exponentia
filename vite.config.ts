import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const config: UserConfig = {
    plugins: [sveltekit(), VitePWA({ registerType: 'autoUpdate' })]
};

export default config;

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Locals {}
	// interface PageData {}
	// interface Error {}
	// interface Platform {}
}

declare interface Window {
	umami: Umami
}

declare interface Umami {
	trackEvent(event: string): void
	trackEvent(event: string, data: any = {}): void
	trackView(url: string): void
	trackView(url: string, referrer: string): void
}
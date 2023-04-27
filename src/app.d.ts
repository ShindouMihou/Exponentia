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
	track(event: string): void
	track(event: string, data: any = {}): void
}
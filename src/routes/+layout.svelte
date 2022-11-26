<script>
	import { onMount } from "svelte";
    import "../app.css";

    const UMAMI_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID;
</script>
<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"> 
    <title>Exponentia</title>
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <meta name="title" content="Exponentia"/>
    <meta name="og:title" content="Exponentia"/>
    <meta name="og:url" content="exponie.me"/>
    <meta name="og:type" content="website"/>
    <meta name="description" content="A minimalist's spelling test website. Challenge your vocabulary."/>
    <meta name="og:description" content="A minimalist's spelling test website. Challenge your vocabulary."/>
    <meta name="og:image" content="/banner.png"/>
    <meta name="image" content="/banner.png"/>
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#fff"/>
    <link rel="manifest" href="/site.webmanifest">
    <style>
        .inter { font-family: 'Inter', 'sans-serif'; }
        body { background-color: #000; }
    </style>
    <script async defer src="https://analytics.umami.is/script.js" data-website-id="{UMAMI_ID}"></script>
</svelte:head>

<div class="p-6 inter flex text-white flex-col min-h-screen">
    <main class="flex w-full flex-grow">
        <slot/>
    </main>
</div>


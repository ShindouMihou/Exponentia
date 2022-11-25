// from https://github.com/tretapey/svelte-pwa/blob/master/public/service-worker.js
// and https://github.com/Myrmod/SvelteKit-offline/blob/master/src/service-worker/installEvent.ts
// full credits to them, love love.
'use strict';

import { build } from "$service-worker";

// Update cache names any time any of the cached files change.
const CACHE_NAME = 'static-cache-v2';

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  evt.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(build);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  // Remove previous cached data from disk.
  evt.waitUntil(
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
     caches.match(event.request).then((cacheResponse) => {
        console.info(`Fetching fresh: ${event.request.url}`);
        return fetch(event.request)
           .then(async (fetchResponse): Promise<Response | undefined> => {
              if (
                 event.request.url.indexOf('http') !== -1
              ) {
                 const cache = await caches.open(CACHE_NAME);

                 try {
                    if (fetchResponse.status !== 206) {
                       cache.put(event.request.url, fetchResponse.clone());
                    }
                 } catch (error) {
                    console.error(error);
                 }
                 return fetchResponse;
              }
              // eslint-disable-next-line consistent-return
              return undefined;
           })
           .catch(((error) => {
               // Prioritize cache last.
               if (cacheResponse) {
                  console.info(`Fetching cached: ${event.request.url}`);
                  return cacheResponse;
               }

              console.error(`"${error}: ${event.request.url}`);
              return error;
           }));
     }),
  );
});
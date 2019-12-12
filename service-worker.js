'use strict';
/*eslint no-undef: 0*/
/* 2019-12-03T10:27 */
self.importScripts('/sw-config.js');

self.addEventListener('install', async event => {
	event.waitUntil((async () => {
		try {
			for (const key of await caches.keys()) {
				if (key !== 'user') {
					await caches.delete(key);
				}
			}

			const cache = await caches.open(config.version);
			await cache.addAll([...config.stale || [], ...config.fresh || []]);
		} catch (err) {
			console.error(err);
		}
	})());
});

self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener('fetch', event => {
	if (event.request.method === 'GET') {
		event.respondWith((async () => {
			const url = new URL(event.request.url);
			url.hash = '';

			if (Array.isArray(config.stale) && config.stale.includes(url.href)) {
				const cached = await caches.match(url);
				if (cached instanceof Response) {
					return cached;
				}
			} else if (Array.isArray(config.fresh) && config.fresh.includes(url.href)) {
				if (navigator.onLine) {
					const resp = await fetch(url.href);
					const cache = await caches.open(config.version);

					if (resp.ok) {
						cache.put(event.request, resp.clone());
					}
					return resp;
				} else {
					return caches.match(event.request.url);
				}
			} else if (Array.isArray(config.allowed) && config.allowed.some(entry => (
				entry instanceof RegExp
					? entry.test(event.request.url)
					: url.host === entry
			))) {
				const resp = await caches.match(event.request.url);
				if (resp instanceof Response) {
					return resp;
				} else if (navigator.onLine) {
					const resp = await fetch(event.request.url, {
						mode: 'cors',
						headers: event.request.headers,
					});

					if (resp instanceof Response) {
						const cache = await caches.open(config.version);
						cache.put(event.request.url, resp.clone());
						return resp;
					} else {
						console.error(`Failed in request for ${event.request.url}`);
					}
				} else {
					console.error('Offline');
				}
			} else {
				console.info(`Making request for ${event.request.url}`);
				return fetch(event.request.url);
			}
		})());
	}
});

self.addEventListener('error', console.error);

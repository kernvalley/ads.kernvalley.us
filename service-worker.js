'use strict';
/* global config */
/* eslint-env serviceworker */
/* 2020-11-30T09:20 */

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
			await cache.addAll([...config.stale || [], ...config.fresh || []]).catch(console.error);
		} catch (err) {
			console.error(err);
		}
	})());
});

self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener('fetch', event => {
	if (event.request.method === 'GET') {
		event.respondWith((async () => {
			if (Array.isArray(config.stale) && config.stale.includes(event.request.url)) {
				const cached = await caches.match(event.request, { ignoreSearch: true });
				if (cached instanceof Response) {
					return cached;
				} else {
					const [resp, cache] = await Promise.all([
						fetch(event.request),
						caches.open(config.version),
					]);

					if (resp.ok) {
						cache.put(event.request, resp.clone());
					}

					return resp;
				}
			} else if (Array.isArray(config.fresh) && config.fresh.includes(event.request.url)) {
				if (navigator.onLine) {
					const [resp, cache] = await Promise.all([
						fetch(event.request),
						caches.open(config.version),
					]);

					if (resp.ok) {
						cache.put(event.request, resp.clone());
						return resp;
					} else {
						return cache.match(event.request, { ignoreSearch: true });
					}
				} else {
					return caches.match(event.request, { ignoreSearch: true });
				}
			} else if (Array.isArray(config.allowed) && config.allowed.some(entry => (
				entry instanceof RegExp
					? entry.test(event.request.url)
					: event.request.url.startsWith(entry)
			))) {
				const resp = await caches.match(event.request);

				if (resp instanceof Response) {
					return resp;
				} else {
					const resp = await fetch(event.request);

					if (resp instanceof Response) {
						const cpy = resp.clone();
						caches.open(config.version).then(cache => cache.put(event.request, cpy));
						return resp;
					} else {
						console.error(`Failed in request for ${event.request.url}`);
					}
				}
			} else {
				return fetch(event.request);
			}
		})());
	}
});

self.addEventListener('push', event => {
	const data = event.data.json();
	if (('notification' in data) && Array.isArray(data.notification) && Notification.permission === 'granted') {
		this.registration.showNotification(...data.notification);
	}
});

self.addEventListener('error', console.error);

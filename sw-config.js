/* eslint-env serviceworker */
/* eslint no-unused-vars: 0 */
const config = {
	version: '1.2.2',
	fresh: [
		'https://apps.kernvalley.us/apps.json',
	].map(path => new URL(path, location.origin).href),
	stale: [
		'/',
		'/js/index.min.js',
		'/css/index.min.css',
		'/manifest.json',
		'/js/imgWorker.js',
		'/img/icons.svg',
		'/img/apple-touch-icon.png',
		'/img/icon-192.png',
		'/img/icon-32.png',
		'/img/favicon.svg',
		'/img/ad-layouts/card.svg',
		'/img/ad-layouts/stack.svg',
		'/img/ad-layouts/text.svg',
		'/img/ad-layouts/image.svg',
		'https://cdn.kernvalley.us/components/toast-message.html',
		'https://cdn.kernvalley.us/components/toast-message.css',
		'https://cdn.kernvalley.us/components/pwa/prompt.html',
		'https://cdn.kernvalley.us/components/pwa/prompt.css',
		'https://cdn.kernvalley.us/components/github/user.html',
		'https://cdn.kernvalley.us/components/github/user.css',
		'https://cdn.kernvalley.us/components/ad/block.html',
		'https://cdn.kernvalley.us/components/ad/block.css',
		'https://cdn.kernvalley.us/img/keep-kern-clean.svg',
		'https://cdn.kernvalley.us/img/logos/play-badge.svg',
		'https://cdn.kernvalley.us/fonts/roboto.woff2',
	].map(path => new URL(path, location.origin).href),
	allowed: [
		/https:\/\/i\.imgur\.com\/*/,
		/https:\/\/api\.github\.com\/user\/*/,
		/https:\/\/*\.githubusercontent\.com\/u\/*/,
	]
};

/* eslint-env serviceworker */
/* eslint no-unused-vars: 0 */
/* 2021-02-11T18:09 */

const config = {
	version: '1.4.4',
	fresh: [
		'/',
		'/webapp.webmanifest',
		'https://apps.kernvalley.us/apps.json',
	].map(path => new URL(path, location.origin).href),
	stale: [
		/* HTML */

		/* JavaScript */
		'/js/index.min.js',

		/* Styles */
		'/css/index.min.css',
		'https://cdn.kernvalley.us/components/toast-message.css',
		'https://cdn.kernvalley.us/components/github/user.css',
		'https://cdn.kernvalley.us/components/install/prompt.css',
		'https://cdn.kernvalley.us/components/ad/block.css',

		/* Images */
		'/img/icons.svg',
		'/img/apple-touch-icon.png',
		'/img/icon-192.png',
		'/img/icon-32.png',
		'/img/favicon.svg',
		'/img/ad-layouts/card.svg',
		'/img/ad-layouts/stack.svg',
		'/img/ad-layouts/text.svg',
		'/img/ad-layouts/image.svg',
		'https://cdn.kernvalley.us/img/keep-kern-clean.svg',
		'https://cdn.kernvalley.us/img/logos/play-badge.svg',
		'https://cdn.kernvalley.us/img/logos/pwa-badge.svg',
		'https://cdn.kernvalley.us/img/logos/instagram.svg',

		/* HTML / Templates */
		'https://cdn.kernvalley.us/components/toast-message.html',
		'https://cdn.kernvalley.us/components/github/user.html',
		'https://cdn.kernvalley.us/components/install/prompt.html',
		'https://cdn.kernvalley.us/components/ad/block.html',

		/* Fonts */
		'https://cdn.kernvalley.us/fonts/roboto.woff2',

		/* Other */
	].map(path => new URL(path, location.origin).href),
	allowed: [
		'https://www.google-analytics.com/analytics.js',
		'https://www.googletagmanager.com/gtag/js',
		'https://i.imgur.com/',
		/https:\/\/\w+\.githubusercontent\.com\/u\/*/,
		/\.(jpg|png|gif|webp|svg|woff2|woff)$/,
	],
	allowedFresh: [
		'https://api.github.com/user/',
		/\.(js|css|html|json)$/,
	],
};

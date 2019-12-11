import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/bacon-ipsum.js';
import 'https://cdn.kernvalley.us/components/gravatar-img.js';
import 'https://cdn.kernvalley.us/components/login-button.js';
import 'https://cdn.kernvalley.us/components/logout-button.js';
import {$, ready, registerServiceWorker} from 'https://cdn.kernvalley.us/js/std-js/functions.js';

if (document.documentElement.dataset.hasOwnProperty('serviceWorker')) {
	registerServiceWorker(document.documentElement.dataset.serviceWorker).catch(console.error);
}

document.documentElement.classList.replace('no-js', 'js');
document.body.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
document.body.classList.toggle('no-details', document.createElement('details') instanceof HTMLUnknownElement);

ready().then(async () => {
	$('[data-scroll-to]').click(event => {
		const target = document.querySelector(event.target.closest('[data-scroll-to]').dataset.scrollTo);
		target.scrollIntoView({
			bahavior: 'smooth',
			block: 'start',
		});
	});

	$('[data-show]').click(event => {
		const target = document.querySelector(event.target.closest('[data-show]').dataset.show);
		if (target instanceof HTMLElement) {
			target.show();
		}
	});

	$('[data-show-modal]').click(event => {
		const target = document.querySelector(event.target.closest('[data-show-modal]').dataset.showModal);
		if (target instanceof HTMLElement) {
			target.showModal();
		}
	});

	$('[data-close]').click(event => {
		const target = document.querySelector(event.target.closest('[data-close]').dataset.close);
		if (target instanceof HTMLElement) {
			target.tagName === 'DIALOG' ? target.close() : target.open = false;
		}
	});
});

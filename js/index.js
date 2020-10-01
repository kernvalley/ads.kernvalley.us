import 'https://unpkg.com/@webcomponents/custom-elements@1.4.2/custom-elements.min.js';
import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/gravatar-img.js';
import 'https://cdn.kernvalley.us/components/login-button.js';
import 'https://cdn.kernvalley.us/components/logout-button.js';
import 'https://cdn.kernvalley.us/components/toast-message.js';
import 'https://cdn.kernvalley.us/components/pwa/install.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/ad/block.js';
import 'https://cdn.kernvalley.us/components/share-target.js';
import { HTMLNotificationElement } from 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { $, ready } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { loadScript, loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { importGa } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import PaymentRequestShim from 'https://cdn.kernvalley.us/js/PaymentAPI/PaymentRequest.js';
// import { pay } from './functions.js';
import { GA } from './consts.js';
import { outbound, madeCall } from './analytics.js';

if (typeof GA === 'string' && GA.length !== 0) {
	requestIdleCallback(() => {
		importGa(GA).then(async () => {
			/* global ga */
			ga('create', GA, 'auto');
			ga('set', 'transport', 'beacon');
			ga('send', 'pageview');

			await ready();

			$('a[rel~="external"]').click(outbound, { passive: true, capture: true });
			$('a[href^="tel:"]').click(madeCall, { passive: true, capture: true });
		});
	});
}

// requestIdleCallback(() => document.getElementById('terms').show());

if (! ('PaymentRequest' in window)) {
	window.PaymentRequest = PaymentRequestShim;
}

document.documentElement.classList.replace('no-js', 'js');
document.body.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
document.body.classList.toggle('no-details', document.createElement('details') instanceof HTMLUnknownElement);

Promise.allSettled([
	ready(),
	loadScript('https://cdn.polyfill.io/v3/polyfill.min.js'),
]).then(async () => {
	const $ads = $('ad-block');

	$('output[for]').each(output => {
		output.htmlFor.forEach(id => {
			$(`#${CSS.escape(id)}`).change(({target}) => {
				switch(target.type) {
					case 'file':
						if (target.files.length === 0) {
							output.value = 'Nothing Selected';
						} else {
							output.value = target.files[0].name;
						}
						break;

					default:
						output.value = target.value;
				}
			}, {
				passive: true,
			});
		});
	});

	$('select').change(({ target }) => {
		$('ad-block img[slot="image"]').each(img => img.dataset[target.name] = target.value);
	});

	$('input, textarea', document.forms.ad).input(async ({ target }) => {
		switch(target.name) {
			case 'image':
				loadImage(target.value).then(async img => {
					await img.decode();
					img.height = img.naturalHeight;
					img.width = img.naturalWidth;
					img.dataset.fit = document.getElementById('object-fit').value;
					img.dataset.position = document.getElementById('object-position').value;
					$ads.each(ad => ad.image = img.cloneNode());
				});
				break;

			case 'url':
				Promise.resolve(new URL(target.value)).then(url => {
					url.searchParams.set('utm_source', 'kv-ad');
					url.searchParams.set('utm_medium', 'web');
					url.searchParams.set('utm_campaign', 'kv-ad');
					$ads.each(ad => ad.url = url);
				});
				break;

			default:
				$ads.each(async ad => ad[target.name] = target.value);
		}
	});

	$('form[name="ad"]').submit(async event => {
		event.preventDefault();
		// await pay();
		const data = new FormData(event.target);
		const HTMLAdBlockElement = customElements.get('ad-block');
		const img = await loadImage(data.get('image'));
		await img.decode();
		img.height = img.naturalHeight;
		img.width = img.naturalWidth;
		img.dataset.fit = data.get('fit');
		img.dataset.position = data.get('position');
		const ad = new HTMLAdBlockElement({
			label: data.get('label'),
			description: data.get('description'),
			image: img,
			callToAction: data.get('callToAction'),
		});
		ad.url = data.get('url');
		await ad.ready;
		setTimeout(() => {
			new HTMLNotificationElement('Ad Created', {
				body: 'What next?',
				icon: '/img/favicon.svg',
				vibrate: [500, 0, 500],
				requireInteraction: true,
				data: {
					html: ad.outerHTML,
					label: data.get('label'),
					url: data.get('url'),
					description: data.get('description'),
					callToAction: data.get('callToAction'),
					image: data.get('image'),
				},
				actions: [{
					title: 'Copy',
					action: 'copy',
				}, {
					title: 'Download',
					action: 'download',
				}, {
					title: 'Share',
					action: 'share',
				}, {
					title: 'Close',
					action: 'close',
				}]
			}).addEventListener('notificationclick', ({ action, target }) => {
				const { html, label } = target.data;

				switch(action) {
					case 'copy':
						Promise.resolve(html).then(async html => {
							await navigator.clipboard.writeText(html);
							alert('HTML for ad copied to clipboard');
						}).catch(err => {
							console.error(err);
							alert('Error writing to clipboard');
						});
						break;

					case 'download':
						Promise.resolve(html).then(async html => {
							const file = new File([html], 'ad.html', { type: 'text/html' });
							const url = URL.createObjectURL(file);
							const a = document.createElement('a');
							a.href = url;
							a.download = file.name;
							a.textContent = 'Download';
							a.classList.add('btn', 'btn-primary');
							document.body.append(a);
							try {
								a.click();
								a.remove();
							} catch(err) {
								console.error(err);
							}
						}).catch(err => {
							console.error(err);
							alert('Error saving HTML for ad');
						});
						break;

					case 'share':
						Promise.resolve({
							title: label,
							text: html,
							files: [new File([html], 'ad.html', { type: 'text/html' })],
						}).then(async ({ title, text, files }) => {
							if (! (navigator.canShare instanceof Function)) {
								throw new Error('Share API not supported');
							} else if (navigator.canShare({ title, text, files })) {
								await navigator.share({ title, text, files });
							} else {
								await navigator.share({ title, text });
							}
						}).catch(err => {
							console.error(err);
							alert('Share failed');
						});
						break;

					case 'close':
						target.close();
				}
			});
		}, 20);
	});
});

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
import { loadScript } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
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

	$('input, textarea', document.forms.ad).input(async ({target}) => {
		if (target instanceof HTMLInputElement) {
			switch(target.type) {
				case 'file':
					if (target.files.length === 1) {
						const file = target.files.item(0);

						switch(file.type) {
							case 'image/svg+xml':
								file.text().then(async svg  => {
									const parser = new DOMParser();
									const {documentElement} = parser.parseFromString(svg, 'image/svg+xml');
									if (! documentElement.hasAttribute('viewBox') && ['width', 'height'].every(attr => documentElement.hasAttribute(attr))) {
										const {width, height} = documentElement;
										documentElement.setAttribute('viewBox', `0 0 ${parseInt(width.value) || 16} ${parseInt(height.value) || 16}`);
									}
									$('[style]', documentElement).each(el => el.removeAttribute('style'));
									documentElement.removeAttribute('height');
									documentElement.removeAttribute('width');
									documentElement.classList.add('current-color');
									documentElement.slot = 'image';
									$ads.each(async ad => {
										await $('[slot="image"]', ad).remove();
										ad.append(documentElement.cloneNode(true));
									});
								});
								break;

							case 'image/jpeg':
							case 'image/png':
							case 'image/webp':
								file.arrayBuffer().then(async buffer => {
									const blob = URL.createObjectURL(new Blob([buffer], {type: file.type}));
									const img = new Image();
									img.addEventListener('error', console.error);
									img.src = blob;
									img.slot = 'image';
									await img.decode();

									$ads.each(async ad => {
										await $('[slot="image"]', ad).remove();
										ad.append(img.cloneNode());
									});
								});
								break;

							default:
								alert(`Invalid image type: ${file.type}`);
								target.value = '';
								target.focus();
						}
					}
					break;

				default:
					$ads.each(async ad => {
						await $(`[slot="${target.name.toLowerCase()}"]`, ad).remove();
						ad[target.name] = target.value;
					});
			}
		} else {
			$ads.each(async ad => {
				await $(`[slot="${target.name}"]`, ad).remove();
				ad[target.name] = target.value;
			});
		}
	});

	$('form[name="ad"]').submit(async event => {
		event.preventDefault();
		// await pay();
		const data = new FormData(event.target);
		const HTMLAdBlockElement = customElements.get('ad-block');
		const ad = new HTMLAdBlockElement({
			label: data.get('label'),
			description: data.get('description'),
			image: data.get('image'),
			callToAction: data.get('callToAction'),
		});
		ad.url = data.get('url');
		await ad.ready;
		setTimeout(() => {
			new HTMLNotificationElement('Ad Created', {
				body: 'What next?',
				icon: '/img/favicon.svg',
				vibrate: [500, 0, 500],
				data: {
					html: ad.outerHTML,
				},
				actions: [{
					title: 'Copy',
					action: 'copy',
				}, {
					title: 'Download',
					action: 'download',
				}, {
					title: 'Close',
					action: 'close',
				}]
			}).addEventListener('notificationclick', ({ action, target }) => {
				switch(action) {
					case 'copy':
						Promise.resolve(target.data.html).then(async html => {
							await navigator.clipboard.writeText(html);
							target.close();
							alert('HTML for ad copied to clipboard');
						}).catch(err => {
							console.error(err);
							alert('Error writing to clipboard');
						});
						break;

					case 'download':
						Promise.resolve(target.data.html).then(async html => {
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
								target.close();
							} catch(err) {
								console.error(err);
							}
						}).catch(err => {
							console.error(err);
							alert('Error saving HTML for ad');
						});
						break;

					case 'close':
						target.close();
				}
			});
		}, 20);
	});
});

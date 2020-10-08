import 'https://unpkg.com/@webcomponents/custom-elements@1.4.2/custom-elements.min.js';
import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/gravatar-img.js';
// import 'https://cdn.kernvalley.us/components/login-button.js';
// import 'https://cdn.kernvalley.us/components/logout-button.js';
import 'https://cdn.kernvalley.us/components/toast-message.js';
import 'https://cdn.kernvalley.us/components/pwa/install.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/ad/block.js';
import 'https://cdn.kernvalley.us/components/share-target.js';
import { HTMLNotificationElement } from 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { $, ready } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { loadScript, loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
// import PaymentRequestShim from 'https://cdn.kernvalley.us/js/PaymentAPI/PaymentRequest.js';
// import { pay } from './functions.js';
import { GA } from './consts.js';

function updateRequired(form) {
	$('.input', form).each(({ labels, required, disabled}) =>
		$(labels).toggleClass('required', required && ! disabled));
}

async function updateForm(form, value) {
	await Promise.allSettled([
		$('#ad-image', form).attr({ disabled: value === 'text' }),
		$('#ad-image-file', form).attr({ disabled: value === 'text' }),
		$('#object-fit', form).attr({ disabled: value === 'text' }),
		$('#object-position', form).attr({ disabled: value === 'text' }),
		$('#ad-description', form).attr({
			disabled: value === 'image',
			maxlength: (value === 'full-width') ? 400 : 100,
		}),
		$('#ad-calltoaction', form).attr({
			disabled: value === 'image',
			maxlength: (value === 'full-width') ? 50 : 25,
		}),
		$('#ad-label', form).attr({
			maxlength: (value === 'ful-width') ? 80 : 20,
		}),
	]);

	updateRequired(form);
}

function sluggify(text) {
	return text.toLowerCase().replace(/\W+/g, '-');
}

if (typeof GA === 'string' && GA.length !== 0) {
	requestIdleCallback(() => {
		importGa(GA).then(async () => {
			/* global ga */
			ga('create', GA, 'auto');
			ga('set', 'transport', 'beacon');
			ga('send', 'pageview');

			await ready();

			$('a[rel~="external"]').click(externalHandler, { passive: true, capture: true });
			$('a[href^="tel:"]').click(telHandler, { passive: true, capture: true });
			$('a[href^="mailto:"]').click(mailtoHandler, { passive: true, capture: true });
		});
	});
}

// requestIdleCallback(() => document.getElementById('terms').show());

// if (! ('PaymentRequest' in window)) {
// 	window.PaymentRequest = PaymentRequestShim;
// }

document.documentElement.classList.replace('no-js', 'js');
document.body.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
document.body.classList.toggle('no-details', document.createElement('details') instanceof HTMLUnknownElement);

Promise.allSettled([
	ready(),
	loadScript('https://cdn.polyfill.io/v3/polyfill.min.js'),
]).then(async () => {
	const $ads = $('ad-block');

	Promise.resolve(new Worker('/js/imgWorker.js')).then(worker => {
		$('#ad-image-file').change(({ target }) => {
			if (target.files.length === 1) {
				$('#ad-image').attr({ type: 'text' });

				worker.postMessage({
					type: 'update',
					file: target.files.item(0),
				});

				worker.addEventListener('message', ({ data }) => {
					const img = document.getElementById('ad-image');
					img.value = data.dataUri;
					target.value = null;
					$ads.each(ad => ad.image = data.dataUri);
					worker.terminate();
				});
			}
		});
	});


	$('input[name], textarea[name], select[name]', document.forms.ad).input(async ({ target }) => {
		const form = target.form;
		switch(target.name) {
			case 'layout':
				updateForm(form, target.value);
				$ads.each(async ad => ad[target.name] = target.value);
				break;

			case 'theme':
				if (target.value === 'auto') {
					$('#dark-preview').attr({ theme: 'dark' });
					$('#light-preview').attr({ theme: 'light' });
					$('#main-preview').attr({ theme: 'auto' });
				} else {
					$ads.each(async ad => ad[target.name] = target.value);
				}
				break;

			case 'url':
				// No-op
				break;

			default:
				$ads.each(async ad => ad[target.name] = target.value);
		}
	});

	$('form[name="ad"]').reset(() => {
		$('.ad-preview > [slot]').remove();
		$('#light-preview').attr({ theme: 'light' });
		$('#dark-preview').attr({ theme: 'dark' });
		$('#main-preview').attr({ theme: 'auto' });
		$('#ad-url').attr({ type: 'url' });

		$ads.attr({
			layout: 'card',
			imagefit: 'cover',
			imageposition: 'center',
		});
	});

	$('form[name="ad"]').submit(async event => {
		event.preventDefault();
		// await pay();
		const data = new FormData(event.target);
		const HTMLAdBlockElement = customElements.get('ad-block');

		const ad = new HTMLAdBlockElement({
			label: data.get('label'),
			description: data.get('description'),
			callToAction: data.get('callToAction'),
			theme: data.get('theme'),
			layout: data.get('layout'),
			imagePosition: data.get('imagePosition'),
			imageFit: data.get('imageFit'),
		});

		ad.url = data.get('url');
		ad.layout = data.get('layout');
		ad.theme = data.get('theme');

		if (data.has('image') && data.get('layout') !== 'text') {
			ad.imagePosition = data.get('imagePosition');
			ad.imageFit = data.get('imageFit');
			const img = await loadImage(data.get('image'));
			await img.decode();
			img.height = img.naturalHeight;
			img.width = img.naturalWidth;
			img.loading = 'lazy';
			ad.image = img;
		}

		await ad.ready;

		await $('[part]', ad).attr({ part: null });
		setTimeout(() => {
			new HTMLNotificationElement('Ad Created', {
				body: 'What next?',
				icon: '/img/favicon.svg',
				vibrate: [500, 0, 500],
				requireInteraction: true,
				data: {
					html: ad.outerHTML,
					fname: `${sluggify(data.get('label'))}-${new Date().toISOString()}`,
					label: data.get('label'),
					json: {
						label: data.get('label'),
						url: data.get('url'),
						description: data.get('description'),
						callToAction: data.get('callToAction'),
						image: data.get('image'),
						layout: data.get('layout'),
						theme: data.get('theme'),
						imageFit: data.get('imageFit'),
						imagePosition: data.get('imagePosition'),
					},
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
				const { html, label, fname } = target.data;

				switch(action) {
					case 'copy':
						Promise.resolve(html).then(async html => {
							await navigator.clipboard.writeText(html);
							alert('HTML for ad copied to clipboard');
						}).catch(err => {
							console.error(err);
							alert(`Error writing to clipboard: ${err.message}`);
						});
						break;

					case 'download':
						Promise.resolve(html).then(async html => {
							const file = new File([html], `${fname}.html`, { type: 'text/html' });
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
							alert(`Error saving HTML for ad: ${err.message}`);
						});
						break;

					case 'share':
						Promise.resolve({
							title: `Ad for ${label}`,
							text: html,
							files: [
								new File([html], `${fname}.html`, { type: 'text/html' })

							],
						}).then(async ({ title, text, files }) => {
							if (! (navigator.canShare instanceof Function)) {
								throw new Error('Share API not supported');
							} else if (navigator.canShare({ title, files })) {
								await navigator.share({ title, files });
							} else {
								await navigator.share({ title, text });
							}
						}).catch(err => {
							console.error(err);
							alert(`Share Failed: ${err.message}`);
						});
						break;

					case 'close':
						target.close();
				}
			});
		}, 20);
	});

	Promise.resolve(document.forms.ad).then(form => {
		const data = new FormData(form);

		updateForm(form, data.get('layout'));

		$ads.each(ad => {
			ad.image = data.get('image') || null;
			ad.imageFit = data.get('imageFit') || null;
			ad.imagePosition = data.get('imagePosition') || null;
			ad.callToActoin = data.get('callToAction') || null;
			ad.layout = data.get('layout');
		});

		if (data.get('theme') !== 'auto') {
			$ads.each(ad => ad.theme = data.get('theme') || null);
		}
	});
});

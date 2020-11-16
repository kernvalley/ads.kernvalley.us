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
import konami from 'https://cdn.kernvalley.us/js/std-js/konami.js';
import { DAYS } from 'https://cdn.kernvalley.us/js/std-js/timeIntervals.js';
import { HTMLNotificationElement } from 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { $, ready } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { loadScript, loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import { importAd, setAd, uuidv4, getFile, saveAd, sluggify, createHandler, consumeHandler, updatePage, updateForm, enableAdvanced } from './functions.js';
// import PaymentRequestShim from 'https://cdn.kernvalley.us/js/PaymentAPI/PaymentRequest.js';
// import { pay } from './functions.js';
import { GA } from './consts.js';

if ('launchQueue' in window) {
	launchQueue.setConsumer(consumeHandler);
}

if (history.state === null) {
	history.replaceState({ identifier: uuidv4() }, document.title, location.href);
} else {
	Object.entries(history.state).forEach(([key, value]) => {
		updatePage(key, value, false);
		$(`[name="${key}"]`).each(i => {
			if (i.type === 'radio' || i.type === 'checkbox') {
				i.checked = i.value === value;
			} else {
				i.value = value;
			}
		});
	});
}

if (typeof GA === 'string' && GA.length !== 0) {
	requestIdleCallback(async () => {
		if (! navigator.onLine) {
			await new Promise(resolve => window.addEventListener('online', () => resolve(), { once: true }));
		}
		importGa(GA).then(async ({ ga }) => {
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

if (location.hash.length !== 0) {
	const layout = location.hash.substr(1);

	if (['card', 'stack', 'text', 'image'].includes(layout)) {
		$('input[name="layout"]').each(i => i.checked = i.value === layout);
		location.hash = '';
		updatePage('layout', layout);
	}
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
	customElements.whenDefined('ad-block'),
]).then(async () => {
	const HTMLAdBlockElement = customElements.get('ad-block');
	const $ads = $('ad-block');

	document.getElementById('uuid').value = history.state.identifier;

	$('#open-btn').click(async () => {
		const file = await getFile();

		if (file) {
			const ad = await importAd(file);
			await setAd(ad);
		}
	});

	$('#save-btn').click(() => saveAd(false));

	if (navigator.canShare instanceof Function && navigator.canShare({ files: [new File([''], 'f.txt', { type: 'text/plain' })]})) {
		$('#share-ad-btn').click(async () => {
			const container = document.createElement('div');
			container.id = 'tmp-container';

			try {
				await customElements.whenDefined('ad-block');
				const identifier = history.state.identifier;
				const ad = document.getElementById('main-preview').cloneNode(true);
				ad.id = identifier;
				container.hidden = true;
				container.append(ad);
				document.body.append(container);
				const title = await ad.label;
				const file = await ad.toFile({ fname: `${sluggify(title || 'new ad')}.krvad` });

				if (! (navigator.canShare instanceof Function)) {
					throw new Error('Sharing not supported');
				} else if (! navigator.canShare({ title, files: [file] })) {
					throw new Error('File sharing not supported');
				} else {
					try {
						await navigator.share({ title, files: [file] });
					} catch(err) {
						console.error(err);
						throw new Error('Unable to share ad file. Not supported');
					}
				}
				$(`#${container.id}`).remove();
			} catch(err) {
				console.error(err);
				alert(err.message);
				$(`#${container.id}`).remove();
			}
		});
	} else {
		$('#share-ad-btn').attr({ hidden: true, disabled: true });
	}

	if (window.showSaveFilePicker instanceof Function) {
		$('#save-as-btn').click(() => saveAd(true));
		$('#save-as-btn').attr({ hidden: false, disabled: false});
	}

	$('#new-btn').click(createHandler);

	$('#enable-advanced').change(async ({ target: { checked }}) => {
		$('.advanced-opt').each(el => {
			if (checked) {
				$(el.labels).removeClass('disabled');
				el.disabled = false;
				el.dispatchEvent(new Event('input'));
				updatePage('color', null);
				updatePage('background', null);
				updatePage('linkColor', null);
				updatePage('borderColor', null);
				updatePage('borderWidth', null);
			} else {
				el.disabled = true;
				$(el.labels).addClass('disabled');
			}
		});

		if (! checked) {
			$ads.attr({ color: null, background: null, linkColor: null, borderWidth: null, borderColor: null });
		}
	});

	$('#pexels-gallery [data-image-src]').click(({ target }) => {
		const input = document.getElementById('ad-image');
		$('#pexels-gallery [data-image-src]').toggleClass('selected-img', el => el.isSameNode(target));
		input.value = target.dataset.imageSrc;
		input.dispatchEvent(new Event('input'));
	}, { passive: true });

	Promise.resolve(new Worker('/js/imgWorker.js')).then(worker => {
		$('#ad-image-file').change(({ target }) => {
			if (target.files.length === 1) {
				$('#ad-image').attr({ type: 'text' });

				worker.postMessage({
					type: 'update',
					file: target.files.item(0),
				});

				worker.addEventListener('message', ({ data: { dataUri }}) => {
					updatePage('image', dataUri, false);
				});
			}
		});
	});


	$('input[name], textarea[name], select[name]', document.forms.ad).input(async ({ target: { name, value }}) => {
		updatePage(name, value);
	});

	$('form[name="ad"]').reset(() => {
		const uuid = uuidv4();
		$('.ad-preview > [slot]').remove();
		$('#light-preview').attr({ theme: 'light' });
		$('#dark-preview').attr({ theme: 'dark' });
		$('#main-preview').attr({ theme: 'auto' });
		$('#ad-url').attr({ type: 'url' });
		history.replaceState({ identifier: uuid }, document.title, location.href);

		document.getElementById('uuid').value = uuid;

		$ads.attr({
			layout: 'card',
			imagefit: 'cover',
			imageposition: 'center',
			background: null,
			border: null,
			bordercolor: null,
			color: null,
			linkcolor: null,
		});
	});

	$('form[name="ad"]').submit(async event => {
		event.preventDefault();
		// await pay();
		const data = new FormData(event.target);

		const ad = new HTMLAdBlockElement({
			label: data.get('label'),
			description: data.get('description'),
			callToAction: data.get('callToAction'),
			theme: data.get('theme'),
			layout: data.get('layout'),
			imagePosition: data.get('imagePosition'),
			imageFit: data.get('imageFit'),
			loading: 'eager',
		});

		if (data.has('background') && data.has('color') && data.has('linkColor')) {
			ad.background = data.get('background') || null;
			ad.color = data.get('color') || null;
			ad.border = data.get('boder') || null;
			ad.borderWidth = data.get('borderWidth') || null;
			ad.linkColor = data.get('linkColor') || null;
		}

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

		const container = document.createElement('div');
		container.append(ad);
		container.hidden = true;
		document.body.append(container);

		await ad.ready.then(() => $('[part]', ad).attr({ part: null }));

		setTimeout(async () => {
			new HTMLNotificationElement('Ad Created', {
				body: 'What next?',
				icon: '/img/favicon.svg',
				vibrate: [500, 0, 500],
				requireInteraction: true,
				data: {
					html: ad.outerHTML,
					fname: `${sluggify(data.get('label'))}-${new Date().toISOString()}`,
					label: data.get('label'),
					json: await ad.getJSON(),
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
			}).addEventListener('notificationclick', async ({ action, target }) => {
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
						Promise.resolve(ad.getDownloadLink({ fname: `${fname}${HTMLAdBlockElement.FILE_EXTENSION}` })).then(a => {
							try {
								a.click();
								a.remove();
							} catch(err) {
								console.error(err);
								alert(err.message);
							}
						}).catch(err => {
							console.error(err);
							alert(`Error saving ad: ${err.message}`);
						});
						break;

					case 'share':
						Promise.resolve({
							title: `Ad for ${label}`,
							text: html,
							files: [await ad.toFile({ fname: `${fname}${HTMLAdBlockElement.FILE_EXTENSION}` })],
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
			container.remove();
		}, 20);
	});

	requestIdleCallback(async () => {
		const data = new FormData(document.forms.ad);

		await new Promise(res => setTimeout(res, 500));

		updateForm(document.forms.ad, data.get('layout'));

		$('ad-block').each(ad => {
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

	document.forms.ad.addEventListener('drop', async function(event) {
		event.preventDefault();
		this.classList.remove('dragging');

		if (event.dataTransfer.items.length === 1) {
			const file = event.dataTransfer.items[0].getAsFile();
			const ad = await importAd(file);
			await setAd(ad).catch(console.error);
		}
	});

	document.forms.ad.addEventListener('dragover', event => event.preventDefault());
	document.forms.ad.addEventListener('dragenter', function()  {
		this.classList.add('dragging');
	});
	document.forms.ad.addEventListener('dragleave', function() {
		this.classList.remove('dragging');
	});

	cookieStore.get({ name: 'konami' }).then(cookie => {
		if (! cookie) {
			konami().then(() => {
				enableAdvanced(true);

				cookieStore.set({
					name: 'konami',
					value: 'enabled',
					path: '/',
					secure: true,
					expires: Date.now() + DAYS, // Now + 1 day
				});

				new HTMLNotificationElement('Cheat mode enabled', {
					body: 'Entering the Konami code enabled advanced options',
					image: 'https://static.wikia.nocookie.net/contra/images/4/49/Konami_Code_-_01.jpg/revision/latest/scale-to-width-down/300',
					vibrate: 0,
					actions: [{
						title: 'Disable',
						action: 'disable',
					}, {
						title: 'Dismiss',
						action: 'dismiss',
					}]
				}).addEventListener('notificationclick', ({ action, target }) => {
					switch(action) {
						case 'disable':
							cookieStore.delete({ name: 'konami',  path: '/', secure: true });
							target.close();
							enableAdvanced(false);
							break;

						case 'dismiss':
							target.close();
							break;

						default:
							throw new Error(`Unhandled action: ${action}`);
					}
				});
			});
		} else {
			enableAdvanced(true);
		}
	});
});

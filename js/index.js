import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/js/std-js/theme-cookie.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/toast-message.js';
import 'https://cdn.kernvalley.us/components/pwa/install.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/ad/block.js';
import 'https://cdn.kernvalley.us/components/share-target.js';
import 'https://cdn.kernvalley.us/components/app/list-button.js';
import 'https://cdn.kernvalley.us/components/app/stores.js';
import konami from 'https://cdn.kernvalley.us/js/std-js/konami.js';
import { DAYS } from 'https://cdn.kernvalley.us/js/std-js/timeIntervals.js';
import { HTMLNotificationElement } from 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { init } from 'https://cdn.kernvalley.us/js/std-js/data-handlers.js';
import { $, ready, getCustomElement } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { open } from 'https://cdn.kernvalley.us/js/std-js/filesystem.js';
import { alert } from 'https://cdn.kernvalley.us/js/std-js/asyncDialog.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import { upload } from 'https://cdn.kernvalley.us/js/std-js/imgur.js';
import { importAd, setAd, getFile, saveAd, sluggify, createHandler, consumeHandler, updatePage, updateForm, enableAdvanced, uploadFile } from './functions.js';
import { uuidv6 } from 'https://cdn.kernvalley.us/js/std-js/uuid.js';
import { GA, ImgurClientId as clientId } from './consts.js';

if ('launchQueue' in window) {
	launchQueue.setConsumer(consumeHandler);
}

if (history.state === null) {
	history.replaceState({ identifier: uuidv6() }, document.title, location.href);
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

$(document.documentElement).toggleClass({
	'no-js': false,
	'js': true,
	'no-dialog': document.createElement('dialog') instanceof HTMLUnknownElement,
	'no-details': document.createElement('details') instanceof HTMLUnknownElement,
});

Promise.allSettled([
	getCustomElement('ad-block'),
	init(),
]).then(async ([HTMLAdBlockElement]) => {
	const $ads = $('ad-block');

	document.getElementById('uuid').value = history.state.identifier;

	$('#upload-btn').click(async () =>{
		const el = document.getElementById('main-preview');
		const ad = await el.toFile();

		if (await uploadFile(ad)) {
			alert('Ad submitted');
		} else {
			alert('Error submitting ad');
		}
	});

	$('#open-btn').click(async () => {
		const file = await getFile();

		if (file) {
			const ad = await importAd(file);
			await setAd(ad);
		}
	});

	$('#upload-image').click(async () => {
		const [file] = await open({
			accept: 'image/png,image/jpeg',
			description: 'Select image to upload',
			directory: false,
			multiple: false,
		});

		if (file instanceof File) {
			const { data: { link }} = await upload(file, { clientId });

			if (typeof link === 'string' && link.startsWith('https://i.imgur.com')) {
				const input = document.getElementById('ad-image');
				input.value = link;
				input.dispatchEvent(new Event('input'));
			}
		}
	}, { passive: true });

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

	$('#pexels-gallery > img[src]').each(img => {
		img.dataset.imageSrc = img.src.replace('t.jpg', 'm.jpg');
	}).then($imgs => {
		const input = document.getElementById('ad-image');

		$imgs.click(({ target }) => {
			$('#pexels-gallery > .selected-img').removeClass('selected-img');
			target.classList.add('selected-img');
			input.value = target.dataset.imageSrc;
			input.dispatchEvent(new Event('input'));
		}, { passive: true });
	});

	$('input[name], textarea[name], select[name]', document.forms.ad).input(async ({ target: { name, value }}) => {
		updatePage(name, value);
	});

	$('form[name="ad"]').reset(() => {
		const uuid = uuidv6();
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

	$('form[name="ad"]').on({
		dragover: event => event.preventDefault(),
		dragenter: () => document.forms.ad.classList.add('dragging'),
		dragleave: () => document.forms.ad.classList.remove('dragging'),
		drop: async event => {
			event.preventDefault();
			document.forms.ad.classList.remove('dragging');

			if (event.dataTransfer.items.length === 1) {
				const file = event.dataTransfer.items[0].getAsFile();
				const ad = await importAd(file);
				await setAd(ad).catch(console.error);
			}
		}
	});

	cookieStore.get({ name: 'konami' }).then(cookie => {
		if (! cookie || cookie.value !== 'enabled') {
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

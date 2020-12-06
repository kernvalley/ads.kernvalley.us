import { $, ready } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { confirm } from 'https://cdn.kernvalley.us/js/std-js/asyncDialog.js';
import { save, open } from 'https://cdn.kernvalley.us/js/std-js/filesystem.js';
let fileHandle = null;
let legacyFileName = null;

export function updateRequired(form) {
	$('.input', form).each(({ labels, required, disabled}) =>
		$(labels).toggleClass('required', required && ! disabled));
}

export function enableAdvanced(enabled = true) {
	const advanced = document.getElementById('advanced-opts');
	const toggle = document.getElementById('enable-advanced');

	toggle.checked = enabled;
	$('input', advanced).attr({ disabled: ! enabled });
	advanced.hidden = ! enabled;
	advanced.open = enabled;
}

export async function updateForm(form, layout) {
	await Promise.allSettled([
		$('#ad-image', form).attr({ disabled: layout === 'text' }),
		$('#ad-image-file', form).attr({ disabled: layout === 'text' }),
		$('#object-fit', form).attr({ disabled: layout === 'text' }),
		$('#object-position', form).attr({ disabled: layout === 'text' }),
		$('#ad-description', form).attr({
			disabled: layout === 'image',
			maxlength: (layout === 'full-width') ? 400 : 118,
		}),
		$('#ad-calltoaction', form).attr({
			disabled: layout === 'image',
			maxlength: (layout === 'full-width') ? 50 : 26,
		}),
		$('#ad-label', form).attr({
			maxlength: (layout === 'full-width') ? 80 : 21,
		}),
	]);

	updateRequired(form);
}

export function updatePage(name, value, updateState = true) {
	const $ads = $('ad-block');

	if (updateState && (name !== 'image' || ! value.startsWith('data:'))) {
		const state = history.state || {};
		state[name] = value;
		history.replaceState(state, document.title, location.href);
	}

	switch(name) {
		case 'layout':
			updateForm(document.forms.ad, value);
			$ads.each(async ad => ad[name] = value);
			break;

		case 'theme':
			$ads.attr({ background: null, color: null, border: null, borderWidth: null, linkColor: null });
			$('#advanced-opts').close();
			$('#advanced-opts input').each(i => i.value = null);

			if (value === 'auto') {
				$('#dark-preview').attr({ theme: 'dark' });
				$('#light-preview').attr({ theme: 'light' });
				$('#main-preview').attr({ theme: 'auto' });
			} else {
				$ads.each(async ad => ad[name] = value);
			}
			break;

		default:
			$(`[name="${name}"]`).each(i => i.value = value);
			$ads.each(ad => ad[name] = value);
	}
}

export function sluggify(text) {
	return text.toLowerCase().replace(/\W+/g, '-');
}

export async function consumeHandler({ files }) {
	if (files.length === 1) {
		fileHandle = files[0];
		const file = await fileHandle.getFile();
		const ad = await importAd(file);
		await ready();
		await setAd(ad);
	}
}

async function verifyPermission(fileHandle, readWrite) {
	const opts = {};
	if (readWrite) {
		opts.mode = 'readwrite';
	}
	// Check if permission was already granted. If so, return true.
	if ((await fileHandle.queryPermission(opts)) === 'granted') {
		return true;
	}
	// Request permission. If the user grants permission, return true.
	if ((await fileHandle.requestPermission(opts)) === 'granted') {
		return true;
	}
	// The user didn't grant permission, so return false.
	return false;
}

export async function importAd(file) {
	if (file instanceof Promise) {
		return importAd(await file);
	} else if (file.text instanceof Function) {
		return JSON.parse(await file.text());
	} else {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.addEventListener('load', event => {
				resolve(JSON.parse(event.target.result));
			});
			reader.addEventListener('error', () => reject(new Error('Error reading file')));
			reader.readAsText(file);
		});
	}
}

/**
 * From: https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
 */
export function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

export async function setAd(ad) {
	Object.entries(ad).forEach(([key, value]) => {
		updatePage(key, value);

		if (typeof value === 'string') {
			switch(key) {
				case 'theme':
					document.forms.ad.querySelector('[name="theme"]').value = value;
					break;

				case 'layout':
					(input => {
						input.checked = true;
					})(document.forms.ad.querySelector(`[name="${key}"][value="${value}"]`));
					break;

				case '@type':
				case '@context':
					// Do nothing
					break;

				default:
					$(`[name=${key}]`, document.forms.ad).each(i => i.value = value);
			}
		}
	});
}

export async function createHandler() {
	if (await confirm('Create new ad? Any current work will be lost')) {
		document.forms.ad.reset();
		fileHandle = null;
		legacyFileName = null;
	}
}

export async function getFile() {
	if (window.showOpenFilePicker instanceof Function) {
		[fileHandle] = await showOpenFilePicker({
			multiple: false,
			types: [{
				description: 'KRV Ad File',
				accept: {
					'application/krv-ad+json': '.krvad',
				}
			}]
		});
		const file = await fileHandle.getFile();
		legacyFileName = file.name;

		return file;
	} else {
		const [file] = await open({ accept: ['.krvad'], description: 'Select .krvad file' });
		legacyFileName = file.name;
		return file;
	}
}

export async function saveAd(saveAs = false) {
	if (window.ga instanceof Function) {
		window.ga('send', {
			hitType: 'event',
			eventCategory: 'ad-save',
			eventAction: 'save',
			transport: 'beacon',
		});
	}

	await customElements.whenDefined('ad-block');
	const ad = document.querySelector('#main .ad-preview');
	const json = await ad.getJSON();

	if (window.showSaveFilePicker instanceof Function) {
		if (fileHandle === null || saveAs === true) {
			const handle = await showSaveFilePicker({
				multiple: false,
				types: [{
					description: 'Kern Valley Ads File',
					accept: {
						'application/krv-ad+json': '.krvad',
					}
				}]
			});

			if (! saveAs) {
				fileHandle = handle;
			}

			await verifyPermission(handle, true);

			const writable = await handle.createWritable();
			await writable.write(json);
			await writable.close();
		} else {
			await verifyPermission(fileHandle, true);
			const writable = await fileHandle.createWritable();
			await writable.write(json);
			await writable.close();
		}
	} else if (typeof legacyFileName === 'string' && legacyFileName.endsWith('.krvad')) {
		const file = new File([json], legacyFileName, { type: 'application/krvad+json' });
		await save(file);
	} else {
		const label = await ad.label;
		const date = new Date();
		const fname = `${sluggify(label || 'ad')}-${date.toISOString()}.krvad`;
		const file = new File([json], fname, { type: 'application/krvad+json' });
		await save(file);
		legacyFileName = file.name;
	}
}

export async function pay({views = 500, price = 0.05} = {}) {
	const terms = document.getElementById('terms');
	const displayItems = [{
		label: 'Ad design submission',
		amount: {
			currency: 'USD',
			value: (views * price).toFixed(2),
		}
	},];
	const paymentRequest = new PaymentRequest([{
		supportedMethods: 'basic-card',
		data: {
			supportedNetworks: ['visa', 'mastercard','discover'],
			supportedTypes: ['credit', 'debit']
		}
	}], {
		displayItems,
		total: {
			label: 'Total Cost',
			amount: {
				currency: 'USD',
				value: displayItems.reduce((sum, item) => sum + item.amount.value, 0),
			}
		},
		// shippingOptions: [{
		// 	id: 'standard',
		// 	label: 'Standard shipping',
		// 	amount: {
		// 		currency: 'USD',
		// 		value: '0.00'
		// 	},
		// 	selected: true
		// }]
	}, {
		requestPayerName: true,
		requestPayerEmail: true,
		requestPayerPhone: true,
		// requestShipping: true,
	});

	await customElements.whenDefined('toast-message');
	navigator.setAppBadge(1).catch(console.error);
	await terms.show();
	await terms.closed;

	if (await paymentRequest.canMakePayment()) {
		try {
			const paymentResponse = await paymentRequest.show();
			paymentResponse.complete('success');
			$('#payment-dialog').remove();
			console.log(paymentResponse);
			await customElements.whenDefined('toast-message');

			// const resp = await fetch('http://localhost:8080/payment/', {
			// 	method: 'POST',
			// 	headers: new Headers({
			// 		Accept: 'application/json',
			// 		'Content-Type': 'application/json'
			// 	}),
			// 	mode: 'cors',
			// 	body: JSON.stringify({paymentResponse, paymentRequest}),
			// });
			// const parsed = await resp.json();
			console.info(paymentResponse);
		} catch(err) {
			console.error(err);
			$('#payment-dialog').remove();
			await customElements.whenDefined('toast-message');
			const Toast = customElements.get('toast-message');
			Toast.toast(err.message);
		} finally {
			$('#payment-dialog').remove();
		}
	}
	navigator.clearApBadge().catch(console.error);
}

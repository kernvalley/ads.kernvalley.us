import { $, ready } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
let fileHandle = null;

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
		console.info({ file, ad });
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
	if (confirm('Create new ad? Any current work will be lost')) {
		document.forms.ad.reset();
		fileHandle = null;
	}
}

export async function getFile() {
	if (window.showOpenFilePicker instanceof Function) {
		[fileHandle] = await showOpenFilePicker({
			multiple: false,
			types: [{
				description: 'Kern Valley Ads File',
				accept: {
					'application/krv-ad+json': '.krvad',
				}
			}]
		});
		const file = await fileHandle.getFile();

		return file;
	} else {
		return new Promise((resolve, reject) => {
			const dialog = document.getElementById('import-dialog');
			const input = document.getElementById('import-file');

			const submitHandler = (event => {
				event.preventDefault();
				const data = new FormData(event.target);
				resolve(data.get('upload'));
				event.target.removeEventListener('submit', submitHandler);
				event.target.removeEventListener('reset', resetHandler);
				input.removeEventListener('change', changeHandler);
				event.target.reset();
				dialog.close();
			});

			const resetHandler = (event => {
				dialog.close();
				event.target.removeEventListener('submit', submitHandler);
				event.target.removeEventListener('reset', resetHandler);
				input.removeEventListener('change', changeHandler);
				reject('Import Cancelled');
			});

			const changeHandler = (async ({ target }) => {
				if (target.files.length === 1) {
					await customElements.whenDefined('ad-block');
					const HTMLAdBlockElement = customElements.get('ad-block');
					const ad = await HTMLAdBlockElement.fromFile(target.files[0]);
					$('#preview-section ad-block').remove();
					document.getElementById('preview-section').append(ad);
				} else {
					$('#preview-section ad-block').remove();
				}
			});

			input.addEventListener('change', changeHandler);
			document.forms.importForm.addEventListener('submit', submitHandler);
			document.forms.importForm.addEventListener('reset', resetHandler);

			dialog.showModal();
		});
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
	const identifier = document.getElementById('uuid').value;
	const ad = document.getElementById('main-preview').cloneNode(true);
	const container = document.createElement('div');
	container.hidden = true;
	ad.id = identifier;
	container.append(ad);
	document.body.append(container);

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
			const data = await ad.getJSON();
			await writable.write(data);
			await writable.close();
			container.remove();
		} else {
			await verifyPermission(fileHandle, true);
			const writable = await fileHandle.createWritable();
			const data = await ad.getJSON();
			await writable.write(data);
			await writable.close();
			container.remove();
		}
	} else {
		const label = await ad.label;
		container.remove();
		const date = new Date();
		const fname = `${sluggify(label || 'ad')}-${date.toISOString()}.krvad`;
		const a = await ad.getDownloadLink({ fname });
		a.click();
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

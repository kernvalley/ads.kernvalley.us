import { $ } from 'https://cdn.kernvalley.us/js/std-js/functions.js';

export async function importAd(file) {
	if (file instanceof Promise) {
		return importAd(await file);
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
		if (typeof value === 'string') {
			if (key === 'theme' && value === 'auto') {
				$('#main-preview').attr({ theme: 'auto' });
				$('#dark-preview').attr({ theme: 'dark' });
				$('#light-preview').attr({ theme: 'light' });
				document.forms.ad.querySelector('[name="theme"]').value = 'auto';
			} else if (key === 'layout') {
				const input = document.forms.ad.querySelector(`[name="${key}"][value="${value}"]`);
				input.checked = true;
				input.dispatchEvent(new Event('input'));
			} else {
				$('ad-block').each(ad => ad[key] = value);
				$(`[name=${key}]`, document.forms.ad).each(i => i.value = value);
			}
		}
	});
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

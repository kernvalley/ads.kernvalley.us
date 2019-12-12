import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/gravatar-img.js';
import 'https://cdn.kernvalley.us/components/login-button.js';
import 'https://cdn.kernvalley.us/components/logout-button.js';
import 'https://cdn.kernvalley.us/components/toast-message.js';
import 'https://cdn.kernvalley.us/components/bacon-ipsum.js';
import {$, ready, registerServiceWorker} from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import PaymentRequestShim from 'https://cdn.kernvalley.us/js/PaymentAPI/PaymentRequest.js';

if (! ('PaymentRequest' in window)) {
	window.PaymentRequest = PaymentRequestShim;
}

async function pay({views = 500, price = 0.05} = {}) {
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
}

if (document.documentElement.dataset.hasOwnProperty('serviceWorker')) {
	registerServiceWorker(document.documentElement.dataset.serviceWorker).catch(console.error);
}

document.documentElement.classList.replace('no-js', 'js');
document.body.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
document.body.classList.toggle('no-details', document.createElement('details') instanceof HTMLUnknownElement);

ready().then(async () => {
	const $ad = $('ad-block');
	$ad.on('drop', console.info);
	document.forms.ad.reset();
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
							const ad = document.querySelector('ad-block');
							await $('[slot="image"]', ad).remove();
							ad.append(documentElement);
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
							const ad = document.querySelector('ad-block');
							await img.decode();

							await $('[slot="image"]', ad).remove();
							ad.append(img);
						});
						break;

					default:
						alert(`Invalid image type: ${file.type}`);
						target.value = '';
						target.focus();
					}
				}
				break;

			default: $(`[slot="${target.name}"]`).text(target.value);
			}

		} else {
			$(`[slot="${target.name}"]`).text(target.value);
		}
	});

	$('form[name="ad"]').submit(async event => {
		event.preventDefault();
		await pay();
		const data = new FormData(event.target);
		console.info({
			label: data.get('label'),
			image: data.get('image'),
			description: data.get('description'),
			callToAction: data.get('calltoaction'),
		});
	});
});

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
import 'https://cdn.kernvalley.us/components/ad-block.js';
import { $, ready } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { loadScript } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { importGa } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import PaymentRequestShim from 'https://cdn.kernvalley.us/js/PaymentAPI/PaymentRequest.js';
import { pay } from './functions.js';
import { GA } from './consts.js';

if (typeof GA === 'string' && GA.length !== 0) {
	importGa(GA);
}

setTimeout(() => document.getElementById('terms').show(), 1200);

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
		await pay();
		const data = new FormData(event.target);
		console.info({
			label: data.get('label'),
			image: data.get('image'),
			description: data.get('description'),
			callToAction: data.get('calltoaction'),
		});
	});

	if (location.search !== '') {
		const params = new URLSearchParams(location.search);
		history.replaceState({}, document.title, location.origin);
		console.info([...document.querySelectorAll('toast-message')].map(el => el.outerHTML));
		customElements.whenDefined('toast-message').then(async () => {
			console.info('<toast-message> defined');
			console.info({form: document.forms.ad});
			await Promise.all([...document.querySelectorAll('toast-message')].map(async el => {
				await el.opened;
				await el.closed;
			}));

			requestAnimationFrame(() => document.forms.ad.scrollIntoView({block: 'start', behavior: 'smooth'}));
			console.info('Requested scroll');
		});

		$('input[name], textarea[name]', document.forms.ad).each(input => {
			switch(input.name) {
			case 'label':
				input.value = params.get('title');
				input.dispatchEvent(new Event('input'));
				break;

			case 'description':
				input.value = params.get('text');
				input.dispatchEvent(new Event('input'));
				break;

			case 'url':
				input.value = params.get('url');
				input.dispatchEvent(new Event('input'));
				break;
			}

		});
	}
});

/* eslint no-unused-vars: 0 */
const config = {
	version: '1.0.0',
	fresh: [
		'/',
		'/js/index.js',
		'/css/index.css',
		'/css/vars.css',
		'/css/layout.css',
		'/css/header.css',
		'/css/nav.css',
		'/css/main.css',
		'/css/sidebar.css',
		'/css/footer.css',
		'/img/icons.svg',
		'/img/neon.svg',
		'/img/apple-touch-icon.png',
		'/img/icon-192.png',
		'/img/favicon.svg',
	].map(url => new URL(url, location.origin).href),
	stale: [
		'https://cdn.kernvalley.us/components/share-button.js',
		'https://cdn.kernvalley.us/components/ad-block.js',
		'https://cdn.kernvalley.us/components/toast-message.html',
		'https://baconipsum.com/api/?paras=6&format=json&type=all-meat',
		'https://cdn.kernvalley.us/js/PaymentAPI/PaymentRequest.js',
		'https://cdn.kernvalley.us/components/payment-form/payment-form.js',
		'https://cdn.kernvalley.us/js/PaymentAPI/PaymentResponse.js',
		'https://cdn.kernvalley.us/js/PaymentAPI/PaymentRequestUpdateEvent.js',
		'https://cdn.kernvalley.us/js/PaymentAPI/PaymentAddress.js',
		'https://cdn.kernvalley.us/js/PaymentAPI/BasicCardResponse.js',
		'https://cdn.kernvalley.us/js/PaymentAPI/BillingAddress.js',
		'https://cdn.kernvalley.us/js/std-js/share-config.js',
		'https://cdn.kernvalley.us/components/current-year.js',
		'https://cdn.kernvalley.us/js/std-js/deprefixer.js',
		'https://cdn.kernvalley.us/js/std-js/shims.js',
		'https://cdn.kernvalley.us/js/std-js/md5.js',
		'https://cdn.kernvalley.us/js/std-js/Notification.js',
		'https://cdn.kernvalley.us/js/std-js/webShareApi.js',
		'https://cdn.kernvalley.us/js/std-js/esQuery.js',
		'https://cdn.kernvalley.us/js/std-js/functions.js',
		'https://cdn.kernvalley.us/components/login-button.js',
		'https://cdn.kernvalley.us/components/logout-button.js',
		'https://cdn.kernvalley.us/components/register-button.js',
		'https://cdn.kernvalley.us/components/bacon-ipsum.js',
		'https://cdn.kernvalley.us/components/toast-message.js',
		'https://cdn.kernvalley.us/components/gravatar-img.js',
		'https://cdn.kernvalley.us/js/std-js/asyncDialog.js',
		'https://cdn.kernvalley.us/js/User.js',
		'https://cdn.kernvalley.us/components/login-form/login-form.js',
		'https://cdn.kernvalley.us/components/registration-form/registration-form.js',
		'https://cdn.kernvalley.us/components/login-form/login-form.html',
		'https://cdn.kernvalley.us/components/registration-form/registration-form.html',
		'https://cdn.kernvalley.us/css/core-css/rem.css',
		'https://cdn.kernvalley.us/css/core-css/viewport.css',
		'https://cdn.kernvalley.us/css/core-css/element.css',
		'https://cdn.kernvalley.us/css/core-css/class-rules.css',
		'https://cdn.kernvalley.us/css/core-css/utility.css',
		'https://cdn.kernvalley.us/css/core-css/fonts.css',
		'https://cdn.kernvalley.us/css/core-css/animations.css',
		'https://cdn.kernvalley.us/css/core-css/layout/index.css',
		'https://cdn.kernvalley.us/css/core-css/layout/wide/index.css',
		'https://cdn.kernvalley.us/css/core-css/layout/left-sidebar/index.css',
		'https://cdn.kernvalley.us/css/core-css/layout/right-sidebar/index.css',
		'https://cdn.kernvalley.us/css/core-css/layout/multi-column.css',
		'https://cdn.kernvalley.us/css/core-css/theme/base.css',
		'https://cdn.kernvalley.us/css/core-css/theme/default/index.css',
		'https://cdn.kernvalley.us/css/core-css/theme/default/light.css',
		'https://cdn.kernvalley.us/css/core-css/theme/default/dark.css',
		'https://cdn.kernvalley.us/css/core-css/layout/shared.css',
		'https://cdn.kernvalley.us/css/core-css/layout/default/index.css',
		'https://cdn.kernvalley.us/css/normalize/normalize.css',
		'https://cdn.kernvalley.us/css/animate.css/animate.css',
		/* Social Icons for Web Share API shim */
		'https://cdn.kernvalley.us/img/octicons/mail.svg',
		'https://cdn.kernvalley.us/img/logos/facebook.svg',
		'https://cdn.kernvalley.us/img/logos/twitter.svg',
		'https://cdn.kernvalley.us/img/logos/google-plus.svg',
		'https://cdn.kernvalley.us/img/logos/linkedin.svg',
		'https://cdn.kernvalley.us/img/logos/reddit.svg',
		'https://cdn.kernvalley.us/img/logos/gmail.svg',
		'https://cdn.kernvalley.us/img/adwaita-icons/actions/mail-send.svg',
		'https://cdn.kernvalley.us/img/logos/instagram.svg',
		'https://cdn.kernvalley.us/fonts/roboto.woff2',
	].map(path => new URL(path, location.origin).href),
	allowed: [
		/https:\/\/secure\.gravatar\.com\/avatar\/*/,
		/https:\/\/i\.imgur\.com\/*/,
	]
};

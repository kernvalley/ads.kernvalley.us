/* global ga */
export function outbound() {
	ga('send', {
		hitType: 'event',
		eventCategory: 'outbound',
		eventAction: 'click',
		eventLabel: this.href,
		transport: 'beacon',
	});
}

export function madeCall() {
	ga('send', {
		hitType: 'event',
		eventCategory: 'call',
		eventLabel: 'Called',
		transport: 'beacon',
	});
}

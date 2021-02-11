/* eslint-env node */
const WEBHOOK = process.env.SLACK_WEBHOOK;
exports.handler = async function(event/*, context*/) {
	if (event.httpMethod === 'POST') {
		try {
			const ad = JSON.parse(event.body);
			if (ad['@context'] !== 'https://schema.org' || ad['@type'] !== 'WPAdBlock') {
				throw new TypeError('Invalid ad submitted');
			}
			const fetch = require('node-fetch');
			const { URL } = require('url');
			const resp = await fetch(new URL(WEBHOOK), {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: 'New Ad submitted on <https://ads.kernvalley.us|Kern Valley Ads>',
					blocks: [{
						type: 'header',
						text: {
							type: 'plain_text',
							text: 'Ad submitted for Kern Valley Ads',
						}
					}, {
						type: 'section',
						fields: [{
							type: 'mrkdwn',
							text: '```\n' + JSON.stringify(ad, null, 4) + '\n```',
						}]
					}]
				}),
			});
			const json = await resp.text();
			return {
				statusCode: 200,
				body: json,
			};
		} catch(err) {
			console.error(err);
			return {
				statusCode: 500,
				body: err.message,
			};
		}
	} else {
		return { statusCode: 405 };
	}
};

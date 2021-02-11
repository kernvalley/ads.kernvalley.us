/* eslint-env node */
const WEBHOOK = process.env.SLACK_WEBHOOK;

async function cloudinarySign(params, secret) {
	if (typeof params !== 'object') {
		throw new TypeError('params must be an object');
	} else if (! Number.isInteger(params.timestamp)) {
		throw new TypeError('Missing or invalid timestamp param');
	} else if (typeof secret !== 'string') {
		throw new TypeError('secret must be a string');
	} else {
		const data = Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&') + secret;
		const { createHash } = require('crypto');
		return createHash('sha256').update(data).digest('hex');
	}
}

async function uploadToCloudinary(file, { type = 'raw', v = 'v1_1', name = 'kernvalley-us' } = {}) {
	if (typeof process.env.CLOUDINARY !== 'string') {
		throw new Error('Not configured');
	}
	const { KEY: api_key = null, SECRET: secret = null } = JSON.parse(process.env.CLOUDINARY) || {};
	const fetch = require('node-fetch');
	const FormData = require('form-data');
	const folder = '/KRV Ads';
	const url = `https://api.cloudinary.com/${v}/${name}/${type}/upload`;

	try {
		const timestamp = Date.now();
		const sig = await cloudinarySign({ folder, timestamp }, secret);
		const body = new FormData();

		body.append('file', file);
		body.append('folder', folder);
		body.append('api_key', api_key);
		body.append('timestamp', timestamp);
		body.append('signature', sig);
		const resp = await fetch(url, { body, method: 'POST' });
		return resp;
	} catch(err) {
		console.error(err);
		return { status: 500, text: () => Promise.resolve(null), url, ok : false };
	}
}

exports.handler = async function(event/*, context*/) {
	if (event.httpMethod === 'POST') {
		try {
			const ad = JSON.parse(event.body);
			if (ad['@context'] !== 'https://schema.org' || ad['@type'] !== 'WPAdBlock') {
				throw new TypeError('Invalid ad submitted');
			}
			const file = `data:application/json;base64,${Buffer.from(JSON.stringify(ad)).toString('base64')}`;
			const upload = await uploadToCloudinary(file).catch(console.error);
			if (! upload.ok) {
				throw new Error('Error uploading file');
			}
			const { url, asset_id } = await upload.json();
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
						text: {
							type: 'plain_text',
							text: ad.label,
						},
						accessory: {
							type: 'button',
							text: {
								type: 'plain_text',
								text: 'View File',
								emoji: true
							},
							url,
							action_id: asset_id
						}
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

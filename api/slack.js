/* eslint-env node */
function base64Encode(buffer, contentType = 'application/octet-stream') {
	if (buffer instanceof Buffer) {
		return `data:${contentType};base64,${buffer.toString('base64')}`;
	} else if (buffer.read instanceof Function) {
		return base64Encode(buffer.read(), contentType);
	} else {
		return base64Encode(Buffer.from(buffer), contentType);
	}
}

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
	const timestamp = Date.now();
	const sig = await cloudinarySign({ folder, timestamp }, secret);
	const body = new FormData();

	body.append('file', file);
	body.append('folder', folder);
	body.append('api_key', api_key);
	body.append('timestamp', timestamp);
	body.append('signature', sig);

	const resp = await fetch(url, { body, method: 'POST' });
	if (resp.ok) {
		return await resp.json();
	} else {
		throw new Error(`${resp.url} [${resp.status} ${resp.statusText}]`);
	}
}

exports.handler = async function(event/*, context*/) {
	if (event.httpMethod === 'POST') {
		try {
			const { files = [], fields: { name, email, phone } = {} } = await new Promise((resolve, reject) => {
				const Multipart = require('lambda-multipart');
				const req = new Multipart(event);
				req.on('finish', resolve);
				req.on('error', reject);
			});

			const adFile = files.find(({ filename }) => filename.endsWith('.krvad'));

			if (! [email, name].every(i => typeof i === 'string' && i.length !== 0)) {
				throw new TypeError('Email and name required');
			} else if (typeof adFile === 'undefined') {
				throw new Error('Missing ad file');
			}
			const { secure_url, asset_id } = await uploadToCloudinary(base64Encode(adFile, 'text/plain'), { type: 'auto' });

			const fetch = require('node-fetch');
			const WEBHOOK = process.env.SLACK_WEBHOOK;
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
							text:`Ad from: ${name}`
						}
					}, {
						type: 'section',
						fields: [{
							type: 'mrkdwn',
							text: `Email: ${email}`
						}, {
							type: 'mrkdwn',
							text: `Phone: ${phone || 'Not given'}`
						}],
						accessory: {
							type: 'button',
							text: {
								type: 'plain_text',
								text: 'View File',
								emoji: true
							},
							url: secure_url,
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

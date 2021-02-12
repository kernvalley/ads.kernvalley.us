/* eslint-env node */

class HTTPError extends Error {
	constructor(message, status = 500) {
		super(message);

		if (! Number.isInteger(status) || status < 100 || status > 600) {
			throw new HTTPError('Invalid HTTP Status Code', 500);
		} else {
			this.status = status;
		}
	}

	get body() {
		return {
			error: {
				status: this.status,
				message: this.message,
			}
		};
	}

	get headers() {
		switch(this.status) {
			case 405:
				return {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Options': 'GET, OPTIONS',
				};

			default:
				return {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				};
		}
	}

	get response() {
		return {
			statusCode: this.status,
			headers: this.headers,
			body: JSON.stringify(this),
		};
	}

	toJSON() {
		return this.body;
	}

	toString() {
		return JSON.stringify(this);
	}

	static createResponse(message, status) {
		try {
			const err = new HTTPError(message, status);
			return err.response;
		} catch(err) {
			if (err instanceof HTTPError) {
				return err.response;
			} else {
				return new HTTPError('An unknown error occured', 500);
			}
		}
	}
}

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
		throw new Error('Not configured', 501);
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
	try {
		if (event.httpMethod === 'POST') {
			if (typeof process.env.SLACK_WEBHOOK !== 'string') {
				throw new HTTPError('Not configured', 501);
			}
			const { files = [], fields: { name, email, phone } = {} } = await new Promise((resolve, reject) => {
				const Multipart = require('lambda-multipart');
				const req = new Multipart(event);
				req.on('finish', resolve);
				req.on('error', reject);
			});

			const adFile = files.find(({ filename }) => filename.endsWith('.krvad'));

			if (! [email, name].every(i => typeof i === 'string' && i.length !== 0)) {
				throw new HTTPError('Email and name required', 400);
			} else if (typeof adFile === 'undefined') {
				throw new HTTPError('Missing ad file', 400);
			}
			const { secure_url, asset_id } = await uploadToCloudinary(base64Encode(adFile, 'text/plain'), { type: 'auto' });

			const fetch = require('node-fetch');
			const resp = await fetch(process.env.SLACK_WEBHOOK, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: 'New Ad submitted on <https://ads.kernvalley.us|Kern Valley Ads>',
					channel: '#advertising',
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

			if (resp.ok) {
				return { statusCode: 204, body: null };
			} else {
				throw new HTTPError('Error sending ad', 500);
			}
		} else if (event.httpMethod === 'OPTIONS') {
			return {
				statusCode: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Options': 'POST, OPTIONS',
				}
			};
		} else {
			throw new HTTPError('Unsupported method', 405);
		}
	} catch(err) {
		console.error(err);

		if (err instanceof HTTPError) {
			return err.resonse;
		} else {
			return {
				statusCode: 500,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					error: {
						status: 500,
						message: 'An unknown error occured',
					}
				})
			};
		}
	}
};

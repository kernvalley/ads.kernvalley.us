/* eslint-env node */

async function sign(params, secret) {
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

exports.upload = async function upload(file, {
	type = 'auto',
	v = 'v1_1',
	name = 'kernvalley-us',
	folder = '/KRV Ads',
} = {}) {
	if (typeof process.env.CLOUDINARY !== 'string') {
		throw new Error('Not configured', 501);
	}

	const { KEY: api_key = null, SECRET: secret = null } = JSON.parse(process.env.CLOUDINARY) || {};
	const fetch = require('node-fetch');
	const FormData = require('form-data');
	const url = `https://api.cloudinary.com/${v}/${name}/${type}/upload`;
	const timestamp = Date.now();
	const sig = await sign({ folder, timestamp }, secret);
	const body = new FormData();

	body.append('file', Buffer.from(file.read()), file.filename);
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
};

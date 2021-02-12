/* eslint-env node */
const ALLOWED = [
	'.png',
	'.jpg',
];

exports.handler = async function uploadHandler(event) {
	const { HTTPError } = require('./http-error');

	try {
		if (event.httpMethod === 'POST') {
			if (typeof process.env.SLACK_WEBHOOK !== 'string') {
				throw new HTTPError('Not configured', 501);
			}
			const { postData } = require('./post-data');
			const { files = [] } = await postData(event);
			const image = files[0];//files.find(({ filename }) => ALLOWED.some(ext => filename.toLowerCase().endsWith(ext)));
			if (typeof image !== 'undefined') {
				const { upload } = require('./cloudinary');

				try {
					const data = await upload(image, { type: 'image', folder: '/KRV Ads' });
					return {
						statusCode: 200,
						body: JSON.stringify(data),
						headers: { 'Content-Type': 'application/json' }
					};
				} catch(err) {
					console.error(err);
					throw new HTTPError('Error uploading image', 500);
				}
			} else {
				throw new HTTPError('No image found', 400);
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
		if (err instanceof HTTPError) {
			console.log(err.response);
			return err.resonse;
		} else {
			console.error(err);
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

/* eslint-env node */

exports.handler = async function slackHandler(event) {
	const { HTTPError } = require('./http-error');

	try {
		if (event.httpMethod === 'POST') {
			if (typeof process.env.SLACK_WEBHOOK !== 'string') {
				throw new HTTPError('Not configured', 501);
			}
			const { postData } = require('./post-data');
			const { files = [], fields: { name, email, phone } = {} } = await postData(event);

			const adFile = files.find(({ filename }) => filename.endsWith('.krvad'));

			if (! [email, name].every(i => typeof i === 'string' && i.length !== 0)) {
				throw new HTTPError('Email and name required', 400);
			} else if (typeof adFile === 'undefined') {
				throw new HTTPError('Missing ad file', 400);
			}
			const { upload } = require('./cloudinary');
			const { secure_url, asset_id } = await upload(adFile, { type: 'auto', folder: '/KRV Ads' });

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

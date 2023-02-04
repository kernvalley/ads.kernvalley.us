/* eslint-env node */
const { status } = require('./http-status.js');

const requiredFields = ['identifier', 'label', 'layout', 'theme'];
const allFields = [...requiredFields, 'callToAction', 'description', 'image', 'url', 'imageFit', 'imagePosition'];
const layouts = ['text', 'card', 'stack', 'image'];
const themes = ['auto', 'light', 'dark'];

exports.handler = async function(event) {
	try {
		const headers = new Headers(event.headers);
		const searchParams = new URLSearchParams(event.queryStringParameters);

		switch (event.httpMethod) {
			case 'GET':
				if (
					headers.has('Accept')
					&& headers.get('Accept') !== '*/*'
					&& ! headers.get('Accept').toLowerCase().startsWith('application/json')
				) {
					return {
						statusCode: status.NOT_ACCEPTABLE,
					};
				} else if (searchParams.has('id')) {
					const { getCollection } = require('./firebase.js');
					const collection = await getCollection('ads');
					const ad = await collection.doc(searchParams.get('id')).get();

					if (! ad.exists) {
						return {
							statusCode: status.NOT_FOUND,
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								error: `${searchParams.get('id')} not found`,
								staatus: status.NOT_FOUND,
							})
						};
					} else {
						return {
							statusCode: status.OK,
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(ad.data()),
						};
					}
				} else {
					return {
						statusCode: status.BAD_REQUEST,
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({})
					};
				}
			case 'POST': {
				if (! headers.get('Content-Type').toLowerCase().startsWith('application/json')) {
					return {
						statusCode: status.BAD_REQUEST,
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							error: {
								message: 'POST must be JSON',
								status: status.BAD_REQUEST,
							}
						})
					};
				} else if (
					headers.has('Accept')
					&& headers.get('Accept') !== '*/*'
					&& ! headers.get('Accept').toLowerCase().startsWith('application/json')
				) {
					return {
						statusCode: status.NOT_ACCEPTABLE,
					};
				} else {
					const data = JSON.parse(event.body);

					if (! requiredFields.every(field => field in data)) {
						return {
							statusCode: status.BAD_REQUEST,
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								error: {
									message: 'Missing required fields',
									status: status.BAD_REQUEST,
								}
							})
						};
					} else if (
						Object.entries(data)
							.some(([k, v]) => ! allFields.includes(k) || typeof v !== 'string')
					) {
						return {
							statusCode: status.BAD_REQUEST,
							headers: { 'Content-Type': 'application/json' },

						};
					} else if (! layouts.includes(data.layout)) {
						return {
							statusCode: status.BAD_REQUEST,
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								error: {
									message: 'Invalid layout',
									status: status.BAD_REQUEST,
								}
							})
						};
					} else if (! themes.includes(data.theme)) {
						return {
							statusCode: status.BAD_REQUEST,
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								error: {
									message: 'Invalid theme',
									status: status.BAD_REQUEST,
								}
							})
						};
					} else if (! ['card', 'text', 'stack'].includes(data.layout)) {
						return {
							statusCode: status.BAD_REQUEST,
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								error: {
									message: 'Missing required description',
									status: status.BAD_REQUEST,
								}
							})
						};
					} else {
						const { getCollection } = require('./firebase.js');
						const collection = await getCollection('ads');
						await collection.doc(data.identifier).set(data);

						return {
							statusCode: status.CREATED,
						};
					}
				}
			}
			default:
				return {
					statusCode: status.METHOD_NOT_ALLOWED,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						error: {
							message: `Unsupported HTTP method: ${event.httpMethod}`,
							status: status.METHOD_NOT_ALLOWED,
						}
					})
				};
		}
	} catch(err) {
		return {
			statusCode: status.INTERNAL_SERVER_ERROR,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				error: {
					message: 'An unknown error occurred',
					status: status.INTERNAL_SERVER_ERROR,
				}
			})
		};
	}
};

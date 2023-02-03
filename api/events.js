/* eslint-env node */
const { status } = require('./http-status.js');

const HEADERS = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Origin': '*',
	'Options': 'POST',
};

const requiredParams = ['uuid', 'type', 'origin', 'datetime', 'layout'];
const supportedEvents = ['view', 'click'];
const layouts = ['card', 'stack', 'text', 'image'];

exports.handler = async function({ httpMethod, headers, body }) {
	try {
		if (httpMethod !== 'POST') {
			return {
				statusCode: status.METHOD_NOT_ALLOWED,
				headers: HEADERS,
				body: JSON.stringify({
					error: {
						message: 'Method not allowed',
						status: status.METHOD_NOT_ALLOWED,
					}
				})
			};
		} else if (! headers['content-type'].startsWith('application/x-www-form-urlencoded')) {
			return {
				statusCode: status.BAD_REQUEST,
				headers: HEADERS,
				body: JSON.stringify({
					error: {
						message: 'Invalid `Content-Type` header',
						status: status.BAD_REQUEST,
					}
				})
			};
		} else {
			const params = new URLSearchParams(body);

			if (! requiredParams.every(param => params.has(param))) {
				return {
					statusCode: status.BAD_REQUEST,
					headers: HEADERS,
					body: JSON.stringify({
						error: {
							message: 'Missing required fields',
							status: status.BAD_REQUEST,
							body: '{}',
						}
					})
				};
			} else if (! supportedEvents.includes(params.get('type'))) {
				return {
					statusCode: status.BAD_REQUEST,
					headers: HEADERS,
					body: JSON.stringify({
						error: {
							message: `invalid event type: "${params.get('event')}"`,
							status: status.BAD_REQUEST,
						}
					})
				};
			} else if (! layouts.includes(params.get('layout'))) {
				return  {
					statusCode: status.BAD_REQUEST,
					headers: HEADERS,
					body: JSON.stringify({
						error: {
							message: `Unknown layout: ${params.get('layout')}`,
							status: status.BAD_REQUEST,
						}
					})
				};
			} else {
				const { getTimestamp, getCollection } = require('./firebase.js');

				try {
					await getCollection('events').doc().set({
						type: params.get('type'),
						origin: params.get('origin'),
						pathanme: params.get('pathname'),
						layout: params.get('layout'),
						theme: params.get('theme'),
						uuid: params.get('uuid'),
						label: params.get('label'),
						source: params.get('source'),
						campaign: params.get('campaign'),
						medium: params.get('medium'),
						term: params.get('term'),
						content: params.get('content'),
						datetime: getTimestamp(new Date(params.get('datetime')).getTime()),
					});

					return {
						statusCode: status.NO_CONTENT,
						headers: HEADERS,
					};
				} catch(err) {
					console.error(err);
					return {
						statusCode: status.INTERNAL_SERVER_ERROR,
						headers: HEADERS,
						body: JSON.stringify({
							message: 'Error saving event',
							status: status.INTERNAL_SERVER_ERROR,
						})
					};
				}
			}
		}
	} catch(err) {
		console.error(err);
		return {
			statusCode: status.INTERNAL_SERVER_ERROR,
			headers: HEADERS,
			body: JSON.stringify({
				error: {
					message: 'An unknown error occurred',
					status: status.INTERNAL_SERVER_ERROR,
				}
			})
		};
	}
};

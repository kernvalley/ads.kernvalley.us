/* eslint-env node */

exports.HTTPError = class HTTPError extends Error {
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
};

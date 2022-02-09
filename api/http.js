/* eslint-env node */
const https = require('https');


class Response {
	constructor(body = null, { status, headers = {}, url } = {}) {
		this.headers = headers;
		this.status = status;
		this.body = body;
		this.url = url;
		this.headers = headers;
	}

	get ok() {
		const status = this.status;
		return typeof status === 'number' && status > 199 && status < 300;
	}

	get statusText() {
		switch(this.status) {
			case 100: return 'Continue';

			case 200: return 'Ok';
			case 201: return 'Created';
			case 202: return 'Accepted';
			case 203: return 'Non-Authoritative Information';
			case 204: return 'No Content';

			case 301: return 'Moved Permenantly';
			case 302: return 'Found';
			case 303: return 'See Other';
			case 304: return 'Not Modified';
			case 307: return 'Temporary Redirect';
			case 308: return 'Permenant Redirect';

			case 400: return 'Bad Request';
			case 401: return 'Unauthorized';
			case 402: return 'Payment Required';
			case 403: return 'Forbidden';
			case 404: return 'Not Found';
			case 405: return 'Method Not Allowed';
			case 406: return 'Not Acceptable';
			case 408: return 'Request Timeout';
			case 409: return 'Conflict';
			case 410: return 'Gone';
			case 429: return 'Too Many Requests';

			case 500: return 'Internal Server Error';
			case 501: return 'Not Implemented';
			case 502: return 'Bad Gateway';
			case 503: return 'Service Unavailable';
			case 504: return 'Gateway Timeout';
			case 511: return 'Network Authentication Required';

			default: return '';
		}
	}

	async text() {
		return this.body;
	}

	async json() {
		const text = await this.text();
		return JSON.parse(text);
	}

	static error() {
		return new Response('', { status: 0 });
	}

	static redirect(url, status = 302) {
		return new Response(null, {
			status,
			headers: { Location: url },
		});
	}
}

exports.Response = Response;

exports.fetch = function fetch(url, { method = 'GET', headers = {}, body, signal } = {}) {
	return new Promise((resolve, reject) => {
		const req = https.request(url, { method, headers, signal }, res => {
			res.setEncoding('utf8');
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				resolve(new Response(data, { url, status: res.statusCode, headers: res.headers }));
			});

			res.on('error', err => {
				console.error(err);
				reject(new Response(data, { url, status: res.statusCode, headers: res.headers }));
			});
		});

		req.on('error', err => {
			console.error(err);
			reject(Response.error());
		});

		if (typeof body === 'string') {
			req.write(body);
		}

		req.end();
	});
};

exports.GET = function GET(url, { headers = {}, signal } = {}) {
	return fetch(url, { method: 'GET', headers, signal });
};

exports.HEAD = function HEAD(url, { headers = {}, signal } = {}) {
	return fetch(url, { method: 'HEAD', headers, signal });
};

exports.OPTIONS = function OPTIONS(url, { headers = {}, signal } = {}) {
	return fetch(url, { method: 'OPTIONS', headers, signal });
};

exports.DELETE = function DELETE(url, { headers = {}, signal } = {}) {
	return fetch(url, { method: 'DELETE', headers, signal });
};

exports.POST = function POST(url, { headers = {}, body, signal } = {}) {
	return fetch(url, { method: 'POST', headers, body, signal });
};

exports.PUT = function PUT(url, { headers = {}, body, signal } = {}) {
	return fetch(url, { method: 'PUT', headers, body, signal });
};

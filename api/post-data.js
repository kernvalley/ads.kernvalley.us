/* eslint-env node*/

exports.postData = async function postData(event) {
	return await new Promise((resolve, reject) => {
		const Multipart = require('lambda-multipart');
		const req = new Multipart(event);
		req.on('finish', result => resolve(result));
		req.on('error', err => reject(err));
	});
};

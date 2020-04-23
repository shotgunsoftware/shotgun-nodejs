class ErrorResponse {
	constructor({ errors } = {}) {
		if (!errors) errors = [];
		this.errors = errors.map(err => new ErrorObject(err));
	}

	toString() {
		return this.errors.map(err => `${err.title} (Code ${err.code})`).join('; ');
	}
}

class ErrorObject {
	constructor({ id, status, code, title, detail, source, meta } = {}) {
		this.id = id;
		this.status = status;
		this.code = code;
		this.title = title;
		this.detail = detail;
		this.source = source;
		this.meta = meta;
	}
}

class RequestError extends Error {

	constructor({ message, method, path, respBody, resp }) {

		let simpleMessage = 'Error performing request';
		if (method) simpleMessage += ' ' + method;
		if (path) simpleMessage += ' ' + path;

		if (!message) {
			message = simpleMessage;
			if (respBody) message += ': ' + JSON.stringify(respBody);
		}
		super(message);

		this.simpleMessage = simpleMessage;
		this.body = respBody;
		this.resp = resp;
	}
}

module.exports = {
	ErrorResponse,
	RequestError,
};

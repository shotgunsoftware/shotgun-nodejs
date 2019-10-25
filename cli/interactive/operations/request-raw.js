const chalk = require('chalk');
const { promptRequired, promptDataObject } = require('../prompts');

async function run({ client, defaults }) {

	let { path } = await promptRequired({
		name: 'path',
		message: 'Path:',
		type: 'string',
		default: defaults.rawRequestPath || '/'
	});

	// eslint-disable-next-line require-atomic-updates
	defaults.rawRequestPath = path;

	let { method } = await promptRequired({
		name: 'method',
		message: 'Method:',
		type: 'string',
		default: defaults.rawRequestMethod || 'GET'
	});

	// eslint-disable-next-line require-atomic-updates
	defaults.rawRequestMethod = method;

	console.log(chalk.bold('Enter headers'));
	let headers = await promptDataObject();

	console.log(chalk.bold('Enter body'));
	let body = await promptDataObject();

	return await client.request({ method, path, headers, body });
}

const title = 'Custom raw request';
const priority = 1000;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

const chalk = require('chalk');
const inquirer = require('inquirer');

const { parseColonKeyValue } = require('../helper');

async function promptRequired(options) {

	// eslint-disable-next-line no-constant-condition
	while (true) {

		let resp = await inquirer.prompt([options]);
		let out = resp[options.name];

		if (out)
			return resp;

		console.log(chalk.yellow('Please enter a value.'));
	}
}

async function promptUndefined(options) {

	let resp = await inquirer.prompt([options]);
	let out = resp[options.name];

	if (options.type === 'number' && isNaN(out) || !out)
		out = undefined;

	return {
		[options.name]: out,
	};
}

async function promptEntityName(defaults) {

	let { entity } = await inquirer.prompt([{
		name: 'entity',
		message: 'Target entity name:',
		type: 'input',
		default: defaults.entity,
	}]);

	// eslint-disable-next-line require-atomic-updates
	defaults.entity = entity;

	return entity;
}

async function promptDataObject() {

	let out = {};
	// eslint-disable-next-line no-constant-condition
	while (true) {

		let { input } = await inquirer.prompt([{
			name: 'input',
			message: `Input key-value colon-separated pair.\n  Current data: ${chalk.cyan(JSON.stringify(out))}\n${chalk.green('>')}`,
			type: 'input',
		}]);

		if (!input)
			break;

		if (input[0] === '-') {
			delete out[input.substr(1)];
			continue;
		}

		let colonKeyValue = parseColonKeyValue(input);
		out[colonKeyValue.key] = colonKeyValue.value;
	}

	return out;
}

module.exports = {
	promptRequired,
	promptUndefined,
	promptEntityName,
	promptDataObject,
};

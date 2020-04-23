const inquirer = require('inquirer');

async function run({ client, defaults }) {

	let { names } = await inquirer.prompt([{
		name: 'names',
		message: 'Names (coma-separated):',
		type: 'string',
		default: defaults.preferenceNames || '*'
	}]);

	// eslint-disable-next-line require-atomic-updates
	defaults.preferenceNames = names;

	return await client.preferencesGet({ names });
}

const title = 'Read preferences';
const priority = 90;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

const inquirer = require('inquirer');
const util = require('util');
const { promptEntityName } = require('../prompts');

async function run({ client, defaults }) {

	let entity = await promptEntityName(defaults);
	let { entityId } = await inquirer.prompt([{
		name: 'entityId',
		message: 'Entity id:',
		type: 'number',
	}]);

	let entry = await client.entityRead({ entity, entityId });
	console.log(util.inspect(entry, false, Infinity, true));

	let { confirm } = await inquirer.prompt([{
		name: 'confirm',
		message: 'Are you sure you want to delete the above entry?',
		type: 'confirm',
		default: false
	}]);
	if (!confirm)
		return;

	return await client.entityDelete({ entity, entityId });
}

const title = 'Delete entity record';
const priority = 1.4;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

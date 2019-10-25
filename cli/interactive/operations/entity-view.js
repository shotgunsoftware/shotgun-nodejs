const inquirer = require('inquirer');
const { promptEntityName } = require('../prompts');

async function run({ client, defaults }) {

	let entity = await promptEntityName(defaults);
	let { entityId } = await inquirer.prompt([{
		name: 'entityId',
		message: 'Entity id:',
		type: 'number',
		default: defaults.selectEntityId,
	}]);

	return await client.entityRead({ entity, entityId });
}

const title = 'View entity record';
const priority = 1.1;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

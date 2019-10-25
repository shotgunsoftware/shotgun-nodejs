const inquirer = require('inquirer');
const { promptEntityName, promptDataObject } = require('../prompts');

async function run({ client, defaults }) {

	let entity = await promptEntityName(defaults);
	let { entityId } = await inquirer.prompt([{
		name: 'entityId',
		message: 'Entity id:',
		type: 'number',
	}]);
	let data = await promptDataObject();
	return await client.entityUpdate({ entity, entityId, data });
}

const title = 'Update entity record';
const priority = 1.3;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

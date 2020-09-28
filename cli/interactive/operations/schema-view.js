const inquirer = require('inquirer');

async function run({ client, defaults }) {

	let { entity } = await inquirer.prompt([{
		name: 'entity',
		message: 'Specific entity (optional):',
		type: 'input',
		default: defaults.schemaEntity || '*',
	}]);

	let isFieldsWanted = false;
	if (!entity || entity === '*') {

		entity = undefined;

	} else {

		// eslint-disable-next-line require-atomic-updates
		defaults.schemaEntity = entity;

		let { answer } = await inquirer.prompt([{
			name: 'answer',
			message: 'Field schema wanted?',
			type: 'confirm',
			default: defaults.isFieldsWanted,
		}]);

		isFieldsWanted = defaults.isFieldsWanted = answer;
	}

	let { projectId } = await inquirer.prompt([{
		name: 'projectId',
		message: 'Project id (optional):',
		type: 'number',
		default: defaults.projectId,
	}]);

	if (isNaN(projectId))
		projectId = undefined;

	// eslint-disable-next-line require-atomic-updates
	defaults.projectId = projectId;

	return await client.schemaGet({ entity, isFieldsWanted, projectId });
}

const title = 'View schema';
const priority = 3;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

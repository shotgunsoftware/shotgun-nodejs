const inquirer = require('inquirer');

async function run({ client, defaults }) {

	let { entity } = await inquirer.prompt([{
		name: 'entity',
		message: 'Specific entity (optional):',
		type: 'input',
		default: defaults.schemaEntity || '*',
	}]);

	let fieldName;
	if (!entity || entity === '*') {

		entity = undefined;

	} else {

		// eslint-disable-next-line require-atomic-updates
		defaults.schemaEntity = entity;

		({ fieldName } = await inquirer.prompt([{
			name: 'fieldName',
			message: 'Field name (optional):',
			type: 'string',
			default: defaults.fieldName || '*',
		}]));

		// eslint-disable-next-line require-atomic-updates
		defaults.fieldName = fieldName;

		if (fieldName === '*')
			fieldName = true;
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

	return await client.schemaGet({ entity, projectId, fieldName });
}

const title = 'View schema';
const priority = 3;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

const { promptRequired, promptUndefined, promptEntityName, promptDataObject } = require('../prompts');
const { SchemaFieldDefinition } = require('../../../src/schema-field-definition');

async function run({ client, defaults }) {

	let schemaFieldDefinition = new SchemaFieldDefinition();

	let entity = await promptEntityName(defaults);

	let { fieldName } = await promptRequired({
		name: 'fieldName',
		message: 'Field name:',
		type: 'string',
	});

	let { projectId } = await promptUndefined({
		name: 'projectId',
		message: 'Project id (optional):',
		type: 'number',
		default: defaults.projectId,
	});

	let data = await promptDataObject();
	schemaFieldDefinition.setProperties(data);

	return await client.schemaFieldUpdate({ entity, fieldName, schemaFieldDefinition, projectId });
}

const title = 'Update schema field';
const priority = 3.2;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

const inquirer = require('inquirer');
const { promptEntityName, promptDataObject } = require('../prompts');
const { SchemaFieldDefinition } = require('../../../src/schema-field-definition');

async function run({ client, defaults }) {

	let schemaFieldDefinition = new SchemaFieldDefinition();

	let entity = await promptEntityName(defaults);

	let { dataType } = await inquirer.prompt([{
		name: 'dataType',
		message: 'Data type:',
		choices: SchemaFieldDefinition.DATA_TYPES,
		type: 'list',
	}]);
	schemaFieldDefinition.setDataType(dataType);

	let properties = await promptDataObject();
	schemaFieldDefinition.setProperties(properties);

	return await client.schemaFieldCreate({ entity, schemaFieldDefinition });
}

const title = 'Create schema field';
const priority = 3.1;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

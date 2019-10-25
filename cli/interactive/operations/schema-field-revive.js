const { promptRequired, promptEntityName } = require('../prompts');

async function run({ client, defaults }) {

	let entity = await promptEntityName(defaults);

	let { fieldName } = await promptRequired({
		name: 'fieldName',
		message: 'Field name:',
		type: 'string',
	});

	return await client.schemaFieldRevive({ entity, fieldName });
}

const title = 'Revive schema field';
const priority = 3.4;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

const { promptRequired, promptEntityName } = require('../prompts');

async function run({ client, defaults }) {

	let entity = await promptEntityName(defaults);

	let { fieldName } = await promptRequired({
		name: 'fieldName',
		message: 'Field name:',
		type: 'string',
	});

	return await client.schemaFieldDelete({ entity, fieldName });
}

const title = 'Delete schema field';
const priority = 3.3;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

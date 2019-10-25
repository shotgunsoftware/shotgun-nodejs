const { promptEntityName, promptDataObject } = require('../prompts');

async function run({ client, defaults }) {

	let entity = await promptEntityName(defaults);
	let data = await promptDataObject();
	return await client.entityCreate({ entity, data });
}

const title = 'Create entity record';
const priority = 1.2;

module.exports = {
	default: run,
	run,
	title,
	priority,
};

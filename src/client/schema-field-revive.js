/**
 * Revive an entity schema field.
 *
 * @param  {string} options.entity    - Entity target.
 * @param  {string} options.fieldName - Target field name.
 * @return {Object} Operation response data.
 */
const schemaFieldRevive = async function({ entity, fieldName }) {

	let respBody = await this.request({
		method: 'POST',
		path: `/schema/${entity}/fields/${fieldName}?revive=true`,
	});
	return respBody;
};

module.exports = schemaFieldRevive;

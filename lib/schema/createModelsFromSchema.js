const connUtils = require('appc-connector-utils');

/**
 * Creates models from your schema (see "fetchSchema" for more information on the schema).
 */
exports.createModelsFromSchema = function () {
	const connector = this;
	const utils = connUtils(connector);
	bindMethods(utils.createModelsViaSchema.createModels());

	function bindMethods(models) {
		Object.keys(models).forEach(function (modelName) {
			utils.common.bindModelMethods(connector, models[modelName]);
		});
		return models;
	}
};

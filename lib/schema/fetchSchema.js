const sdkFacade = require('../utils/sdkFacade');
const schemaFactory = require('../utils/schemaFactory');
const connUtils = require('appc-connector-utils');

exports.fetchSchema = function (callback) {
	const connector = this;
	const createSchemaFunc = connUtils(connector).createModelsViaSchema.createSchema;	
	sdkFacade(connector.config, (err, swaggerObject) => {
		if (err) {
			return callback(err);
		} else {
			return callback(null, createSchemaFunc(schemaFactory, swaggerObject));
		}
	});
};

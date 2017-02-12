const _ = require('lodash');
const async = require('async');
const sdkFacade = require('../utils/sdkFacade');
const SwaggerClient = require('swagger-client');

exports.fetchSchema = function (callback) {
	const connector = this;
	const logger = connector.logger;
	const options = connector.config;
	const params = {
		schema: {},
		logger: logger || require('arrow').createLogger({}, {
			name: 'appc.swagger', useConsole: true, level: 'debug'
		}),
		options: options
	};
	const tasks = [];

	// Download the swagger docs!
	tasks.push(next => {
		sdkFacade(options, (err, swaggerObject) => {
			if (err) {
				return next(err);
			} else {
				params.swaggerObject = swaggerObject;
				return next();
			}
		});
	});

	// Translate the models
	tasks.push(function (next) {
		var baseURL = (params.swaggerObject.schemes && params.swaggerObject.schemes[0]) || 'https';
		baseURL += '://';
		baseURL += params.swaggerObject.host;

		if (params.swaggerObject.basePath) {
			baseURL += params.swaggerObject.basePath;
		}
		params.baseURL = baseURL;

		// loop through the models and generate local equivalents
		var models = params.swaggerObject.definitions;
		for (var modelName in models) {
			if (models.hasOwnProperty(modelName)) {
				// TODO do this async!
				connector.downloadModel(params, modelName, models[modelName], function (err) {
					if (err) {
						return next(err);
					}
				});
			}
		}

		// Try to find API endpoints that correspond to the models.
		var paths = params.swaggerObject.paths;
		for (var path in paths) {
			if (paths.hasOwnProperty(path)) {
				// TODO do this async!
				connector.downloadAPI(params, path, paths[path], function (err) {
					if (err) {
						return next(err);
					}
				});
			}
		}
		next();
	});

	// Adds security definition to matching authentication provider configs
	tasks.push(function (next) {
		_.forEach(params.swaggerObject.securityDefinitions, function (securityDefinition, key) {
			if (connector.config.authenticationProvider[key]) {

				params.logger.trace('Adding security definition to "' + key + '" authentication provider.');

				var providerConfig = connector.config.authenticationProvider[key];
				providerConfig.securityDefinition = securityDefinition;
			}
		});

		next();
	});

	// That's it! After all of the tasks execute, exec our callback.
	return async.series(tasks, function (err) {
		if (err) {
			callback(err);
		} else {
			callback(null, params.schema);
		}
	});
};

const _ = require('lodash');
const swaggerParseUtils = require('./swaggerParseUtils');

module.exports = function (connector, swaggerObject) {
	const schema = {}
	const models = swaggerObject.definitions;
	const paths = swaggerObject.paths;
	const securityDefinitions = swaggerObject.securityDefinitions;
	const baseURL = getBaseURL(swaggerObject);

	// PROCESS MODELS
	Object.keys(models).forEach(function (modelName) {
		const parsedModelName = swaggerParseUtils.parseModelName(modelName);
		const modelData = models[modelName];
		schema[parsedModelName] = modelFactory(parsedModelName, modelData);
	});

	// PROCESS PATHS
	Object.keys(paths).forEach(function (path) {
		// TODO: FIXME The model name may not be in the path, we should look at params to tell
		const modelName = swaggerParseUtils.parseModelName(path);
		const methods = paths[path];
		var model = schema[modelName];
		if (!model) {
			model = schema[modelName] = {
				label: modelName,
				fields: {},
				methods: []
			}
		}
		Object.keys(methods).forEach(function (method) {
			const methodProperties = methods[method];
			if (!('parameters' === method)) {
				model.methods.push(getModelMethod(methodProperties, path, method, baseURL))
			}
		});
	});

	// PROCESS SECURITY DEFINITIONS 
	Object.keys(securityDefinitions).forEach(function (securityDefinitionKey) {
		const securityDefinition = securityDefinitions[securityDefinitionKey];
		const providerConfig = connector.config.authenticationProvider[securityDefinitionKey];
		if (providerConfig) {
			connector.logger.trace(`Adding security definition to ${securityDefinitionKey} authentication provider.`);
			providerConfig.securityDefinition = securityDefinition;
		}
	});	

	return schema;
}

function getModelMethod(methodProperties, path, method, baseURL) {
	const methodName = methodProperties.operationId || swaggerParseUtils.parseMethodName(connector.config, method, path);
	const globalParams = method.parameters || {};
	return {
		// TODO: Need to implement method overriding (aka: same name, different signatures).
		name: methodName,
		params: translateParameters(_.defaults(methodProperties.parameters, globalParams)),
		verb: method.toUpperCase(),
		url: baseURL + path,
		path: path,
		operation: {
			operationId: methodProperties.operationId,
			summary: methodProperties.summary,
			description: methodProperties.description
		}
	};
}

function modelFactory(modelName, modelData) {
	const model = {
		label: modelName,
		methods: [],
		fields: {}
	}
	const properties = modelData.properties;
	const requiredProperties = modelData.required || [];

	properties && processProperties(properties);

	return model;

	function processProperties(properties) {
		Object.keys(properties).forEach(function (propertyName) {
			if ('id' !== propertyName) {
				addModelField(propertyName)
			}
		});
	}

	function addModelField(propertyName) {
		const property = properties[propertyName];
		model.fields[propertyName] = {
			type: translateType(property),
			required: requiredProperties.indexOf(propertyName) !== -1
		};
	}
}

function getBaseURL(swaggerObject) {
	var baseURL = `${(swaggerObject.schemes && swaggerObject.schemes[0]) || 'https'}://${swaggerObject.host}`;
	if (swaggerObject.basePath) {
		baseURL += swaggerObject.basePath;
	}
	return baseURL;
}


/**
 * Hacks the parameters to remove properties injected by swagger-client for model references.
 * Using them causes circular references, which breaks the process later on.
 *
 * @param {Object} params
 * @param {Object} modified params
 */
function translateParameters(params) {
	var newParam = [];
	_.forEach(params, function (param) {
		if (param.schema && param.schema.$ref) {
			var type = param.modelSignature && param.modelSignature.type,
				model = type && param.modelSignature.definitions && param.modelSignature.definitions[type],
				definition = model && model.definition,
				properties = definition && definition.properties,
				required = definition && definition.required || [];

			_.forEach(properties, function (val, key) {
				if ('id' !== key) {
					newParam.push({
						in: param.in,
						name: key,
						type: val.type || 'object',
						description: val.description,
						required: required.indexOf(key) !== -1
					});
				}
			});
		} else {
			newParam.push(param);
			delete param.modelSignature; // This is circular reference to model if the param is a model!
			delete param.responseClassSignature;
			delete param.signature;
			delete param.sampleJSON;
		}
	});

	return newParam;
}

/**
 * Translate from Swagger type to JS type
 * @param {Object} prop
 * @returns {string}
 */
function translateType(prop) {
	var complexType = prop.type;
	const typeMap = {
		'array': 'Array',
		'integer': 'Integer',
		'integer.int32': 'Integer',
		'integer.int64': 'Integer',
		'number': 'Number',
		'number.double': 'Number',
		'number.float': 'Number',
		'string': 'String',
		'string.byte': 'String',
		// binary not supported in JavaScript client right now, using String as a workaround
		'string.binary': 'String',
		'boolean': 'Boolean',
		'string.date': 'Date',
		'string.date-time': 'Date',
		'string.password': 'String',
		'file': 'File',
		'object': 'Object'
	};
	if (prop.format) {
		complexType = complexType + '.' + prop.format;
	}
	return typeMap[complexType];
}

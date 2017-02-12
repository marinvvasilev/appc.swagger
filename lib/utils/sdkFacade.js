const SwaggerClient = require('swagger-client');

module.exports = function (config, callback) {
	var client;
	const clientOptions = {
		url: config.swaggerDocs,
		success: function () {
			callback(null, client.swaggerObject);
		},
		failure: function (err) {
			callback(err);
		}
	};
	updateClientOptionsWithAuthInfo(config, clientOptions);
	client = new SwaggerClient(clientOptions);
}

function updateClientOptionsWithAuthInfo(connectorConfig, clientOptions) {
	const defaultApiKeyType = 'query';
	const defaultPassword = '';
	if (connectorConfig.login) {
		clientOptions.authorizations = {};
		if (connectorConfig.login.username) {
			clientOptions.authorizations.Basic = new SwaggerClient.PasswordAuthorization(connectorConfig.login.username, connectorConfig.login.password || defaultPassword);
		}
		if (connectorConfig.login.apiKey) {
			clientOptions.authorizations.APIKey = new SwaggerClient.ApiKeyAuthorization(connectorConfig.login.apiKey.name, config.login.apiKey.value, connectorConfig.login.apiKey.type || defaultApiKeyType);
		}
	}
}

// module.exports = function (url, callback) {
// 	var client;

// 	const clientOptions = {
// 		url: url,
// 		success: function () {
// 			callback(null, client.swaggerObject);
// 		},
// 		failure: function (err) {
// 			callback(err);
// 		}
// 	};

// 	client = new SwaggerClient(clientOptions);
// }

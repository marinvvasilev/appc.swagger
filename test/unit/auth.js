const test = require('tape');
const nock = require('nock');
const request = require('superagent');
const Arrow = require('arrow');
const serverFactory = require('../server');

const auth = require('../../lib/utils/authentication/auth');
const ApiKeyAuthentication = require('../../lib/utils/authentication/providers/api-key');
const BasicAuthentication = require('../../lib/utils/authentication/providers/basic');
const OauthAuthentication = require('../../lib/utils/authentication/providers/oauth');

var SERVER, CONNECTOR, CONFIG;
test('### START SERVER ###', t => {
	t.plan(2);
	SERVER = new Arrow({ overrideLevel: 'info' });
	CONNECTOR = SERVER.getConnector('appc.swagger');
	CONFIG = CONNECTOR.config;
	CONFIG.swaggerDocs = 'http://petstore.swagger.io/v2/swagger.json';
	CONFIG.authenticationProvider = {
		api_key: {
			value: 'special-key'
		},
		basic: {
			username: 'boblee',
			password: 'swagger',
			securityDefinition: {
				type: 'basic'
			}
		},
		oauth_password: {
			client_id: 'id',
			client_secret: 'super_secret',
			username: 'boblee',
			password: 'swagger',
			requestContentType: 'json',
			securityDefinition: {
				type: 'oauth2',
				flow: 'password',
				tokenUrl: 'http://localhost/oauth/token'
			}
		},
		oauth_client: {
			client_id: 'id',
			client_secret: 'super_secret',
			requestContentType: 'json',
			securityDefinition: {
				type: 'oauth2',
				flow: 'application',
				tokenUrl: 'http://localhost/oauth/token'
			}
		}
	};
	CONNECTOR.connect( err => {
		t.ok("dsadsa");
		t.ok("dsdsadsa");
	});
});

test('### Should add swagger securityDefinition to authenticationProvider.api_key ###', t => {
	const securityDefinition = CONFIG.authenticationProvider.api_key.securityDefinition;
	t.deepEqual(securityDefinition, {
		type: 'apiKey',
		name: 'api_key',
		in: 'header'
	}, 'securityDefinition has the correct structure');
	t.end();
});

test('Resolver - should return empty array if no provider found', t => {
	const securityRequirement = [{ na: [] }];
	const providers = auth.resolveAuthenticationProviders(CONNECTOR, securityRequirement);
	t.ok(providers instanceof Array, 'we have list with providers');
	t.equal(providers.length, 0, 'which is empty when provider is not found');
	t.end();
});

test('Resolver - should return all required providers', t => {
	const securityRequirement = [{ api_key: [], basic: [] }];
	const providers = auth.resolveAuthenticationProviders(CONNECTOR, securityRequirement);
	t.ok(providers instanceof Array, 'we have list with providers');
	t.equal(providers.length, 2, 'providers are found');
	t.ok(providers[0] instanceof ApiKeyAuthentication, 'Provider one is ApiKeyAuthentication');
	t.ok(providers[1] instanceof BasicAuthentication, 'Provider two is BasicAuthentication');
	t.end();
});


test('HTTP basic provider - should resolve configured basic authentication provider', t => {
	const providerConfig = CONFIG.authenticationProvider.basic;
	const provider = resolveAndValidateProvider(t, [{ basic: [] }], BasicAuthentication);
	t.equal(provider.username, providerConfig.username, 'username is correct');
	t.equal(provider.password, providerConfig.password, 'password is correct');
	t.end();
});

test('HTTP basic provider - should apply basic auth header to request', t => {
	const username = CONFIG.authenticationProvider.basic.username;
	const password = CONFIG.authenticationProvider.basic.password;
	const provider = resolveAndValidateProvider(t, [{ basic: [] }], BasicAuthentication);

	const r = request.get('/test');
	provider.apply(r, function () {
		const authHeaderValue = r.get('Authorization');
		const buffer = new Buffer(`${username}:${password}`).toString('base64');
		t.equal(authHeaderValue, `Basic ${buffer}`);
		t.end();
	});
});

test('API key provider - should resolve configured api key authentication provider', t => {
	const providerConfig = CONFIG.authenticationProvider.api_key;
	const provider = resolveAndValidateProvider(t, [{ api_key: [] }], ApiKeyAuthentication);
	t.equal(provider.name, providerConfig.securityDefinition.name);
	t.equal(provider.value, providerConfig.value);
	t.equal(provider.type, providerConfig.securityDefinition.in);
	t.end();
});

test('API key provider - should apply api key as header field', t => {
	const provider = resolveAndValidateProvider(t, [{ api_key: [] }], ApiKeyAuthentication);
	// swagger petstore default is to add the api key as header field
	const r = request.get('/test');
	provider.apply(r, function () {
		const apiKeyHeaderValue = r.get(provider.name);
		t.ok(apiKeyHeaderValue);
		t.equal(apiKeyHeaderValue, provider.value);
		t.end();
	});
});

test('API key provider - should apply api key as query parameter', t => {
	const provider = resolveAndValidateProvider(t, [{ api_key: [] }], ApiKeyAuthentication);
	// change to query type to also test this case
	provider.type = 'query';

	const r = request.get('/test');
	provider.apply(r, function () {
		const queryArguments = r.qs;
		t.ok(queryArguments);
		t.deepEqual(queryArguments[provider.name], provider.value);
		t.end();
	});
});

test('Oauth2 provider - should resolve configured oauth2 provider', t => {
	const provider = resolveAndValidateProvider(t, [{ oauth_password: [] }], OauthAuthentication);
	const providerConfig = CONFIG.authenticationProvider.oauth_password;
	t.equal(provider.providerConfig, providerConfig);
	t.equal(provider.tokenUrl, providerConfig.securityDefinition.tokenUrl);
	t.equal(provider.flow, providerConfig.securityDefinition.flow);
	t.end();
});

test('Oauth2 provider - should apply bearer token with password flow', t => {
	const provider = resolveAndValidateProvider(t, [{ oauth_password: [] }], OauthAuthentication);

	const providerConfig = CONFIG.authenticationProvider.oauth_password;
	const testToken = '123456';
	nock('http://localhost')
		.post('/oauth/token', {
			grant_type: 'password',
			username: providerConfig.username,
			password: providerConfig.password,
			client_id: providerConfig.client_id,
			client_secret: providerConfig.client_secret
		})
		.reply(200, {
			access_token: testToken
		});

	const r = request.get('/test');
	provider.apply(r, function (err) {
		t.notOk(err);
		const authHeaderValue = r.get('Authorization');
		t.ok(authHeaderValue);
		t.equal(authHeaderValue, `Bearer ${testToken}`);
		t.end();
	});
});

test('Oauth2 provider - should apply bearer token with application flow', t => {
	const provider = resolveAndValidateProvider(t, [{ oauth_client: [] }], OauthAuthentication);

	const providerConfig = CONFIG.authenticationProvider.oauth_client;
	const testToken = '654321';
	nock('http://localhost')
		.post('/oauth/token', {
			grant_type: 'client_credentials',
			client_id: providerConfig.client_id,
			client_secret: providerConfig.client_secret
		})
		.reply(200, {
			access_token: testToken
		});

	const r = request.get('/test');
	provider.apply(r, function (err) {
		t.notOk(err);
		const authHeaderValue = r.get('Authorization');
		t.ok(authHeaderValue);
		t.equal(authHeaderValue, `Bearer ${testToken}`);
		t.end();
	});
});

test('Oauth2 provider - should use refresh token to request new access token', t => {
	const provider = resolveAndValidateProvider(t, [{ oauth_password: [] }], OauthAuthentication);
	resetOauthProvider(provider);
	const providerConfig = CONFIG.authenticationProvider.oauth_client;
	const testToken = '987654';

	// populate provider with expired mock token
	provider.token = {
		accessToken: '123456',
		expiryDate: new Date(),
		refreshToken: '654321'
	};

	nock('http://localhost')
		.post('/oauth/token', {
			grant_type: 'refresh_token',
			refresh_token: provider.token.refreshToken,
			client_id: providerConfig.client_id,
			client_secret: providerConfig.client_secret
		})
		.reply(200, {
			access_token: testToken
		});

	const r = request.get('/test');
	provider.apply(r, function (err) {
		t.notOk(err);
		const authHeaderValue = r.get('Authorization');
		t.ok(authHeaderValue);
		t.equal(authHeaderValue, `Bearer ${testToken}`);
		t.end();
	});
});

/**
 * Resolves a auth provider for the given security requirement and checks
 * if it's of the given provider type
 *
 * @param {Object} securityRequirement The security required used to resolve the provider
 * @param {Function} providerObjectType Provider object type used to type check the found provider
 * @return {Object} Found authentication provider instance
 */
function resolveAndValidateProvider(t, securityRequirement, providerObjectType) {
	const providers = auth.resolveAuthenticationProviders(CONNECTOR, securityRequirement);
	t.equal(providers.length, 1);
	const provider = providers[0];
	t.ok(provider instanceof providerObjectType, 'provider is of correct type');
	return provider;
}

/**
 * Resets an oauth provider by setting the token to null
 *
 * @param {OauthAuthentication} provider Oauth authentication provider
 */
function resetOauthProvider(provider) {
	provider.token = null;
}

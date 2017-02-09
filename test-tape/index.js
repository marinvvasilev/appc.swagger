const test = require('tape');
const tapSpec = require('tap-spec');
test.createStream()
	.pipe(tapSpec())
	.pipe(process.stdout);

const utils = require('./../lib/utility/utils');

test('### parseModelName() - should ignore first segment if version ###', t => {
	t.equal(utils.parseModelName('/v1/pet'), 'Pet');
	t.equal(utils.parseModelName('/v1.2/pet'), 'Pet');
	t.equal(utils.parseModelName('/2/pet'), 'Pet');
	t.equal(utils.parseModelName('/2.1/pet'), 'Pet');
	t.end();
});

test('### parseModelName() - should use first path segment if not version ###', t => {
	t.equal(utils.parseModelName('/order/status/{orderId}'), 'Order');
	t.end();
});

test('### parseModelName() - should strip periods and underscores, convert to UppercaseCamelCase ###', t => {
	t.equal(utils.parseModelName('appc.salesforce_AcceptedEventRelation'), 'AppcSalesforceAcceptedEventRelation');
	t.equal(utils.parseModelName('appc.arrowdb_acl'), 'AppcArrowdbAcl');
	t.end();
});

test('### parsePathVars() - should be able to parse out single path variable ###', t => {
	var pathVars = utils.parsePathVars('/order/status/{orderId}');
	t.equal(pathVars.length, 1);
	t.equal(pathVars[0], 'orderId');
	t.end();
});

test('### parsePathVars() - should be able to parse out multiple path variables ###', t => {
	var pathVars = utils.parsePathVars('/acs/{app_guid}/push_devices/{app_env}/unsubscribe');
	t.equal(pathVars.length, 2);
	t.equal(pathVars[0], 'app_guid');
	t.equal(pathVars[1], 'app_env');
	t.end();
});

test('### parseMethodName() - should be able to generate method name ###', t => {
	const options = {
		verbMap: {
			POST: 'create',
			GET: 'find',
			PUT: 'update',
			DELETE: 'delete'
		}
	};
	t.equal(utils.parseMethodName(options, 'GET', '/app'), 'findAll');
	t.equal(utils.parseMethodName({}, 'GET', '/app'), 'findAll');
	t.equal(utils.parseMethodName(options, 'POST', '/app'), 'create');
	t.equal(utils.parseMethodName({}, 'POST', '/app'), 'create');
	t.equal(utils.parseMethodName(options, 'GET', '/app/{id}'), 'findOne');
	t.equal(utils.parseMethodName({}, 'GET', '/app/{id}'), 'findOne');
	t.equal(utils.parseMethodName(options, 'POST', '/app/saveFromTiApp'), 'createSaveFromTiApp');
	t.equal(utils.parseMethodName({}, 'POST', '/app/saveFromTiApp'), 'createSaveFromTiApp');
	t.equal(utils.parseMethodName(options, 'PUT', '/app/{id}'), 'update');
	t.equal(utils.parseMethodName({}, 'PUT', '/app/{id}'), 'update');
	t.equal(utils.parseMethodName(options, 'GET', '/app/{app_guid}/module/{module_guid}/verification'), 'findModuleVerification');
	t.equal(utils.parseMethodName({}, 'GET', '/app/{app_guid}/module/{module_guid}/verification'), 'findModuleVerification');
	t.equal(utils.parseMethodName(options, 'DELETE', '/acs/{app_guid}/push_devices/{app_env}/unsubscribe'), 'deletePushDevicesUnsubscribe');
	t.equal(utils.parseMethodName({}, 'DELETE', '/acs/{app_guid}/push_devices/{app_env}/unsubscribe'), 'deletePushDevicesUnsubscribe');
	t.end();
});

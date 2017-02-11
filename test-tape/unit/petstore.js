const test = require('tape');
const serverFactory = require('../server');

var SERVER;
test('### START SERVER ###', function (t) {
	serverFactory(arrow => {
		t.ok(arrow, 'Arrow has been started');
		SERVER = arrow;
		t.end();
	});
});

test('### Could obtaind models from connector ###', t => {
	const connector = SERVER.getConnector('appc.swagger');
	const config = connector.config;
	const PetModel = connector.getModel('Pet');
	const OrderModel = connector.getModel('Order');
	t.ok(PetModel, 'Pet Model is available');
	t.ok(OrderModel, 'Order Model is available');
	t.end();
});

test('### Should be able to fetch metadata ###', t => {
	const connector = SERVER.getConnector('appc.swagger');
	const config = connector.config;
	connector.fetchMetadata(function (err, meta) {
		t.notOk(err, 'fetchMetadata execute successfully');
		t.ok(meta, 'fetchMetadata return meta information');
		t.ok(meta['fields'], 'meta information contains fields');
		t.end();
	});
});

test('### Should be able to find all instances ###', t => {
	const connector = SERVER.getConnector('appc.swagger');
	const config = connector.config;
	const PetModel = connector.getModel('Pet');
	PetModel.findPetsByStatus({ status: ['available'] }, (err, collection) => {
		t.ok(collection, 'collection with pets has been found');
		const id = collection[0].getPrimaryKey();
		t.ok(id, 'getPrimaryKey is available');
		PetModel.getPetById(id, (err, pet) => {
			t.notOk(err);
			t.equal(pet.getPrimaryKey(), id);
			t.end();
		});
	});
});

test('### Should throw TypeError if callback function is not passed to API method call ###', t => {
	const connector = SERVER.getConnector('appc.swagger');
	const config = connector.config;
	t.throws(invokeWithoutCallback, 'findPetsByStatus throws without callback');
	t.end();
	function invokeWithoutCallback() {
		const PetModel = connector.getModel('Pet');
		PetModel.findPetsByStatus({ status: ['available'] });
	};
});

test('### STOP SERVER ###', function (t) {
	SERVER.stop(function () {
		t.pass('Arrow has been stopped!');
		t.end();
	});
});

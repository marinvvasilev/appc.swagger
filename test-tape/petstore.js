const test = require('tape');

module.exports = function (server) {
	const connector = server.getConnector('appc.swagger');
	const config = connector.config;

	test('### Could obtaind models from connector ###', t => {
		const PetModel = connector.getModel('Pet');
		const OrderModel = connector.getModel('Order');
		t.ok(PetModel, 'Pet Model is available');
		t.ok(OrderModel, 'Order Model is available');
		t.end();
	});

	test('### Should be able to fetch metadata ###', t => {
		connector.fetchMetadata(function (err, meta) {
			t.notOk(err, 'fetchMetadata execute successfully');
			t.ok(meta, 'fetchMetadata return meta information');
			t.ok(meta['fields'], 'meta information contains fields');
			t.end();
		});
	});

	test('### Should be able to find all instances ###', t => {
		const PetModel = connector.getModel('Pet');
		PetModel.findPetsByStatus({ status: ['available'] }, (err, collection) => {
			t.ok(collection);
			t.end();
			// should.ifError(err);

			// if (collection.length <= 0) {
			// 	return next();
			// }
			// var first = collection[0];
			// should(first.getPrimaryKey()).be.ok;

			// PetModel.getPetById(first.getPrimaryKey(), function (err, pet) {
			// 	should(err).be.not.ok;
			// 	should.equal(pet.getPrimaryKey(), first.getPrimaryKey());
			// 	next();
			// });
		});

	});

	test('### Should throw TypeError if callback function is not passed to API method call ###', t => {
		t.throws(invokeWithoutCallback, 'findPetsByStatus throws without callback');
		t.end();
		function invokeWithoutCallback() {
			const PetModel = connector.getModel('Pet');
			PetModel.findPetsByStatus({ status: ['available'] });
		};
	});

}

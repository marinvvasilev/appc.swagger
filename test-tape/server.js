const Arrow = require ('arrow');
module.exports = function(callback, options) {
	const config = options || {};
    const server = new Arrow();	
    server.start(() => {
		callback(server);
	});
}

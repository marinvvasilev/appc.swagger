const Arrow = require ('arrow');
module.exports = function(callback, options) {
	const config = options || {};
    const server = new Arrow();	
    server.start(() => {
		console.log('Server has been started!');
		callback(server);
	});
}

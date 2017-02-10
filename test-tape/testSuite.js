module.exports = function(server) {
	require('./utils')(server);
	require('./petstore')(server);
	server.stop(() => {
		console.log('Server has been stopped!');
	})
}

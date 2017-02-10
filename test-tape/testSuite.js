module.exports = function(server) {
	require('./utils')(server);
	server.stop(() => {
		console.log('Server has been stopped!');
	})
}

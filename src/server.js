const Hapi = require('hapi');

// Create the Hapi Web Server
const server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: '@@PORT'
});

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }

  console.log('Server running at:', server.info.uri);
});

const io = require('socket.io')(server.listener);

module.exports.hapi = server;
module.exports.io = io;

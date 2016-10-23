const Hapi = require('hapi');

// Create the Hapi Web Server
const server = new Hapi.Server({
  connections: {
    routes: {
      files: {
        relativeTo: require('path').join(__dirname)
      }
    }
  }
});

server.connection({
  host: 'localhost',
  port: '@@PORT',
});

server.register(require('inert'), () => {});

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

'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');
const YoutubeApi = require('./youtubeapi');
const Hapi = require('hapi');

// Create the Hapi Web Server
const server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: 9000
});

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }

  console.log('Server running at:', server.info.uri);
});

const AUTH_WINDOW = 'auth';
const MAIN_WINDOW = 'main';

const io = require('socket.io')(server.listener);

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let windows = {};

function onClosed(windowName) {
  // dereference the window
  windows[windowName] = null;
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 700
  });

  win.loadUrl('file://' + __dirname + '/client/index.html');
  win.on('closed', onClosed.bind(MAIN_WINDOW));

  return win;
}

function createLogInWindow(url) {
  const win = new BrowserWindow({
    width: 500,
    height: 600
  });

  win.loadUrl(url);
  win.on('closed', onClosed.bind('auth'));

  return win;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate-with-no-open-windows', () => {
  if (!windows[MAIN_WINDOW]) {
    windows[MAIN_WINDOW] = createMainWindow();
  }
});

app.on('ready', () => {
  windows[MAIN_WINDOW] = createMainWindow();

  io.on('connection', (socket) => {
    YoutubeApi.tryStoredAccessToken((noValidAccessToken, token) => {
      if (noValidAccessToken) {
        socket.emit('youtube/notauthenticated');
      } else {
        socket.emit('youtube/callback', token);
      }
    });

    socket.on('youtube/auth', () => {
      socket.emit('youtube/waiting');

      YoutubeApi.getAuthUrl((url) => {
        socket.emit('youtube/waitingforuser')
        windows[AUTH_WINDOW] = createLogInWindow(url);
      });
    });

    socket.on('subscriptions/list', () => {
      YoutubeApi.getSubscriptions((err, subscriptions) => {
        if (err) {
          console.log(err);
        } else {
          socket.emit('subscriptions/list', subscriptions);
        }
      });
    });
  });

  server.route({
    method: 'GET',
    path:'/youtube/callback',
    handler: function (request, reply) {
      io.emit('youtube/waiting');
      YoutubeApi.getToken(request.query.code, function (token) {
        io.emit('youtube/callback', token);

        windows[AUTH_WINDOW].close();
      });
    }
  });
});

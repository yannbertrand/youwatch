'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');
const YoutubeApi = require('./youtubeapi');
const Hapi = require('hapi');

// Launch an Hapi Web Server
const server = new Hapi.Server();

server.connection({ 
  host: 'localhost', 
  port: 9000 
});

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;

function onClosed() {
  // dereference the window
  // for multiple windows store them in an array
  mainWindow = null;
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 700
  });

  win.loadUrl('file://' + __dirname + '/client/index.html');
  win.on('closed', onClosed);

  return win;
}

function createLogInWindow(url) {
  const win = new BrowserWindow({
    width: 500,
    height: 600
  })

  win.loadUrl(url);
  win.on('closed', onClosed);

  return win;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate-with-no-open-windows', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow();
  }
});

app.on('ready', () => {
  YoutubeApi.getAuthUrl((url) => {
    mainWindow = createLogInWindow(url);
  });

  server.route({
    method: 'GET',
    path:'/hello',
    handler: function (request, reply) {
      reply('Redirecting you to the app!');

      mainWindow.close();

      YoutubeApi.getToken(request.query.code, function () {
        mainWindow = createMainWindow();
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/plus',
    handler: function (request, reply) {
      YoutubeApi.getPlusPeople(function(err, profile) {
        if (err) {
          console.log('An error occured', err);
          return;
        }
        reply(profile.displayName, ':', profile.tagline)
      });
    }
  });

  // Start the server
  server.start((err) => {
    if (err) {
      throw err;
    }

    console.log('Server running at:', server.info.uri);
  });
});

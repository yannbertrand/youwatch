'use strict';

const CONFIG = require('./config');

const app = require('app');
const BrowserWindow = require('browser-window');

const YoutubeApi = require('./youtubeapi');

const Hapi = require('hapi');
const isOnline = require('is-online');

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
    width: CONFIG.MAIN_WINDOW.WIDTH,
    height: CONFIG.MAIN_WINDOW.HEIGHT
  });

  win.loadUrl('file://' + __dirname + '/client/index.html');
  win.on('closed', onClosed.bind(MAIN_WINDOW));

  return win;
}

function createLogInWindow(url) {
  const win = new BrowserWindow({
    width: CONFIG.AUTH_WINDOW.WIDTH,
    height: CONFIG.AUTH_WINDOW.HEIGHT
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

    socket.on('video/cue', (video) => {
      console.log('Cueing video: ', video.id);
      if (!Object.keys(currentPlaylist).length)
        socket.emit('video/cue', video.id);

      if (!currentPlaylist[video.id]) {
        currentPlaylist[video.id] = video;
      }

      socket.emit('playlist/update', currentPlaylist);
    });

    socket.on('video/play', (video) => {
      console.log('Play video: ', video.id);

      socket.emit('video/play', video.id);
    });

    socket.on('video/start', (id) => {
      console.log('Video started: ', id);
      isVideoPlaying = true;
    });

    socket.on('video/pause', (id) => {
      console.log('Video paused: ', id);
    });

    socket.on('video/buffer', (id) => {
      console.log('Video buffering: ', id);
    });

    socket.on('video/end', (id) => {
      console.log('Video ended: ', id);
      isVideoPlaying = false;
      delete currentPlaylist[id];
      socket.emit('playlist/update', currentPlaylist);

      let playlistVideosIds = Object.keys(currentPlaylist);
      if (!playlistVideosIds.length) return;
      let newVideoId = playlistVideosIds[0];

      socket.emit('video/play', newVideoId);
    });

    function launchApp() {
      if (isOnline((err, online) => {
        if (err || !online) {
          return socket.emit('internet/notconnected');
        }
        
        YoutubeApi.tryStoredAccessToken((noValidAccessToken, token) => {
          if (noValidAccessToken) {
            socket.emit('youtube/notauthenticated');
          } else {
            socket.emit('youtube/callback', token);
          }
        });
      }));
    }

    socket.on('internet/reconnect', launchApp);

    let currentPlaylist = {};
    let isVideoPlaying = false;
    launchApp();
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

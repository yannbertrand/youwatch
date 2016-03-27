'use strict';

const CONFIG = require('./config');

const app = require('app');
const BrowserWindow = require('browser-window');

const YoutubeApi = require('./youtubeapi');

const Hapi = require('hapi');
const isOnline = require('is-online');
const youtubeRegex = require('youtube-regex');

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
          console.error(err);
        } else {
          socket.emit('subscriptions/list', subscriptions);
        }
      });
    });

    // Video
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

    function playVideo(video) {
      console.log('Play video: ', video.id);

      playlist.playNow(video);
      socket.emit('playlist/update', playlist);

      if (isVideoPlaying)
        socket.emit('video/play', video.id);
      else
        socket.emit('video/cue', video.id);
    }

    /* This method is called to play a video immediately */
    socket.on('video/play', playVideo);

    /* Put a video on the end of the playlist */
    socket.on('video/cue', (video) => {
      console.log('Cueing video: ', video.id);
      if (!playlist.length)
        socket.emit('video/cue', video.id);

      if (!playlist.contains(video.id)) {
        console.log('Pushing a video into the playlist (' + video.id + ')');
        playlist.push(video);
        socket.emit('playlist/update', playlist);
      }
    });

    /* Set a video as next to play */
    socket.on('video/next', (video) => {
      console.log('Set next video: ', video.id);
      if (!playlist.length)
        socket.emit('video/cue', video.id);

      if (!playlist.contains(video.id)) {
        playlist.setNext(video);
      }

      socket.emit('playlist/update', playlist);
    });

    /* When something is pasted, if it is a YouTube video, play it */
    socket.on('video/paste', (text) => {
      if (!youtubeRegex().test(text))
        return;

      let videoId = youtubeRegex().exec(text)[1];
      YoutubeApi.getVideo(videoId, function (err, theVideo) {
        if (err) return;
        playVideo(theVideo);
      });
    });

    socket.on('video/end', (id) => {
      console.log('Video ended: ', id);
      isVideoPlaying = false;
      playlist.remove(id);
      socket.emit('playlist/update', playlist);

      if (!playlist.length) return;

      socket.emit('video/play', playlist[0].id);
    });

    function isVideoInPlaylist(videoId) {
      return ~concoctPlaylistVideoIds().indexOf(videoId);
    }

    // === _.pluck(playlist, 'id')
    function concoctPlaylistVideoIds() {
      let playlistVideosIds = [];

      for (let video of playlist)
        playlistVideosIds.push(video.id);

      return playlistVideosIds;
    }

    function removeVideoFromPlaylist(videoId) {
      if (!playlist.contains(videoId)) return;

      playlist.splice(playlist.concoctVideoIds().indexOf(videoId), 1);
    }

    function playVideoNow(video) {
      if (playlist.contains(video.id))
        playlist.remove(video.id);
      playlist.splice(0, 0, video);
    }

    function setNextVideoInPlaylist(video) {
      if (playlist.length)
        playlist.splice(1, 0, video);
      else
        playlist.push(video);
    }

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

    let playlist = [];
    playlist.concoctVideoIds = concoctPlaylistVideoIds;
    playlist.remove = removeVideoFromPlaylist;
    playlist.contains = isVideoInPlaylist;
    playlist.playNow = playVideoNow;
    playlist.setNext = setNextVideoInPlaylist;

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

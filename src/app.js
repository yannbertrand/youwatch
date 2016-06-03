'use strict';

const CONFIG = require('./config');

const Configstore = require('configstore');
const async = require('async');
const google = require('googleapis');
const electron = require('electron');
const app = electron.app;


const YoutubeApi = require('./youtubeapi')(Configstore, async, google, CONFIG);
const Windows = require('./windows')(electron, CONFIG);
const server = require('./server');
const database = require('./database');

const isOnline = require('is-online');
const youtubeRegex = require('youtube-regex');

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  Windows.openMainWindow();

  server.io.on('connection', (socket) => {
    socket.on('internet/reconnect', launchApp);

    let subscriptions = [];
    let playlist = require('./playlist');

    let videoPlaying = null;
    launchApp();

    socket.on('youtube/auth', () => {
      socket.emit('youtube/waiting');

      YoutubeApi.getAuthUrl((url) => {
        socket.emit('youtube/waitingforuser');
        Windows.openLogInWindow(url);
      });
    });

    socket.on('subscriptions/list', () => {
      if (subscriptions.length)
        return socket.emit('subscriptions/list', subscriptions);
      
      YoutubeApi.getSubscriptions((err, _subscriptions) => {
        if (err) {
          console.error(err);
        } else {
          subscriptions = _subscriptions;
          socket.emit('subscriptions/list', subscriptions);
        }
      });
    });

    // Video
    socket.on('video/start', (id) => {
      console.log('Video started: ', id);
      videoPlaying = id;
    });

    socket.on('video/pause', (id) => {
      console.log('Video paused: ', id);
    });

    socket.on('video/buffer', (id) => {
      console.log('Video buffering: ', id);
    });

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

    socket.on('video/remove', (id) => {
      console.log('Remove video: ', id);
      removeVideo(id);
    })

    socket.on('video/end', (id) => {
      console.log('Video ended: ', id);
      removeVideo(id);
      playNextVideo();
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

    function playVideo(video) {
      console.log('Play video: ', video.id);

      playlist.playNow(video);
      socket.emit('playlist/update', playlist);

      if (videoPlaying) {
        socket.emit('video/play', video.id);
      }
      else
        socket.emit('video/cue', video.id);
    }

    function playNextVideo() {
      if (!playlist.length) {
        videoPlaying = null;
        return;
      }

      if (videoPlaying === playlist[0].id) return;

      socket.emit('video/play', playlist[0].id);
      videoPlaying = playlist[0].id;
    }

    function removeVideo(id) {
      playlist.remove(id);
      socket.emit('video/remove');
      socket.emit('playlist/update', playlist);
    }
  });

  server.hapi.route({
    method: 'GET',
    path:'/youtube/callback',
    handler: function (request, reply) {
      server.io.emit('youtube/waiting');
      YoutubeApi.getToken(request.query.code, function (token) {
        server.io.emit('youtube/callback', token);

        Windows.closeLogInWindow();
      });
    }
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  Windows.activateWithNoOpenWindows();
});

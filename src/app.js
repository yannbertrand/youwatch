'use strict';

const electron = require('electron');
const app = electron.app;

const VideoManager = require('./videomanager');
const YoutubeApi = require('./youtubeapi');
const Windows = require('./windows')(electron);

const server = require('./server');

const youtubeRegex = require('youtube-regex');

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  Windows.openMainWindow();

  VideoManager.refresh();

  server.io.on('connection', (socket) => {
    let subscriptions = [];

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
      
      // YoutubeApi.refreshSubscriptions((errSub, newSubscriptions, allSubscriptions) => {
      //   console.log(errSub, newSubscriptions.length);
      //   YoutubeApi.refreshChannels(allSubscriptions, (errChan, newChannels, updatedChannels) => {
      //     console.log(errChan, newChannels.length, updatedChannels.length);
          YoutubeApi.findAllChannels((errChan2, channels) => {
            console.log(errChan2, channels.length);
            let uploadsPlaylists = channels.map(channel => channel.relatedPlaylists.uploads);
            YoutubeApi.refreshPlaylistItems(uploadsPlaylists, (errPI, createdPlaylistItems, updatedPlaylistItems) => {
              console.log(errPI, createdPlaylistItems);
            });
          });
      //   });
      // });

      // YoutubeApi.getSubscriptions((err, _subscriptions) => {
      //   if (err) {
      //     console.error(err);
      //   } else {
      //     subscriptions = _subscriptions;
      //     socket.emit('subscriptions/list', subscriptions);
      //   }
      // });
    });

    // Video
    socket.on('video/start', (id) => {
      console.log('Video started: ', id);
    });

    socket.on('video/pause', (id) => {
      console.log('Video paused: ', id);
    });

    socket.on('video/buffer', (id) => {
      console.log('Video buffering: ', id);
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

    socket.on('app/authenticate', () => {
      YoutubeApi.tryStoredAccessToken((noValidAccessToken, token) => {
        if (noValidAccessToken) {
          socket.emit('youtube/notauthenticated');
        } else {
          socket.emit('youtube/callback', token);
        }
      });
    });
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

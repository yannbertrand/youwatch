'use strict';

const { app, shell, ipcMain } = require('electron');
const youtubeRegex = require('youtube-regex');

const VideoManager = require('./videomanager');
const YoutubeApi = require('./youtubeapi');
const Windows = require('./windows');
const server = require('./server');



// Adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  Windows.openMainWindow();
  VideoManager.refresh();

  let subscriptions = [];

  ipcMain.on('handshake', (event) => {
    server.hapi.route({
      method: 'GET',
      path:'/youtube/callback',
      handler: (request, reply) => {
        event.sender.send('youtube/waiting');
        YoutubeApi.getToken(request.query.code, (err, token) => {
          if (err) {
            event.sender.send('youtube/callbackerror', err);
            return;
          }

          event.sender.send('youtube/callback', token);
          return reply.file(require('path').join('client/authenticated.html'));
        });
      },
    });
  });

  ipcMain.on('youtube/auth', (event) => {
    event.sender.send('youtube/waiting');

    YoutubeApi.getAuthUrl((url) => {
      event.sender.send('youtube/waitingforuser');

      shell.openExternal(url);
    });
  });

  ipcMain.on('subscriptions/list', (event) => {
    if (subscriptions.length > 0)
      return event.sender.send('subscriptions/list', subscriptions);

    YoutubeApi.getSubscriptions((err, _subscriptions) => {
      if (err) {
        console.error(err);
      } else {
        subscriptions = _subscriptions;
        event.sender.send('subscriptions/list', subscriptions);
      }
    });
  });

  // Video
  ipcMain.on('video/start', (event, id) => {
    console.log('Video started: ', id);
  });

  ipcMain.on('video/pause', (event, id) => {
    console.log('Video paused: ', id);
  });

  ipcMain.on('video/buffer', (event, id) => {
    console.log('Video buffering: ', id);
  });

  /* When something is pasted, if it is a YouTube video, play it */
  ipcMain.on('video/paste', (event, text) => {
    if (!youtubeRegex().test(text))
      return;

    const videoId = youtubeRegex().exec(text)[1];
    YoutubeApi.getVideo(videoId, (/* err, theVideo */) => {
      // ToDo
    });
  });

  ipcMain.on('app/authenticate', (event) => {
    YoutubeApi.tryStoredAccessToken((noValidAccessToken, token) => {
      if (noValidAccessToken) {
        event.sender.send('youtube/notauthenticated');
      } else {
        event.sender.send('youtube/callback', token);
      }
    });
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

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  Windows.openMainWindow();
});

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

      async.waterfall([

        call.bind(this, YoutubeApi.refreshSubscriptions, [' new subscriptions']),
        forgetParameters,

        call.bind(this, YoutubeApi.findAllSubscriptions, [' subscriptions found']),

        call.bind(this, YoutubeApi.refreshChannels, [' created channels', ' updated channels']),
        forgetParameters,

        call.bind(this, YoutubeApi.findAllChannels, [' channels found']),

        prepareUploadsPlaylists,
        call.bind(this, YoutubeApi.refreshPlaylistItems, [' created playlist items']),

      ], function (err) {
        if (err)
          return console.error('Error', err);

        console.log('Done');
      });

      function prepareUploadsPlaylists(channels, next) {
        next(null, channels.map(channel => channel.relatedPlaylists.uploads));
      }

      function call() {
        let messages = arguments[1];
        let callback = arguments[arguments.length - 1];
        let _arguments = [];

        if (arguments.length === 4)
          _arguments.push(arguments[2]);

        _arguments.push(logResult);

        arguments[0].apply(null, _arguments);

        function logResult() {
          Array.prototype.splice.call(arguments, 0, 1, ...messages);
          Array.prototype.push.call(arguments, callback);

          log.apply(null, arguments);
        }
      }

      function forgetParameters() {
        return arguments[arguments.length - 1]();
      }

      function log() {
        switch (arguments.length) {
          case 3:
            console.log(arguments[1].length + arguments[0]);

            return arguments[2](null, arguments[1]);
          case 5:
            console.log(arguments[2].length + arguments[0]);
            console.log(arguments[3].length + arguments[1]);

            return arguments[4](null, arguments[2], arguments[3]);
          default:
            console.error('not implemented');
        }
      }

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

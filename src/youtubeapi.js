const CONFIG = require('./config');

const Configstore = require('configstore');

const async = require('async');
const google = require('googleapis');
const OAuth2Client = google.auth.OAuth2;

const oauth2Client = new OAuth2Client(
  CONFIG.CREDENTIALS.CLIENT_ID,
  CONFIG.CREDENTIALS.CLIENT_SECRET,
  'http://localhost:@@PORT/youtube/callback' // redirect url
);

const configStore = new Configstore('YouWatch');

// Check if the stored access token (if existing) is still working
module.exports.tryStoredAccessToken = function (cb) {
  if(!configStore.get('tokens')) {
    return cb(true);
  }

  oauth2Client.setCredentials(configStore.get('tokens'));

  google.youtube('v3').subscriptions.list({
    part: 'id',
    mine: true,
    auth: oauth2Client
  }, function (err, response) {
    if (err) return cb(true);

    // Refresh the access token
    oauth2Client.refreshAccessToken(function (err, newTokens) {
      if (err) return cb(true);

      configStore.set('tokens', newTokens);

      return cb(false, newTokens);
    });
  });
};

// retrieve the auth page url
module.exports.getAuthUrl = function (cb) {
  // generate consent page url
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    // approval_prompt : 'force',
    scope: 'https://www.googleapis.com/auth/youtube.readonly' // can be a space-delimited string or an array of scopes
  });

  return cb(url);
};

// retrieve an access token
module.exports.getToken = function (code, cb) {
  // request access token
  oauth2Client.getToken(code, function(err, tokens) {
    if (!err) {
      configStore.set('tokens', tokens);
      oauth2Client.setCredentials(tokens);
      cb(tokens);
    }
  });
};

module.exports.getVideo = function (videoId, cb) {
  google.youtube('v3').videos.list({
    part: 'id, snippet',
    id: videoId,
    auth: oauth2Client
  }, function (err, videoPage) {
    if (err) {
      console.log('Error when trying to get a video', err);
      return cb(err);
    }
    if (!videoPage.pageInfo.totalResults) {
      console.log('Video not found');
      return cb(404);
    }

    cb(null, {
      id: videoPage.items[0].id,
      thumbnail: videoPage.items[0].snippet.thumbnails.high.url,
      title: videoPage.items[0].snippet.title,
      channel: videoPage.items[0].snippet.channelTitle,
      publishedAt: new Date(videoPage.items[0].snippet.publishedAt)
    });
  });
};

module.exports.getSubscriptions = function (cb) {
  async.auto({

    getSubscriptions: function (next) {
      var subscriptions = [];
      var nextPageToken = true;
      var i = 1;

      async.whilst(
        () => nextPageToken,
        function (nextPage) {
          google.youtube('v3').subscriptions.list({
            part: 'id, snippet',
            mine: true,
            maxResults: 50,
            order: 'alphabetical',
            pageToken: nextPageToken || null,
            auth: oauth2Client
          }, function (err, aSubscriptionsPage) {
            if (err) {
              console.log('Error when trying to find a subscription page');
              return nextPage(); // In fact retrying the same page
            }

            nextPageToken = aSubscriptionsPage.nextPageToken || false;
            subscriptions = subscriptions.concat(aSubscriptionsPage.items);
            nextPage(null, subscriptions);
          });
        },
        function (err, allSubscriptions) {
            if (err) return next(err);
            next(null, allSubscriptions);
        }
      );
    },

    getChannelDetails: ['getSubscriptions', function (next, results) {
      var channelsDetails = [];

      async.each(results['getSubscriptions'], function (subscription, nextSubscription) {
        google.youtube('v3').channels.list({
          part: 'id, contentDetails',
          id: subscription.snippet.resourceId.channelId,
          auth: oauth2Client
        }, function (err, channelDetails) {
          if (err) {
            console.log('Error when trying to get channel ' + subscription.snippet.resourceId.channelId, err);
            return nextSubscription();
          }

          if (channelDetails)
            channelsDetails.push(channelDetails);

          nextSubscription();
        });
      }, function (err) {
        next(err, channelsDetails);
      });
    }],

    getLastUploadedVideos: ['getChannelDetails', function (next, results) {
      var lastUploadedVideos = [];

      async.each(results['getChannelDetails'], function (channel, nextChannel) {
        if (channel.pageInfo.totalResults <= 0) return nextChannel();

        google.youtube('v3').playlistItems.list({
          part: 'id, snippet, contentDetails',
          playlistId: channel.items[0].contentDetails.relatedPlaylists.uploads,
          auth: oauth2Client
        }, function (err, lastUploadedVideosFromChannel) {
          if (err) {
            console.log('Error when trying to find playlist ' + channel.items[0].contentDetails.relatedPlaylists.uploads + ' from channel ' + channel.items[0].id, err);
            return nextChannel();
          }

          lastUploadedVideosFromChannel = lastUploadedVideosFromChannel.items.map(uploadedVideoFromChannel => {
            return {
              id: uploadedVideoFromChannel.contentDetails.videoId,
              thumbnail: uploadedVideoFromChannel.snippet.thumbnails.medium.url,
              title: uploadedVideoFromChannel.snippet.title,
              channel: uploadedVideoFromChannel.snippet.channelTitle,
              publishedAt: new Date(uploadedVideoFromChannel.snippet.publishedAt)
            };
          });
          
          lastUploadedVideos = lastUploadedVideos.concat(lastUploadedVideosFromChannel);
          nextChannel();
        });
      }, function (err) {
        next(err, lastUploadedVideos);
      });
    }],

    orderLastUploadedVideos: ['getLastUploadedVideos', function (next, results) {
      next(null, results['getLastUploadedVideos'].sort((firstVideo, secondVideo) => {
        return secondVideo.publishedAt.getTime() - firstVideo.publishedAt.getTime();
      }));
    }]

  }, function (err, results) {
    if (err) return cb(err);

    cb(null, results['orderLastUploadedVideos']);
  });
};

const credentials = require('./credentials');
const Configstore = require('configstore');

const async = require('async');
const google = require('googleapis');
const OAuth2Client = google.auth.OAuth2;

const REDIRECT_URL = 'http://localhost:9000/youtube/callback';
const oauth2Client = new OAuth2Client(credentials.CLIENT_ID, credentials.CLIENT_SECRET, REDIRECT_URL);

const conf = new Configstore('YouWatch');

// Check if the stored access token (if existing) is still working
module.exports.tryStoredAccessToken = function (cb) {
  if(!conf.get('tokens')) {
    return cb(true);
  }

  oauth2Client.setCredentials(conf.get('tokens'));

  google.youtube('v3').subscriptions.list({
    part: 'id',
    mine: true,
    auth: oauth2Client
  }, function (err, response) {
    if (err) return cb(true);

    // Refresh the access token
    oauth2Client.refreshAccessToken(function (err, newTokens) {
      if (err) return cb(true);

      conf.set('tokens', newTokens);

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
      conf.set('tokens', tokens);
      cb(tokens);
    }
  });
};

module.exports.getSubscriptions = function (cb) {
  async.auto({

    getASubscriptionsPage: function (next) {
      google.youtube('v3').subscriptions.list({
        part: 'id, snippet',
        mine: true,
        maxResults: 50,
        order: 'alphabetical',
        auth: oauth2Client
      }, function (err, subscriptionsPage) {
        if (err) return next(err);
        next(null, subscriptionsPage.items);
      });
    },

    getChannelDetails: ['getASubscriptionsPage', function (next, results) {
      var channelsDetails = [];

      async.each(results['getASubscriptionsPage'], function (subscription, nextSubscription) {
        google.youtube('v3').channels.list({
          part: 'id, contentDetails',
          id: subscription.snippet.resourceId.channelId,
          auth: oauth2Client
        }, function (err, channelDetails) {
          if (err) return nextSubscription(err);

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
          part: 'id, snippet',
          playlistId: channel.items[0].contentDetails.relatedPlaylists.uploads,
          auth: oauth2Client
        }, function (err, lastUploadedVideosFromChannel) {
          if (err) return nextChannel(err);

          lastUploadedVideosFromChannel = lastUploadedVideosFromChannel.items.map(uploadedVideoFromChannel => {
            return {
              id: uploadedVideoFromChannel.id,
              thumbnail: uploadedVideoFromChannel.snippet.thumbnails.high.url,
              title: uploadedVideoFromChannel.snippet.title,
              channel: uploadedVideoFromChannel.snippet.channelTitle
            };
          });
          
          // ToDo: Order the videos by desc date
          lastUploadedVideos = lastUploadedVideos.concat(lastUploadedVideosFromChannel);
          nextChannel();
        });
      }, function (err) {
        next(err, lastUploadedVideos);
      });
    }]

  }, function (err, results) {
    if (err) return cb(err);

    cb(null, results['getLastUploadedVideos']);
  });
};

const Configstore = require('configstore');
const async = require('async');
const Google = require('googleapis');

const CONFIG = require('./config');

const configStore = new Configstore('YouWatch');
const YouTube = Google.youtube('v3');
const oauth2Client = new Google.auth.OAuth2(
  CONFIG.CREDENTIALS.CLIENT_ID,
  CONFIG.CREDENTIALS.CLIENT_SECRET,
  'http://localhost:@@PORT/youtube/callback' // redirect url
);

module.exports = {
  tryStoredAccessToken,
  getAuthUrl,
  getToken,
  getVideo,
  getSubscriptions,
};

// Check if the stored access token (if existing) is still working
function tryStoredAccessToken(cb) {
  if(!configStore.get('tokens')) {
    return cb(true);
  }

  oauth2Client.setCredentials(configStore.get('tokens'));

  YouTube.subscriptions.list({
    part: 'id',
    mine: true,
    auth: oauth2Client,
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
function getAuthUrl(cb) {
  // generate consent page url
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    // approval_prompt : 'force',
    scope: 'https://www.googleapis.com/auth/youtube.readonly', // can be a space-delimited string or an array of scopes
  });

  return cb(url);
};

// retrieve an access token
function getToken(code, cb) {
  // request access token
  oauth2Client.getToken(code, function(err, tokens) {
    if (!err) {
      configStore.set('tokens', tokens);
      oauth2Client.setCredentials(tokens);
      cb(tokens);
    }
  });
};

function getVideo(videoId, cb) {
  YouTube.videos.list({
    part: 'id, snippet',
    id: videoId,
    auth: oauth2Client,
  }, function (err, videoPage) {
    if (err) {
      console.log('Error while trying to get a video', err);
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

function getSubscriptions(cb) {
  async.auto({

    getSubscriptions: function (next) {
      var subscriptions = [];
      var nextPageToken = true;
      var i = 1;

      async.whilst(
        () => nextPageToken,
        function (nextPage) {
          YouTube.subscriptions.list({
            part: 'id, snippet',
            mine: true,
            maxResults: 50,
            order: 'alphabetical',
            pageToken: nextPageToken || null,
            auth: oauth2Client,
          }, function (err, aSubscriptionsPage) {
            if (err) {
              console.log('Error while trying to find a subscription page');
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

    getChannelDetails: ['getSubscriptions', function (results, next) {
      var channelsDetails = [];

      async.each(results['getSubscriptions'], function (subscription, nextSubscription) {
        YouTube.channels.list({
          part: 'id, contentDetails',
          id: subscription.snippet.resourceId.channelId,
          auth: oauth2Client,
        }, function (err, channelDetails) {
          if (err) {
            console.log('Error while trying to get channel ' + subscription.snippet.resourceId.channelId, err);
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

    getLastUploadedVideos: ['getChannelDetails', function (results, next) {
      var videosIds = [];

      async.each(results['getChannelDetails'], function (channel, nextChannel) {
        if (channel.pageInfo.totalResults <= 0) return nextChannel();

        YouTube.playlistItems.list({
          part: 'id, contentDetails',
          playlistId: channel.items[0].contentDetails.relatedPlaylists.uploads,
          auth: oauth2Client,
        }, function (err, lastUploadedVideosFromChannel) {
          if (err) {
            console.log('Error while trying to find playlist ' + channel.items[0].contentDetails.relatedPlaylists.uploads + ' from channel ' + channel.items[0].id, err);
            return nextChannel();
          }

          videosIds = videosIds.concat(
            lastUploadedVideosFromChannel.items.map(uploadedVideoFromChannel => {
              return uploadedVideoFromChannel.contentDetails.videoId;
            })
          );
          
          nextChannel();
        });
      }, function (err) {
        next(err, videosIds);
      });
    }],

    constructVideosIdsStrings: ['getLastUploadedVideos', function (results, next) {
      let counter = 0;
      let idList = [];
      let currentIds = '';

      for (let videoId of results['getLastUploadedVideos']) {
        currentIds += (counter? ', ' : '') + videoId;

        if (++counter === 50) {
          idList.push(currentIds);
          currentIds = '';
          counter = 0;
        }
      }

      if (counter) {
        idList.push(currentIds);
      }

      return next(null, idList);
    }],

    getVideosDetails: ['constructVideosIdsStrings', function (results, next) {
      let videosDetails = [];
      async.each(results['constructVideosIdsStrings'], function (ids, nextIds) {
        YouTube.videos.list({
          part: 'id, snippet, contentDetails',
          id: ids,
          auth: oauth2Client,
        }, function (err, videos) {
          if (err) {
            console.log('Error while trying to find videos', err);
            return nextIds();
          }

          videosDetails = videosDetails.concat(
            videos.items.map(video => {
              return {
                id: video.id,
                duration: iso8601ToStringDuration(video.contentDetails.duration),
                thumbnail: video.snippet.thumbnails.medium.url,
                title: video.snippet.title,
                channel: video.snippet.channelTitle,
                publishedAt: new Date(video.snippet.publishedAt)
              }
            })
          );

          return nextIds();
        });
      }, function (err) {
        next(err, videosDetails);
      });

    }],

    orderLastUploadedVideos: ['getVideosDetails', function (results, next) {
      next(null, results['getVideosDetails'].sort((firstVideo, secondVideo) => {
        return secondVideo.publishedAt.getTime() - firstVideo.publishedAt.getTime();
      }));
    }]

  }, function (err, results) {
    if (err) return cb(err);

    cb(null, results['orderLastUploadedVideos']);
  });
};



function iso8601ToStringDuration(rawDuration) {
  return constructDurationString(parse(rawDuration));

  // From ISO8601-duration npm
  // https://github.com/tolu/ISO8601-duration/blob/master/src/index.js
  function parse(durationString) {
    const numbers = '\\d+(?:[\\.,]\\d{0,3})?';
    const weekPattern = `(${numbers}W)`;
    const datePattern = `(${numbers}Y)?(${numbers}M)?(${numbers}D)?`;
    const timePattern = `T(${numbers}H)?(${numbers}M)?(${numbers}S)?`;

    const iso8601 = `P(?:${weekPattern}|${datePattern}(?:${timePattern})?)`;
    const pattern = new RegExp(iso8601);
    const objMap = ['weeks', 'years', 'months', 'days', 'hours', 'minutes', 'seconds'];

    return durationString.match(pattern).slice(1).reduce((prev, next, idx) => {
      prev[objMap[idx]] = parseFloat(next) || 0;
      return prev;
    }, {});
  }

  function constructDurationString(durationObject) {
    let duration = '';
    let flag = false;

    if (flag || durationObject.hours) {
      duration += leftpad(durationObject.hours) + ':';
      flag = true;
    }

    if (flag || durationObject.minutes) {
      duration += leftpad(durationObject.minutes) + ':';
    } else {
      duration += '0:';
    }

    duration += leftpad(durationObject.seconds, 2, 0);

    return duration;
  }

  // The famous npm leftpad module-function
  // https://github.com/camwest/left-pad/blob/master/index.js
  function leftpad(str, len, ch) {
    str = String(str);

    var i = -1;

    if (!ch && ch !== 0) ch = ' ';

    len = len - str.length;

    while (++i < len) {
      str = ch + str;
    }

    return str;
  }
}

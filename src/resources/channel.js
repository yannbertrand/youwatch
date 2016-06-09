let async;
let YouTube;
let oauth2Client;
let db;

module.exports = function (_async, _YouTube, _oauth2Client, _db) {
  async = _async;
  YouTube = _YouTube;
  oauth2Client = _oauth2Client;
  db = _db;

  return {
    findAllChannels,
    refreshChannels,
  };
};

function findAllChannels(callback) {
  db.find({ kind: 'youtube#channel' }, callback);
}

function refreshChannels(subscriptions, callback) {
  let pageToken = true;
  let newChannels = [];
  let updatedChannels = [];

  console.info('START: refreshChannels');

  async.each(subscriptions, refreshSubscriptionChannel, sendNewAndUpdatedChannels);

  function refreshSubscriptionChannel(subscription, nextSubscription) {
    YouTube.channels.list(concoctRequest(subscription), handleError(gotChannel));

    function gotChannel(channel) {
      if (channel && channel.items && channel.items.length) {
        upsertChannel(channel.items[0], handleError(upsertedChannel));
      } else {
        nextSubscription();
      }
    }

    function upsertedChannel(newChannel, updatedChannel) {
      if (newChannel) newChannels.push(newChannel);
      if (updatedChannel) updatedChannels.push(updatedChannel);
      
      nextSubscription();
    }
  }

  function sendNewAndUpdatedChannels(err) {
    console.info('END: refreshChannels');
    callback(err, newChannels, updatedChannels);
  }
}

function concoctRequest(subscription) {
  return {
    part: 'id, snippet, contentDetails',
    id: subscription.channelId,
    auth: oauth2Client,
  };
}

function upsertChannel(channel, callback) {
  // console.info('START: upsertChannel');

  let request = {
    kind: 'youtube#channel',
    id: channel.id,
  };

  db.findOne(request, handleError(gotChannel));

  function gotChannel(result) {
    let dbChannel = {
      kind: 'youtube#channel',
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnails: channel.snippet.thumbnails,
      relatedPlaylists: channel.contentDetails.relatedPlaylists,
    };

    if (!result) {
      db.insert(dbChannel, sendNewChannels);
    } else {
      let $set = {};

      if (result.title !== channel.snippet.title)
        $set.title = channel.snippet.title;
      if (result.description !== channel.snippet.description)
        $set.description = channel.snippet.description;
      if (JSON.stringify(result.thumbnails) !== JSON.stringify(channel.snippet.thumbnails))
        $set.thumbnails = channel.snippet.thumbnails;
      if (JSON.stringify(result.relatedPlaylists) !== JSON.stringify(channel.contentDetails.relatedPlaylists))
        $set.relatedPlaylists = channel.contentDetails.relatedPlaylists;

      if (Object.keys($set).length) {
        db.update(request, { $set }, { upsert: true }, sendUpdatedChannels);
      } else {
        sendNewChannels();
      }
    }

    function sendNewChannels(err, channel) {
      // console.info('END: upsertChannel');
      callback(err, channel);
    }

    function sendUpdatedChannels(err) {
      // console.info('END: upsertChannel');
      callback(err, null, dbChannel);
    }
  }
}

function handleError(next) {
  return function (err) {
    if (err) {
      console.error(err);
      return callback(err);
    }

    let _arguments = Array.prototype.slice.call(arguments, 1);
    next.apply(null, _arguments);
  };
}

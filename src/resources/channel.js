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

function findAllChannels(cb) {
  db.find({ kind: 'youtube#channel' }, cb);
}

function refreshChannels(subscriptions, cb) {
  let pageToken = true;
  let newChannels = [];
  let updatedChannels = [];

  console.info('START: refreshChannels');

  async.each(subscriptions, refreshSubscriptionChannel, sendNewAndUpdatedChannels);



  function refreshSubscriptionChannel(subscription, nextSubscription) {
    YouTube.channels.list(concoctRequest(subscription), gotChannel);

    function concoctRequest(subscription) {
      return {
        part: 'id, snippet, contentDetails',
        id: subscription.channelId,
        auth: oauth2Client,
      };
    }

    function gotChannel(err, channel) {
      if (err) {
        console.error('Error while trying to get channel ' + subscription.channelId, err);
        return nextSubscription();
      }

      if (channel && channel.items && channel.items.length) {
        upsertChannel(channel.items[0], function (err, newChannel, updatedChannel) {
          if (newChannel) {
            newChannels.push(newChannel);
          } else if (updatedChannel) {
            updatedChannels.push(updatedChannel);
          }
          nextSubscription();
        });
      } else {
        nextSubscription();
      }
    }
  }

  function sendNewAndUpdatedChannels(err) {
    console.info('END: refreshChannels');
    cb(err, newChannels, updatedChannels);
  }
}

function upsertChannel(channel, cb) {
  console.info('START: upsertChannel');

  let request = {
    kind: 'youtube#channel',
    id: channel.id,
  };

  db.findOne(request, gotChannel);



  function gotChannel(err, result) {
    if (err) {
      console.error(err);
      return sendNewChannels(err);
    }

    let dbChannel = {
      kind: 'youtube#channel',
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnails: channel.snippet.thumbnails,
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

      if (Object.keys($set).length) {
        db.update(request, { $set }, { upsert: true }, sendUpdatedChannels);
      } else {
        sendNewChannels();
      }
    }

    function sendNewChannels(err, channel) {
      console.info('END: upsertChannel');
      cb(err, channel);
    }

    function sendUpdatedChannels(err) {
      console.info('END: upsertChannel');
      console.log(dbChannel);
      cb(err, null, dbChannel);
    }
  }
}

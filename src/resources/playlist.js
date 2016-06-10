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
    findAllPlaylists,
    findAllRelatedPlaylists,
    refreshPlaylists,
  };
};

function findAllRelatedPlaylists(callback) {
  db.find({ kind: 'youtube#channel' }, function (err, channels) {
    if (err) return callback(err);

    return callback(null, channels.map(channel => {
      return { [channel.id]: channel.relatedPlaylists };
    }));
  });
}

function findAllPlaylists(callback) {
  db.find({ kind: 'youtube#playlist' }, callback);
}

function refreshPlaylists(channels, callback) {
  let createdPlaylists = [];
  let updatedPlaylists = [];

  // console.info('START: refreshPlaylists');

  async.each(channels, refreshChannelPlaylists, sendNewAndUpdatedPlaylists);

  function refreshChannelPlaylists(channel, nextChannel) {
    YouTube.playlists.list(concoctRequest(channel), handleError(gotPlaylists, callback));

    function gotPlaylists(playlists) {
      if (playlists && playlists.items && playlists.items.length) {
        upsertPlaylists(playlists.items, handleError(upsertedPlaylist, callback));
      } else {
        nextChannel();
      }
    }

    function upsertedPlaylist(createdChannelPlaylists, updatedChannelPlaylists) {
      if (createdChannelPlaylists) createdPlaylists.push(...createdChannelPlaylists);
      if (updatedChannelPlaylists) updatedPlaylists.push(...updatedChannelPlaylists);

      nextChannel();
    }
  }

  function sendNewAndUpdatedPlaylists(err) {
    // console.info('END: refreshPlaylists');
    callback(err, createdPlaylists, updatedPlaylists);
  }
}

function concoctRequest(channel) {
  return {
    part: 'id, snippet',
    channelId: channel.id,
    auth: oauth2Client,
  };
}

function upsertPlaylists(playlists, callback) {
  let createdChannelPlaylists = [];
  let updatedChannelPlaylists = [];

  // console.info('START: upsertPlaylists');

  let $or = playlists.map(playlist => {
    return { id: playlist.id };
  });

  db.find({
    kind: 'youtube#playlist',
    $or: $or,
  }, handleError(gotPlaylists, callback));

  function gotPlaylists(results) {
    async.parallel([
      createUnexistingPlaylists,
      updateExistingPlaylists,
    ], sendNewAndUpdatedPlaylists);

    function createUnexistingPlaylists(done) {
      if (results.length >= playlists.length) return done();

      let resultsIds = results.map(result => result.id);
      let unexistingPlaylists = playlists
        .filter(playlist => !resultsIds.includes(playlist.id))
        .map(playlist => {
          return {
            kind: 'youtube#playlist',
            id: playlist.id,
            channelId: playlist.snippet.channelId,
            title: playlist.snippet.title,
            description: playlist.snippet.description,
            thumbnails: playlist.snippet.thumbnails,
          };
        });

      db.insert(unexistingPlaylists, handleError(pushCreatedPlaylists, callback));

      function pushCreatedPlaylists(createdPlaylists) {
        createdChannelPlaylists.push(...createdPlaylists);
        return done();
      }
    }

    function updateExistingPlaylists(done) {
      async.each(results, updatePlaylist, pushUpdatedPlaylists);

      function updatePlaylist(result, nextResult) {
        let correspondingPlaylist = playlists.filter(playlist => playlist.id === result.id)[0];

        let $set = {};

        if (result.title !== correspondingPlaylist.snippet.title)
          $set.title = correspondingPlaylist.snippet.title;
        if (result.description !== correspondingPlaylist.snippet.description)
          $set.description = correspondingPlaylist.snippet.description;
        if (JSON.stringify(result.thumbnails) !== JSON.stringify(correspondingPlaylist.snippet.thumbnails))
          $set.thumbnails = correspondingPlaylist.snippet.thumbnails;

        if (Object.keys($set).length) {
          db.update({
            kind: 'youtube#playlist',
            id: result.id,
          }, { $set }, { upsert: true }, handleError(pushUpdatedPlaylist, callback));
        } else {
          nextResult();
        }

        function pushUpdatedPlaylist(updatedPlaylist) {
          updatedChannelPlaylists.push(updatedPlaylist);
          nextResult();
        }
      }

      function pushUpdatedPlaylists(err) {
        return done(err);
      }
    }

    function sendNewAndUpdatedPlaylists(err) {
      // console.info('END: upsertPlaylists');
      return callback(err, createdChannelPlaylists, updatedChannelPlaylists);
    }
  }
}

function handleError(next, callback) {
  return function (err) {
    if (err) {
      console.error(err);
      return callback(err);
    }

    let _arguments = Array.prototype.slice.call(arguments, 1);
    next.apply(null, _arguments);
  };
}

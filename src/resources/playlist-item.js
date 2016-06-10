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
    findAllPlaylistItems,
    refreshPlaylistItems,
  };
};

function findAllPlaylistItems(callback) {
  db.find({ kind: 'youtube#playlistItem' }, callback);
}

function refreshPlaylistItems(playlists, callback) {
  let createdPlaylistItems = [];

  // console.info('START: refreshPlaylistItems');

  async.each(playlists, refreshPlaylistPlaylistItems, sendNewPlaylistItems);

  function refreshPlaylistPlaylistItems(playlist, nextPlaylist) {
    YouTube.playlistItems.list(concoctRequest(playlist), handleError(gotPlaylistItems, callback));

    function gotPlaylistItems(playlistItems) {
      if (playlistItems && playlistItems.items && playlistItems.items.length) {
        upsertPlaylistItems(playlistItems.items, handleError(upsertedPlaylistItem, callback));
      } else {
        nextPlaylist();
      }
    }

    function upsertedPlaylistItem(createdPlaylistPlaylistItems) {
      if (createdPlaylistPlaylistItems)
        createdPlaylistItems.push(...createdPlaylistPlaylistItems);

      nextPlaylist();
    }
  }

  function sendNewPlaylistItems(err) {
    // console.info('END: refreshPlaylistItems');
    callback(err, createdPlaylistItems);
  }
}

function concoctRequest(playlist) {
  return {
    part: 'id, snippet, contentDetails',
    playlistId: playlist,
    auth: oauth2Client,
  };
}

function upsertPlaylistItems(playlistItems, callback) {
  let createdPlaylistPlaylistItems = [];

  // console.info('START: upsertPlaylistItems');

  let $or = playlistItems.map(playlistItem => {
    return { id: playlistItem.id };
  });

  db.find({
    kind: 'youtube#playlistItem',
    $or: $or,
  }, handleError(gotPlaylistItems, callback));

  function gotPlaylistItems(results) {
    createUnexistingPlaylistItems(sendNewPlaylistItems);

    function createUnexistingPlaylistItems(done) {
      if (results.length >= playlistItems.length) return done();

      let resultsIds = results.map(result => result.id);
      let unexistingPlaylistItems = playlistItems
        .filter(playlistItem => !resultsIds.includes(playlistItem.id))
        .map(playlistItem => {
          return {
            kind: 'youtube#playlistItem',
            id: playlistItem.id,
            channelId: playlistItem.snippet.channelId,
            playlistId: playlistItem.snippet.playlistId,
            videoId: playlistItem.contentDetails.videoId,
          };
        });

      db.insert(unexistingPlaylistItems, handleError(pushCreatedPlaylistItems, callback));

      function pushCreatedPlaylistItems(createdPlaylistItems) {
        createdPlaylistPlaylistItems.push(...createdPlaylistItems);
        return done();
      }
    }

    function sendNewPlaylistItems(err) {
      // console.info('END: upsertPlaylistItems');
      return callback(err, createdPlaylistPlaylistItems);
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

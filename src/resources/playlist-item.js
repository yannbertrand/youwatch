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

function findAllPlaylistItems(cb) {
  db.find({ kind: 'youtube#playlistItem' }, cb);
}

function refreshPlaylistItems(playlists, cb) {
  let createdPlaylistItems = [];

  console.info('START: refreshPlaylistItems');

  async.each(playlists, refreshPlaylistPlaylistItems, sendNewPlaylistItems);



  function refreshPlaylistPlaylistItems(playlist, nextPlaylist) {
    YouTube.playlistItems.list(concoctRequest(playlist), gotPlaylistItems);

    function concoctRequest(playlist) {
      return {
        part: 'id, snippet, contentDetails',
        playlistId: playlist,
        auth: oauth2Client,
      };
    }

    function gotPlaylistItems(err, playlistItems) {
      if (err) {
        console.error('Error while trying to get playlist items of playlist ' + playlist.id, err);
        return nextPlaylist(err);
      }

      if (playlistItems && playlistItems.items && playlistItems.items.length) {
        upsertPlaylistItems(playlistItems.items, function (err, createdPlaylistPlaylistItems) {
          if (createdPlaylistPlaylistItems) {
            createdPlaylistItems.push(...createdPlaylistPlaylistItems);
          }
          nextPlaylist();
        });
      } else {
        nextPlaylist();
      }
    }
  }

  function sendNewPlaylistItems(err) {
    console.info('END: refreshPlaylistItems');
    cb(err, createdPlaylistItems);
  }
}

function upsertPlaylistItems(playlistItems, cb) {
  let createdPlaylistPlaylistItems = [];

  console.info('START: upsertPlaylistItems');

  let $or = playlistItems.map(playlistItem => {
    return {
      id: playlistItem.id
    };
  });

  db.find({
    kind: 'youtube#playlistItem',
    $or: $or,
  }, gotPlaylistItems);

  function gotPlaylistItems(err, results) {
    if (err) {
      console.error(err);
      return sendNewPlaylistItems(err);
    }

    createUnexistingPlaylistItems(sendNewPlaylistItems);

    function createUnexistingPlaylistItems(done) {
      if (results.length >= playlistItems.length) return done();

      let resultsIds = results.map(result => result.id);
      let unexistingPlaylistItems = playlistItems.filter(playlistItem => !resultsIds.includes(playlistItem.id));

      unexistingPlaylistItems = unexistingPlaylistItems.map(playlistItem => {
        return {
          kind: 'youtube#playlistItem',
          id: playlistItem.id,
          channelId: playlistItem.snippet.channelId,
          playlistId: playlistItem.snippet.playlistId,
          videoId: playlistItem.contentDetails.videoId,
        };
      });

      db.insert(unexistingPlaylistItems, pushCreatedPlaylistItems);

      function pushCreatedPlaylistItems(err, createdPlaylistItems) {
        createdPlaylistPlaylistItems.push(...createdPlaylistItems);
        return done(err);
      }
    }

    function sendNewPlaylistItems(err) {
      console.info('END: upsertPlaylistItems');
      return cb(err, createdPlaylistPlaylistItems);
    }
  }
}
